#!/usr/bin/env python3
"""Tokenized offline bridge v0.1 for evidence-utilization ↔ EPKV.

Reads the metadata-only bridge v0 records, reconstructs the same synthetic
fixture prompts, and adds exact tokenizer-derived token spans and KV page ranges
for canonical/decoy evidence regions.

Boundary:
- no model inference;
- no vLLM serving calls;
- no real EPKV selection;
- tokenizer only, from a local path supplied via --tokenizer-path or TOKENIZER_PATH.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import platform
import time
from pathlib import Path
from typing import Any

from transformers import AutoTokenizer

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_IN = REPO_ROOT / "bench" / "evidence-utilization-epkv-bridge-2026-05-19" / "records.jsonl"
DEFAULT_OUT = REPO_ROOT / "bench" / "evidence-utilization-epkv-bridge-tokenized-2026-05-19"
DATE_STAMP = "2026-05-19"
BLOCK_SIZE = 16


def make_handle(i: int) -> dict[str, Any]:
    ii = f"{i:02d}"
    return {
        "i": i,
        "alias": f"bridge taxonomy handle {i}",
        "code": f"AYA-BRIDGE-{ii}-{2000 + i * 23}-OK",
        "old": f"AYA-BRIDGE-{ii}-OLD-{3000 + i}-NO",
    }


def canonical_block(h: dict[str, Any]) -> str:
    return "\n".join([
        "CANONICAL RECORD",
        f"ALIAS: {h['alias']}",
        f"SECRET VALUE: {h['code']}",
        "RULE: This is the valid current record.",
    ])


def distractor_block(h: dict[str, Any], typ: str, j: int) -> str:
    if typ == "explicit_decoy":
        return "\n".join([
            "DECOY LOOKUP",
            f"ALIAS: {h['alias']}",
            f"INVALID VALUE: DECOY-BRIDGE-{h['i']}-{j}",
            "This is not the canonical record.",
        ])
    if typ == "stale_record":
        return "\n".join([
            "ARCHIVED RECORD",
            f"ALIAS: {h['alias']}",
            f"SECRET VALUE: {h['old']}",
            "This record may be old. Timestamp: previous batch.",
        ])
    if typ == "conflicting_correction":
        return "\n".join([
            "CORRECTION THREAD",
            f"ALIAS: {h['alias']}",
            f"Earlier value: {h['old']}",
            "A later update might exist elsewhere.",
        ])
    if typ == "near_duplicate":
        return "\n".join([
            "CANONICAL RECORD",
            f"ALIAS: {h['alias']} alternate",
            f"SECRET VALUE: DECOY-BRIDGE-NEAR-{h['i']}-{j}",
            "This is for a near-duplicate alias, not the requested alias.",
        ])
    raise ValueError(f"unknown distractor type {typ}")


def filler_block(label: str, size_chars: int) -> str:
    base = f"FILLER {label}. ordinary studio context. archive label. sensor calibration. retrieval note. no canonical value. "
    return (base * max(1, math.ceil(size_chars / len(base))))[:size_chars]


def build_retrieved_section(handle: dict[str, Any], rank: int, decoys_before: int, distractor_type: str) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    before = min(decoys_before, rank - 1)
    for i in range(before):
        chunks.append({"kind": "distractor", "content": distractor_block(handle, distractor_type, i), "distractor_index": i})
    while len(chunks) < rank - 1:
        chunks.append({"kind": "filler", "content": filler_block(f"pre-{len(chunks)}", 420), "distractor_index": None})
    chunks.append({"kind": "canonical", "content": canonical_block(handle), "distractor_index": None})
    j = before
    while len(chunks) < 16:
        if j < 18:
            chunks.append({"kind": "distractor", "content": distractor_block(handle, distractor_type, j), "distractor_index": j})
            j += 1
        else:
            chunks.append({"kind": "filler", "content": filler_block(f"post-{len(chunks)}", 420), "distractor_index": None})
    return chunks


def render_retrieved_section(chunks: list[dict[str, Any]]) -> str:
    return "\n\n".join(
        f"// retrieved_chunk_rank_{i + 1}\n```\n{chunk['content']}\n```"
        for i, chunk in enumerate(chunks)
    )


def build_system_prompt() -> str:
    return "You answer retrieval questions. Answer only the exact SECRET VALUE. No explanation."


def build_user_prompt(retrieved_text: str, handle: dict[str, Any]) -> str:
    return f"{retrieved_text}\n\nQuestion: Which SECRET VALUE belongs to {handle['alias']}? Answer only the exact value."


def qwen2_im_chat_text(system_text: str, user_text: str) -> str:
    return (
        f"<|im_start|>system\n{system_text}<|im_end|>\n"
        f"<|im_start|>user\n{user_text}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )


def char_span_to_token_span(offsets: list[tuple[int, int]], span: tuple[int, int]) -> list[int]:
    start, end = span
    token_idxs = [i for i, (a, b) in enumerate(offsets) if b > start and a < end]
    if not token_idxs:
        raise ValueError(f"no tokens overlap char span {span}")
    return [token_idxs[0], token_idxs[-1] + 1]


def token_span_to_page_range(token_span: list[int], block_size: int = BLOCK_SIZE) -> list[int]:
    start, end = token_span
    return [start // block_size, (end - 1) // block_size]


def reconstruct(record: dict[str, Any]) -> dict[str, Any]:
    evidence = record["evidence"]
    h = make_handle(evidence["handle"]["index"])
    chunks = build_retrieved_section(h, evidence["canonical_rank"], evidence["decoys_before"], evidence["distractor_type"])
    retrieved_text = render_retrieved_section(chunks)
    system_text = build_system_prompt()
    user_text = build_user_prompt(retrieved_text, h)
    chat_text = qwen2_im_chat_text(system_text, user_text)
    user_offset = chat_text.index(user_text)

    # Validate the v0 char span against the reconstructed prompt.
    c0, c1 = evidence["canonical_char_span_in_user_prompt"]
    canonical_slice = user_text[c0:c1]
    expected_canonical = canonical_block(h)
    if canonical_slice != expected_canonical:
        raise ValueError(f"canonical span mismatch for {record['fixture_id']}")

    return {
        "system_text": system_text,
        "user_text": user_text,
        "chat_text": chat_text,
        "user_offset_in_chat": user_offset,
    }


def load_records(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def tokenized_record(record: dict[str, Any], tok: Any) -> dict[str, Any]:
    rendered = reconstruct(record)
    enc = tok(
        rendered["chat_text"],
        add_special_tokens=False,
        return_offsets_mapping=True,
    )
    offsets = [(int(a), int(b)) for a, b in enc["offset_mapping"]]
    user_offset = rendered["user_offset_in_chat"]

    ev = record["evidence"]
    c_span_user = tuple(ev["canonical_char_span_in_user_prompt"])
    c_span_chat = (user_offset + c_span_user[0], user_offset + c_span_user[1])
    c_tok = char_span_to_token_span(offsets, c_span_chat)

    decoys = []
    for decoy in ev["decoy_spans"]:
        d_span_user = tuple(decoy["char_span"])
        d_span_chat = (user_offset + d_span_user[0], user_offset + d_span_user[1])
        d_tok = char_span_to_token_span(offsets, d_span_chat)
        decoys.append({
            **decoy,
            "char_span_in_chat_prompt": list(d_span_chat),
            "token_span_exact": d_tok,
            "page_range": token_span_to_page_range(d_tok),
        })

    out = json.loads(json.dumps(record))  # JSON-safe deep copy
    out["bridge_version"] = "v0.1-tokenized"
    out["evidence"]["tokenizer"] = {
        "source": "local tokenizer path supplied at build time",
        "name_or_path": getattr(tok, "name_or_path", "<unknown>"),
        "class": tok.__class__.__name__,
        "is_fast": bool(getattr(tok, "is_fast", False)),
        "chat_template": "qwen2_im_manual",
        "add_special_tokens": False,
        "block_size": BLOCK_SIZE,
    }
    out["evidence"]["chat_prompt_total_tokens"] = len(enc["input_ids"])
    out["evidence"]["user_offset_in_chat_prompt"] = user_offset
    out["evidence"]["canonical_char_span_in_chat_prompt"] = list(c_span_chat)
    out["evidence"]["canonical_token_span_exact"] = c_tok
    out["evidence"]["canonical_page_range"] = token_span_to_page_range(c_tok)
    out["evidence"]["decoy_spans"] = decoys
    out["evidence"]["token_span_method"] = "Qwen tokenizer offset_mapping over manual Qwen2.5 chat prompt; token end exclusive"
    out["runtime"]["mode"] = "offline_metadata_tokenized"
    out["runtime"]["no_real_selection"] = True
    out["runtime"]["enabled_in_serving"] = False
    out["runtime"]["page_mapping"] = {
        "block_size": BLOCK_SIZE,
        "canonical_page_range": token_span_to_page_range(c_tok),
        "decoy_page_ranges": [d["page_range"] for d in decoys],
        "source": "tokenizer offset_mapping; no vLLM scheduler allocation observed",
    }
    out["non_claims"] = sorted(set(out.get("non_claims", []) + [
        "not a real vLLM KV cache allocation",
        "not a real EPKV selected-position trace",
    ]))
    return out


def write_results(out_dir: Path, records: list[dict[str, Any]], summary: dict[str, Any]) -> None:
    lines = [
        "# Evidence-utilization ↔ Evidence-Paged KV bridge — tokenized offline v0.1",
        "",
        "> Status: offline tokenized bridge. Tokenizer only; no model inference, no serving, no real EPKV selection.",
        "",
        "## Boundary",
        "",
        "```txt",
        "bridge_version: v0.1-tokenized",
        "runtime mode: offline_metadata_tokenized",
        "tokenizer: local Qwen tokenizer via offset_mapping",
        "chat template: manual Qwen2.5 im_start/im_end template",
        f"block_size: {BLOCK_SIZE}",
        "```",
        "",
        "## Readout",
        "",
        f"- records: {summary['total_records']}",
        f"- mean chat prompt tokens: {summary['mean_chat_prompt_tokens']:.1f}",
        f"- canonical page span min/max pages: {summary['canonical_page_span_min']} / {summary['canonical_page_span_max']}",
        f"- max decoy spans per record: {summary['max_decoy_spans_per_record']}",
        "",
        "## What changed from v0",
        "",
        "- v0 had exact char spans and heuristic token spans (`chars_per_token=3.6`).",
        "- v0.1 keeps the same fixture ids and adds exact tokenizer offset spans.",
        "- each record now has `canonical_token_span_exact`, `canonical_page_range`, and decoy `page_range` fields.",
        "",
        "## Caveats",
        "",
        "- page ranges are derived from tokenizer positions and `block_size=16`; they are not observed vLLM scheduler allocations.",
        "- manual Qwen2.5 chat template is used because the local tokenizer config does not expose `chat_template`.",
        "- still no answer observation and no real selected-position trace.",
        "",
        "## Output files",
        "",
        "```txt",
        "records.jsonl",
        "summary.json",
        "RESULTS.md",
        "```",
        "",
        "## Non-claims",
        "",
        "- no serving claim",
        "- no model-quality claim",
        "- no real EPKV selection trace",
        "- no real vLLM KV cache allocation claim",
        "- no leaderboard score",
        "",
        "## Next step",
        "",
        "Use these token/page ranges as the frozen alignment target for an offline selected-position replay or for a later dry-run serving trace only after the absolute telemetry gate and serving baseline are accepted.",
    ]
    (out_dir / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, default=DEFAULT_IN)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--tokenizer-path", default=os.environ.get("TOKENIZER_PATH"))
    args = ap.parse_args()

    if not args.tokenizer_path:
        raise SystemExit("missing --tokenizer-path or TOKENIZER_PATH")
    tok_path = Path(args.tokenizer_path)
    if not tok_path.exists():
        raise SystemExit(f"tokenizer path does not exist: {tok_path}")

    tok = AutoTokenizer.from_pretrained(str(tok_path), local_files_only=True)
    records_v0 = load_records(args.input)
    records = [tokenized_record(r, tok) for r in records_v0]

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "records.jsonl").write_text("\n".join(json.dumps(r, sort_keys=True) for r in records) + "\n", encoding="utf-8")

    canonical_page_spans = [r["evidence"]["canonical_page_range"][1] - r["evidence"]["canonical_page_range"][0] + 1 for r in records]
    summary = {
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "bridge_version": "v0.1-tokenized",
        "source_v0_records": str(args.input.relative_to(REPO_ROOT) if args.input.is_relative_to(REPO_ROOT) else args.input),
        "total_records": len(records),
        "tokenizer": {
            "path_used": str(tok_path),
            "class": tok.__class__.__name__,
            "is_fast": bool(getattr(tok, "is_fast", False)),
            "vocab_size": len(tok),
            "chat_template": "qwen2_im_manual",
        },
        "block_size": BLOCK_SIZE,
        "mean_chat_prompt_tokens": sum(r["evidence"]["chat_prompt_total_tokens"] for r in records) / len(records),
        "canonical_page_span_min": min(canonical_page_spans),
        "canonical_page_span_max": max(canonical_page_spans),
        "max_decoy_spans_per_record": max(len(r["evidence"]["decoy_spans"]) for r in records),
        "runtime_layer_summary": {
            "mode": "offline_metadata_tokenized",
            "no_real_selection": True,
            "enabled_in_serving": False,
        },
        "environment": {
            "python": platform.python_version(),
            "platform": platform.platform(),
        },
        "non_claims": [
            "no serving claim",
            "no model-quality claim",
            "no real EPKV selection trace",
            "no real vLLM KV cache allocation claim",
            "no leaderboard score",
        ],
    }
    (args.out / "summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    write_results(args.out, records, summary)
    print(f"wrote {len(records)} tokenized records to {args.out}")


if __name__ == "__main__":
    main()
