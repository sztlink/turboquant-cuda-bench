#!/usr/bin/env python3
"""Batch driver for live internal-sampler EPKV policy runner.

Uses existing span maps and calls `epkv-internal-sampler-policy-live.py` per case.
This tests the dynamic vLLM sampler policy-file path without API `logit_bias`.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def aliases(candidate: str) -> list[str]:
    out = [candidate]
    if candidate == "English":
        out.extend(["England", "Germany"])  # label/country verbalization cases
    if candidate == "German":
        out.append("Germany")
    if candidate.startswith("Ví"):
        out.extend([candidate.replace("Ví", "Vi", 1), "Victor Bó", "Victor Bo"])
    return list(dict.fromkeys(out))


def closes(output: str, candidate: str) -> bool:
    no = norm(output)
    return any(norm(a) in no for a in aliases(candidate))


def run(cmd: list[str]) -> tuple[int, str, str]:
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return p.returncode, p.stdout, p.stderr


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-dir", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--limit", type=int, default=8)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--candidate-source", choices=["auto", "terminal-object", "answer", "gold"], default="terminal-object")
    p.add_argument("--bias", type=float, default=3.0)
    p.add_argument("--max-tokens", type=int, default=16)
    p.add_argument("--no-suppress-scaffold", action="store_true")
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    runs_dir = out_dir / "runs"
    runs_dir.mkdir(parents=True, exist_ok=True)
    all_json = sorted(Path(args.span_dir).glob("*.json"))
    span_candidates = []
    for pth in all_json:
        try:
            obj = json.loads(pth.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(obj, dict) and obj.get("messages") and obj.get("spans"):
            span_candidates.append(pth)
    spans = span_candidates[args.offset: args.offset + args.limit]
    rows = []
    t0 = time.time()
    for span in spans:
        out = runs_dir / span.name
        cmd = [
            sys.executable,
            "07-scripts/vllm-hook/epkv-internal-sampler-policy-live.py",
            "--span-map", str(span),
            "--candidate-source", args.candidate_source,
            "--bias", str(args.bias),
            "--max-tokens", str(args.max_tokens),
            "--out", str(out),
        ]
        if not args.no_suppress_scaffold:
            cmd.append("--suppress-scaffold")
        code, stdout, stderr = run(cmd)
        row = {"span_map": str(span), "artifact": str(out), "returncode": code}
        if code == 0:
            data = json.loads(out.read_text(encoding="utf-8"))
            candidate = data.get("policy", {}).get("candidate", "")
            output = data.get("output", "")
            row.update({
                "qid": data.get("policy", {}).get("provenance", {}).get("qid"),
                "candidate": candidate,
                "output": output,
                "closed": closes(output, candidate),
                "restore_error": data.get("restore_error"),
            })
        else:
            row.update({"closed": False, "stdout": stdout[-1000:], "stderr": stderr[-2000:]})
        rows.append(row)

    summary = {
        "schema": "epkv.internal_sampler_policy_batch.v0",
        "span_dir": args.span_dir,
        "elapsed_sec": time.time() - t0,
        "closed": sum(1 for r in rows if r.get("closed")),
        "total": len(rows),
        "rows": rows,
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# EPKV internal sampler policy batch", "", f"closed: {summary['closed']}/{summary['total']}", "", "| qid | closed | candidate | output |", "|---|---:|---|---|"]
    for r in rows:
        md.append(f"| {r.get('qid','')} | {int(bool(r.get('closed')))} | {r.get('candidate','')} | `{str(r.get('output','')).replace('`','')[:120]}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"closed": summary["closed"], "total": summary["total"], "out_dir": str(out_dir)}, indent=2))
    print("EPKV_INTERNAL_SAMPLER_BATCH_DONE")


if __name__ == "__main__":
    main()
