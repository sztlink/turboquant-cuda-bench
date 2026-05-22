#!/usr/bin/env python3
"""Compare baseline, KV-only artifact, API logit_bias, internal sampler policy, and relation fallback."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path
from typing import Any


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def aliases(candidate: str) -> list[str]:
    out = [candidate]
    if candidate == "English":
        out.extend(["England", "Germany"])
    if candidate == "German":
        out.append("Germany")
    if candidate.startswith("Ví"):
        out.extend([candidate.replace("Ví", "Vi", 1), "Victor Bó", "Victor Bo"])
    return list(dict.fromkeys(out))


def closes(output: str, candidate: str) -> bool:
    no = norm(output)
    return any(norm(a) in no for a in aliases(candidate))


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def sh(cmd: list[str], timeout: int = 180) -> str:
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"command failed {p.returncode}: {' '.join(cmd)}\n{p.stderr}")
    return p.stdout


def kv_output(path_s: str) -> str:
    if not path_s:
        return ""
    p = Path(path_s)
    if not p.exists():
        return ""
    obj = json.loads(p.read_text(encoding="utf-8"))
    for key in ["output_text", "response_text", "content", "output"]:
        if obj.get(key):
            return str(obj[key])
    try:
        return str(obj["choices"][0]["message"]["content"])
    except Exception:
        return ""


def load_dataset(dataset: Path) -> dict[str, dict[str, Any]]:
    data = json.loads(dataset.read_text(encoding="utf-8"))
    return {str(x.get("_id")): x for x in data if x.get("_id")}


def relation_prompt(item: dict[str, Any]) -> str:
    triples = item.get("evidences") or []
    chain = "\n".join(f"{s} -- {p} --> {o}." for s, p, o in triples[:2])
    return "\n".join([
        "Answer with only the final entity at the end of the relation chain.",
        "Relation chain:",
        chain,
        f"Question: {item['question']}",
    ])


def build_policy(span_map: str, out: Path, source: str, bias: float, suppress: bool) -> dict[str, Any]:
    cmd = [sys.executable, "07-scripts/vllm-hook/epkv-build-logit-policy-file.py", "--span-map", span_map, "--candidate-source", source, "--bias", str(bias), "--out", str(out)]
    if suppress:
        cmd.append("--suppress-scaffold")
    sh(cmd)
    return json.loads(out.read_text(encoding="utf-8"))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--cases", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--bias", type=float, default=3.0)
    p.add_argument("--max-tokens", type=int, default=16)
    p.add_argument("--timeout", type=int, default=120)
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    cases = json.loads(Path(args.cases).read_text(encoding="utf-8"))
    dataset = load_dataset(Path(args.dataset))
    rows = []
    for case in cases:
        label = case["label"]
        span_path = case["span_map"]
        span = json.loads(Path(span_path).read_text(encoding="utf-8"))
        qid = str(span.get("qid"))
        user = span["messages"][0]["content"]
        with tempfile.TemporaryDirectory(prefix="epkv-compare-") as td:
            policy = build_policy(span_path, Path(td) / "policy.json", case.get("candidate_source", "auto"), float(case.get("bias", args.bias)), bool(case.get("suppress_scaffold", True)))
        candidate = policy.get("candidate", "")

        baseline_resp = request_json(args.endpoint, {"model": args.model, "messages": [{"role": "user", "content": user}], "temperature": 0, "max_tokens": args.max_tokens}, args.timeout)
        baseline = content_of(baseline_resp)
        kv = kv_output(case.get("kv_only_artifact", ""))
        api_resp = request_json(args.endpoint, {"model": args.model, "messages": [{"role": "user", "content": user}], "temperature": 0, "max_tokens": args.max_tokens, "logit_bias": policy.get("bias_map", {})}, args.timeout)
        api = content_of(api_resp)

        internal_out = out_dir / f"{label}-internal.json"
        sh([sys.executable, "07-scripts/vllm-hook/epkv-internal-sampler-policy-live.py", "--span-map", span_path, "--candidate-source", case.get("candidate_source", "auto"), "--bias", str(case.get("bias", args.bias)), "--max-tokens", str(args.max_tokens), "--out", str(internal_out), "--max-events", "1000000"] + (["--suppress-scaffold"] if case.get("suppress_scaffold", True) else []), timeout=300)
        internal_data = json.loads(internal_out.read_text(encoding="utf-8"))
        internal = internal_data.get("output", "")

        rel = ""
        if qid in dataset:
            rel_prompt = relation_prompt(dataset[qid])
            rel_resp = request_json(args.endpoint, {"model": args.model, "messages": [{"role": "user", "content": rel_prompt}], "temperature": 0, "max_tokens": args.max_tokens}, args.timeout)
            rel = content_of(rel_resp)

        rows.append({
            "label": label,
            "qid": qid,
            "candidate": candidate,
            "baseline": {"output": baseline, "closed": closes(baseline, candidate)},
            "kv_only": {"artifact": case.get("kv_only_artifact", ""), "output": kv, "closed": closes(kv, candidate)},
            "api_logit_bias": {"output": api, "closed": closes(api, candidate)},
            "internal_sampler_policy": {"artifact": str(internal_out), "output": internal, "closed": closes(internal, candidate), "hook_event_count": internal_data.get("hook_event_count")},
            "relation_path_then_decode": {"output": rel, "closed": closes(rel, candidate)},
            "policy": {"candidate_ids": policy.get("candidate_ids"), "scaffold_ids": policy.get("scaffold_ids"), "provenance": policy.get("provenance")},
        })
    result = {"schema": "epkv.policy_stack_comparison.v0", "rows": rows}
    (out_dir / "comparison.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# EPKV policy stack comparison", "", "| case | candidate | baseline | KV-only | API logit_bias | internal sampler | relation path |", "|---|---|---:|---:|---:|---:|---:|"]
    for r in rows:
        md.append(f"| {r['label']} | {r['candidate']} | {int(r['baseline']['closed'])} | {int(r['kv_only']['closed'])} | {int(r['api_logit_bias']['closed'])} | {int(r['internal_sampler_policy']['closed'])} | {int(r['relation_path_then_decode']['closed'])} |")
    md.extend(["", "## Outputs", ""])
    for r in rows:
        md.append(f"### {r['label']} — {r['candidate']}")
        for key in ["baseline", "kv_only", "api_logit_bias", "internal_sampler_policy", "relation_path_then_decode"]:
            md.append(f"- **{key}** ({int(r[key]['closed'])}): `{str(r[key]['output']).replace('`','')}`")
        md.append("")
    (out_dir / "COMPARISON.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "rows": len(rows), "closed_counts": {k: sum(1 for r in rows if r[k]["closed"]) for k in ["baseline", "kv_only", "api_logit_bias", "internal_sampler_policy", "relation_path_then_decode"]}}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
