"""Guarded Evidence-Paged KV Phase 2a runtime hook for vLLM TurboQuant.

This hook is intentionally narrow and disabled by default.

Enable only for controlled experiments:

    VLLM_EPKV_RUNTIME_HOOK=1
    VLLM_EPKV_RUNTIME_LOG=/home/felipe/vllm-lab/evidence-paged-kv-runtime/events.jsonl
    VLLM_EPKV_RUNTIME_K=32
    VLLM_EPKV_RUNTIME_MAX_SEQ=256
    VLLM_EPKV_RUNTIME_DRY_RUN=1  # optional: telemetry only, fall back to original TQ
    VLLM_EPKV_RUNTIME_TRACE_SELECTION=1  # optional: compact selected-position telemetry
    VLLM_EPKV_RUNTIME_SCHEMA_V1=1  # optional: dry-run emits epkv.runtime.telemetry.v1

Boundary:
- B=1 decode only.
- turboquant_k8v4 style: FP8-K + 4-bit uniform V, packed slot layout.
- score kernel reads packed FP8-K slots into materialized scores [M,Hq].
- torch.topk/softmax selects K rows per head.
- value kernel reads packed 4-bit-V slots and accumulates [B,Hq,D].

Non-claims:
- not production attention;
- not serving speedup;
- not quality improvement;
- not comparison with PagedAttention/FlashAttention.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

import torch

try:
    from vllm.logger import init_logger
    from vllm.triton_utils import tl, triton
    from vllm.v1.attention.ops.triton_turboquant_decode import _use_fp8_e4b15

    logger = init_logger(__name__)
except Exception:  # pragma: no cover
    import logging

    logger = logging.getLogger(__name__)
    from vllm.triton_utils import tl, triton  # type: ignore
    from vllm.v1.attention.ops.triton_turboquant_decode import _use_fp8_e4b15  # type: ignore

_ENV = "VLLM_EPKV_RUNTIME_HOOK"
_ENV_LOG = "VLLM_EPKV_RUNTIME_LOG"
_ENV_K = "VLLM_EPKV_RUNTIME_K"
_ENV_MAX_SEQ = "VLLM_EPKV_RUNTIME_MAX_SEQ"
_ENV_MAX_EVENTS = "VLLM_EPKV_RUNTIME_MAX_EVENTS"
_ENV_SYNC_TIMING = "VLLM_EPKV_RUNTIME_SYNC_TIMING"
_ENV_TAG = "VLLM_EPKV_RUNTIME_TAG"
_ENV_DRY_RUN = "VLLM_EPKV_RUNTIME_DRY_RUN"
_ENV_TRACE_SELECTION = "VLLM_EPKV_RUNTIME_TRACE_SELECTION"
_ENV_TRACE_TOP_N = "VLLM_EPKV_RUNTIME_TRACE_TOP_N"
_ENV_SCHEMA_V1 = "VLLM_EPKV_RUNTIME_SCHEMA_V1"

_seen = 0
_warned = False


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except Exception:
        return default


def _enabled() -> bool:
    return os.environ.get(_ENV, "0") == "1"


def _write_event(event: dict[str, Any]) -> None:
    path_s = os.environ.get(_ENV_LOG)
    if not path_s:
        return
    path = Path(path_s)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, sort_keys=True) + "\n")


def _trace_selection_enabled() -> bool:
    return os.environ.get(_ENV_TRACE_SELECTION, "0") == "1"


def _schema_v1_enabled() -> bool:
    return os.environ.get(_ENV_SCHEMA_V1, "0") == "1"


def _selection_summary(pos: torch.Tensor, *, M: int, Hq: int, K: int) -> dict[str, Any]:
    """Return compact selected-position telemetry without prompt/token text.

    ``pos`` has shape [K, Hq]. This intentionally records positions only,
    never raw prompt text or token ids. It may synchronize CUDA when enabled,
    so keep it behind ``VLLM_EPKV_RUNTIME_TRACE_SELECTION``.
    """
    top_n = max(0, min(_int_env(_ENV_TRACE_TOP_N, 32), K))
    sample = []
    if top_n > 0:
        sample = pos[:top_n, :].transpose(0, 1).detach().cpu().tolist()
    flat = pos.detach().flatten().cpu().tolist()
    bin_size = 128
    histogram: dict[str, int] = {}
    for value in flat:
        start = (int(value) // bin_size) * bin_size
        key = f"{start}-{start + bin_size - 1}"
        histogram[key] = histogram.get(key, 0) + 1
    return {
        "heads": Hq,
        "K": K,
        "trace_top_n": top_n,
        "positions_by_head_first_n": sample,
        "position_histogram_bin_size": bin_size,
        "position_histogram": histogram,
        "min_position": min(flat) if flat else None,
        "max_position": max(flat) if flat else None,
        "seq_len": M,
    }


def _schema_v1_event_from_legacy(
    legacy: dict[str, Any],
    *,
    event_cap: int,
    dry_run: bool,
) -> dict[str, Any]:
    """Project legacy hook telemetry into the Casey-guided schema v1.

    Only used when ``VLLM_EPKV_RUNTIME_SCHEMA_V1=1`` and dry-run is enabled.
    This preserves the legacy default event format and avoids approximate output
    on real prompts.
    """
    query_shape = legacy.get("query_shape") or [1, 0, 0]
    kv_cache_shape = legacy.get("kv_cache_shape") or [0, 0, 0, 0]
    seq_len = int(legacy.get("seq_len", 0))
    K = int(legacy.get("K", 0))
    Hq = int(query_shape[1]) if len(query_shape) > 1 else 0
    Hk = int(kv_cache_shape[2]) if len(kv_cache_shape) > 2 else 0
    D = int(query_shape[2]) if len(query_shape) > 2 else 0
    selection = legacy.get("selected_positions_sample") or {}
    return {
        "schema": "epkv.runtime.telemetry.v1",
        "tag": legacy.get("tag", ""),
        "mode": "dry-run" if dry_run else "degraded-fallback",
        "decision": "telemetry_only_fallback_to_original_tq" if dry_run else "schema_v1_requires_dry_run",
        "reason_code": "dry_run_telemetry_only" if dry_run else "telemetry_incomplete",
        "policy_version": "epkv.runtime.schema_v1_adapter.v0.1.default_off",
        "seq_len": seq_len,
        "Hq": Hq,
        "Hk": Hk,
        "D": D,
        "global_k": K,
        "probe_local_top": 8,
        "fallback_local_top": 32,
        "num_chunks": (seq_len + 511) // 512 if seq_len > 0 else 0,
        "flagged_head_count": 0,
        "flagged_head_rate": 0.0,
        "seq_guard": 4096,
        "flag_rate_threshold": 0.75,
        "timing_ms": {
            "probe_candidates": 0.0,
            "detector": 0.0,
            "compact_merge": 0.0,
            "global_select": 0.0,
            "value": 0.0,
            "exact_fallback": 0.0,
            "total_hook_wall": float(legacy.get("elapsed_ms_wall") or 0.0),
            "total_hook_cuda": float(legacy.get("elapsed_ms_sync_timing") or 0.0),
        },
        "coverage": {
            "event_index": int(legacy.get("event_index", 0)) + 1,
            "event_cap": int(event_cap),
            "cap_hit": False,
            "bucket": f"runtime_schema_v1:seq_len:{seq_len}",
        },
        "privacy": {
            "prompt_text": False,
            "raw_token_ids": False,
            "selected_positions_only": True,
        },
        "selection_geometry": {
            "runtime_selected_positions_sample": selection.get("positions_by_head_first_n", []),
            "runtime_position_histogram": selection.get("position_histogram", {}),
            "runtime_position_histogram_bin_size": selection.get("position_histogram_bin_size"),
            "runtime_min_position": selection.get("min_position"),
            "runtime_max_position": selection.get("max_position"),
            "runtime_trace_top_n": selection.get("trace_top_n"),
            "runtime_heads": selection.get("heads"),
            "runtime_K": selection.get("K"),
        },
        "runtime_boundary": {
            "schema_v1_direct": True,
            "dry_run_required": True,
            "serving_output_changed": False,
            "model_inference": False,
            "selected_positions_are_attention": False,
        },
    }


@triton.jit
def _epkv_scores_kernel(
    Q_ptr,
    KV_ptr,
    Block_table_ptr,
    Scores_ptr,
    stride_cache_block: tl.constexpr,
    stride_cache_pos: tl.constexpr,
    stride_cache_head: tl.constexpr,
    M: tl.constexpr,
    Hq: tl.constexpr,
    D: tl.constexpr,
    KV_GROUP: tl.constexpr,
    BLOCK_SIZE: tl.constexpr,
    BLOCK_D: tl.constexpr,
    ATTN_SCALE: tl.constexpr,
    FP8_E4B15: tl.constexpr,
):
    row = tl.program_id(0)
    hq = tl.program_id(1)
    kh = hq // KV_GROUP
    d = tl.arange(0, BLOCK_D)
    mask = d < D
    page_idx = row // BLOCK_SIZE
    page_off = row - page_idx * BLOCK_SIZE
    block_num = tl.load(Block_table_ptr + page_idx).to(tl.int64)
    slot_base = block_num * stride_cache_block + page_off * stride_cache_pos + kh * stride_cache_head
    q = tl.load(Q_ptr + hq * D + d, mask=mask, other=0.0).to(tl.float32)
    k_raw = tl.load(KV_ptr + slot_base + d, mask=mask, other=0)
    if FP8_E4B15:
        k = k_raw.to(tl.float8e4b15, bitcast=True).to(tl.float32)
    else:
        k = k_raw.to(tl.float8e4nv, bitcast=True).to(tl.float32)
    score = tl.sum(tl.where(mask, q * k, 0.0), axis=0) * ATTN_SCALE
    tl.store(Scores_ptr + row * Hq + hq, score)


@triton.jit
def _epkv_value_kernel(
    KV_ptr,
    Block_table_ptr,
    Top_pos_ptr,
    Weights_ptr,
    Out_ptr,
    stride_cache_block: tl.constexpr,
    stride_cache_pos: tl.constexpr,
    stride_cache_head: tl.constexpr,
    Hq: tl.constexpr,
    D: tl.constexpr,
    KTOP: tl.constexpr,
    KV_GROUP: tl.constexpr,
    BLOCK_SIZE: tl.constexpr,
    BLOCK_D: tl.constexpr,
    KPS: tl.constexpr,
    VAL_DATA_BYTES: tl.constexpr,
):
    hq = tl.program_id(0)
    kh = hq // KV_GROUP
    d = tl.arange(0, BLOCK_D)
    mask = d < D
    acc = tl.zeros([BLOCK_D], dtype=tl.float32)
    vb_idx = d // 2
    vb_shift = (d % 2) * 4
    for kk in tl.static_range(0, KTOP):
        row = tl.load(Top_pos_ptr + kk * Hq + hq).to(tl.int64)
        w = tl.load(Weights_ptr + kk * Hq + hq).to(tl.float32)
        page_idx = row // BLOCK_SIZE
        page_off = row - page_idx * BLOCK_SIZE
        block_num = tl.load(Block_table_ptr + page_idx).to(tl.int64)
        slot_base = block_num * stride_cache_block + page_off * stride_cache_pos + kh * stride_cache_head
        val_base = slot_base + KPS
        raw = tl.load(KV_ptr + val_base + vb_idx, mask=mask, other=0).to(tl.int32)
        v_idx = ((raw >> vb_shift) & 0xF).to(tl.float32)
        sc_base = val_base + VAL_DATA_BYTES
        sc_lo = tl.load(KV_ptr + sc_base).to(tl.uint16)
        sc_hi = tl.load(KV_ptr + sc_base + 1).to(tl.uint16)
        v_scale = (sc_lo | (sc_hi << 8)).to(tl.float16, bitcast=True).to(tl.float32)
        zr_lo = tl.load(KV_ptr + sc_base + 2).to(tl.uint16)
        zr_hi = tl.load(KV_ptr + sc_base + 3).to(tl.uint16)
        v_zero = (zr_lo | (zr_hi << 8)).to(tl.float16, bitcast=True).to(tl.float32)
        acc += w * (v_idx * v_scale + v_zero)
    tl.store(Out_ptr + hq * D + d, acc, mask=mask)


def _decode_phase2a(
    *,
    impl: Any,
    query: torch.Tensor,
    kv_cache: torch.Tensor,
    block_table: torch.Tensor,
    seq_lens: torch.Tensor,
) -> tuple[torch.Tensor, dict[str, Any] | None] | None:
    B, Hq, D = query.shape
    if B != 1:
        return None
    M = int(seq_lens[0].item())
    if M <= 0:
        return None
    max_seq = _int_env(_ENV_MAX_SEQ, 256)
    if max_seq > 0 and M > max_seq:
        return None

    Hk = int(kv_cache.shape[2])
    if Hk <= 0 or Hq % Hk != 0:
        return None
    kv_group = Hq // Hk
    tq = getattr(impl, "tq_config", None)
    if tq is None:
        return None
    if not bool(getattr(tq, "key_fp8", False)):
        return None
    if int(getattr(tq, "effective_value_quant_bits", 0)) != 4:
        return None
    if bool(getattr(tq, "value_centroid", False)):
        return None
    if bool(getattr(tq, "rotate_values", False)):
        return None

    K = min(_int_env(_ENV_K, 32), M)
    if K <= 0:
        return None
    key_packed_size = int(getattr(tq, "key_packed_size"))
    val_data_bytes = (D * int(getattr(tq, "effective_value_quant_bits")) + 7) // 8
    block_size = int(kv_cache.shape[1])
    block_table_1 = block_table[0].contiguous()
    q = query.contiguous()

    scores = torch.empty((M, Hq), device=query.device, dtype=torch.float32)
    block_d = triton.next_power_of_2(D)
    _epkv_scores_kernel[(M, Hq)](
        q[0],
        kv_cache,
        block_table_1,
        scores,
        stride_cache_block=kv_cache.stride(0),
        stride_cache_pos=kv_cache.stride(1),
        stride_cache_head=kv_cache.stride(2),
        M=M,
        Hq=Hq,
        D=D,
        KV_GROUP=kv_group,
        BLOCK_SIZE=block_size,
        BLOCK_D=block_d,
        ATTN_SCALE=float(getattr(impl, "scale")),
        FP8_E4B15=_use_fp8_e4b15(query.device.index or 0),
        num_warps=4,
        num_stages=1,
    )
    vals, pos = torch.topk(scores, K, dim=0)
    weights = torch.softmax(vals, dim=0).contiguous()
    pos = pos.contiguous()
    selection_summary = _selection_summary(pos, M=M, Hq=Hq, K=K) if _trace_selection_enabled() else None
    out = torch.empty((Hq, D), device=query.device, dtype=torch.float32)
    _epkv_value_kernel[(Hq,)](
        kv_cache,
        block_table_1,
        pos,
        weights,
        out,
        stride_cache_block=kv_cache.stride(0),
        stride_cache_pos=kv_cache.stride(1),
        stride_cache_head=kv_cache.stride(2),
        Hq=Hq,
        D=D,
        KTOP=K,
        KV_GROUP=kv_group,
        BLOCK_SIZE=block_size,
        BLOCK_D=block_d,
        KPS=key_packed_size,
        VAL_DATA_BYTES=val_data_bytes,
        num_warps=4,
        num_stages=1,
    )
    return out.unsqueeze(0).to(query.dtype), selection_summary


def maybe_decode(
    *,
    impl: Any,
    query: torch.Tensor,
    kv_cache: torch.Tensor,
    attn_metadata: Any,
    layer: Any = None,
) -> torch.Tensor | None:
    """Return Phase 2a output or None to delegate to original TurboQuant.

    Never propagates exceptions into vLLM serving.
    """
    global _seen, _warned
    if not _enabled():
        return None
    max_events = _int_env(_ENV_MAX_EVENTS, 64)
    try:
        if _seen >= max_events:
            return None
        sync_timing = os.environ.get(_ENV_SYNC_TIMING, "0") == "1"
        wall_start = time.perf_counter()
        start = end = None
        if sync_timing and query.is_cuda:
            start = torch.cuda.Event(enable_timing=True)
            end = torch.cuda.Event(enable_timing=True)
            start.record()
        decoded = _decode_phase2a(
            impl=impl,
            query=query,
            kv_cache=kv_cache,
            block_table=attn_metadata.block_table,
            seq_lens=attn_metadata.seq_lens,
        )
        elapsed_ms = None
        if sync_timing and start is not None and end is not None:
            end.record()
            torch.cuda.synchronize(query.device)
            elapsed_ms = float(start.elapsed_time(end))
        elapsed_ms_wall = (time.perf_counter() - wall_start) * 1000.0
        if decoded is None:
            return None
        out, selection_summary = decoded
        dry_run = os.environ.get(_ENV_DRY_RUN, "0") == "1"
        event = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "tag": os.environ.get(_ENV_TAG, ""),
            "event_index": _seen,
            "hook": "evidence_paged_kv.runtime.phase2a.v0",
            "mode": "guarded_runtime_selected_page_dry_run" if dry_run else "guarded_runtime_selected_page",
            "decision": "telemetry_only_fallback_to_original_tq" if dry_run else "returned_phase2a_output",
            "elapsed_ms_sync_timing": elapsed_ms,
            "elapsed_ms_wall": elapsed_ms_wall,
            "query_shape": list(query.shape),
            "kv_cache_shape": list(kv_cache.shape),
            "block_table_shape": list(attn_metadata.block_table.shape),
            "seq_len": int(attn_metadata.seq_lens[0].item()),
            "K": min(_int_env(_ENV_K, 32), int(attn_metadata.seq_lens[0].item())),
            "temp_scores_bytes": int(attn_metadata.seq_lens[0].item()) * int(query.shape[1]) * 4,
            "fallback_after_max_events": max_events,
        }
        if selection_summary is not None:
            event["selected_positions_sample"] = selection_summary
        if dry_run and _schema_v1_enabled():
            event = _schema_v1_event_from_legacy(event, event_cap=max_events, dry_run=True)
        _write_event(event)
        if _seen == 0:
            logger.warning(
                "Evidence-Paged KV Phase 2a runtime hook ACTIVE. This is experimental; "
                "delegation fallback after %d events. log=%s",
                max_events,
                os.environ.get(_ENV_LOG, "<unset>"),
            )
        _seen += 1
        return None if dry_run else out
    except Exception as exc:  # noqa: BLE001
        if not _warned:
            logger.warning("Evidence-Paged KV runtime hook failed; falling back to original TurboQuant: %s", exc)
            _warned = True
        return None
