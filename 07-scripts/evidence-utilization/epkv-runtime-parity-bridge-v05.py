#!/usr/bin/env python3
"""EPKV bridge v0.5 — runtime hook parity bridge.

Offline only. Drives the actual guarded runtime_hook.maybe_decode function on
synthetic packed TurboQuant-shaped KV caches whose sequence lengths come from
v0.4 hook-off telemetry events. Then projects the legacy hook events into the
Casey-guided epkv.runtime.telemetry.v1 schema.

This checks implementation/schema parity for the runtime hook boundary. It is
not serving, not real prompts, not model behavior, not speedup.
"""
from __future__ import annotations

import json
import math
import os
import time
import traceback
from pathlib import Path
from types import SimpleNamespace

import torch

from vllm.v1.attention.ops.triton_turboquant_store import triton_turboquant_store
from vllm.v1.attention.evidence_paged_kv import runtime_hook

IN_EVENTS = Path(os.environ.get("EPKV_V04_EVENTS", "/home/felipe/vllm-lab/epkv-hookoff-v04-events.jsonl"))
OUT_DIR = Path(os.environ.get("EPKV_V05_OUT", "/home/felipe/vllm-lab/evidence-utilization-epkv-runtime-parity-bridge-2026-05-19"))
LEGACY_LOG = OUT_DIR / "legacy-runtime-events.jsonl"
SCHEMA_EVENTS = OUT_DIR / "events.jsonl"
SUMMARY = OUT_DIR / "summary.json"
ERROR = OUT_DIR / "ERROR.txt"

Hq = 28
Hk = 4
D = 64
K = 32
BLOCK_SIZE = 16
KEY_PACKED_SIZE = D
VALUE_BITS = 4
VAL_DATA_BYTES = math.ceil(D * VALUE_BITS / 8)
SLOT_SIZE = KEY_PACKED_SIZE + VAL_DATA_BYTES + 4


def read_jsonl(path: Path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def write_jsonl(path: Path, rows):
    path.write_text("\n".join(json.dumps(r, sort_keys=True) for r in rows) + "\n", encoding="utf-8")


def timing_ms_from_legacy(ev):
    cuda_total = ev.get("elapsed_ms_sync_timing")
    wall_total = ev.get("elapsed_ms_wall")
    return {
        "probe_candidates": 0.0,
        "detector": 0.0,
        "compact_merge": 0.0,
        "global_select": 0.0,
        "value": 0.0,
        "exact_fallback": 0.0,
        "total_hook_wall": float(wall_total or 0.0),
        "total_hook_cuda": float(cuda_total or 0.0),
    }


def schema_from_legacy(legacy, source, idx, total):
    seq_len = int(legacy["seq_len"])
    selected = legacy.get("selected_positions_sample") or {}
    return {
        "schema": "epkv.runtime.telemetry.v1",
        "tag": "runtime-parity-bridge-v05-2026-05-19",
        "mode": "dry-run",
        "decision": "telemetry_only_fallback_to_original_tq",
        "reason_code": "dry_run_telemetry_only",
        "policy_version": "epkv.runtime_parity_bridge.v0.5.actual_runtime_hook_2026_05_19",
        "seq_len": seq_len,
        "Hq": int(legacy["query_shape"][1]),
        "Hk": int(legacy["kv_cache_shape"][2]),
        "D": int(legacy["query_shape"][2]),
        "global_k": int(legacy["K"]),
        "probe_local_top": 8,
        "fallback_local_top": 32,
        "num_chunks": math.ceil(seq_len / 512),
        "flagged_head_count": 0,
        "flagged_head_rate": 0.0,
        "seq_guard": 4096,
        "flag_rate_threshold": 0.75,
        "timing_ms": timing_ms_from_legacy(legacy),
        "coverage": {
            "event_index": idx + 1,
            "event_cap": total,
            "cap_hit": False,
            "bucket": f"runtime_parity_v05:seq_len:{seq_len}",
        },
        "privacy": {
            "prompt_text": False,
            "raw_token_ids": False,
            "selected_positions_only": True,
        },
        "selection_geometry": {
            "source_fixture_id": source.get("selection_geometry", {}).get("fixture_id"),
            "source_mode": source.get("mode"),
            "source_seq_len": source.get("seq_len"),
            "runtime_selected_positions_sample": selected.get("positions_by_head_first_n", []),
            "runtime_position_histogram": selected.get("position_histogram", {}),
            "runtime_position_histogram_bin_size": selected.get("position_histogram_bin_size"),
            "runtime_min_position": selected.get("min_position"),
            "runtime_max_position": selected.get("max_position"),
            "runtime_trace_top_n": selected.get("trace_top_n"),
            "runtime_heads": selected.get("heads"),
            "runtime_K": selected.get("K"),
        },
        "parity_boundary": {
            "actual_runtime_hook_function": True,
            "synthetic_packed_kv_cache": True,
            "serving_mutation": False,
            "model_inference": False,
            "real_request": False,
            "component_timings_instrumented": False,
        },
    }


def pct(values, q):
    values = sorted(float(v) for v in values)
    if not values:
        return None
    idx = min(len(values) - 1, max(0, int(len(values) * q)))
    return values[idx]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ERROR.unlink(missing_ok=True)
    LEGACY_LOG.unlink(missing_ok=True)
    SCHEMA_EVENTS.unlink(missing_ok=True)

    sources = read_jsonl(IN_EVENTS)
    max_seq = max(int(e["seq_len"]) for e in sources)
    max_blocks = math.ceil(max_seq / BLOCK_SIZE)

    os.environ["VLLM_EPKV_RUNTIME_HOOK"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_DRY_RUN"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_TRACE_SELECTION"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_TRACE_TOP_N"] = "32"
    os.environ["VLLM_EPKV_RUNTIME_SYNC_TIMING"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_MAX_SEQ"] = str(max_seq + 1)
    os.environ["VLLM_EPKV_RUNTIME_MAX_EVENTS"] = str(len(sources) + 4)
    os.environ["VLLM_EPKV_RUNTIME_K"] = str(K)
    os.environ["VLLM_EPKV_RUNTIME_LOG"] = str(LEGACY_LOG)
    os.environ["VLLM_EPKV_RUNTIME_TAG"] = "runtime-parity-bridge-v05-2026-05-19"
    runtime_hook._seen = 0

    tq_config = SimpleNamespace(
        key_fp8=True,
        effective_value_quant_bits=VALUE_BITS,
        value_centroid=False,
        rotate_values=False,
        key_packed_size=KEY_PACKED_SIZE,
    )
    impl = SimpleNamespace(tq_config=tq_config, scale=1.0 / math.sqrt(D))
    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)

    for idx, source in enumerate(sources):
        M = int(source["seq_len"])
        torch.manual_seed(20260519 + idx)
        query = torch.randn((1, Hq, D), device="cuda", dtype=torch.bfloat16)
        key = torch.randn((M, Hk, D), device="cuda", dtype=torch.bfloat16)
        value = torch.randn((M, Hk, D), device="cuda", dtype=torch.bfloat16)
        kv_cache = torch.empty((max_blocks, BLOCK_SIZE, Hk, SLOT_SIZE), device="cuda", dtype=torch.uint8)
        kv_cache.zero_()
        slot_mapping = torch.arange(M, device="cuda", dtype=torch.int32)
        triton_turboquant_store(
            key,
            value,
            kv_cache,
            slot_mapping,
            PiT,
            midpoints,
            mse_bits=0,
            key_packed_size=KEY_PACKED_SIZE,
            value_quant_bits=VALUE_BITS,
            key_fp8=True,
            rotate_values=False,
            padded_head_dim=D,
            value_centroid=False,
        )
        n_pages = math.ceil(M / BLOCK_SIZE)
        block_table = torch.arange(n_pages, device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
        seq_lens = torch.tensor([M], device="cuda", dtype=torch.int32)
        attn_metadata = SimpleNamespace(block_table=block_table, seq_lens=seq_lens)
        out = runtime_hook.maybe_decode(impl=impl, query=query, kv_cache=kv_cache, attn_metadata=attn_metadata)
        if out is not None:
            raise RuntimeError("dry-run runtime hook returned output; expected None")
        torch.cuda.synchronize()

    legacy_events = read_jsonl(LEGACY_LOG)
    if len(legacy_events) != len(sources):
        raise RuntimeError(f"expected {len(sources)} legacy events, got {len(legacy_events)}")
    schema_events = [schema_from_legacy(ev, sources[i], i, len(sources)) for i, ev in enumerate(legacy_events)]
    write_jsonl(SCHEMA_EVENTS, schema_events)

    seq_lens = [e["seq_len"] for e in schema_events]
    selected_count = sum(len(h) for e in schema_events for h in e["selection_geometry"]["runtime_selected_positions_sample"])
    elapsed_cuda = [e["timing_ms"]["total_hook_cuda"] for e in schema_events]
    elapsed_wall = [e["timing_ms"]["total_hook_wall"] for e in schema_events]
    summary = {
        "bridge_version": "v0.5-runtime-hook-parity-bridge",
        "source_events": str(IN_EVENTS),
        "legacy_events": str(LEGACY_LOG),
        "schema_events": str(SCHEMA_EVENTS),
        "events": len(schema_events),
        "seq_len_min": min(seq_lens),
        "seq_len_max": max(seq_lens),
        "runtime_selected_positions_sampled": selected_count,
        "elapsed_cuda_ms": {
            "min": min(elapsed_cuda),
            "p50": pct(elapsed_cuda, 0.50),
            "p90": pct(elapsed_cuda, 0.90),
            "max": max(elapsed_cuda),
            "mean": sum(elapsed_cuda) / len(elapsed_cuda),
        },
        "elapsed_wall_ms": {
            "min": min(elapsed_wall),
            "p50": pct(elapsed_wall, 0.50),
            "p90": pct(elapsed_wall, 0.90),
            "max": max(elapsed_wall),
            "mean": sum(elapsed_wall) / len(elapsed_wall),
        },
        "boundary": {
            "actual_runtime_hook_function": True,
            "synthetic_packed_kv_cache": True,
            "serving_mutation": False,
            "model_inference": False,
            "real_request": False,
            "component_timings_instrumented": False,
        },
    }
    SUMMARY.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        ERROR.write_text(traceback.format_exc(), encoding="utf-8")
        raise
