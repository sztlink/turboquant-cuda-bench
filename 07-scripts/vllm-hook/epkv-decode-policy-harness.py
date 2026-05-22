#!/usr/bin/env python3
"""Decode-policy harness for EPKV live probes.

This is deliberately above the KV hook: it measures the LM-head/sampler layer
that decides which surface token wins after our KV/value interventions.

It answers questions like:

    evidence/KV path contains `Víctor Bó`, but why does decode emit `Armando`?

The harness uses OpenAI-compatible chat completions with logprobs/top_logprobs
and optional diagnostic logit_bias. It does not require credentials and does not
modify the vLLM service.
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from transformers import AutoTokenizer


def norm_text(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - local lab endpoint
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return {"error": {"type": "http_error", "status": e.code, "body": body}}


def candidate_from_span_map(span_map: dict[str, Any]) -> str:
    if span_map.get("answer_span", {}).get("text"):
        return str(span_map["answer_span"]["text"])
    if span_map.get("gold_answer"):
        return str(span_map["gold_answer"])
    spans = span_map.get("spans") or []
    if spans:
        text = str(spans[-1].get("text") or "")
        if "-->" in text:
            return norm_text(text.rsplit("-->", 1)[1].rstrip("."))
    raise SystemExit("could not derive candidate; pass --candidate")


def first_token_bias_ids(tok: Any, candidate: str) -> list[int]:
    variants = [candidate, candidate.lstrip(), " " + candidate.lstrip()]
    if candidate.startswith("Ví"):
        variants.extend([candidate.replace("Ví", "Vi", 1), "V", "Vict"])
    elif candidate.startswith("Vi"):
        variants.extend(["V", "Vict"])
    out: list[int] = []
    for v in variants:
        ids = tok.encode(v, add_special_tokens=False)
        if ids and ids[0] not in out:
            out.append(int(ids[0]))
    return out


def top_logprob_summary(resp: dict[str, Any], candidate_tokens: set[str]) -> dict[str, Any]:
    choice = (resp.get("choices") or [{}])[0]
    content = choice.get("message", {}).get("content", "")
    lp_content = (((choice.get("logprobs") or {}).get("content")) or [])
    first = lp_content[0] if lp_content else {}
    top = first.get("top_logprobs") or []
    token = first.get("token")
    top_compact = [{"token": x.get("token"), "logprob": x.get("logprob")} for x in top]
    candidate_seen = [x for x in top_compact if str(x.get("token") or "").strip() in candidate_tokens]
    return {
        "content": content,
        "first_token": token,
        "first_logprob": first.get("logprob"),
        "first_top_logprobs": top_compact,
        "candidate_seen_in_first_top_logprobs": candidate_seen,
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-map", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--tokenizer", default="Qwen/Qwen2.5-7B-Instruct")
    p.add_argument("--candidate", default="")
    p.add_argument("--bias", action="append", type=float, default=[0, 1, 2, 3, 4, 6])
    p.add_argument("--max-tokens", type=int, default=12)
    p.add_argument("--top-logprobs", type=int, default=10)
    p.add_argument("--timeout", type=int, default=90)
    args = p.parse_args()

    span_map = json.loads(Path(args.span_map).read_text(encoding="utf-8"))
    prompt = span_map["messages"][0]["content"]
    candidate = args.candidate or candidate_from_span_map(span_map)
    tok = AutoTokenizer.from_pretrained(args.tokenizer, trust_remote_code=True)
    candidate_ids = first_token_bias_ids(tok, candidate)
    candidate_token_strings = {tok.decode([i]) for i in candidate_ids}
    candidate_token_strings.update({candidate[:1], candidate[:4], candidate.split()[0]})

    rows = []
    for bias in args.bias:
        logit_bias = {str(i): bias for i in candidate_ids} if bias else None
        payload: dict[str, Any] = {
            "model": args.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
            "max_tokens": args.max_tokens,
            "logprobs": True,
            "top_logprobs": args.top_logprobs,
        }
        if logit_bias:
            payload["logit_bias"] = logit_bias
        started = time.time()
        resp = request_json(args.endpoint, payload, args.timeout)
        rows.append({
            "bias": bias,
            "candidate_ids": candidate_ids,
            "logit_bias": logit_bias,
            "elapsed_sec": time.time() - started,
            "summary": top_logprob_summary(resp, candidate_token_strings),
            "response": resp,
        })

    result = {
        "schema": "epkv.decode_policy_harness.v0",
        "span_map": str(args.span_map),
        "qid": span_map.get("qid"),
        "gold_answer": span_map.get("gold_answer"),
        "candidate": candidate,
        "candidate_ids": candidate_ids,
        "candidate_token_strings": sorted(candidate_token_strings),
        "endpoint": args.endpoint,
        "rows": rows,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "schema": result["schema"],
        "candidate": candidate,
        "candidate_ids": candidate_ids,
        "rows": [{"bias": r["bias"], **r["summary"]} for r in rows],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
