#!/usr/bin/env python3
"""Build compact relation-chain prompts from 2Wiki evidence triples.

This is the repair path for cases where decode policy is not enough because the
model built the wrong relation path. It turns support triples into an explicit
chain and asks only for the terminal entity.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--qid", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()
    data = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    item = next((x for x in data if x.get("_id") == args.qid), None)
    if item is None:
        raise SystemExit(f"qid not found: {args.qid}")
    triples = item.get("evidences") or []
    if not triples:
        raise SystemExit("no evidences triples")
    chain = "\n".join(f"{s} -- {p} --> {o}." for s, p, o in triples[:2])
    prompt = "\n".join([
        "Answer with only the final entity at the end of the relation chain.",
        "Relation chain:",
        chain,
        f"Question: {item['question']}",
    ])
    result = {
        "schema": "epkv.relation_path_prompt.v0",
        "qid": item.get("_id"),
        "question": item.get("question"),
        "answer": item.get("answer"),
        "triples": triples[:2],
        "prompt": prompt,
        "messages": [{"role": "user", "content": prompt}],
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: result[k] for k in ["schema", "qid", "answer"]}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
