#!/usr/bin/env python3
"""Automatic evidence-derived decode policy selector.

Given a span map, derive a candidate from evidence/answer span, then try a small
policy grid:

- direct candidate bias
- scaffold-suppressed candidate bias

It selects the lowest-bias policy whose output contains the candidate (or a
known alias such as English/England). This is a diagnostic policy selector, not
production decoding.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


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


def run_state(span_map: str, out: Path, bias: float, suppress: bool, source: str, max_tokens: int) -> dict:
    cmd = [
        sys.executable,
        "07-scripts/vllm-hook/epkv-state-aware-decode-policy.py",
        "--span-map", span_map,
        "--candidate-source", source,
        "--bias", str(bias),
        "--baseline-max-tokens", "48",
        "--continue-max-tokens", str(max_tokens),
        "--out", str(out),
    ]
    if suppress:
        cmd.append("--suppress-scaffold")
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return json.loads(out.read_text(encoding="utf-8"))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-map", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--candidate-source", choices=["auto", "terminal-object", "answer", "gold"], default="auto")
    p.add_argument("--biases", default="1,2,3,6,10")
    p.add_argument("--max-tokens", type=int, default=16)
    args = p.parse_args()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    work = out.with_suffix("")
    work.mkdir(parents=True, exist_ok=True)
    rows = []
    chosen = None
    for suppress in [False, True]:
        for b in [float(x) for x in args.biases.split(",") if x.strip()]:
            rpath = work / f"policy-{'suppress' if suppress else 'direct'}-bias{str(b).replace('.', 'p')}.json"
            data = run_state(args.span_map, rpath, b, suppress, args.candidate_source, args.max_tokens)
            candidate = data["candidate"]
            direct = data["direct_bias"]["content"]
            prefill = data.get("prefill_bias", {}).get("content") if data.get("prefill_bias") else None
            best_output = direct
            mode = "direct_bias"
            if prefill and closes(prefill, candidate):
                best_output = prefill
                mode = "prefill_bias"
            ok = closes(best_output, candidate)
            row = {
                "suppress_scaffold": suppress,
                "bias": b,
                "candidate": candidate,
                "candidate_ids": data["candidate_ids"],
                "mode": mode,
                "output": best_output,
                "closed": ok,
                "artifact": str(rpath),
            }
            rows.append(row)
            if ok and chosen is None:
                chosen = row
                break
        if chosen is not None:
            break

    result = {
        "schema": "epkv.auto_decode_policy.v0",
        "span_map": args.span_map,
        "chosen": chosen,
        "rows": rows,
    }
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
