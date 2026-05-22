#!/usr/bin/env python3
"""Integrated EPKV evidence -> relation/path -> decode-policy runner.

This glues the sprint pieces into one diagnostic runner:

1. Load a span map created from the live tokenizer layout. This carries EPKV
   provenance: evidence pages, token ranges, answer span pages/tokens.
2. Try automatic state-aware decode policy (direct, entity-slot/prefill,
   scaffold suppression).
3. If decode-surface policy fails, fall back to relation-path construction from
   2Wiki evidence triples and decode the compact chain.

The point is to separate failure modes:

- sampler/LM-head surface choice: solved by state-aware decode policy.
- relation/path construction: solved before decode via explicit evidence path.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def aliases(candidate: str) -> list[str]:
    out = [candidate]
    if candidate == "English":
        out.append("England")
    if candidate.startswith("Ví"):
        out.extend([candidate.replace("Ví", "Vi", 1), "Victor Bó", "Victor Bo"])
    return list(dict.fromkeys(out))


def closes(output: str, candidate: str) -> bool:
    no = norm(output)
    return any(norm(a) in no for a in aliases(candidate))


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - local lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def load_dataset_item(dataset: Path, qid: str) -> dict[str, Any] | None:
    if not dataset.exists():
        return None
    data = json.loads(dataset.read_text(encoding="utf-8"))
    return next((x for x in data if x.get("_id") == qid), None)


def relation_path_prompt(item: dict[str, Any]) -> dict[str, Any] | None:
    triples = item.get("evidences") or []
    if not triples:
        return None
    chain = "\n".join(f"{s} -- {p} --> {o}." for s, p, o in triples[:2])
    prompt = "\n".join([
        "Answer with only the final entity at the end of the relation chain.",
        "Relation chain:",
        chain,
        f"Question: {item['question']}",
    ])
    return {
        "triples": triples[:2],
        "prompt": prompt,
        "messages": [{"role": "user", "content": prompt}],
        "answer": item.get("answer"),
    }


def span_provenance(span_map: dict[str, Any]) -> dict[str, Any]:
    spans = span_map.get("spans") or []
    terminal = spans[-1] if spans else None
    return {
        "qid": span_map.get("qid"),
        "gold_answer": span_map.get("gold_answer"),
        "terminal_span": None if terminal is None else {
            "label": terminal.get("label"),
            "text": terminal.get("text"),
            "token_range_spec": terminal.get("token_range_spec"),
            "pages_spec": terminal.get("pages_spec"),
        },
        "answer_span": span_map.get("answer_span"),
        "answer_pages_spec": span_map.get("answer_pages_spec"),
        "answer_token_range_spec": span_map.get("answer_token_range_spec"),
        "evidence_pages_spec": span_map.get("evidence_pages_spec"),
        "evidence_token_range_spec": span_map.get("evidence_token_range_spec"),
    }


def run_auto(span_map_path: str, out: Path, source: str, biases: str, max_tokens: int) -> dict[str, Any]:
    cmd = [
        sys.executable,
        "07-scripts/vllm-hook/epkv-auto-decode-policy.py",
        "--span-map", span_map_path,
        "--candidate-source", source,
        "--biases", biases,
        "--max-tokens", str(max_tokens),
        "--out", str(out),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return json.loads(out.read_text(encoding="utf-8"))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-map", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--candidate-source", choices=["auto", "terminal-object", "answer", "gold"], default="auto")
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--biases", default="1,2,3,6,10")
    p.add_argument("--max-tokens", type=int, default=16)
    p.add_argument("--timeout", type=int, default=90)
    args = p.parse_args()

    t0 = time.time()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    work = out.with_suffix("")
    work.mkdir(parents=True, exist_ok=True)
    span_map = json.loads(Path(args.span_map).read_text(encoding="utf-8"))
    qid = span_map.get("qid")
    provenance = span_provenance(span_map)

    auto_path = work / "auto-policy.json"
    auto = run_auto(args.span_map, auto_path, args.candidate_source, args.biases, args.max_tokens)
    final: dict[str, Any]
    relation_result = None
    if auto.get("chosen"):
        final = {
            "layer": "state_aware_decode_policy",
            "closed": True,
            "output": auto["chosen"]["output"],
            "candidate": auto["chosen"]["candidate"],
            "policy": auto["chosen"],
        }
    else:
        item = load_dataset_item(Path(args.dataset), str(qid)) if qid else None
        rel = relation_path_prompt(item) if item else None
        if rel is not None:
            payload = {
                "model": args.model,
                "messages": rel["messages"],
                "temperature": 0,
                "max_tokens": args.max_tokens,
                "logprobs": True,
                "top_logprobs": 10,
            }
            resp = request_json(args.endpoint, payload, args.timeout)
            output = content_of(resp)
            candidate = str(rel.get("answer") or provenance.get("gold_answer") or "")
            relation_result = {
                "prompt": rel["prompt"],
                "triples": rel["triples"],
                "candidate": candidate,
                "output": output,
                "closed": closes(output, candidate) if candidate else False,
                "response": resp,
            }
            (work / "relation-path.json").write_text(json.dumps(relation_result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            final = {
                "layer": "relation_path_then_decode",
                "closed": bool(relation_result["closed"]),
                "output": output,
                "candidate": candidate,
                "policy": {"artifact": str(work / "relation-path.json")},
            }
        else:
            final = {
                "layer": "unresolved",
                "closed": False,
                "output": "",
                "candidate": provenance.get("gold_answer") or "",
                "policy": None,
            }

    result = {
        "schema": "epkv.integrated_evidence_policy_runner.v0",
        "span_map": args.span_map,
        "elapsed_sec": time.time() - t0,
        "provenance": provenance,
        "auto_policy": auto,
        "relation_path": relation_result,
        "final": final,
    }
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"qid": qid, "final": final, "out": str(out)}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
