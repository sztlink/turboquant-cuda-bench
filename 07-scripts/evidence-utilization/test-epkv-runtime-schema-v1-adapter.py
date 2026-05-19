#!/usr/bin/env python3
"""Source-level/offline test for EPKV runtime schema-v1 adapter.

Runs the patched runtime_hook.py as a standalone module on synthetic packed KV.
Verifies:
  1. legacy event format remains default when VLLM_EPKV_RUNTIME_SCHEMA_V1 is unset;
  2. schema-v1 event format is emitted when VLLM_EPKV_RUNTIME_SCHEMA_V1=1;
  3. both modes are dry-run and return None (no approximate output emitted).

No serving mutation, no real prompts, no model inference.
"""
from __future__ import annotations

import importlib.util
import json
import math
import os
import shutil
import traceback
from pathlib import Path
from types import SimpleNamespace

import torch
from vllm.v1.attention.ops.triton_turboquant_store import triton_turboquant_store

RUNTIME_HOOK_FILE = Path(os.environ.get("EPKV_RUNTIME_HOOK_FILE", "/home/felipe/vllm-lab/runtime_hook_schema_v1.py"))
OUT_DIR = Path(os.environ.get("EPKV_TEST_OUT", "/home/felipe/vllm-lab/evidence-utilization-epkv-runtime-schema-v1-adapter-tests-2026-05-19"))
LEGACY_LOG = OUT_DIR / "legacy-default-events.jsonl"
SCHEMA_LOG = OUT_DIR / "schema-v1-events.jsonl"
SUMMARY = OUT_DIR / "summary.json"
ERROR = OUT_DIR / "ERROR.txt"

Hq, Hk, D, K = 28, 4, 64, 32
BLOCK_SIZE = 16
KEY_PACKED_SIZE = D
VALUE_BITS = 4
VAL_DATA_BYTES = math.ceil(D * VALUE_BITS / 8)
SLOT_SIZE = KEY_PACKED_SIZE + VAL_DATA_BYTES + 4
SEQ_LEN = 1041


def import_runtime_hook(name: str):
    spec = importlib.util.spec_from_file_location(name, RUNTIME_HOOK_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot import {RUNTIME_HOOK_FILE}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def read_jsonl(path: Path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def setup_env(log_path: Path, schema_v1: bool):
    os.environ["VLLM_EPKV_RUNTIME_HOOK"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_DRY_RUN"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_TRACE_SELECTION"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_TRACE_TOP_N"] = "32"
    os.environ["VLLM_EPKV_RUNTIME_SYNC_TIMING"] = "1"
    os.environ["VLLM_EPKV_RUNTIME_MAX_SEQ"] = str(SEQ_LEN + 1)
    os.environ["VLLM_EPKV_RUNTIME_MAX_EVENTS"] = "4"
    os.environ["VLLM_EPKV_RUNTIME_K"] = str(K)
    os.environ["VLLM_EPKV_RUNTIME_LOG"] = str(log_path)
    os.environ["VLLM_EPKV_RUNTIME_TAG"] = "runtime-schema-v1-adapter-tests-2026-05-19"
    if schema_v1:
        os.environ["VLLM_EPKV_RUNTIME_SCHEMA_V1"] = "1"
    else:
        os.environ.pop("VLLM_EPKV_RUNTIME_SCHEMA_V1", None)


def make_fixture():
    torch.manual_seed(2026051907)
    max_blocks = math.ceil(SEQ_LEN / BLOCK_SIZE)
    query = torch.randn((1, Hq, D), device="cuda", dtype=torch.bfloat16)
    key = torch.randn((SEQ_LEN, Hk, D), device="cuda", dtype=torch.bfloat16)
    value = torch.randn((SEQ_LEN, Hk, D), device="cuda", dtype=torch.bfloat16)
    kv_cache = torch.empty((max_blocks, BLOCK_SIZE, Hk, SLOT_SIZE), device="cuda", dtype=torch.uint8)
    kv_cache.zero_()
    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    slot_mapping = torch.arange(SEQ_LEN, device="cuda", dtype=torch.int32)
    triton_turboquant_store(key, value, kv_cache, slot_mapping, PiT, midpoints, mse_bits=0, key_packed_size=KEY_PACKED_SIZE, value_quant_bits=VALUE_BITS, key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False)
    block_table = torch.arange(math.ceil(SEQ_LEN / BLOCK_SIZE), device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
    seq_lens = torch.tensor([SEQ_LEN], device="cuda", dtype=torch.int32)
    tq_config = SimpleNamespace(key_fp8=True, effective_value_quant_bits=VALUE_BITS, value_centroid=False, rotate_values=False, key_packed_size=KEY_PACKED_SIZE)
    impl = SimpleNamespace(tq_config=tq_config, scale=1.0 / math.sqrt(D))
    return impl, query, kv_cache, SimpleNamespace(block_table=block_table, seq_lens=seq_lens)


def run_once(log_path: Path, schema_v1: bool, module_name: str):
    setup_env(log_path, schema_v1)
    hook = import_runtime_hook(module_name)
    hook._seen = 0
    impl, query, kv_cache, attn_metadata = make_fixture()
    out = hook.maybe_decode(impl=impl, query=query, kv_cache=kv_cache, attn_metadata=attn_metadata)
    torch.cuda.synchronize()
    if out is not None:
        raise RuntimeError("dry-run returned output; expected None")
    events = read_jsonl(log_path)
    if len(events) != 1:
        raise RuntimeError(f"expected one event in {log_path}, got {len(events)}")
    return events[0]


def main():
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    legacy = run_once(LEGACY_LOG, schema_v1=False, module_name="runtime_hook_legacy_default_test")
    schema = run_once(SCHEMA_LOG, schema_v1=True, module_name="runtime_hook_schema_v1_test")

    checks = {
        "legacy_has_no_schema_field": "schema" not in legacy,
        "legacy_has_hook_field": legacy.get("hook") == "evidence_paged_kv.runtime.phase2a.v0",
        "legacy_mode_is_dry_run_legacy": legacy.get("mode") == "guarded_runtime_selected_page_dry_run",
        "legacy_has_selected_positions": "selected_positions_sample" in legacy,
        "schema_has_schema_v1": schema.get("schema") == "epkv.runtime.telemetry.v1",
        "schema_mode_dry_run": schema.get("mode") == "dry-run",
        "schema_reason_dry_run": schema.get("reason_code") == "dry_run_telemetry_only",
        "schema_has_selection_geometry": "selection_geometry" in schema,
        "schema_privacy_contract": schema.get("privacy") == {"prompt_text": False, "raw_token_ids": False, "selected_positions_only": True},
    }
    failed = [k for k, v in checks.items() if not v]
    if failed:
        raise RuntimeError(f"checks failed: {failed}")
    summary = {
        "test": "epkv-runtime-schema-v1-adapter-source-level",
        "runtime_hook_file": str(RUNTIME_HOOK_FILE),
        "legacy_log": str(LEGACY_LOG),
        "schema_log": str(SCHEMA_LOG),
        "checks": checks,
        "passed": True,
        "boundary": {"serving_mutation": False, "real_prompt": False, "model_inference": False, "dry_run": True},
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
