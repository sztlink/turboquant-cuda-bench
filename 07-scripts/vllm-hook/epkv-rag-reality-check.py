#!/usr/bin/env python3
"""RAG reality check: retrieval/rerank/prompt vs oracle evidence-control upper bound.

This tests the critique that real RAG is dominated by retrieval quality and
distractor robustness rather than position/KV utilization.

Conditions implemented:
- BM25 top-k + basic prompt
- BM25 top-k + strong answer-only prompt
- BM25 top-n -> BGE rerank top-k + strong answer-only prompt

The EPKV/oracle upper bound is consolidated separately from existing quality
proof summaries.
"""
from __future__ import annotations

import argparse
import json
import re
import string
import time
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from rank_bm25 import BM25Okapi


def normalize_answer(s: str) -> str:
    def remove_articles(text: str) -> str:
        return re.sub(r"\b(a|an|the)\b", " ", text)
    def white_space_fix(text: str) -> str:
        return " ".join(text.split())
    def remove_punc(text: str) -> str:
        exclude = set(string.punctuation)
        return "".join(ch for ch in text if ch not in exclude)
    return white_space_fix(remove_articles(remove_punc(str(s).lower())))


def exact_match(prediction: str, ground_truth: str) -> float:
    return float(normalize_answer(prediction) == normalize_answer(ground_truth))


def contains_match(prediction: str, ground_truth: str) -> float:
    ng = normalize_answer(ground_truth)
    np = normalize_answer(prediction)
    return float(bool(ng) and ng in np)


def f1_score(prediction: str, ground_truth: str) -> float:
    pred_tokens = normalize_answer(prediction).split()
    gold_tokens = normalize_answer(ground_truth).split()
    if not pred_tokens and not gold_tokens:
        return 1.0
    if not pred_tokens or not gold_tokens:
        return 0.0
    counts = Counter(pred_tokens)
    num_same = 0
    for t in gold_tokens:
        if counts[t] > 0:
            num_same += 1
            counts[t] -= 1
    if num_same == 0:
        return 0.0
    precision = num_same / len(pred_tokens)
    recall = num_same / len(gold_tokens)
    return 2 * precision * recall / (precision + recall)


def metrics(pred: str, gold: str) -> dict[str, float]:
    return {"em": exact_match(pred, gold), "contains": contains_match(pred, gold), "f1": f1_score(pred, gold)}


def tokenize(s: str) -> list[str]:
    return re.findall(r"[\wÀ-ÖØ-öø-ÿ]+", str(s).lower())


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def build_corpus(data: list[dict[str, Any]]) -> list[dict[str, str]]:
    seen = set()
    docs = []
    for item in data:
        for title, sents in item.get("context") or []:
            text = f"{title}: {' '.join(sents)}"
            key = (title, text)
            if key in seen:
                continue
            seen.add(key)
            docs.append({"title": str(title), "text": text})
    return docs


def support_titles(item: dict[str, Any]) -> set[str]:
    out = {str(x[0]) for x in item.get("supporting_facts") or [] if x}
    for ev in item.get("evidences") or []:
        if ev:
            out.add(str(ev[0]))
    return out


def make_prompt(question: str, docs: list[dict[str, str]], mode: str) -> str:
    lines = [f"P{i+1}: {d['text']}" for i, d in enumerate(docs)]
    if mode == "basic":
        return "\n".join([
            "Use the retrieved passages to answer the question.",
            "Passages:",
            *lines,
            f"Question: {question}",
        ])
    if mode == "strong":
        return "\n".join([
            "You are answering a multi-hop question using retrieved passages.",
            "Some passages may be irrelevant or distracting.",
            "Use only passages that directly support the answer.",
            "Answer with only the final answer string. No explanation.",
            "Passages:",
            *lines,
            f"Question: {question}",
            "Final answer:",
        ])
    raise ValueError(mode)


def call_llm(endpoint: str, model: str, prompt: str, max_tokens: int, timeout: int) -> tuple[str, dict[str, Any], float]:
    t0 = time.time()
    resp = request_json(endpoint, {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0, "max_tokens": max_tokens}, timeout)
    return content_of(resp), resp, time.time() - t0


def avg(rows: list[dict[str, Any]], condition: str, metric: str) -> float:
    if not rows:
        return 0.0
    return sum(float(r["conditions"][condition][metric]) for r in rows) / len(rows)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--top-k", type=int, default=10)
    p.add_argument("--bm25-pool", type=int, default=30)
    p.add_argument("--max-tokens", type=int, default=32)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--bge-model", default="BAAI/bge-reranker-v2-m3")
    p.add_argument("--skip-bge", action="store_true")
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    responses_dir = out_dir / "responses"
    responses_dir.mkdir(exist_ok=True)
    data = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    selected = [x for x in data if x.get("type") in {"compositional", "inference"} and len(x.get("evidences") or []) >= 2]
    selected = selected[args.offset: args.offset + args.limit]
    corpus = build_corpus(data)
    bm25 = BM25Okapi([tokenize(d["text"]) for d in corpus])

    reranker = None
    if not args.skip_bge:
        from sentence_transformers import CrossEncoder
        reranker = CrossEncoder(args.bge_model, max_length=512)

    rows = []
    t0 = time.time()
    for idx, item in enumerate(selected, start=args.offset):
        qid = str(item["_id"])
        q = str(item["question"])
        gold = str(item["answer"])
        stitles = support_titles(item)
        scores = bm25.get_scores(tokenize(q))
        top_pool_idx = sorted(range(len(scores)), key=lambda i: float(scores[i]), reverse=True)[: max(args.bm25_pool, args.top_k)]
        bm25_docs = [corpus[i] for i in top_pool_idx[: args.top_k]]
        pool_docs = [corpus[i] for i in top_pool_idx]
        rerank_docs = []
        rerank_scores = []
        if reranker is not None:
            pairs = [(q, d["text"]) for d in pool_docs]
            pred = reranker.predict(pairs)
            rerank_order = sorted(range(len(pool_docs)), key=lambda i: float(pred[i]), reverse=True)
            rerank_docs = [pool_docs[i] for i in rerank_order[: args.top_k]]
            rerank_scores = [float(pred[i]) for i in rerank_order[: args.top_k]]
        conditions: dict[str, Any] = {}
        for name, docs, prompt_mode in [
            ("bm25_basic", bm25_docs, "basic"),
            ("bm25_strong", bm25_docs, "strong"),
            ("bge_rerank_strong", rerank_docs, "strong"),
        ]:
            if not docs:
                continue
            prompt = make_prompt(q, docs, prompt_mode)
            output, resp, latency = call_llm(args.endpoint, args.model, prompt, args.max_tokens, args.timeout)
            m = metrics(output, gold)
            conditions[name] = {
                **m,
                "output": output,
                "latency_sec": latency,
                "support_titles_present": sorted(stitles.intersection({d["title"] for d in docs})),
                "support_title_recall": len(stitles.intersection({d["title"] for d in docs})) / max(1, len(stitles)),
                "answer_string_present_in_docs": any(normalize_answer(gold) in normalize_answer(d["text"]) for d in docs),
                "docs": [{"title": d["title"], "text": d["text"][:500]} for d in docs],
            }
            (responses_dir / f"{idx}-{qid}-{name}.json").write_text(json.dumps({"qid": qid, "condition": name, "gold": gold, "prompt": prompt, "output": output, "metrics": m, "response": resp}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        rows.append({
            "idx": idx,
            "qid": qid,
            "type": item.get("type"),
            "question": q,
            "gold": gold,
            "support_titles": sorted(stitles),
            "bm25_top_titles": [d["title"] for d in bm25_docs],
            "bge_top_titles": [d["title"] for d in rerank_docs],
            "bge_scores": rerank_scores,
            "conditions": conditions,
        })

    conds = sorted({c for r in rows for c in r["conditions"]})
    summary = {
        "schema": "epkv.rag_reality_check.v0",
        "elapsed_sec": time.time() - t0,
        "total": len(rows),
        "corpus_docs": len(corpus),
        "top_k": args.top_k,
        "bm25_pool": args.bm25_pool,
        "macro": {},
        "rows": rows,
    }
    for c in conds:
        crows = [r for r in rows if c in r["conditions"]]
        summary["macro"][c] = {
            "n": len(crows),
            "em": avg(crows, c, "em"),
            "contains": avg(crows, c, "contains"),
            "f1": avg(crows, c, "f1"),
            "support_title_recall": avg(crows, c, "support_title_recall"),
            "answer_string_present_rate": sum(1 for r in crows if r["conditions"][c]["answer_string_present_in_docs"]) / max(1, len(crows)),
            "latency_sec": avg(crows, c, "latency_sec"),
        }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = [
        "# RAG Reality Check",
        "",
        f"total: {len(rows)}",
        f"corpus_docs: {len(corpus)}",
        "",
        "| condition | n | EM | contains | F1 | support recall | answer in docs | latency s |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for c, m in summary["macro"].items():
        md.append(f"| {c} | {m['n']} | {m['em']:.3f} | {m['contains']:.3f} | {m['f1']:.3f} | {m['support_title_recall']:.3f} | {m['answer_string_present_rate']:.3f} | {m['latency_sec']:.2f} |")
    md.extend(["", "## Rows", "", "| qid | gold | bm25_basic | bm25_strong | bge_rerank_strong |", "|---|---|---|---|---|"])
    for r in rows:
        def cell(c: str) -> str:
            if c not in r["conditions"]:
                return ""
            x = r["conditions"][c]
            return f"{int(x['em'])}/{x['f1']:.2f}: `{str(x['output']).replace('`','')[:80]}`"
        md.append(f"| {r['qid']} | {r['gold']} | {cell('bm25_basic')} | {cell('bm25_strong')} | {cell('bge_rerank_strong')} |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "total": len(rows), "macro": summary["macro"]}, indent=2, ensure_ascii=False))
    print("EPKV_RAG_REALITY_CHECK_DONE")


if __name__ == "__main__":
    main()
