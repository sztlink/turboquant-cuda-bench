#!/usr/bin/env python3
"""EPKV bridge v0.6 — direct runtime schema-v1 adapter smoke.

Offline synthetic only. Imports a standalone patched runtime_hook.py copy and
checks that VLLM_EPKV_RUNTIME_SCHEMA_V1=1 makes dry-run emit
`epkv.runtime.telemetry.v1` directly, without a post-hoc projection adapter.
"""
from __future__ import annotations

import importlib.util
import json
import math
import os
import subprocess
import traceback
from pathlib import Path
from types import SimpleNamespace

import torch
from vllm.v1.attention.ops.triton_turboquant_store import triton_turboquant_store

RUNTIME_HOOK_FILE = Path(os.environ.get("EPKV_RUNTIME_HOOK_FILE", "/home/felipe/vllm-lab/runtime_hook_schema_v1.py"))
OUT_DIR = Path(os.environ.get("EPKV_V06_OUT", "/home/felipe/vllm-lab/evidence-utilization-epkv-runtime-schema-v1-adapter-2026-05-19"))
EVENTS = OUT_DIR / "events.jsonl"
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
SEQ_LENS = [817, 1041, 1139, 1549]


def import_runtime_hook():
    spec = importlib.util.spec_from_file_location("runtime_hook_schema_v1", RUNTIME_HOOK_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {RUNTIME_HOOK_FILE}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def read_jsonl(path: Path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def pct(values, q):
    values = sorted(float(v) for v in values)
    idx = min(len(values) - 1, max(0, int(len(values) * q)))
    return values[idx]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ERROR.unlink(missing_ok=True)
    EVENTS.unlink(missing_ok=True)
    runtime_hook = import_runtime_hook()
    max_seq = max(SEQ_LENS)
    max_blocks = math.ceil(max_seq / BLOCK_SIZE)

    os.environ["VLLM_EPKV_RUNTIME_HOOK"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_DRY_RUN"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_SCHEMA_V1"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_TRACE_SELECTION"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_TRACE_TOP_N"] = "32"
    os.environ["VLLM_EPKV_RUNTIME_SYNC_TIMING"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_MAX_SEQ"] = str(max_seq + 1)
    os.environ["VLLM_EPKV_RUNTIME_MAX_EVENTS"] = str(len(SEQ_LENS) + 2)
    os.environ["VLLM_EPKV_RUNTIME_K"] = str(K)
    os.environ["VLLM_EPKV_RUNTIME_LOG"] = str(EVENTS)
    os.environ["VLLM_EPKV_RUNTIME_TAG"] = "runtime-schema-v1-adapter-v06-2026-05-19"
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

    for idx, M in enumerate(SEQ_LENS):
        torch.manual_seed(2026051906 + idx)
        query = torch.randn((1, Hq, D), device="cuda", dtype=torch.bfloat16)
        key = torch.randn((M, Hk, D), device="cuda", dtype=torch.bfloat16)
        value = torch.randn((M, Hk, D), device="cuda", dtype=torch.bfloat16)
        kv_cache = torch.empty((max_blocks, BLOCK_SIZE, Hk, SLOT_SIZE), device="cuda", dtype=torch.uint8)
        kv_cache.zero_()
        slot_mapping = torch.arange(M, device="cuda", dtype=torch.int32)
        triton_turboquant_store(key, value, kv_cache, slot_mapping, PiT, midpoints, mse_bits=0, key_packed_size=KEY_PACKED_SIZE, value_quant_bits=VALUE_BITS, key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False)
        block_table = torch.arange(math.ceil(M / BLOCK_SIZE), device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
        seq_lens = torch.tensor([M], device="cuda", dtype=torch.int32)
        out = runtime_hook.maybe_decode(impl=impl, query=query, kv_cache=kv_cache, attn_metadata=SimpleNamespace(block_table=block_table, seq_lens=seq_lens))
        if out is not None:
            raise RuntimeError("dry-run schema v1 hook returned output; expected None")
        torch.cuda.synchronize()

    events = read_jsonl(EVENTS)
    if len(events) != len(SEQ_LENS):
        raise RuntimeError(f"expected {len(SEQ_LENS)} events, got {len(events)}")
    if any(e.get("schema") != "epkv.runtime.telemetry.v1" for e in events):
        raise RuntimeError("not all events used epkv.runtime.telemetry.v1")
    if any(e.get("mode") != "dry-run" for e in events):
        raise RuntimeError("not all events were dry-run")
    if any(e.get("reason_code") != "dry_run_telemetry_only" for e in events):
        raise RuntimeError("not all events used dry_run_telemetry_only")

    cuda = [e["timing_ms"]["total_hook_cuda"] for e in events]
    wall = [e["timing_ms"]["total_hook_wall"] for e in events]
    selected = sum(len(h) for e in events for h in e.get("selection_geometry", {}).get("runtime_selected_positions_sample", []))
    summary = {
        "bridge_version": "v0.6-runtime-schema-v1-adapter-smoke",
        "runtime_hook_file": str(RUNTIME_HOOK_FILE),
        "events": len(events),
        "seq_lens": SEQ_LENS,
        "runtime_selected_positions_sampled": selected,
        "schema": "epkv.runtime.telemetry.v1",
        "modes": sorted(set(e.get("mode") for e in events)),
        "reason_codes": sorted(set(e.get("reason_code") for e in events)),
        "elapsed_cuda_ms": {"min": min(cuda), "p50": pct(cuda, 0.5), "p90": pct(cuda, 0.9), "max": max(cuda), "mean": sum(cuda) / len(cuda)},
        "elapsed_wall_ms": {"min": min(wall), "p50": pct(wall, 0.5), "p90": pct(wall, 0.9), "max": max(wall), "mean": sum(wall) / len(wall)},
        "boundary": {"serving_mutation": False, "model_inference": False, "real_request": False, "schema_v1_direct": True, "dry_run": True},
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
