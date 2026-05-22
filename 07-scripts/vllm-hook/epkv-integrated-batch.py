#!/usr/bin/env python3
"""Batch driver for the integrated EPKV evidence-policy runner.

Creates compact case JSON files from 2Wiki evidence triples, builds live-tokenizer
span maps, runs the integrated runner, and writes a compact summary.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


def triple_sentence(t: list[Any]) -> str:
    if len(t) >= 3:
        s, p, o = t[:3]
        return f"{s}: {s} -- {p} --> {o}."
    return " -- ".join(map(str, t))


def make_case(item: dict[str, Any]) -> dict[str, Any]:
    evidences = item.get("evidences") or []
    evidence = [triple_sentence(t) for t in evidences[:2]]
    distractor: list[str] = []
    for title, sents in item.get("context") or []:
        joined = f"{title}: {' '.join(sents[:2])}"
        if all(str(t[0]) not in joined for t in evidences[:2] if t):
            distractor.append(joined)
        if len(distractor) >= 4:
            break
    return {
        "qid": item.get("_id"),
        "type": item.get("type"),
        "question": item.get("question"),
        "answer": item.get("answer"),
        "evidence": evidence,
        "distractor": distractor,
    }


def run(cmd: list[str], log: list[str]) -> None:
    log.append("$ " + " ".join(cmd))
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.stdout:
        log.append(p.stdout[-2000:])
    if p.stderr:
        log.append(p.stderr[-2000:])
    if p.returncode != 0:
        raise RuntimeError(f"command failed {p.returncode}: {' '.join(cmd)}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--types", default="compositional,inference")
    p.add_argument("--biases", default="1,2,3,6,10")
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    cases_dir = out_dir / "cases"
    spans_dir = out_dir / "span-maps"
    runs_dir = out_dir / "runs"
    for d in [cases_dir, spans_dir, runs_dir]:
        d.mkdir(parents=True, exist_ok=True)

    allowed = set(x.strip() for x in args.types.split(",") if x.strip())
    data = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    selected = [x for x in data if x.get("type") in allowed and len(x.get("evidences") or []) >= 2]
    selected = selected[args.offset:args.offset + args.limit]

    rows: list[dict[str, Any]] = []
    log: list[str] = []
    t0 = time.time()
    for idx, item in enumerate(selected, start=args.offset):
        qid = item["_id"]
        case_path = cases_dir / f"{idx}-{qid}.json"
        span_path = spans_dir / f"{idx}-{qid}.json"
        run_path = runs_dir / f"{idx}-{qid}.json"
        case_path.write_text(json.dumps(make_case(item), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        try:
            run([sys.executable, "07-scripts/vllm-hook/epkv-span-to-page-map.py", "--case-json", str(case_path), "--out", str(span_path)], log)
            source = "terminal-object"
            run([
                sys.executable,
                "07-scripts/vllm-hook/epkv-integrated-evidence-policy-runner.py",
                "--span-map", str(span_path),
                "--candidate-source", source,
                "--biases", args.biases,
                "--out", str(run_path),
            ], log)
            result = json.loads(run_path.read_text(encoding="utf-8"))
            final = result["final"]
            rows.append({
                "idx": idx,
                "qid": qid,
                "type": item.get("type"),
                "answer": item.get("answer"),
                "layer": final.get("layer"),
                "closed": bool(final.get("closed")),
                "candidate": final.get("candidate"),
                "output": final.get("output"),
                "run": str(run_path),
                "span_map": str(span_path),
            })
        except Exception as e:  # noqa: BLE001 - batch should keep going
            rows.append({
                "idx": idx,
                "qid": qid,
                "type": item.get("type"),
                "answer": item.get("answer"),
                "layer": "error",
                "closed": False,
                "error": str(e),
            })

    summary = {
        "schema": "epkv.integrated_batch.v0",
        "dataset": args.dataset,
        "offset": args.offset,
        "limit": args.limit,
        "elapsed_sec": time.time() - t0,
        "closed": sum(1 for r in rows if r.get("closed")),
        "total": len(rows),
        "by_layer": {},
        "rows": rows,
    }
    for r in rows:
        layer = str(r.get("layer"))
        summary["by_layer"].setdefault(layer, {"total": 0, "closed": 0})
        summary["by_layer"][layer]["total"] += 1
        summary["by_layer"][layer]["closed"] += int(bool(r.get("closed")))

    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# EPKV integrated batch", "", f"closed: {summary['closed']}/{summary['total']}", "", "| idx | type | layer | closed | answer | output |", "|---:|---|---|---:|---|---|"]
    for r in rows:
        md.append(f"| {r.get('idx')} | {r.get('type')} | {r.get('layer')} | {int(bool(r.get('closed')))} | {r.get('answer','')} | `{str(r.get('output','')).replace('`','')[:120]}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    (out_dir / "run.log").write_text("\n".join(log) + "\nEPKV_INTEGRATED_BATCH_DONE\n", encoding="utf-8")
    print(json.dumps({"closed": summary["closed"], "total": summary["total"], "out_dir": str(out_dir)}, indent=2))
    print("EPKV_INTEGRATED_BATCH_DONE")


if __name__ == "__main__":
    main()
