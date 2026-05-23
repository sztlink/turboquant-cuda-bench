#!/usr/bin/env python3
"""Fast retrieval-only grid for entity-hop RealRAG path construction.

This intentionally avoids BGE and LLM calls. It reuses the same corpus/BM25/title
matcher once, then sweeps entity-hop expansion parameters to find whether simple
multi-hop title/entity expansion improves the retrieval bottleneck before any
sampler/ECD work.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import time
from pathlib import Path
from typing import Any

from rank_bm25 import BM25Okapi


def load_entity_hop_module() -> Any:
    path = Path(__file__).with_name("epkv-entity-hop-retrieval.py")
    spec = importlib.util.spec_from_file_location("epkv_entity_hop_retrieval", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def config_grid() -> list[dict[str, int]]:
    configs: list[dict[str, int]] = []
    # Keep this deliberately fast: no per-mention BM25 second-hop by default.
    # Exact title/entity expansion is cheap enough to sweep interactively.
    for bm25_first in [8, 12, 20]:
        for seed_top in [0, 2]:
            for max_doc_mentions in [3, 6]:
                configs.append({
                    "bm25_first": bm25_first,
                    "seed_top": seed_top,
                    "second_per_mention": 0,
                    "max_seed_expansions": 4,
                    "max_doc_mentions": max_doc_mentions,
                    "pool_limit": 80,
                })
    return configs


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--rag-summary", default="bench/epkv-live-probe-v0-2026-05-21/sprint-12h/rag-reality-check-100/summary.json")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--top-k", type=int, default=10)
    args = p.parse_args()

    mod = load_entity_hop_module()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    data = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    selected_all = [x for x in data if x.get("type") in {"compositional", "inference"} and len(x.get("evidences") or []) >= 2]
    selected = selected_all[args.offset : args.offset + args.limit]
    corpus = mod.build_corpus(data)
    bm25 = BM25Okapi([mod.tokenize(d["text"]) for d in corpus])
    matcher = mod.TitleMatcher(corpus)
    rag_ref_rows: dict[str, Any] = {}
    if args.rag_summary and Path(args.rag_summary).exists():
        rag = json.loads(Path(args.rag_summary).read_text(encoding="utf-8"))
        rag_ref_rows = {str(r["qid"]): r for r in rag.get("rows", [])}

    t0 = time.time()
    rows = []
    for ci, cfg in enumerate(config_grid()):
        per_case = []
        for idx, item in enumerate(selected, start=args.offset):
            qid = str(item["_id"])
            q = str(item["question"])
            gold = str(item["answer"])
            stitles = mod.support_titles(item)
            pool, edges, seeds = mod.retrieve_entity_hop(q, corpus, bm25, matcher, **cfg)
            docs = mod.rank_pool_heuristic(q, pool)[: args.top_k]
            doc_titles = {d["title"] for d in docs}
            support_recall = len(stitles.intersection(doc_titles)) / max(1, len(stitles))
            full_support = float(stitles.issubset(doc_titles)) if stitles else 0.0
            answer_present = any(mod.normalize_answer(gold) in mod.normalize_answer(d["text"]) for d in docs)
            bref = (rag_ref_rows.get(qid, {}).get("conditions", {}).get("bge_rerank_strong") or {})
            per_case.append({
                "idx": idx,
                "qid": qid,
                "gold": gold,
                "support_titles": sorted(stitles),
                "selected_titles": [d["title"] for d in docs],
                "support_title_recall": support_recall,
                "full_support_recall": full_support,
                "answer_string_present_in_docs": bool(answer_present),
                "pool_size": len(pool),
                "edge_count": len(edges),
                "seed_count": len(seeds),
                "bge_ref": {"em": bref.get("em", 0), "f1": bref.get("f1", 0)},
            })
        n = max(1, len(per_case))
        row = {
            "config_id": ci,
            "config": cfg,
            "metrics": {
                "support_title_recall": sum(x["support_title_recall"] for x in per_case) / n,
                "full_support_recall": sum(x["full_support_recall"] for x in per_case) / n,
                "answer_string_present_rate": sum(1 for x in per_case if x["answer_string_present_in_docs"]) / n,
                "avg_pool_size": sum(x["pool_size"] for x in per_case) / n,
                "avg_edge_count": sum(x["edge_count"] for x in per_case) / n,
            },
            "cases": per_case,
        }
        # useful scalar: full chain and answer both present.
        row["metrics"]["full_support_and_answer"] = sum(1 for x in per_case if x["full_support_recall"] and x["answer_string_present_in_docs"]) / n
        rows.append(row)
        print(json.dumps({"config_id": ci, **cfg, **row["metrics"]}, ensure_ascii=False), flush=True)

    rows_sorted = sorted(rows, key=lambda r: (r["metrics"]["full_support_and_answer"], r["metrics"]["answer_string_present_rate"], r["metrics"]["full_support_recall"], r["metrics"]["support_title_recall"]), reverse=True)
    summary = {
        "schema": "epkv.entity_hop_grid.v0",
        "elapsed_sec": time.time() - t0,
        "total_cases": len(selected),
        "corpus_docs": len(corpus),
        "top_k": args.top_k,
        "baseline_bge_reality_check_100": {
            "support_title_recall": 0.5116666666666666,
            "full_support_recall": 0.14,
            "answer_string_present_rate": 0.40,
            "em": 0.09,
            "f1": 0.18503174603174602,
        },
        "best": rows_sorted[0] if rows_sorted else None,
        "configs": rows_sorted,
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = [
        "# Entity-Hop Retrieval Grid",
        "",
        f"total_cases: {len(selected)}",
        f"corpus_docs: {len(corpus)}",
        "",
        "Baseline BGE reality-check 100:",
        "",
        "```txt",
        "support_title_recall: 0.512",
        "full_support_recall:  0.140",
        "answer_present_rate:  0.400",
        "EM/F1:                0.090 / 0.185",
        "```",
        "",
        "## Grid",
        "",
        "| id | bm25_first | seed_top | second | seed_exp | mentions | pool | support | full | answer | full+answer | avg pool | avg edges |",
        "|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in rows_sorted:
        c = r["config"]
        m = r["metrics"]
        md.append(f"| {r['config_id']} | {c['bm25_first']} | {c['seed_top']} | {c['second_per_mention']} | {c['max_seed_expansions']} | {c['max_doc_mentions']} | {c['pool_limit']} | {m['support_title_recall']:.3f} | {m['full_support_recall']:.3f} | {m['answer_string_present_rate']:.3f} | {m['full_support_and_answer']:.3f} | {m['avg_pool_size']:.1f} | {m['avg_edge_count']:.1f} |")
    if rows_sorted:
        b = rows_sorted[0]
        md.extend([
            "",
            "## Best by full_support_and_answer",
            "",
            "```json",
            json.dumps({"config_id": b["config_id"], "config": b["config"], "metrics": b["metrics"]}, indent=2, ensure_ascii=False),
            "```",
        ])
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "best": None if not rows_sorted else {"config_id": rows_sorted[0]["config_id"], "config": rows_sorted[0]["config"], "metrics": rows_sorted[0]["metrics"]}}, indent=2, ensure_ascii=False))
    print("EPKV_ENTITY_HOP_GRID_DONE")


if __name__ == "__main__":
    main()
