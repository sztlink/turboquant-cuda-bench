#!/usr/bin/env python3
"""Soft/multi-candidate sampler policy for entity-hop RealRAG.

Consumes an entity-hop summary (usually `entity-hop-llm-100/summary.json`) and
reruns the graph/path prompt with a soft first-token bias over multiple candidate
entities instead of a single strict extractor candidate.

Candidate sources are intentionally cheap and non-oracle:
- direct path-prompt output (optional; default on, acts as continuity anchor)
- selected entity-hop document titles
- title graph edge endpoints
- question seed entities

This tests whether sampler-side evidence control can help after entity-hop
retrieval without forcing a brittle single-candidate extractor.
"""
from __future__ import annotations

import argparse
import json
import re
import string
import subprocess
import tempfile
import time
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

from transformers import AutoTokenizer


SCaffoldS = [
    "Based", " Based", "The", " The", "According", " According",
    "From", " From", "Given", " Given", "Answer", " Answer",
]


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


def sh(cmd: list[str], *, timeout: int = 120) -> str:
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"command failed {p.returncode}: {' '.join(cmd)}\nSTDOUT={p.stdout}\nSTDERR={p.stderr}")
    return p.stdout


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def copy_policy_to_remote(local_policy: Path, host: str, windows_tmp: str, remote_policy_path: str) -> None:
    sh(["scp", str(local_policy), f"{host}:{windows_tmp}"], timeout=120)
    wsl_tmp = windows_tmp.replace("C:/", "/mnt/c/").replace("C:\\", "/mnt/c/").replace("\\", "/")
    sh(["ssh", host, "wsl.exe", "-d", "Ubuntu-24.04", "-u", "felipe", "--", "cp", wsl_tmp, remote_policy_path], timeout=120)


def first_token_ids(tok: Any, text: str) -> list[int]:
    s = str(text or "").strip()
    if not s:
        return []
    variants = [s, " " + s]
    # title disambiguation often has parentheticals; add clean title stem.
    stem = re.sub(r"\s*\([^)]*\)\s*", " ", s).strip()
    if stem and stem != s:
        variants.extend([stem, " " + stem])
    out: list[int] = []
    for v in variants:
        ids = tok.encode(v, add_special_tokens=False)
        if ids and int(ids[0]) not in out:
            out.append(int(ids[0]))
    return out


def scaffold_ids(tok: Any) -> list[int]:
    out: list[int] = []
    for s in SCaffoldS:
        ids = tok.encode(s, add_special_tokens=False)
        if ids and int(ids[0]) not in out:
            out.append(int(ids[0]))
    return out


def clean_candidate(s: str) -> str:
    s = re.sub(r"\s+", " ", str(s or "")).strip(" \t\n\r`*_#•-:;,.!?\"'")
    if not s:
        return ""
    if len(s) > 90:
        return ""
    low = s.lower()
    if low in {"unknown", "missing", "none", "n/a", "the", "a", "an"}:
        return ""
    # Avoid full explanatory sentences from path prompt output.
    if len(s.split()) > 8 and not re.match(r"^[\wÀ-ÖØ-öø-ÿ'’.-]+(?:,\s*[\wÀ-ÖØ-öø-ÿ'’.-]+){1,3}$", s):
        return ""
    return s


def candidate_list(row: dict[str, Any], *, include_path_output: bool, max_candidates: int) -> list[str]:
    raw: list[str] = []
    if include_path_output:
        raw.append(str(row.get("conditions", {}).get("entity_hop_path_prompt", {}).get("output") or ""))
    raw.extend(str(x) for x in row.get("selected_titles") or [])
    for edge in row.get("edges") or []:
        if isinstance(edge, list | tuple) and len(edge) >= 2:
            raw.append(str(edge[0]))
            raw.append(str(edge[1]))
    raw.extend(str(x) for x in row.get("seeds") or [])
    out: list[str] = []
    seen = set()
    for x in raw:
        c = clean_candidate(x)
        if not c:
            continue
        key = normalize_answer(c)
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(c)
        if len(out) >= max_candidates:
            break
    return out


def build_policy(tok: Any, qid: str, candidates: list[str], bias: float, scaffold_bias: float, tag: str) -> dict[str, Any]:
    bias_map: dict[str, float] = {}
    cand_ids: dict[str, list[int]] = {}
    for c in candidates:
        ids = first_token_ids(tok, c)
        cand_ids[c] = ids
        for i in ids:
            # If multiple candidates share a first token, keep the max but do not stack.
            bias_map[str(i)] = max(float(bias_map.get(str(i), -999.0)), float(bias))
    scaff = scaffold_ids(tok)
    for i in scaff:
        bias_map.setdefault(str(i), float(scaffold_bias))
    return {
        "schema": "epkv.soft_multi_candidate_policy.v0",
        "enabled": True,
        "tag": tag,
        "qid": qid,
        "candidates": candidates,
        "candidate_ids": cand_ids,
        "bias_map": bias_map,
        "suppress_scaffold": True,
        "scaffold_ids": scaff,
        "max_events": 1000000,
    }


def avg(rows: list[dict[str, Any]], condition: str, metric: str) -> float:
    if not rows:
        return 0.0
    return sum(float(r[condition][metric]) for r in rows) / len(rows)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--summary", required=True, help="entity-hop summary.json")
    p.add_argument("--responses-dir", required=True, help="directory with entity_hop_path_prompt response JSONs")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--host", default="4090")
    p.add_argument("--remote-policy-path", default="/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json")
    p.add_argument("--tokenizer", default="Qwen/Qwen2.5-7B-Instruct")
    p.add_argument("--bias", type=float, default=2.0)
    p.add_argument("--scaffold-bias", type=float, default=-8.0)
    p.add_argument("--max-candidates", type=int, default=12)
    p.add_argument("--max-tokens", type=int, default=24)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--no-path-output-candidate", action="store_true")
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    run_dir = out_dir / "runs"
    pol_dir = out_dir / "policies"
    run_dir.mkdir(parents=True, exist_ok=True)
    pol_dir.mkdir(parents=True, exist_ok=True)
    summary = json.loads(Path(args.summary).read_text(encoding="utf-8"))
    rows_in = summary.get("rows", [])[args.offset : args.offset + args.limit]
    tok = AutoTokenizer.from_pretrained(args.tokenizer, trust_remote_code=True)
    off_policy = {"enabled": False, "tag": "default-off"}
    out_rows = []
    t0 = time.time()
    with tempfile.TemporaryDirectory(prefix="epkv-soft-policy-") as td:
        td_path = Path(td)
        off_path = td_path / "off.json"
        off_path.write_text(json.dumps(off_policy, ensure_ascii=False) + "\n", encoding="utf-8")
        for row in rows_in:
            idx = row["idx"]
            qid = str(row["qid"])
            gold = str(row["gold"])
            resp_path = Path(args.responses_dir) / f"{idx}-{qid}-entity_hop_path_prompt.json"
            resp = json.loads(resp_path.read_text(encoding="utf-8"))
            prompt = str(resp["prompt"])
            candidates = candidate_list(row, include_path_output=not args.no_path_output_candidate, max_candidates=args.max_candidates)
            policy = build_policy(tok, qid, candidates, args.bias, args.scaffold_bias, f"entity-hop-soft-{idx}-{qid}")
            local_pol = pol_dir / f"{idx}-{qid}.json"
            local_pol.write_text(json.dumps(policy, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            response = None
            restore_error = ""
            try:
                copy_policy_to_remote(local_pol, args.host, "C:/temp/logit-policy.json", args.remote_policy_path)
                payload = {"model": args.model, "messages": [{"role": "user", "content": prompt}], "temperature": 0, "max_tokens": args.max_tokens}
                response = request_json(args.endpoint, payload, args.timeout)
            finally:
                try:
                    copy_policy_to_remote(off_path, args.host, "C:/temp/logit-policy.json", args.remote_policy_path)
                except Exception as exc:  # noqa: BLE001
                    restore_error = str(exc)
            output = content_of(response or {})
            m = metrics(output, gold)
            path_output = str(row.get("conditions", {}).get("entity_hop_path_prompt", {}).get("output") or "")
            path_m = metrics(path_output, gold)
            bge_m = row.get("bge_ref") or {}
            result = {
                "idx": idx,
                "qid": qid,
                "gold": gold,
                "candidates": candidates,
                "path_prompt": {**path_m, "output": path_output},
                "bge_ref": {"em": bge_m.get("em", 0), "contains": bge_m.get("contains", 0), "f1": bge_m.get("f1", 0), "output": bge_m.get("output", "")},
                "soft_policy": {**m, "output": output},
                "restore_error": restore_error,
                "policy_path": str(local_pol),
            }
            (run_dir / f"{idx}-{qid}.json").write_text(json.dumps({**result, "response": response}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            out_rows.append(result)

    macro = {
        "bge_ref": {m: avg(out_rows, "bge_ref", m) for m in ["em", "contains", "f1"]},
        "path_prompt": {m: avg(out_rows, "path_prompt", m) for m in ["em", "contains", "f1"]},
        "soft_policy": {m: avg(out_rows, "soft_policy", m) for m in ["em", "contains", "f1"]},
    }
    wins_losses = {
        "soft_wins_vs_path": sum(1 for r in out_rows if r["path_prompt"]["em"] == 0 and r["soft_policy"]["em"] == 1),
        "soft_losses_vs_path": sum(1 for r in out_rows if r["path_prompt"]["em"] == 1 and r["soft_policy"]["em"] == 0),
        "soft_wins_vs_bge": sum(1 for r in out_rows if float(r["bge_ref"].get("em", 0)) == 0 and r["soft_policy"]["em"] == 1),
        "soft_losses_vs_bge": sum(1 for r in out_rows if float(r["bge_ref"].get("em", 0)) == 1 and r["soft_policy"]["em"] == 0),
    }
    final = {
        "schema": "epkv.entity_hop_soft_policy.v0",
        "elapsed_sec": time.time() - t0,
        "total": len(out_rows),
        "source_summary": args.summary,
        "macro": macro,
        "wins_losses": wins_losses,
        "rows": out_rows,
    }
    (out_dir / "summary.json").write_text(json.dumps(final, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# Entity-Hop Soft Multi-Candidate Policy", "", f"total: {len(out_rows)}", "", "| condition | EM | contains | F1 |", "|---|---:|---:|---:|"]
    for k, v in macro.items():
        md.append(f"| {k} | {v['em']:.3f} | {v['contains']:.3f} | {v['f1']:.3f} |")
    md.extend(["", "## Win/loss", "", "```json", json.dumps(wins_losses, indent=2), "```", "", "## Rows", "", "| idx | gold | path | soft | candidates | soft output |", "|---:|---|---:|---:|---:|---|"])
    for r in out_rows:
        md.append(f"| {r['idx']} | {r['gold']} | {r['path_prompt']['em']:.0f}/{r['path_prompt']['f1']:.2f} | {r['soft_policy']['em']:.0f}/{r['soft_policy']['f1']:.2f} | {len(r['candidates'])} | `{str(r['soft_policy']['output']).replace('`','')[:90]}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "total": len(out_rows), "macro": macro, "wins_losses": wins_losses}, indent=2, ensure_ascii=False))
    print("EPKV_ENTITY_HOP_SOFT_POLICY_DONE")


if __name__ == "__main__":
    main()
