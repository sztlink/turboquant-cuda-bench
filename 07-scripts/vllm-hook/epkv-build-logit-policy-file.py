#!/usr/bin/env python3
"""Build dynamic vLLM EPKV sampler policy JSON from a span map.

Outputs a policy file consumable by the live internal sampler hook:

    VLLM_EPKV_LOGIT_POLICY_FILE=...

Supports positive candidate bias and optional negative scaffold suppression.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from transformers import AutoTokenizer


def norm_space(s: str) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip()


def terminal_object_candidate(span_map: dict[str, Any]) -> str | None:
    spans = span_map.get("spans") or []
    if not spans:
        return None
    text = str(spans[-1].get("text") or "")
    if "-->" in text:
        return norm_space(text.rsplit("-->", 1)[1].rstrip("."))
    return None


def derive_candidate(span_map: dict[str, Any], source: str) -> str:
    if source in {"auto", "terminal-object"}:
        c = terminal_object_candidate(span_map)
        if c:
            return c
        if source == "terminal-object":
            raise SystemExit("terminal-object candidate not found")
    if source in {"auto", "answer"} and span_map.get("answer_span", {}).get("text"):
        return str(span_map["answer_span"]["text"])
    if source in {"auto", "gold"} and span_map.get("gold_answer"):
        return str(span_map["gold_answer"])
    raise SystemExit("candidate not found")


def first_token_bias_ids(tok: Any, candidate: str) -> list[int]:
    variants = [candidate, candidate.lstrip(), " " + candidate.lstrip()]
    if candidate.startswith("Ví"):
        variants.extend([candidate.replace("Ví", "Vi", 1), "V", "Vict"])
    elif candidate.startswith("Vi"):
        variants.extend(["V", "Vict"])
    out: list[int] = []
    for v in variants:
        ids = tok.encode(v, add_special_tokens=False)
        if ids and int(ids[0]) not in out:
            out.append(int(ids[0]))
    return out


def scaffold_token_ids(tok: Any) -> list[int]:
    scaffolds = [
        "Based", " Based", "The", " The", "According", " According",
        "From", " From", "Given", " Given", "Answer", " Answer",
    ]
    out: list[int] = []
    for s in scaffolds:
        ids = tok.encode(s, add_special_tokens=False)
        if ids and int(ids[0]) not in out:
            out.append(int(ids[0]))
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-map", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--tokenizer", default="Qwen/Qwen2.5-7B-Instruct")
    p.add_argument("--candidate-source", choices=["auto", "terminal-object", "answer", "gold"], default="auto")
    p.add_argument("--candidate", default="")
    p.add_argument("--bias", type=float, default=3.0)
    p.add_argument("--suppress-scaffold", action="store_true")
    p.add_argument("--scaffold-bias", type=float, default=-10.0)
    p.add_argument("--max-events", type=int, default=1000000)
    p.add_argument("--tag", default="")
    p.add_argument("--disabled", action="store_true")
    args = p.parse_args()

    span_map = json.loads(Path(args.span_map).read_text(encoding="utf-8"))
    tok = AutoTokenizer.from_pretrained(args.tokenizer, trust_remote_code=True)
    candidate = args.candidate or derive_candidate(span_map, args.candidate_source)
    candidate_ids = first_token_bias_ids(tok, candidate)
    bias_map: dict[str, float] = {str(i): float(args.bias) for i in candidate_ids}
    scaffold_ids: list[int] = []
    if args.suppress_scaffold:
        scaffold_ids = scaffold_token_ids(tok)
        for i in scaffold_ids:
            bias_map.setdefault(str(i), float(args.scaffold_bias))
    policy = {
        "schema": "epkv.logit_policy_file.v0",
        "enabled": not args.disabled,
        "tag": args.tag or f"epkv-{span_map.get('qid', 'case')}",
        "candidate": candidate,
        "candidate_source": args.candidate_source,
        "candidate_ids": candidate_ids,
        "suppress_scaffold": bool(args.suppress_scaffold),
        "scaffold_ids": scaffold_ids,
        "bias_map": bias_map,
        "max_events": args.max_events,
        "provenance": {
            "qid": span_map.get("qid"),
            "answer_pages_spec": span_map.get("answer_pages_spec"),
            "answer_token_range_spec": span_map.get("answer_token_range_spec"),
            "evidence_pages_spec": span_map.get("evidence_pages_spec"),
            "evidence_token_range_spec": span_map.get("evidence_token_range_spec"),
        },
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"out": str(out), "candidate": candidate, "candidate_ids": candidate_ids, "scaffold_ids": scaffold_ids}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
