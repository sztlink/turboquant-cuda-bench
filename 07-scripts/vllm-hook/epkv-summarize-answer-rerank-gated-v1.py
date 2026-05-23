#!/usr/bin/env python3
"""Post-process answer-rerank runs with a stricter v1 override gate.

v0 showed a useful 100-case signal but introduced losses at 300 cases because
`confidence=high` was not calibrated. v1 keeps the same default (trust the
direct entity-hop path prompt) and adds two loss guards:

- exact/unknown preservation: if the verifier selected UNKNOWN and the path is a
  concrete answer, do not override it.
- relation-owner guard: if the verifier answer appears as the owner of the
  relation in its own rationale (e.g. "Nero's mother ...") while the question asks
  for that relation target (mother/father/etc.), do not override.

This is deliberately conservative: the point is to learn when to abstain, not to
maximize overrides.
"""
from __future__ import annotations

import argparse
import json
import re
import string
from collections import Counter
from pathlib import Path
from typing import Any


RELATION_TERMS = [
    "mother-in-law", "father-in-law", "mother", "father", "wife", "husband",
    "daughter", "son", "sister", "brother", "grandmother", "grandfather",
    "parent", "spouse", "child",
]
SCHEMA_ARTIFACTS = {
    "place of origin", "place of birth", "place of death", "date of birth",
    "date of death", "country of origin", "occupation", "profession",
}


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


def is_schema_artifact(s: str) -> bool:
    n = normalize_answer(s)
    return n in {normalize_answer(x) for x in SCHEMA_ARTIFACTS}


def looks_concrete(s: str) -> bool:
    n = normalize_answer(s)
    if not n or is_schema_artifact(s):
        return False
    # Reject full explanatory sentences as "concrete exact answers".
    if len(str(s).split()) > 8 and re.search(r"\b(is|was|were|died|born|worked)\b", str(s), re.I):
        return False
    return True


def question_relation_terms(question: str) -> set[str]:
    q = normalize_answer(question.replace("-", " "))
    found = set()
    for term in RELATION_TERMS:
        if normalize_answer(term.replace("-", " ")) in q:
            found.add(term)
    return found


def relation_owner_guard(question: str, verifier_out: str, reason: str) -> bool:
    terms = question_relation_terms(question)
    if not terms:
        return False
    vo = re.escape(str(verifier_out).strip())
    if not vo:
        return False
    # If the rationale says "<answer>'s mother/father/...", the proposed answer
    # is likely the source entity, not the requested relation target.
    pat = re.compile(rf"\b{vo}\s*(?:'s|’s)\s+({'|'.join(re.escape(t) for t in RELATION_TERMS)})\b", re.I)
    return bool(pat.search(reason or ""))


def should_override(path_out: str, verifier_out: str, verifier: dict[str, Any], question: str = "") -> tuple[bool, str]:
    if str(verifier.get("confidence") or "").lower() != "high":
        return False, "not_high_confidence"
    np = normalize_answer(path_out)
    nv = normalize_answer(verifier_out)
    if not nv:
        return False, "empty_verifier"
    if np and (np in nv or nv in np):
        return False, "overlap_preserve_path"

    selected = str(verifier.get("selected") or "")
    reason = str(verifier.get("reason") or "")

    if selected.strip().upper() == "UNKNOWN" and looks_concrete(path_out):
        return False, "unknown_selected_preserve_concrete_path"

    if relation_owner_guard(question, verifier_out, reason):
        return False, "relation_owner_preserve_path"

    return True, "high_confidence_no_overlap_v1"


def load_context(path: str | None) -> dict[int, dict[str, Any]]:
    if not path:
        return {}
    p = Path(path)
    if not p.exists():
        return {}
    src = json.loads(p.read_text(encoding="utf-8"))
    return {int(r["idx"]): r for r in src.get("rows", [])}


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--summary", required=True)
    p.add_argument("--context-summary", help="entity-hop LLM summary with questions/support metadata")
    p.add_argument("--out-dir", required=True)
    args = p.parse_args()

    src = json.loads(Path(args.summary).read_text(encoding="utf-8"))
    context = load_context(args.context_summary)
    rows = []
    for r in src["rows"]:
        idx = int(r["idx"])
        ctx = context.get(idx, {})
        question = str(ctx.get("question") or r.get("question") or "")
        path_out = r["path_prompt"]["output"]
        verifier_out = r["rerank"]["output"]
        verifier = r["rerank"].get("verifier") or {}
        use, rule = should_override(path_out, verifier_out, verifier, question)
        out = verifier_out if use else path_out
        rr = dict(r)
        if question:
            rr["question"] = question
        rr["gated_rerank_v1"] = {**metrics(out, r["gold"]), "output": out, "used_verifier": bool(use), "rule": rule}
        rows.append(rr)

    macro = {}
    for cond in ["bge_ref", "strong", "path_prompt", "rerank", "gated_rerank_v1"]:
        macro[cond] = {m: avg(rows, cond, m) for m in ["em", "contains", "f1"]}
    wins_losses = {
        "gated_wins_vs_path": sum(1 for r in rows if r["path_prompt"]["em"] == 0 and r["gated_rerank_v1"]["em"] == 1),
        "gated_losses_vs_path": sum(1 for r in rows if r["path_prompt"]["em"] == 1 and r["gated_rerank_v1"]["em"] == 0),
        "gated_wins_vs_bge": sum(1 for r in rows if r["bge_ref"]["em"] == 0 and r["gated_rerank_v1"]["em"] == 1),
        "gated_losses_vs_bge": sum(1 for r in rows if r["bge_ref"]["em"] == 1 and r["gated_rerank_v1"]["em"] == 0),
        "overrides": sum(1 for r in rows if r["gated_rerank_v1"]["used_verifier"]),
    }
    rule_counts = Counter(r["gated_rerank_v1"]["rule"] for r in rows)

    out_dir = Path(args.out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    out = {
        "schema": "epkv.entity_hop_answer_rerank_gated.v1",
        "source_summary": args.summary,
        "context_summary": args.context_summary,
        "total": len(rows),
        "macro": macro,
        "wins_losses": wins_losses,
        "rule_counts": dict(rule_counts),
        "rows": rows,
    }
    (out_dir / "summary.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md = ["# Entity-Hop Confidence-Gated Answer Rerank v1", "", f"total: {len(rows)}", "", "| condition | EM | contains | F1 |", "|---|---:|---:|---:|"]
    for k, v in macro.items():
        md.append(f"| {k} | {v['em']:.3f} | {v['contains']:.3f} | {v['f1']:.3f} |")
    md += ["", "## Gate", "", "```txt", "default: keep entity-hop path prompt", "override: confidence high + no overlap + not UNKNOWN-over-concrete-path + not relation-owner rationale", "```", "", "## Win/loss", "", "```json", json.dumps(wins_losses, indent=2), "```", "", "## Rule counts", "", "```json", json.dumps(dict(rule_counts), indent=2), "```", "", "## Overrides", "", "| idx | gold | question | path | verifier | gated |", "|---:|---|---|---|---|---|"]
    for r in rows:
        if r["gated_rerank_v1"]["used_verifier"]:
            q = str(r.get("question") or "").replace("|", "\\|")
            md.append(f"| {r['idx']} | {r['gold']} | {q} | `{r['path_prompt']['output']}` | `{r['rerank']['output']}` | `{r['gated_rerank_v1']['output']}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(json.dumps({"out_dir": str(out_dir), "macro": macro, "wins_losses": wins_losses, "rule_counts": dict(rule_counts)}, indent=2, ensure_ascii=False))
    print("EPKV_ENTITY_HOP_GATED_RERANK_V1_DONE")


if __name__ == "__main__":
    main()
