#!/usr/bin/env python3
"""Build 2Wiki compact evidence cases and EPKV span maps with one tokenizer load."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from transformers import AutoTokenizer


def ranges_to_spec(pages: list[int]) -> str:
    if not pages:
        return ""
    pages = sorted(set(int(p) for p in pages))
    ranges = []
    start = prev = pages[0]
    for p in pages[1:]:
        if p == prev + 1:
            prev = p
            continue
        ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
        start = prev = p
    ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
    return ",".join(ranges)


def token_indices_for_span(offsets: list[tuple[int, int]], start: int, end: int) -> list[int]:
    out = []
    for i, (a, b) in enumerate(offsets):
        if a is None or b is None:
            continue
        if int(a) == int(b):
            continue
        if int(b) > start and int(a) < end:
            out.append(i)
    return out


def triple_sentence(t: list[Any]) -> str:
    if len(t) >= 3:
        s, p, o = t[:3]
        return f"{s}: {s} -- {p} --> {o}."
    return " -- ".join(map(str, t))


def make_case(item: dict[str, Any]) -> dict[str, Any]:
    evidences = item.get("evidences") or []
    evidence = [triple_sentence(t) for t in evidences[:2]]
    distractor: list[str] = []
    for title, sents in item.get("context") or []:
        joined = f"{title}: {' '.join(sents[:2])}"
        if all(str(t[0]) not in joined for t in evidences[:2] if t):
            distractor.append(joined)
        if len(distractor) >= 4:
            break
    return {
        "qid": item.get("_id"),
        "type": item.get("type"),
        "question": item.get("question"),
        "answer": item.get("answer"),
        "evidence": evidence,
        "distractor": distractor,
    }


def build_span_map(tok: Any, case: dict[str, Any], block_size: int) -> dict[str, Any]:
    question = case["question"]
    evidence = case.get("evidence") or []
    distractor = case.get("distractor") or []
    evidence_lines = [f"E{i+1}: {text}" for i, text in enumerate(evidence)]
    distractor_lines = [f"D{i+1}: {text}" for i, text in enumerate(distractor)]
    instruction = case.get("instruction") or "Use only the evidence lines to answer."
    instruction_lines = [instruction] if isinstance(instruction, str) else [str(x) for x in instruction]
    layout = case.get("layout") or "evidence_first"
    if layout == "distractors_first":
        body = [*instruction_lines, "Distractors:", *distractor_lines, "Evidence:", *evidence_lines, f"Question: {question}"]
    else:
        body = [*instruction_lines, "Evidence:", *evidence_lines, "Distractors:", *distractor_lines, f"Question: {question}"]
    user = "\n".join(body)
    messages = [{"role": "user", "content": user}]
    chat = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    encoded = tok(chat, return_offsets_mapping=True, add_special_tokens=False)
    offsets = encoded["offset_mapping"]
    input_ids = encoded["input_ids"]
    spans = []
    all_token_indices: list[int] = []
    all_pages: list[int] = []
    for label, text in [(f"E{i+1}", e) for i, e in enumerate(evidence)]:
        needle = f"{label}: {text}"
        start = chat.find(needle)
        if start < 0:
            raise RuntimeError(f"could not find evidence text: {needle!r}")
        end = start + len(needle)
        token_indices = token_indices_for_span(offsets, start, end)
        pages = sorted(set(i // block_size for i in token_indices))
        token_start = min(token_indices) if token_indices else None
        token_end_exclusive = (max(token_indices) + 1) if token_indices else None
        spans.append({
            "label": label,
            "text": text,
            "char_start": start,
            "char_end": end,
            "token_start": token_start,
            "token_end_exclusive": token_end_exclusive,
            "token_range_spec": "" if token_start is None or token_end_exclusive is None else f"{token_start}-{token_end_exclusive - 1}",
            "token_count": len(token_indices),
            "pages": pages,
            "pages_spec": ranges_to_spec(pages),
        })
        all_token_indices.extend(token_indices)
        all_pages.extend(pages)

    answer_text = case.get("answer")
    answer_span = None
    if answer_text:
        candidate = str(answer_text)
        answer_start = -1
        answer_end = -1
        for span in spans:
            local = chat.find(candidate, int(span["char_start"]), int(span["char_end"]))
            if local >= 0:
                answer_start = local
                answer_end = local + len(candidate)
                break
        if answer_start < 0:
            local = chat.find(candidate)
            if local >= 0:
                answer_start = local
                answer_end = local + len(candidate)
        if answer_start >= 0:
            answer_token_indices = token_indices_for_span(offsets, answer_start, answer_end)
            answer_pages = sorted(set(i // block_size for i in answer_token_indices))
            answer_token_start = min(answer_token_indices) if answer_token_indices else None
            answer_token_end_exclusive = (max(answer_token_indices) + 1) if answer_token_indices else None
            answer_span = {
                "text": candidate,
                "char_start": answer_start,
                "char_end": answer_end,
                "token_start": answer_token_start,
                "token_end_exclusive": answer_token_end_exclusive,
                "token_range_spec": "" if answer_token_start is None or answer_token_end_exclusive is None else f"{answer_token_start}-{answer_token_end_exclusive - 1}",
                "token_count": len(answer_token_indices),
                "pages": answer_pages,
                "pages_spec": ranges_to_spec(answer_pages),
            }
    return {
        "schema": "epkv.span_to_page_map.v0",
        "model": getattr(tok, "name_or_path", ""),
        "block_size": block_size,
        "token_count_total": len(input_ids),
        "evidence_token_count": len(set(all_token_indices)),
        "evidence_pages": sorted(set(all_pages)),
        "evidence_pages_spec": ranges_to_spec(all_pages),
        "terminal_evidence_pages": spans[-1]["pages"] if spans else [],
        "terminal_evidence_pages_spec": spans[-1]["pages_spec"] if spans else "",
        "terminal_evidence_token_range_spec": spans[-1]["token_range_spec"] if spans else "",
        "all_evidence_token_range_spec": ranges_to_spec(sorted(set(all_token_indices))),
        "answer_span": answer_span,
        "answer_token_range_spec": answer_span["token_range_spec"] if answer_span else "",
        "answer_pages_spec": answer_span["pages_spec"] if answer_span else "",
        "qid": case.get("qid"),
        "gold_answer": case.get("answer"),
        "layout": layout,
        "instruction": instruction_lines,
        "spans": spans,
        "messages": messages,
        "chat_template_text": chat,
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--model", default="Qwen/Qwen2.5-7B-Instruct")
    p.add_argument("--block-size", type=int, default=16)
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--types", default="compositional,inference")
    args = p.parse_args()
    out_dir = Path(args.out_dir)
    cases_dir = out_dir / "cases"
    spans_dir = out_dir / "span-maps"
    cases_dir.mkdir(parents=True, exist_ok=True)
    spans_dir.mkdir(parents=True, exist_ok=True)
    allowed = set(x.strip() for x in args.types.split(",") if x.strip())
    data = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    selected = [x for x in data if x.get("type") in allowed and len(x.get("evidences") or []) >= 2]
    selected = selected[args.offset: args.offset + args.limit]
    tok = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    rows = []
    for idx, item in enumerate(selected, start=args.offset):
        case = make_case(item)
        qid = case["qid"]
        case_path = cases_dir / f"{idx}-{qid}.json"
        span_path = spans_dir / f"{idx}-{qid}.json"
        case_path.write_text(json.dumps(case, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        span_map = build_span_map(tok, case, args.block_size)
        span_path.write_text(json.dumps(span_map, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        rows.append({"idx": idx, "qid": qid, "type": case.get("type"), "answer": case.get("answer"), "case": str(case_path), "span_map": str(span_path)})
    summary = {"schema": "epkv.2wiki_span_batch.v0", "total": len(rows), "offset": args.offset, "limit": args.limit, "rows": rows}
    (out_dir / "span-batch-summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"total": len(rows), "out_dir": str(out_dir)}, indent=2))


if __name__ == "__main__":
    main()
