#!/usr/bin/env python3
"""State-aware decode-policy harness for EPKV.

API-level diagnostic for the next layer after KV/value interventions:

1. Run a baseline decode.
2. If the evidence-derived candidate appears later in the generated scaffold,
   cut an assistant prefill prefix immediately before the candidate.
3. Continue from that prefix with candidate token bias.

This approximates generated-token-state-aware policy without patching vLLM's
sampler internals: do not bias the discourse scaffold; bias only at the entity
slot where the answer should surface.
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


def norm_space(s: str) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip()


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - local lab endpoint
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"error": {"status": e.code, "body": e.read().decode("utf-8", errors="replace")}}


def terminal_object_candidate(span_map: dict[str, Any]) -> str | None:
    spans = span_map.get("spans") or []
    if not spans:
        return None
    text = str(spans[-1].get("text") or "")
    if "-->" in text:
        return norm_space(text.rsplit("-->", 1)[1].rstrip("."))
    return None


def derive_candidate(span_map: dict[str, Any], source: str) -> str:
    if source in {"auto", "terminal-object"}:
        c = terminal_object_candidate(span_map)
        if c:
            return c
        if source == "terminal-object":
            raise SystemExit("terminal-object candidate not found")
    if source in {"auto", "answer"} and span_map.get("answer_span", {}).get("text"):
        return str(span_map["answer_span"]["text"])
    if source in {"auto", "gold"} and span_map.get("gold_answer"):
        return str(span_map["gold_answer"])
    raise SystemExit("candidate not found")


def first_token_bias_ids(tok: Any, candidate: str) -> list[int]:
    variants = [candidate, candidate.lstrip(), " " + candidate.lstrip()]
    if candidate.startswith("Ví"):
        variants.extend([candidate.replace("Ví", "Vi", 1), "V", "Vict"])
    elif candidate.startswith("Vi"):
        variants.extend(["V", "Vict"])
    out: list[int] = []
    for v in variants:
        ids = tok.encode(v, add_special_tokens=False)
        if ids and int(ids[0]) not in out:
            out.append(int(ids[0]))
    return out


def scaffold_token_ids(tok: Any) -> list[int]:
    scaffolds = [
        "Based", " Based", "The", " The", "According", " According",
        "From", " From", "Given", " Given", "Answer", " Answer",
    ]
    out: list[int] = []
    for s in scaffolds:
        ids = tok.encode(s, add_special_tokens=False)
        if ids and int(ids[0]) not in out:
            out.append(int(ids[0]))
    return out


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def first_top(resp: dict[str, Any]) -> dict[str, Any]:
    lp = (((resp.get("choices") or [{}])[0].get("logprobs") or {}).get("content") or [])
    if not lp:
        return {}
    x = lp[0]
    return {
        "token": x.get("token"),
        "logprob": x.get("logprob"),
        "top_logprobs": [{"token": y.get("token"), "logprob": y.get("logprob")} for y in (x.get("top_logprobs") or [])],
    }


def candidate_aliases(candidate: str) -> list[str]:
    aliases = [candidate]
    if candidate.startswith("Ví"):
        aliases.extend([candidate.replace("Ví", "Vi", 1), "Victor Bó", "Victor Bo"])
    if candidate == "English":
        # 2Wiki uses an adjective label, but the model often verbalizes the
        # country as England. Use this only for locating the entity slot; the
        # biased candidate remains the evidence-derived label.
        aliases.append("England")
    return list(dict.fromkeys(aliases))


def find_prefix_before_candidate(text: str, candidate: str) -> dict[str, str]:
    for alias in candidate_aliases(candidate):
        idx = text.find(alias)
        if idx >= 0:
            return {"prefix": text[:idx], "matched_alias": alias}
    return {"prefix": "", "matched_alias": ""}


def make_payload(model: str, user: str, max_tokens: int, top_logprobs: int, *, assistant_prefix: str = "", logit_bias: dict[str, float] | None = None) -> dict[str, Any]:
    messages: list[dict[str, str]] = [{"role": "user", "content": user}]
    if assistant_prefix:
        messages.append({"role": "assistant", "content": assistant_prefix})
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0,
        "max_tokens": max_tokens,
        "logprobs": True,
        "top_logprobs": top_logprobs,
    }
    if logit_bias:
        payload["logit_bias"] = logit_bias
    return payload


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-map", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--tokenizer", default="Qwen/Qwen2.5-7B-Instruct")
    p.add_argument("--candidate-source", choices=["auto", "terminal-object", "answer", "gold"], default="auto")
    p.add_argument("--candidate", default="")
    p.add_argument("--bias", type=float, default=3.0)
    p.add_argument("--suppress-scaffold", action="store_true")
    p.add_argument("--scaffold-bias", type=float, default=-10.0)
    p.add_argument("--baseline-max-tokens", type=int, default=48)
    p.add_argument("--continue-max-tokens", type=int, default=16)
    p.add_argument("--top-logprobs", type=int, default=10)
    p.add_argument("--assistant-prefix", default="")
    p.add_argument("--timeout", type=int, default=90)
    args = p.parse_args()

    span_map = json.loads(Path(args.span_map).read_text(encoding="utf-8"))
    user = span_map["messages"][0]["content"]
    candidate = args.candidate or derive_candidate(span_map, args.candidate_source)
    tok = AutoTokenizer.from_pretrained(args.tokenizer, trust_remote_code=True)
    ids = first_token_bias_ids(tok, candidate)
    logit_bias = {str(i): args.bias for i in ids}
    scaffold_ids: list[int] = []
    if args.suppress_scaffold:
        scaffold_ids = scaffold_token_ids(tok)
        for sid in scaffold_ids:
            logit_bias.setdefault(str(sid), args.scaffold_bias)

    t0 = time.time()
    baseline = request_json(args.endpoint, make_payload(args.model, user, args.baseline_max_tokens, args.top_logprobs), args.timeout)
    baseline_text = content_of(baseline)
    prefix_info = {"prefix": args.assistant_prefix, "matched_alias": "manual" if args.assistant_prefix else ""}
    if not args.assistant_prefix:
        prefix_info = find_prefix_before_candidate(baseline_text, candidate)
    prefix = prefix_info["prefix"]

    direct = request_json(args.endpoint, make_payload(args.model, user, args.continue_max_tokens, args.top_logprobs, logit_bias=logit_bias), args.timeout)
    prefill_no_bias = None
    prefill_bias = None
    if prefix:
        prefill_no_bias = request_json(args.endpoint, make_payload(args.model, user, args.continue_max_tokens, args.top_logprobs, assistant_prefix=prefix), args.timeout)
        prefill_bias = request_json(args.endpoint, make_payload(args.model, user, args.continue_max_tokens, args.top_logprobs, assistant_prefix=prefix, logit_bias=logit_bias), args.timeout)

    result = {
        "schema": "epkv.state_aware_decode_policy.v0",
        "span_map": args.span_map,
        "qid": span_map.get("qid"),
        "gold_answer": span_map.get("gold_answer"),
        "candidate": candidate,
        "candidate_source": args.candidate_source,
        "candidate_ids": ids,
        "bias": args.bias,
        "suppress_scaffold": bool(args.suppress_scaffold),
        "scaffold_ids": scaffold_ids,
        "scaffold_bias": args.scaffold_bias,
        "derived_prefix": prefix,
        "matched_alias": prefix_info.get("matched_alias", ""),
        "elapsed_sec": time.time() - t0,
        "baseline": {"content": baseline_text, "first_top": first_top(baseline), "response": baseline},
        "direct_bias": {"content": content_of(direct), "first_top": first_top(direct), "response": direct},
        "prefill_no_bias": None if prefill_no_bias is None else {"content": content_of(prefill_no_bias), "first_top": first_top(prefill_no_bias), "response": prefill_no_bias},
        "prefill_bias": None if prefill_bias is None else {"content": content_of(prefill_bias), "first_top": first_top(prefill_bias), "response": prefill_bias},
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "candidate": candidate,
        "candidate_ids": ids,
        "prefix": prefix,
        "matched_alias": prefix_info.get("matched_alias", ""),
        "baseline": baseline_text,
        "direct_bias": result["direct_bias"]["content"],
        "prefill_no_bias": None if result["prefill_no_bias"] is None else result["prefill_no_bias"]["content"],
        "prefill_bias": None if result["prefill_bias"] is None else result["prefill_bias"]["content"],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
