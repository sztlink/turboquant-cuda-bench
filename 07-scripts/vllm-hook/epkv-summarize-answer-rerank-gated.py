#!/usr/bin/env python3
"""Post-process answer-rerank runs with a conservative confidence gate.

Rule:
- Default to direct entity-hop path-prompt output.
- Override with verifier answer only when verifier confidence is high and the
  verifier answer is not just a more-specific/superset variant of the path output.

This protects exact-answer cases like `1969` vs `December 1969` and `United
Nations` vs `United Nations High Commissioner for Refugees`, while still allowing
verifier to recover path-prompt misses.
"""
from __future__ import annotations

import argparse
import json
import re
import string
from collections import Counter
from pathlib import Path
from typing import Any


def normalize_answer(s: str) -> str:
    def remove_articles(text: str) -> str:
        return re.sub(r"\b(a|an|the)\b", " ", text)
    def remove_punc(text: str) -> str:
        return "".join(ch for ch in text if ch not in set(string.punctuation))
    return " ".join(remove_articles(remove_punc(str(s).lower())).split())


def exact_match(a: str, b: str) -> float:
    return float(normalize_answer(a) == normalize_answer(b))


def contains_match(a: str, b: str) -> float:
    na = normalize_answer(a); nb = normalize_answer(b)
    return float(bool(nb) and nb in na)


def f1_score(a: str, b: str) -> float:
    pa = normalize_answer(a).split(); gb = normalize_answer(b).split()
    if not pa and not gb: return 1.0
    if not pa or not gb: return 0.0
    c = Counter(pa); same = 0
    for t in gb:
        if c[t] > 0:
            same += 1; c[t] -= 1
    if not same: return 0.0
    p = same / len(pa); r = same / len(gb)
    return 2 * p * r / (p + r)


def metrics(out: str, gold: str) -> dict[str, float]:
    return {"em": exact_match(out, gold), "contains": contains_match(out, gold), "f1": f1_score(out, gold)}


def avg(rows: list[dict[str, Any]], cond: str, metric: str) -> float:
    return sum(float(r[cond][metric]) for r in rows) / max(1, len(rows))


def should_override(path_out: str, verifier_out: str, verifier: dict[str, Any]) -> bool:
    if str(verifier.get("confidence") or "").lower() != "high":
        return False
    np = normalize_answer(path_out)
    nv = normalize_answer(verifier_out)
    if not nv:
        return False
    # If verifier merely adds/removes specificity around path output, keep path.
    if np and (np in nv or nv in np):
        return False
    return True


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--summary", required=True)
    p.add_argument("--out-dir", required=True)
    args = p.parse_args()
    src = json.loads(Path(args.summary).read_text(encoding="utf-8"))
    rows = []
    for r in src["rows"]:
        path_out = r["path_prompt"]["output"]
        verifier_out = r["rerank"]["output"]
        verifier = r["rerank"].get("verifier") or {}
        use = should_override(path_out, verifier_out, verifier)
        out = verifier_out if use else path_out
        rr = dict(r)
        rr["gated_rerank"] = {**metrics(out, r["gold"]), "output": out, "used_verifier": bool(use), "rule": "high_confidence_no_overlap"}
        rows.append(rr)
    macro = {}
    for cond in ["bge_ref", "strong", "path_prompt", "rerank", "gated_rerank"]:
        macro[cond] = {m: avg(rows, cond, m) for m in ["em", "contains", "f1"]}
    wins_losses = {
        "gated_wins_vs_path": sum(1 for r in rows if r["path_prompt"]["em"] == 0 and r["gated_rerank"]["em"] == 1),
        "gated_losses_vs_path": sum(1 for r in rows if r["path_prompt"]["em"] == 1 and r["gated_rerank"]["em"] == 0),
        "gated_wins_vs_bge": sum(1 for r in rows if r["bge_ref"]["em"] == 0 and r["gated_rerank"]["em"] == 1),
        "gated_losses_vs_bge": sum(1 for r in rows if r["bge_ref"]["em"] == 1 and r["gated_rerank"]["em"] == 0),
        "overrides": sum(1 for r in rows if r["gated_rerank"]["used_verifier"]),
    }
    out_dir = Path(args.out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    out = {"schema": "epkv.entity_hop_answer_rerank_gated.v0", "source_summary": args.summary, "total": len(rows), "macro": macro, "wins_losses": wins_losses, "rows": rows}
    (out_dir / "summary.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# Entity-Hop Confidence-Gated Answer Rerank", "", f"total: {len(rows)}", "", "| condition | EM | contains | F1 |", "|---|---:|---:|---:|"]
    for k, v in macro.items():
        md.append(f"| {k} | {v['em']:.3f} | {v['contains']:.3f} | {v['f1']:.3f} |")
    md += ["", "## Gate", "", "```txt", "default: keep entity-hop path prompt", "override: verifier confidence high AND verifier/path outputs do not overlap", "```", "", "## Win/loss", "", "```json", json.dumps(wins_losses, indent=2), "```", "", "## Overrides", "", "| idx | gold | path | verifier | gated |", "|---:|---|---|---|---|"]
    for r in rows:
        if r["gated_rerank"]["used_verifier"]:
            md.append(f"| {r['idx']} | {r['gold']} | `{r['path_prompt']['output']}` | `{r['rerank']['output']}` | `{r['gated_rerank']['output']}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "macro": macro, "wins_losses": wins_losses}, indent=2, ensure_ascii=False))
    print("EPKV_ENTITY_HOP_GATED_RERANK_DONE")


if __name__ == "__main__":
    main()
