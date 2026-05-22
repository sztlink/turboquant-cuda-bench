#!/usr/bin/env python3
"""Summarize EPKV policy batch results by layer and failure/repair type."""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


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


def exact_closed(output: str, candidate: str) -> bool:
    return norm(candidate) in norm(output)


def alias_closed(output: str, candidate: str) -> bool:
    no = norm(output)
    return any(norm(a) in no for a in aliases(candidate))


def classify(row: dict) -> str:
    if not row.get("closed"):
        if row.get("returncode") not in (None, 0):
            return "runner_error"
        if row.get("relation_attempted"):
            return "unresolved_after_relation_fallback"
        return "unresolved_surface_or_candidate"
    layer = row.get("layer")
    if layer == "relation_path_then_decode":
        return "relation_path_repair"
    if exact_closed(str(row.get("output", "")), str(row.get("candidate", ""))):
        return "surface_decode_exact"
    if alias_closed(str(row.get("output", "")), str(row.get("candidate", ""))):
        return "surface_decode_alias"
    return "closed_unknown"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--summary", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()
    summary = json.loads(Path(args.summary).read_text(encoding="utf-8"))
    rows = summary.get("rows") or []
    by_layer: dict[str, Counter] = defaultdict(Counter)
    by_type = Counter()
    sample_rows = []
    for row in rows:
        c = classify(row)
        by_type[c] += 1
        by_layer[str(row.get("layer"))][c] += 1
        sample_rows.append({
            "qid": row.get("qid"),
            "layer": row.get("layer"),
            "classification": c,
            "candidate": row.get("candidate"),
            "output": row.get("output"),
            "closed": row.get("closed"),
            "candidate_ids": (row.get("policy") or {}).get("candidate_ids"),
            "scaffold_ids": (row.get("policy") or {}).get("scaffold_ids"),
            "provenance": (row.get("policy") or {}).get("provenance"),
        })
    result = {
        "schema": "epkv.policy_metrics.v0",
        "summary": args.summary,
        "closed": summary.get("closed"),
        "total": summary.get("total"),
        "classification_counts": dict(by_type),
        "by_layer_classification": {k: dict(v) for k, v in by_layer.items()},
        "rows": sample_rows,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = [
        "# EPKV policy metrics",
        "",
        f"source: `{args.summary}`",
        f"closed: {summary.get('closed')}/{summary.get('total')}",
        "",
        "## Classification counts",
        "",
        "| class | count |",
        "|---|---:|",
    ]
    for k, v in sorted(by_type.items()):
        md.append(f"| {k} | {v} |")
    md.extend(["", "## By layer", "", "| layer | class | count |", "|---|---|---:|"])
    for layer, ctr in sorted(by_layer.items()):
        for k, v in sorted(ctr.items()):
            md.append(f"| {layer} | {k} | {v} |")
    md.extend(["", "## Rows", "", "| qid | layer | class | candidate | output |", "|---|---|---|---|---|"])
    for r in sample_rows:
        md.append(f"| {r.get('qid')} | {r.get('layer')} | {r.get('classification')} | {r.get('candidate')} | `{str(r.get('output')).replace('`','')[:120]}` |")
    out.with_suffix(".md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out": str(out), "closed": result["closed"], "total": result["total"], "classification_counts": result["classification_counts"]}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
