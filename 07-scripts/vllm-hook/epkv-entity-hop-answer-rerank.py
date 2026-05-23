#!/usr/bin/env python3
"""Confidence-gated answer rerank over entity-hop path prompt outputs.

Instead of forcing decoder bias, this tests a safer control surface:
- keep direct entity-hop path prompt when candidates agree;
- when strong/path prompt disagree, ask a verifier to choose the best supported
  answer from a small candidate set, using the same entity-hop evidence prompt.

Goal: beat path prompt without adding many losses.
"""
from __future__ import annotations

import argparse
import json
import re
import string
import time
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any


def normalize_answer(s: str) -> str:
    def remove_articles(text: str) -> str:
        return re.sub(r"\b(a|an|the)\b", " ", text)
    def white_space_fix(text: str) -> str:
        return " ".join(text.split())
    def remove_punc(text: str) -> str:
        return "".join(ch for ch in text if ch not in set(string.punctuation))
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
    counts = Counter(pred_tokens)
    num_same = 0
    for t in gold_tokens:
        if counts[t] > 0:
            num_same += 1
            counts[t] -= 1
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


def call_llm(endpoint: str, model: str, prompt: str, max_tokens: int, timeout: int) -> tuple[str, dict[str, Any], float]:
    t0 = time.time()
    resp = request_json(endpoint, {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0, "max_tokens": max_tokens}, timeout)
    return content_of(resp), resp, time.time() - t0


def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        obj = json.loads(cleaned)
        return obj if isinstance(obj, dict) else {}
    except Exception:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        try:
            obj = json.loads(cleaned[start : end + 1])
            return obj if isinstance(obj, dict) else {}
        except Exception:
            return {}
    return {}


def clean_candidate(s: str) -> str:
    s = re.sub(r"\s+", " ", str(s or "")).strip(" \t\n\r`*_#•-:;,.!?\"'")
    if not s or s.lower() in {"unknown", "missing", "none", "n/a"}:
        return ""
    if len(s) > 140:
        return ""
    # Prefer answer strings, not explanatory sentences. Keep dates/awards with short context.
    if len(s.split()) > 12:
        return ""
    return s


def candidate_set(row: dict[str, Any], max_candidates: int) -> list[str]:
    raw: list[str] = []
    cond = row.get("conditions", {})
    raw.append(cond.get("entity_hop_path_prompt", {}).get("output", ""))
    raw.append(cond.get("entity_hop_strong", {}).get("output", ""))
    raw.append((row.get("bge_ref") or {}).get("output", ""))
    raw.extend(row.get("selected_titles") or [])
    for edge in row.get("edges") or []:
        if isinstance(edge, list) and len(edge) >= 2:
            raw.append(edge[0]); raw.append(edge[1])
    out: list[str] = []
    seen = set()
    for x in raw:
        c = clean_candidate(x)
        k = normalize_answer(c)
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(c)
        if len(out) >= max_candidates:
            break
    return out


def verifier_prompt(path_prompt: str, candidates: list[str]) -> str:
    c_lines = [f"C{i+1}: {c}" for i, c in enumerate(candidates)]
    return "\n".join([
        "You are a strict answer verifier for a multi-hop QA task.",
        "Use ONLY the evidence passages and candidate entity graph inside the original prompt.",
        "Choose the candidate that is directly supported by the evidence and best answers the question.",
        "If none are supported, return UNKNOWN.",
        "Return ONLY valid JSON with this schema:",
        '{"final_answer":"...","selected":"C1|C2|...|UNKNOWN","confidence":"high|medium|low","reason":"short"}',
        "",
        "Candidates:",
        *c_lines,
        "",
        "Original prompt with evidence:",
        path_prompt,
    ])


def avg(rows: list[dict[str, Any]], condition: str, metric: str) -> float:
    if not rows:
        return 0.0
    return sum(float(r[condition][metric]) for r in rows) / len(rows)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--summary", required=True)
    p.add_argument("--responses-dir", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--max-candidates", type=int, default=12)
    p.add_argument("--max-tokens", type=int, default=128)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--only-disagreements", action="store_true")
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    run_dir = out_dir / "runs"
    run_dir.mkdir(parents=True, exist_ok=True)
    summary = json.loads(Path(args.summary).read_text(encoding="utf-8"))
    rows_in = summary.get("rows", [])[args.offset : args.offset + args.limit]
    rows = []
    t0 = time.time()
    for row in rows_in:
        idx = row["idx"]
        qid = str(row["qid"])
        gold = str(row["gold"])
        path_out = str(row.get("conditions", {}).get("entity_hop_path_prompt", {}).get("output") or "")
        strong_out = str(row.get("conditions", {}).get("entity_hop_strong", {}).get("output") or "")
        bge_out = str((row.get("bge_ref") or {}).get("output") or "")
        path_m = metrics(path_out, gold)
        strong_m = metrics(strong_out, gold)
        bge_m = metrics(bge_out, gold)
        disagree = normalize_answer(path_out) != normalize_answer(strong_out)
        final = path_out
        selected = "PATH_FALLBACK"
        verifier_text = ""
        verifier_obj: dict[str, Any] = {}
        latency = 0.0
        if disagree or not args.only_disagreements:
            candidates = candidate_set(row, args.max_candidates)
            resp_path = Path(args.responses_dir) / f"{idx}-{qid}-entity_hop_path_prompt.json"
            path_prompt = json.loads(resp_path.read_text(encoding="utf-8"))["prompt"]
            prompt = verifier_prompt(path_prompt, candidates)
            verifier_text, response, latency = call_llm(args.endpoint, args.model, prompt, args.max_tokens, args.timeout)
            verifier_obj = extract_json_object(verifier_text)
            vfinal = clean_candidate(str(verifier_obj.get("final_answer") or ""))
            if vfinal and normalize_answer(vfinal) != "unknown":
                final = vfinal
                selected = str(verifier_obj.get("selected") or "VERIFIER")
            (run_dir / f"{idx}-{qid}.json").write_text(json.dumps({
                "idx": idx, "qid": qid, "gold": gold, "candidates": candidates,
                "verifier_prompt": prompt, "verifier_text": verifier_text, "verifier": verifier_obj,
                "final": final, "selected": selected, "response": response, "latency_sec": latency,
            }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        else:
            candidates = candidate_set(row, args.max_candidates)
        rows.append({
            "idx": idx, "qid": qid, "gold": gold, "disagree": disagree,
            "bge_ref": {**bge_m, "output": bge_out},
            "strong": {**strong_m, "output": strong_out},
            "path_prompt": {**path_m, "output": path_out},
            "rerank": {**metrics(final, gold), "output": final, "selected": selected, "verifier": verifier_obj, "latency_sec": latency},
            "candidates": candidates,
        })

    macro = {c: {m: avg(rows, c, m) for m in ["em", "contains", "f1"]} for c in ["bge_ref", "strong", "path_prompt", "rerank"]}
    wins_losses = {
        "rerank_wins_vs_path": sum(1 for r in rows if r["path_prompt"]["em"] == 0 and r["rerank"]["em"] == 1),
        "rerank_losses_vs_path": sum(1 for r in rows if r["path_prompt"]["em"] == 1 and r["rerank"]["em"] == 0),
        "rerank_wins_vs_bge": sum(1 for r in rows if r["bge_ref"]["em"] == 0 and r["rerank"]["em"] == 1),
        "rerank_losses_vs_bge": sum(1 for r in rows if r["bge_ref"]["em"] == 1 and r["rerank"]["em"] == 0),
        "disagreements": sum(1 for r in rows if r["disagree"]),
    }
    out = {"schema": "epkv.entity_hop_answer_rerank.v0", "elapsed_sec": time.time() - t0, "total": len(rows), "macro": macro, "wins_losses": wins_losses, "rows": rows}
    (out_dir / "summary.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# Entity-Hop Answer Rerank", "", f"total: {len(rows)}", "", "| condition | EM | contains | F1 |", "|---|---:|---:|---:|"]
    for k, v in macro.items():
        md.append(f"| {k} | {v['em']:.3f} | {v['contains']:.3f} | {v['f1']:.3f} |")
    md += ["", "## Win/loss", "", "```json", json.dumps(wins_losses, indent=2), "```", "", "## Rows", "", "| idx | gold | path | strong | rerank | selected | output |", "|---:|---|---:|---:|---:|---|---|"]
    for r in rows:
        md.append(f"| {r['idx']} | {r['gold']} | {r['path_prompt']['em']:.0f}/{r['path_prompt']['f1']:.2f} | {r['strong']['em']:.0f}/{r['strong']['f1']:.2f} | {r['rerank']['em']:.0f}/{r['rerank']['f1']:.2f} | {r['rerank']['selected']} | `{str(r['rerank']['output']).replace('`','')[:90]}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "total": len(rows), "macro": macro, "wins_losses": wins_losses}, indent=2, ensure_ascii=False))
    print("EPKV_ENTITY_HOP_ANSWER_RERANK_DONE")


if __name__ == "__main__":
    main()
