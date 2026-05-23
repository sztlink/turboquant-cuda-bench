#!/usr/bin/env python3
"""Machine-only RealRAG reality report with paired bootstrap CIs.

Consumes an entity-hop gated-rerank summary and emits a compact markdown/json
report. No human adjudication; exact-answer benchmark only.
"""
from __future__ import annotations

import argparse
import json
import random
import statistics
from pathlib import Path
from typing import Any

METRICS = ["em", "contains", "f1"]
DEFAULT_CONDS = ["bge_ref", "strong", "path_prompt", "rerank", "gated_rerank_v1", "gated_rerank"]


def avg(xs: list[float]) -> float:
    return sum(xs) / max(1, len(xs))


def pct(xs: list[float], q: float) -> float:
    if not xs:
        return 0.0
    ys = sorted(xs)
    pos = (len(ys) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(ys) - 1)
    frac = pos - lo
    return ys[lo] * (1 - frac) + ys[hi] * frac


def two_sided_binom_p(k: int, n: int) -> float:
    """Exact two-sided binomial p for H0 p=0.5, small n stdlib implementation."""
    if n <= 0:
        return 1.0
    import math
    probs = [math.comb(n, i) * (0.5 ** n) for i in range(n + 1)]
    pk = probs[k]
    return min(1.0, sum(p for p in probs if p <= pk + 1e-15))


def summarize(rows: list[dict[str, Any]], conds: list[str]) -> dict[str, dict[str, float]]:
    out = {}
    for c in conds:
        if rows and c in rows[0]:
            out[c] = {m: avg([float(r[c][m]) for r in rows]) for m in METRICS}
    return out


def pair_stats(rows: list[dict[str, Any]], base: str, test: str) -> dict[str, Any]:
    wins = [r for r in rows if float(r[base]["em"]) == 0.0 and float(r[test]["em"]) == 1.0]
    losses = [r for r in rows if float(r[base]["em"]) == 1.0 and float(r[test]["em"]) == 0.0]
    ties = len(rows) - len(wins) - len(losses)
    return {
        "base": base,
        "test": test,
        "wins": len(wins),
        "losses": len(losses),
        "ties": ties,
        "discordant": len(wins) + len(losses),
        "binom_p_two_sided": two_sided_binom_p(len(wins), len(wins) + len(losses)),
        "win_indices": [int(r["idx"]) for r in wins],
        "loss_indices": [int(r["idx"]) for r in losses],
    }


def bootstrap(rows: list[dict[str, Any]], base: str, test: str, n: int, seed: int) -> dict[str, Any]:
    rng = random.Random(seed)
    diffs = {m: [] for m in METRICS}
    total = len(rows)
    if total == 0:
        return {m: {"mean_diff": 0.0, "ci95": [0.0, 0.0]} for m in METRICS}
    for _ in range(n):
        sample = [rows[rng.randrange(total)] for _ in range(total)]
        for m in METRICS:
            diffs[m].append(avg([float(r[test][m]) - float(r[base][m]) for r in sample]))
    return {
        m: {
            "mean_diff": avg([float(r[test][m]) - float(r[base][m]) for r in rows]),
            "ci95": [pct(diffs[m], 0.025), pct(diffs[m], 0.975)],
        }
        for m in METRICS
    }


def fmt(x: float) -> str:
    return f"{x:.3f}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--summary", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--baseline", default="path_prompt")
    ap.add_argument("--test", default="gated_rerank_v1")
    ap.add_argument("--bootstrap", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=500)
    args = ap.parse_args()

    src = json.loads(Path(args.summary).read_text(encoding="utf-8"))
    rows = src.get("rows", [])
    conds = [c for c in DEFAULT_CONDS if rows and c in rows[0]]
    macro = summarize(rows, conds)
    pair = pair_stats(rows, args.baseline, args.test)
    ci = bootstrap(rows, args.baseline, args.test, args.bootstrap, args.seed)

    retrieval = {}
    # Context fields may be copied into rows only for question; keep graceful.
    for k in ["support_title_recall", "full_support_recall", "answer_string_present_in_docs"]:
        vals = [float(r[k]) for r in rows if k in r]
        if vals:
            retrieval[k] = avg(vals)

    out = {
        "schema": "epkv.machine_only_reality_report.v0",
        "source_summary": args.summary,
        "total": len(rows),
        "macro": macro,
        "paired": pair,
        "bootstrap_vs_baseline": ci,
        "retrieval": retrieval,
        "caveat": "Machine-only exact-answer benchmark. No human adjudication.",
    }
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "summary.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = [
        "# RealRAG Machine-Only Reality Check",
        "",
        "> Automatic exact-answer benchmark only. No human adjudication.",
        "",
        f"total: {len(rows)}",
        "",
        "## Results",
        "",
        "| condition | EM | contains | F1 |",
        "|---|---:|---:|---:|",
    ]
    for c in conds:
        v = macro[c]
        md.append(f"| {c} | {fmt(v['em'])} | {fmt(v['contains'])} | {fmt(v['f1'])} |")
    md += [
        "",
        f"## Paired test: `{args.test}` vs `{args.baseline}`",
        "",
        "```json",
        json.dumps({k: v for k, v in pair.items() if k not in {"win_indices", "loss_indices"}}, indent=2),
        "```",
        "",
        "## Bootstrap 95% CI for metric deltas",
        "",
        "| metric | mean delta | 95% CI |",
        "|---|---:|---:|",
    ]
    for m, v in ci.items():
        md.append(f"| {m} | {fmt(v['mean_diff'])} | [{fmt(v['ci95'][0])}, {fmt(v['ci95'][1])}] |")
    if retrieval:
        md += ["", "## Retrieval diagnostics", "", "```json", json.dumps(retrieval, indent=2), "```"]
    md += [
        "",
        "## Interpretation boundary",
        "",
        "This report can support a machine-only quality delta claim on this slice. It cannot support human acceptability, general RAG dominance, or production readiness.",
    ]
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "total": len(rows), "macro": macro, "paired": {k: v for k, v in pair.items() if k not in {"win_indices", "loss_indices"}}, "bootstrap": ci}, indent=2, ensure_ascii=False))
    print("EPKV_MACHINE_ONLY_REALITY_REPORT_DONE")


if __name__ == "__main__":
    main()
