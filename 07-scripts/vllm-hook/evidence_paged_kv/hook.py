"""Observe-first Evidence-Paged KV hook for vLLM TurboQuant decode.

Mode: boundary scout.

The hook records tensor shapes and runtime metadata at the TurboQuant decode
boundary, then returns control to the normal vLLM attention path. It deliberately
avoids GPU synchronisation, tensor value reads, or attention replacement.

Enable with:

    VLLM_EPKV_HOOK=1
    VLLM_EPKV_HOOK_LOG=/tmp/evidence-paged-kv-hook.jsonl

Optional:

    VLLM_EPKV_HOOK_MAX_EVENTS=64
    VLLM_EPKV_HOOK_TAG=my-run

Non-claims:
- not a production attention kernel;
- not a vLLM speedup;
- not a model-quality improvement;
- not a FlashAttention/PagedAttention comparison.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

try:
    from vllm.logger import init_logger

    logger = init_logger(__name__)
except Exception:  # pragma: no cover - usable outside vLLM for smoke tests.
    import logging

    logger = logging.getLogger(__name__)

_ENV_ENABLED = "VLLM_EPKV_HOOK"
_ENV_LOG = "VLLM_EPKV_HOOK_LOG"
_ENV_MAX_EVENTS = "VLLM_EPKV_HOOK_MAX_EVENTS"
_ENV_TAG = "VLLM_EPKV_HOOK_TAG"

_seen_events = 0
_warned_disabled = False


def _enabled() -> bool:
    return os.environ.get(_ENV_ENABLED, "0") == "1"


def _shape(x: Any) -> list[int] | None:
    try:
        return [int(v) for v in x.shape]
    except Exception:
        return None


def _dtype(x: Any) -> str | None:
    try:
        return str(x.dtype)
    except Exception:
        return None


def _device(x: Any) -> str | None:
    try:
        return str(x.device)
    except Exception:
        return None


def _stride(x: Any) -> list[int] | None:
    try:
        return [int(v) for v in x.stride()]
    except Exception:
        return None


def _safe_int(v: Any) -> int | None:
    try:
        return int(v)
    except Exception:
        return None


def _write_event(event: dict[str, Any]) -> None:
    log_path = os.environ.get(_ENV_LOG)
    if not log_path:
        return
    path = Path(log_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, sort_keys=True) + "\n")


def observe_decode(
    *,
    impl: Any,
    query: Any,
    kv_cache: Any,
    attn_metadata: Any,
    layer: Any = None,
) -> None:
    """Record the TurboQuant decode insertion boundary, then return.

    This function must be cheap and non-invasive:
    - no GPU synchronisation;
    - no tensor value reads;
    - no attention output mutation;
    - no exception propagation into serving path.
    """
    global _seen_events, _warned_disabled

    if not _enabled():
        if not _warned_disabled:
            _warned_disabled = True
        return

    max_events = _safe_int(os.environ.get(_ENV_MAX_EVENTS, "32")) or 32
    if _seen_events >= max_events:
        return

    try:
        tq_config = getattr(impl, "tq_config", None)
        Hq = query.shape[1] if len(query.shape) >= 2 else None
        Hk = kv_cache.shape[2] if len(kv_cache.shape) >= 3 else None
        kv_group = int(Hq // Hk) if Hq and Hk else None

        valid_mask = getattr(attn_metadata, "triatt_valid_mask", None)
        event = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "tag": os.environ.get(_ENV_TAG, ""),
            "event_index": _seen_events,
            "hook": "evidence_paged_kv.decode.observe.v0",
            "mode": "observe_only",
            "query": {
                "shape": _shape(query),
                "stride": _stride(query),
                "dtype": _dtype(query),
                "device": _device(query),
            },
            "kv_cache": {
                "shape": _shape(kv_cache),
                "stride": _stride(kv_cache),
                "dtype": _dtype(kv_cache),
                "device": _device(kv_cache),
                "block_size": _safe_int(kv_cache.shape[1]) if len(kv_cache.shape) >= 2 else None,
                "num_kv_heads": _safe_int(Hk),
                "slot_size": _safe_int(kv_cache.shape[3]) if len(kv_cache.shape) >= 4 else None,
            },
            "metadata": {
                "block_table_shape": _shape(getattr(attn_metadata, "block_table", None)),
                "seq_lens_shape": _shape(getattr(attn_metadata, "seq_lens", None)),
                "slot_mapping_shape": _shape(getattr(attn_metadata, "slot_mapping", None)),
                "query_start_loc_shape": _shape(getattr(attn_metadata, "query_start_loc", None)),
                "num_actual_tokens": _safe_int(getattr(attn_metadata, "num_actual_tokens", None)),
                "max_query_len": _safe_int(getattr(attn_metadata, "max_query_len", None)),
                "max_seq_len": _safe_int(getattr(attn_metadata, "max_seq_len", None)),
                "num_decodes": _safe_int(getattr(attn_metadata, "num_decodes", None)),
                "num_decode_tokens": _safe_int(getattr(attn_metadata, "num_decode_tokens", None)),
                "has_triatt_valid_mask": valid_mask is not None,
                "triatt_valid_mask_shape": _shape(valid_mask),
            },
            "impl": {
                "num_heads": _safe_int(getattr(impl, "num_heads", None)),
                "num_kv_heads": _safe_int(getattr(impl, "num_kv_heads", None)),
                "head_size": _safe_int(getattr(impl, "head_size", None)),
                "scale": float(getattr(impl, "scale", 0.0)),
                "kv_group": _safe_int(kv_group),
                "kv_cache_dtype": str(getattr(impl, "kv_cache_dtype", "")),
                "key_fp8": bool(getattr(tq_config, "key_fp8", False)) if tq_config else None,
                "key_mse_bits": _safe_int(getattr(tq_config, "key_mse_bits", None)) if tq_config else None,
                "key_packed_size": _safe_int(getattr(tq_config, "key_packed_size", None)) if tq_config else None,
                "value_quant_bits": _safe_int(getattr(tq_config, "effective_value_quant_bits", None)) if tq_config else None,
                "value_centroid": bool(getattr(tq_config, "value_centroid", False)) if tq_config else None,
                "rotate_values": bool(getattr(tq_config, "rotate_values", False)) if tq_config else None,
            },
            "layer": {
                "type": type(layer).__name__ if layer is not None else None,
            },
            "decision": "delegate_to_original_turboquant_decode",
        }
        _write_event(event)
        if _seen_events == 0:
            logger.warning(
                "Evidence-Paged KV observe hook active: logging decode boundary "
                "metadata to %s and delegating to original TurboQuant attention.",
                os.environ.get(_ENV_LOG, "<unset>"),
            )
        _seen_events += 1
    except Exception as exc:  # noqa: BLE001 - never break serving path.
        logger.warning("Evidence-Paged KV observe hook failed and was ignored: %s", exc)
