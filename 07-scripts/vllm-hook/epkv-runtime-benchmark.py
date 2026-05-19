#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2a — controlled runtime benchmark (Track A).

Offline harness against the guarded runtime hook function.

It imports ``vllm.v1.attention.evidence_paged_kv.runtime_hook`` and drives
``maybe_decode`` directly against a synthetic TurboQuant KV cache populated by
``triton_turboquant_store``. It does not call the running vLLM HTTP service,
does not restart anything, and does not process real prompts.

Question answered:
    Is the steady-state cost of the Phase 2a hook bounded enough to use as
    telemetry-only substrate for a future evidence-utilization bridge?

Non-claims:
    - not production attention;
    - not a serving speedup claim;
    - not model-quality or evidence-utilization improvement;
    - not a PagedAttention/FlashAttention comparison.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import platform
import statistics
import subprocess
import time
import traceback
import types
from pathlib import Path
from typing import Any, Callable

CUDA_HOME_DEFAULT = "/home/felipe/vllm-lab/venv-tq-fresh-20260515/lib/python3.12/site-packages/nvidia/cu13"


def configure_cuda_env(cuda_home: str) -> None:
    os.environ["CUDA_HOME"] = cuda_home
    os.environ["PATH"] = f"{cuda_home}/bin:" + os.environ.get("PATH", "")
    os.environ["LD_LIBRARY_PATH"] = f"{cuda_home}/lib:/usr/lib/wsl/lib:" + os.environ.get("LD_LIBRARY_PATH", "")


def smi() -> str:
    try:
        return subprocess.check_output(
            [
                "nvidia-smi",
                "--query-gpu=name,driver_version,memory.used,memory.total,utilization.gpu,temperature.gpu",
                "--format=csv,noheader",
            ],
            text=True,
        ).strip()
    except Exception as exc:  # noqa: BLE001
        return f"ERROR {exc}"


def log_line(log_path: Path, msg: str) -> None:
    line = f"[{time.strftime('%Y-%m-%dT%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with log_path.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def percentile(sorted_values: list[float], q: float) -> float:
    if not sorted_values:
        return float("nan")
    idx = min(len(sorted_values) - 1, max(0, int(len(sorted_values) * q)))
    return sorted_values[idx]


def tensor_checksum(y: Any) -> float | None:
    if y is None:
        return None
    yy = y[0] if isinstance(y, tuple) else y
    try:
        return float(yy.float().sum().detach().cpu())
    except Exception:  # noqa: BLE001
        return None


def bench_call(
    torch: Any,
    fn: Callable[[], Any],
    *,
    warmup_n: int,
    steady_n: int,
) -> dict[str, Any]:
    warmup_ms: list[float] = []
    warmup_checksum = None
    for _ in range(warmup_n):
        start = torch.cuda.Event(enable_timing=True)
        end = torch.cuda.Event(enable_timing=True)
        start.record()
        y = fn()
        end.record()
        torch.cuda.synchronize()
        warmup_ms.append(float(start.elapsed_time(end)))
        if warmup_checksum is None:
            warmup_checksum = tensor_checksum(y)

    steady_ms: list[float] = []
    steady_checksum = None
    for _ in range(steady_n):
        start = torch.cuda.Event(enable_timing=True)
        end = torch.cuda.Event(enable_timing=True)
        start.record()
        y = fn()
        end.record()
        torch.cuda.synchronize()
        steady_ms.append(float(start.elapsed_time(end)))
        if steady_checksum is None:
            steady_checksum = tensor_checksum(y)

    times = sorted(steady_ms)
    return {
        "warmup_n": warmup_n,
        "steady_n": steady_n,
        "first_compile_ms": warmup_ms[0] if warmup_ms else None,
        "warmup_ms": warmup_ms,
        "steady_min_ms": times[0],
        "steady_p10_ms": percentile(times, 0.10),
        "steady_p50_ms": statistics.median(times),
        "steady_p90_ms": percentile(times, 0.90),
        "steady_max_ms": times[-1],
        "warmup_checksum": warmup_checksum,
        "steady_checksum": steady_checksum,
    }


def make_block_table(torch: Any, M: int, block_size: int) -> Any:
    n_pages = math.ceil(M / block_size)
    return torch.arange(n_pages, device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()


def write_results_md(out_dir: Path, report: dict[str, Any]) -> None:
    results = report["results"]
    baseline_by_m = {
        r["M"]: r for r in results if r["mode"] == "original_turboquant_decode"
    }

    lines = [
        "# Evidence-Paged KV Phase 2a — runtime benchmark — Track A",
        "",
        "> Offline benchmark of the guarded runtime hook function. No serving mutation, no HTTP requests, no real prompts.",
        "",
        "## Boundary",
        "",
        "```txt",
        "baseline: original TurboQuant decode over synthetic packed KV cache",
        "hook: runtime_hook.maybe_decode -> Triton scores -> torch.topk/softmax -> Triton value",
        "layout: turboquant_k8v4, FP8-K + 4-bit-V, slot_size=196, block_size=16, Hq=28, Hk=4, D=128",
        "```",
        "",
        "## Environment",
        "",
        "```json",
        json.dumps(report["meta"], indent=2, sort_keys=True),
        "```",
        "",
        "## Timings",
        "",
        "| mode | M rows | K | first compile ms | steady p50 ms | steady p90 ms | steady max ms | p90 hook / original | temp scores MiB |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        ratio = ""
        if r["mode"] == "epkv_runtime_hook_phase2a":
            base = baseline_by_m.get(r["M"])
            if base and base.get("steady_p90_ms", 0) > 0:
                ratio = f"{r['steady_p90_ms'] / base['steady_p90_ms']:.3f}"
        temp_mib = r.get("temp_scores_bytes", 0) / (1024 * 1024)
        k = "" if r.get("K") is None else str(r.get("K"))
        first = r.get("first_compile_ms")
        lines.append(
            f"| {r['mode']} | {r['M']} | {k} | "
            f"{first:.4f} | {r['steady_p50_ms']:.4f} | {r['steady_p90_ms']:.4f} | "
            f"{r['steady_max_ms']:.4f} | {ratio} | {temp_mib:.2f} |"
        )

    lines += [
        "",
        "## Gate readout template",
        "",
        "Proceed to the evidence-utilization bridge only if:",
        "",
        "- steady `p90_hook / p90_original_tq <= 2.5` for M in {64, 512, 2048};",
        "- per-bucket steady max is <= 5x steady p50, or outlier bands are explicitly repeated/excluded;",
        "- telemetry events include seq_len, K, temp_scores_bytes, elapsed_ms_sync_timing;",
        "- any later serving-path probe is separately confirmed and restored.",
        "",
        "## Event log",
        "",
        f"Raw runtime hook events: `{report['events_jsonl']}`",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not a serving speedup claim.",
        "- Not a model-quality or evidence-utilization improvement claim.",
        "- Not a PagedAttention/FlashAttention comparison.",
    ]
    (out_dir / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_int_list(value: str) -> list[int]:
    return [int(part.strip()) for part in value.split(",") if part.strip()]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cuda-home", default=os.environ.get("CUDA_HOME", CUDA_HOME_DEFAULT))
    ap.add_argument("--out", default=f"/home/felipe/vllm-lab/evidence-paged-kv-runtime-benchmark-{time.strftime('%Y-%m-%d')}")
    ap.add_argument("--seq-lens", default="64,512,2048,8192")
    ap.add_argument("--topks", default="32,128")
    ap.add_argument("--warmup", type=int, default=4)
    ap.add_argument("--steady", type=int, default=30)
    ap.add_argument("--seed", type=int, default=20260519)
    args = ap.parse_args()

    configure_cuda_env(args.cuda_home)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    log_path = out_dir / "run.log"
    log_path.write_text("", encoding="utf-8")
    events_path = out_dir / "events.jsonl"
    events_path.write_text("", encoding="utf-8")

    try:
        log_line(log_path, "EPKV_RUNTIME_BENCHMARK_TRACK_A_START")
        import torch  # noqa: PLC0415
        from vllm.v1.attention.ops import triton_turboquant_decode as tq_decode  # noqa: PLC0415
        from vllm.v1.attention.ops.triton_turboquant_decode import (  # noqa: PLC0415
            triton_turboquant_decode_attention,
        )
        from vllm.v1.attention.ops.triton_turboquant_store import triton_turboquant_store  # noqa: PLC0415
        from vllm.v1.attention.evidence_paged_kv import runtime_hook  # noqa: PLC0415

        if not torch.cuda.is_available():
            raise RuntimeError("CUDA unavailable")
        torch.manual_seed(args.seed)

        seq_lens_to_bench = parse_int_list(args.seq_lens)
        topks = parse_int_list(args.topks)
        max_M = max(seq_lens_to_bench)

        # Match the production hook receipt observed on 2026-05-19.
        B = 1
        Hq = 28
        Hk = 4
        D = 128
        kv_group = Hq // Hk
        block_size = 16
        key_packed_size = 128
        value_quant_bits = 4
        val_data_bytes = math.ceil(D * value_quant_bits / 8)
        slot_size = key_packed_size + val_data_bytes + 4
        scale = 1.0 / math.sqrt(D)
        max_blocks = math.ceil(max_M / block_size)

        os.environ["VLLM_EPKV_RUNTIME_HOOK"] = "1"
        os.environ["VLLM_EPKV_RUNTIME_SYNC_TIMING"] = "1"
        os.environ["VLLM_EPKV_RUNTIME_LOG"] = str(events_path)
        os.environ["VLLM_EPKV_RUNTIME_MAX_EVENTS"] = "8192"
        os.environ["VLLM_EPKV_RUNTIME_MAX_SEQ"] = str(max_M + 1)
        os.environ.pop("VLLM_EPKV_RUNTIME_DRY_RUN", None)

        meta = {
            "host": platform.node(),
            "python": platform.python_version(),
            "torch": torch.__version__,
            "cuda_home": os.environ.get("CUDA_HOME"),
            "cuda_device": torch.cuda.get_device_name(0),
            "nvidia_smi_start": smi(),
            "seq_lens": seq_lens_to_bench,
            "topks": topks,
            "warmup_n": args.warmup,
            "steady_n": args.steady,
            "layout": {
                "kv_cache_dtype": "turboquant_k8v4",
                "B": B,
                "Hq": Hq,
                "Hk": Hk,
                "D": D,
                "kv_group": kv_group,
                "block_size": block_size,
                "key_fp8": True,
                "key_packed_size": key_packed_size,
                "value_quant_bits": value_quant_bits,
                "val_data_bytes": val_data_bytes,
                "slot_size": slot_size,
                "max_M": max_M,
                "max_blocks": max_blocks,
            },
        }
        log_line(log_path, "META " + json.dumps(meta, sort_keys=True))

        PiT = torch.eye(D, device="cuda", dtype=torch.float32)
        midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
        centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
        key = torch.randn((max_M, Hk, D), device="cuda", dtype=torch.bfloat16)
        value = torch.randn((max_M, Hk, D), device="cuda", dtype=torch.bfloat16)
        q = torch.randn((B, Hq, D), device="cuda", dtype=torch.bfloat16)
        kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size), device="cuda", dtype=torch.uint8)
        kv_cache.zero_()
        slot_mapping = torch.arange(max_M, device="cuda", dtype=torch.int32)

        log_line(log_path, "STORE_START")
        triton_turboquant_store(
            key,
            value,
            kv_cache,
            slot_mapping,
            PiT,
            midpoints,
            mse_bits=0,
            key_packed_size=key_packed_size,
            value_quant_bits=value_quant_bits,
            key_fp8=True,
            rotate_values=False,
            padded_head_dim=D,
            value_centroid=False,
        )
        torch.cuda.synchronize()
        log_line(log_path, "STORE_OK " + smi())

        tq_config = types.SimpleNamespace(
            key_fp8=True,
            effective_value_quant_bits=value_quant_bits,
            value_centroid=False,
            rotate_values=False,
            key_packed_size=key_packed_size,
        )
        impl = types.SimpleNamespace(tq_config=tq_config, scale=scale)

        results: list[dict[str, Any]] = []
        for M in seq_lens_to_bench:
            block_table = make_block_table(torch, M, block_size)
            seq_lens = torch.tensor([M], device="cuda", dtype=torch.int32)
            attn_metadata = types.SimpleNamespace(block_table=block_table, seq_lens=seq_lens)

            def original_decode() -> Any:
                return triton_turboquant_decode_attention(
                    query=q,
                    kv_cache=kv_cache,
                    block_table=block_table,
                    seq_lens=seq_lens,
                    Pi=PiT,
                    centroids=centroids,
                    scale=scale,
                    mse_bits=0,
                    key_packed_size=key_packed_size,
                    value_quant_bits=value_quant_bits,
                    key_fp8=True,
                    norm_correction=False,
                    PiT=PiT,
                    max_num_kv_splits=32,
                    rotate_values=False,
                    original_head_dim=D,
                    value_centroid=False,
                    sparse_v=False,
                    valid_mask=None,
                )

            baseline = bench_call(torch, original_decode, warmup_n=args.warmup, steady_n=args.steady)
            baseline.update(
                {
                    "mode": "original_turboquant_decode",
                    "M": M,
                    "K": None,
                    "temp_scores_bytes": 0,
                }
            )
            results.append(baseline)
            log_line(log_path, "RESULT " + json.dumps(baseline, sort_keys=True))

            for K in topks:
                os.environ["VLLM_EPKV_RUNTIME_K"] = str(K)
                os.environ["VLLM_EPKV_RUNTIME_TAG"] = f"track-a-M{M}-K{K}"
                runtime_hook._seen = 0  # reset module-level event cap per bucket

                def hook_decode() -> Any:
                    return runtime_hook.maybe_decode(
                        impl=impl,
                        query=q,
                        kv_cache=kv_cache,
                        attn_metadata=attn_metadata,
                        layer=None,
                    )

                hooked = bench_call(torch, hook_decode, warmup_n=args.warmup, steady_n=args.steady)
                if hooked.get("steady_checksum") is None:
                    raise RuntimeError(f"hook returned None for M={M} K={K}; check max_seq/layout guards")
                hooked.update(
                    {
                        "mode": "epkv_runtime_hook_phase2a",
                        "M": M,
                        "K": K,
                        "temp_scores_bytes": M * Hq * 4,
                    }
                )
                results.append(hooked)
                log_line(log_path, "RESULT " + json.dumps(hooked, sort_keys=True))

        report = {
            "title": "Evidence-Paged KV Phase 2a — runtime benchmark — Track A",
            "boundary": "Offline direct call into guarded runtime_hook.maybe_decode; no serving mutation.",
            "meta": meta | {"nvidia_smi_end": smi()},
            "events_jsonl": str(events_path),
            "results": results,
        }
        (out_dir / "summary.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        write_results_md(out_dir, report)
        log_line(log_path, "EPKV_RUNTIME_BENCHMARK_TRACK_A_DONE")
    except Exception:
        log_line(log_path, "EPKV_RUNTIME_BENCHMARK_TRACK_A_FAILED")
        (out_dir / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise


if __name__ == "__main__":
    main()
