#!/usr/bin/env python3
"""Quality evaluation for EPKV Evidence-Controlled Decoding batches.

Runs baseline decoding for a span-map batch and compares it with an existing
internal-sampler+relation-fallback summary using EM/token-F1/contains metrics.
"""
from __future__ import annotations

import argparse
import json
import re
import string
import time
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any


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
    common = {}
    for t in pred_tokens:
        common[t] = common.get(t, 0) + 1
    num_same = 0
    for t in gold_tokens:
        if common.get(t, 0) > 0:
            num_same += 1
            common[t] -= 1
    if num_same == 0:
        return 0.0
    precision = num_same / len(pred_tokens)
    recall = num_same / len(gold_tokens)
    return 2 * precision * recall / (precision + recall)


def metrics(pred: str, gold: str) -> dict[str, float]:
    return {"em": exact_match(pred, gold), "contains": contains_match(pred, gold), "f1": f1_score(pred, gold)}


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def avg(rows: list[dict[str, Any]], key: str, metric: str) -> float:
    if not rows:
        return 0.0
    return sum(float(r[key][metric]) for r in rows) / len(rows)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-dir", required=True)
    p.add_argument("--policy-summary", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--max-tokens", type=int, default=32)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--limit", type=int, default=0)
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    baseline_dir = out_dir / "baseline"
    baseline_dir.mkdir(parents=True, exist_ok=True)
    policy_summary = json.loads(Path(args.policy_summary).read_text(encoding="utf-8"))
    policy_by_qid = {str(r.get("qid")): r for r in policy_summary.get("rows", [])}
    span_paths = sorted(Path(args.span_dir).glob("*.json"))
    if args.limit:
        span_paths = span_paths[: args.limit]
    rows = []
    t0 = time.time()
    for span_path in span_paths:
        span = json.loads(span_path.read_text(encoding="utf-8"))
        qid = str(span.get("qid"))
        gold = str(span.get("gold_answer") or "")
        user = span["messages"][0]["content"]
        resp = request_json(args.endpoint, {"model": args.model, "messages": [{"role": "user", "content": user}], "temperature": 0, "max_tokens": args.max_tokens}, args.timeout)
        baseline_output = content_of(resp)
        (baseline_dir / span_path.name).write_text(json.dumps({"qid": qid, "gold": gold, "output": baseline_output, "response": resp}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        prow = policy_by_qid.get(qid, {})
        policy_output = str(prow.get("output") or "")
        layer = str(prow.get("layer") or "")
        row = {
            "qid": qid,
            "gold": gold,
            "type": (span_path.name.split("-")[1] if "-" in span_path.name else ""),
            "layer": layer,
            "baseline_output": baseline_output,
            "policy_output": policy_output,
            "baseline": metrics(baseline_output, gold),
            "policy": metrics(policy_output, gold),
            "policy_closed": bool(prow.get("closed")),
            "policy_artifact": prow.get("artifact"),
            "relation_artifact": prow.get("relation_artifact"),
        }
        rows.append(row)
    summary: dict[str, Any] = {
        "schema": "epkv.quality_eval.v0",
        "elapsed_sec": time.time() - t0,
        "total": len(rows),
        "policy_summary": args.policy_summary,
        "macro": {
            "baseline": {m: avg(rows, "baseline", m) for m in ["em", "contains", "f1"]},
            "policy": {m: avg(rows, "policy", m) for m in ["em", "contains", "f1"]},
        },
        "by_layer": {},
        "rows": rows,
    }
    for layer in sorted(set(r["layer"] for r in rows)):
        subset = [r for r in rows if r["layer"] == layer]
        summary["by_layer"][layer] = {
            "total": len(subset),
            "policy": {m: avg(subset, "policy", m) for m in ["em", "contains", "f1"]},
        }
    out_json = out_dir / "quality-summary.json"
    out_json.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = [
        "# EPKV Quality Evaluation",
        "",
        f"total: {summary['total']}",
        "",
        "## Macro metrics",
        "",
        "| system | EM | contains | token F1 |",
        "|---|---:|---:|---:|",
        f"| baseline | {summary['macro']['baseline']['em']:.3f} | {summary['macro']['baseline']['contains']:.3f} | {summary['macro']['baseline']['f1']:.3f} |",
        f"| internal+relation policy | {summary['macro']['policy']['em']:.3f} | {summary['macro']['policy']['contains']:.3f} | {summary['macro']['policy']['f1']:.3f} |",
        "",
        "## By winning layer",
        "",
        "| layer | n | EM | contains | F1 |",
        "|---|---:|---:|---:|---:|",
    ]
    for layer, v in summary["by_layer"].items():
        md.append(f"| {layer} | {v['total']} | {v['policy']['em']:.3f} | {v['policy']['contains']:.3f} | {v['policy']['f1']:.3f} |")
    md.extend(["", "## Rows", "", "| qid | layer | gold | baseline EM/F1 | policy EM/F1 | baseline | policy |", "|---|---|---|---:|---:|---|---|"])
    for r in rows:
        md.append(f"| {r['qid']} | {r['layer']} | {r['gold']} | {r['baseline']['em']:.0f}/{r['baseline']['f1']:.2f} | {r['policy']['em']:.0f}/{r['policy']['f1']:.2f} | `{r['baseline_output'].replace('`','')[:80]}` | `{r['policy_output'].replace('`','')[:80]}` |")
    (out_dir / "QUALITY-RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "total": len(rows), "macro": summary["macro"]}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
