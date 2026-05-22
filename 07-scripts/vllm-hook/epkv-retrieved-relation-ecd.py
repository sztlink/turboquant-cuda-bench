#!/usr/bin/env python3
"""Retrieved-docs -> relation/path extraction -> ECD sampler policy.

Consumes outputs from `epkv-rag-reality-check.py` (BGE rerank prompts) and tests
whether retrieved passages can be converted into a relation/path candidate that
then drives Evidence-Controlled Decoding.

This is the bridge test between natural retrieval and the oracle-evidence ECD
quality proofs.
"""
from __future__ import annotations

import argparse
import json
import re
import string
import subprocess
import sys
import time
import urllib.request
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
    counts: dict[str, int] = {}
    for t in pred_tokens:
        counts[t] = counts.get(t, 0) + 1
    num_same = 0
    for t in gold_tokens:
        if counts.get(t, 0) > 0:
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
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - local lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def call_llm(endpoint: str, model: str, prompt: str, max_tokens: int, timeout: int) -> tuple[str, dict[str, Any], float]:
    t0 = time.time()
    resp = request_json(endpoint, {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0, "max_tokens": max_tokens}, timeout)
    return content_of(resp), resp, time.time() - t0


def parse_question_from_prompt(prompt: str) -> str:
    m = re.search(r"\nQuestion:\s*(.*?)\nFinal answer:", prompt, flags=re.S)
    if m:
        return m.group(1).strip()
    m = re.search(r"\nQuestion:\s*(.*)$", prompt, flags=re.S)
    return m.group(1).strip() if m else ""


def parse_passages_from_prompt(prompt: str) -> str:
    m = re.search(r"Passages:\n(.*?)\nQuestion:", prompt, flags=re.S)
    return m.group(1).strip() if m else prompt


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


def relation_extract_prompt(question: str, passages: str) -> str:
    return f"""You are a strict relation-path extractor for multi-hop QA.
Use ONLY the retrieved passages below. Some are distractors.
Find a minimal relation chain that answers the question.
If the retrieved passages do not contain enough information, output status MISSING.
Return ONLY valid JSON, no markdown.

JSON schema:
{{"status":"FOUND|MISSING","final_answer":"answer string or UNKNOWN","chain":["A -- relation --> B"],"evidence_passages":["P1"],"reason":"short"}}

Retrieved passages:
{passages}

Question: {question}
"""


def ecd_answer_prompt(question: str, passages: str) -> str:
    return "\n".join([
        "You are answering a multi-hop question using retrieved passages.",
        "Some passages may be irrelevant or distracting.",
        "Use only passages that directly support the answer.",
        "Answer with only the final answer string. No explanation.",
        "Passages:",
        passages,
        f"Question: {question}",
        "Final answer:",
    ])


def sh(cmd: list[str], timeout: int = 300) -> str:
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"command failed {p.returncode}: {' '.join(cmd)}\nSTDOUT={p.stdout}\nSTDERR={p.stderr}")
    return p.stdout


def run_internal_ecd(prompt: str, candidate: str, qid: str, gold: str, out_path: Path, bias: float, max_tokens: int) -> dict[str, Any]:
    fake = {
        "schema": "epkv.retrieved_relation_prompt.v0",
        "qid": qid,
        "gold_answer": gold,
        "messages": [{"role": "user", "content": prompt}],
        "spans": [],
    }
    span_path = out_path.with_suffix(".span-map.json")
    span_path.write_text(json.dumps(fake, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    sh([
        sys.executable,
        "07-scripts/vllm-hook/epkv-internal-sampler-policy-live.py",
        "--span-map", str(span_path),
        "--candidate", candidate,
        "--candidate-source", "auto",
        "--bias", str(bias),
        "--suppress-scaffold",
        "--max-tokens", str(max_tokens),
        "--out", str(out_path),
    ], timeout=420)
    return json.loads(out_path.read_text(encoding="utf-8"))


def avg(rows: list[dict[str, Any]], key: str, metric: str) -> float:
    if not rows:
        return 0.0
    return sum(float(r[key][metric]) for r in rows) / len(rows)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--rag-summary", required=True)
    p.add_argument("--responses-dir", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--limit", type=int, default=20)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--extract-max-tokens", type=int, default=256)
    p.add_argument("--answer-max-tokens", type=int, default=32)
    p.add_argument("--bias", type=float, default=3.0)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--disable-internal-ecd", action="store_true")
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    extract_dir = out_dir / "extract"
    ecd_dir = out_dir / "ecd"
    extract_dir.mkdir(parents=True, exist_ok=True)
    ecd_dir.mkdir(parents=True, exist_ok=True)
    summary = json.loads(Path(args.rag_summary).read_text(encoding="utf-8"))
    rows_in = summary.get("rows", [])[args.offset : args.offset + args.limit]
    rows = []
    t0 = time.time()
    for row in rows_in:
        qid = str(row["qid"])
        idx = row.get("idx", len(rows))
        gold = str(row.get("gold") or "")
        resp_path = Path(args.responses_dir) / f"{idx}-{qid}-bge_rerank_strong.json"
        if not resp_path.exists():
            matches = list(Path(args.responses_dir).glob(f"*-{qid}-bge_rerank_strong.json"))
            resp_path = matches[0] if matches else resp_path
        base_resp = json.loads(resp_path.read_text(encoding="utf-8"))
        prompt = base_resp["prompt"]
        question = parse_question_from_prompt(prompt)
        passages = parse_passages_from_prompt(prompt)
        extract_prompt = relation_extract_prompt(question, passages)
        extract_text, extract_response, extract_latency = call_llm(args.endpoint, args.model, extract_prompt, args.extract_max_tokens, args.timeout)
        extract_obj = extract_json_object(extract_text)
        candidate = str(extract_obj.get("final_answer") or "").strip()
        status = str(extract_obj.get("status") or "").upper()
        if candidate.upper() in {"", "UNKNOWN", "MISSING", "N/A", "NONE"}:
            candidate = ""
        extract_artifact = extract_dir / f"{idx}-{qid}.json"
        extract_artifact.write_text(json.dumps({
            "qid": qid,
            "gold": gold,
            "question": question,
            "extract_prompt": extract_prompt,
            "extract_text": extract_text,
            "extract": extract_obj,
            "response": extract_response,
            "latency_sec": extract_latency,
        }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        extract_output = candidate if status == "FOUND" and candidate else extract_text
        ecd_output = ""
        ecd_data: dict[str, Any] | None = None
        ecd_error = ""
        if candidate and not args.disable_internal_ecd:
            try:
                ecd_data = run_internal_ecd(ecd_answer_prompt(question, passages), candidate, qid, gold, ecd_dir / f"{idx}-{qid}.json", args.bias, args.answer_max_tokens)
                ecd_output = str(ecd_data.get("output") or "")
            except Exception as exc:  # noqa: BLE001
                ecd_error = str(exc)
        m_extract = metrics(extract_output, gold)
        m_ecd = metrics(ecd_output, gold) if ecd_output else {"em": 0.0, "contains": 0.0, "f1": 0.0}
        bge = row.get("conditions", {}).get("bge_rerank_strong", {})
        rows.append({
            "idx": idx,
            "qid": qid,
            "gold": gold,
            "question": question,
            "bge_strong": {"em": bge.get("em", 0), "contains": bge.get("contains", 0), "f1": bge.get("f1", 0), "output": bge.get("output", ""), "support_title_recall": bge.get("support_title_recall"), "answer_string_present_in_docs": bge.get("answer_string_present_in_docs")},
            "extract_status": status,
            "candidate": candidate,
            "extract_output": extract_output,
            "extract": m_extract,
            "ecd_output": ecd_output,
            "ecd": m_ecd,
            "ecd_error": ecd_error,
            "extract_artifact": str(extract_artifact),
            "ecd_artifact": "" if ecd_data is None else str(ecd_dir / f"{idx}-{qid}.json"),
        })

    result = {
        "schema": "epkv.retrieved_relation_ecd.v0",
        "elapsed_sec": time.time() - t0,
        "total": len(rows),
        "macro": {
            "bge_strong": {m: avg(rows, "bge_strong", m) for m in ["em", "contains", "f1"]},
            "relation_extract": {m: avg(rows, "extract", m) for m in ["em", "contains", "f1"]},
            "retrieved_relation_ecd": {m: avg(rows, "ecd", m) for m in ["em", "contains", "f1"]},
        },
        "rows": rows,
    }
    (out_dir / "summary.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = [
        "# Retrieved Relation-Path ECD",
        "",
        f"total: {len(rows)}",
        "",
        "| condition | EM | contains | F1 |",
        "|---|---:|---:|---:|",
    ]
    for name, vals in result["macro"].items():
        md.append(f"| {name} | {vals['em']:.3f} | {vals['contains']:.3f} | {vals['f1']:.3f} |")
    md.extend(["", "## Rows", "", "| qid | gold | candidate | BGE F1 | extract F1 | ECD F1 | ECD output |", "|---|---|---|---:|---:|---:|---|"])
    for r in rows:
        md.append(f"| {r['qid']} | {r['gold']} | {r['candidate']} | {r['bge_strong']['f1']:.2f} | {r['extract']['f1']:.2f} | {r['ecd']['f1']:.2f} | `{r['ecd_output'].replace('`','')[:100]}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "total": len(rows), "macro": result["macro"]}, indent=2, ensure_ascii=False))
    print("EPKV_RETRIEVED_RELATION_ECD_DONE")


if __name__ == "__main__":
    main()
