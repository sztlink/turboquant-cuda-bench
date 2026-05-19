#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.10 — compact fallback shape sweep.

Validate the tentative flag-rate policy across sequence lengths:

    if flagged_head_rate >= ~0.75: exact-only
    else: compact fallback

Boundary: offline synthetic fixtures only. No serving mutation, no real prompts,
no speedup or quality claim.
"""
from __future__ import annotations

import importlib.util
import json
import math
import platform
import subprocess
import time
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
FLAG_SWEEP = HERE / "epkv-compact-fallback-flag-sweep-harness.py"
spec = importlib.util.spec_from_file_location("epkv_flag_sweep", FLAG_SWEEP)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load {FLAG_SWEEP}")
flag_sweep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(flag_sweep)
compact = flag_sweep.compact
gpu = flag_sweep.gpu
epkv = flag_sweep.epkv

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-compact-fallback-shape-sweep-2026-05-19")
OUT.mkdir(parents=True, exist_ok=True)
LOG = OUT / "run.log"


def log(msg: str) -> None:
    line = f"[{time.strftime('%Y-%m-%dT%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def smi() -> str:
    try:
        return subprocess.check_output([
            "nvidia-smi",
            "--query-gpu=name,driver_version,memory.used,memory.total,utilization.gpu,temperature.gpu",
            "--format=csv,noheader",
        ], text=True).strip()
    except Exception as exc:  # noqa: BLE001
        return f"ERROR {exc}"


def sync(torch):
    torch.cuda.synchronize()


def bench_event(torch, name, fn, repeats=5, warmup=3):
    for _ in range(warmup):
        fn()
    sync(torch)
    times = []
    checksum = None
    for _ in range(repeats):
        a = torch.cuda.Event(enable_timing=True)
        b = torch.cuda.Event(enable_timing=True)
        a.record()
        y = fn()
        b.record()
        sync(torch)
        yy = y[0] if isinstance(y, tuple) else y
        if checksum is None:
            raw = float(yy.float().sum().detach().cpu())
            checksum = raw if math.isfinite(raw) else None
        times.append(a.elapsed_time(b))
    times = sorted(times)
    return {
        "name": name,
        "repeats": repeats,
        "p50_ms": times[len(times) // 2],
        "p90_ms": times[min(len(times) - 1, int(len(times) * 0.9))],
        "min_ms": times[0],
        "max_ms": times[-1],
        "checksum": checksum,
    }


def policy_choice(flag_rate: float, threshold: float = 0.75) -> str:
    return "exact_only" if flag_rate >= threshold else "compact_fallback"


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_COMPACT_FALLBACK_SHAPE_SWEEP_START")
    import torch
    from vllm.v1.attention.ops import triton_turboquant_decode as tq_decode
    from vllm.v1.attention.ops.triton_turboquant_store import triton_turboquant_store

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable")
    torch.manual_seed(20260519)

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
    max_N = 65536
    max_blocks = math.ceil(max_N / block_size)
    global_k = 32
    probe_top = 8
    exact_top = 32
    chunk_rows = 512
    M_values = [8192, 16384, 32768, 65536]
    requested_flag_counts = [0, 7, 14, 21, 28]
    threshold = 0.75

    meta = {
        "host": platform.node(),
        "python": platform.python_version(),
        "torch": torch.__version__,
        "cuda_device": torch.cuda.get_device_name(0),
        "nvidia_smi_start": smi(),
        "policy_under_test": {"flagged_head_rate_exact_only_threshold": threshold},
        "kernel_policy": {"global_k": global_k, "probe_local_top": probe_top, "fallback_local_top": exact_top, "chunk_rows": chunk_rows},
        "boundary": "offline multi-shape synthetic threshold validation; no serving mutation",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
    slot_mapping = torch.arange(max_N, device="cuda", dtype=torch.int32)
    results = []

    for M in M_values:
        block_table = torch.arange(math.ceil(M / block_size), device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
        for requested in requested_flag_counts:
            q, key, value = flag_sweep.make_partial_head_fixture(torch, max_N=max_N, Hq=Hq, Hk=Hk, D=D, kv_group=kv_group, global_k=global_k, target_flag_heads=requested)
            kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size), device="cuda", dtype=torch.uint8)
            kv_cache.zero_()
            triton_turboquant_store(key, value, kv_cache, slot_mapping, PiT, midpoints, mse_bits=0, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits, key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False)
            sync(torch)
            K_out, V_out = epkv.launch_full_dequant(torch, tq_decode, kv_cache, block_table, centroids, M, Hk=Hk, D=D, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits)
            sync(torch)
            exact_ref = epkv.ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, global_k).detach().float()

            def probe_candidates_flags():
                pv, pp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=probe_top, chunk_rows=chunk_rows)
                flags = gpu.launch_gpu_overflow_detector(torch, pv, Hq=Hq, global_k=global_k, local_top=probe_top)
                return pv, pp, flags

            def compact_full_path():
                pv, pp, flags = probe_candidates_flags()
                cv, cp = compact.launch_compact_fallback_candidates(torch, q, kv_cache, block_table, pv, pp, flags, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, probe_top=probe_top, exact_top=exact_top, chunk_rows=chunk_rows)
                tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
                return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

            def exact_full_path():
                cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=exact_top, chunk_rows=chunk_rows)
                tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
                return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

            pv, pp, flags = probe_candidates_flags()
            out = compact_full_path().detach().float()
            sync(torch)
            observed_flags = int(flags.detach().cpu().sum().item())
            flag_rate = observed_flags / Hq
            error = {"max_abs": float((out - exact_ref).abs().max().detach().cpu()), "mean_abs": float((out - exact_ref).abs().mean().detach().cpu())}
            compact_b = bench_event(torch, f"compact_full M={M} requested={requested} observed={observed_flags}", compact_full_path)
            exact_b = bench_event(torch, f"exact_full M={M} requested={requested} observed={observed_flags}", exact_full_path)
            ratio = compact_b["p50_ms"] / exact_b["p50_ms"] if exact_b["p50_ms"] else None
            predicted = policy_choice(flag_rate, threshold)
            actual_best = "compact_fallback" if ratio < 1.0 else "exact_only"
            row = {
                "M": M,
                "requested_flag_heads": requested,
                "observed_flag_heads": observed_flags,
                "flag_rate": flag_rate,
                "error_vs_exact_topk_output": error,
                "timing": {"compact_full_path": compact_b, "exact_full_path": exact_b},
                "compact_vs_exact_p50_ratio": ratio,
                "policy_threshold": threshold,
                "policy_choice": predicted,
                "actual_best_p50": actual_best,
                "policy_matches_p50_best": predicted == actual_best,
            }
            results.append(row)
            log("RESULT " + json.dumps(row))
            del q, key, value, kv_cache, K_out, V_out, exact_ref, pv, pp, flags, out
            torch.cuda.empty_cache()

    by_m = {}
    for r in results:
        by_m.setdefault(str(r["M"]), []).append(r)
    report = {"title": "Evidence-Paged KV Phase 2c.10 — compact fallback shape sweep", "meta": meta, "results": results, "by_M": by_m, "nvidia_smi_end": smi(), "non_claims": ["not production attention", "not serving", "not a serving speedup claim", "not model-quality evidence"]}
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c.10 — compact fallback shape sweep — 2026-05-19",
        "",
        "> Offline multi-shape validation of tentative flag-rate policy. No serving mutation.",
        "",
        "## Boundary",
        "",
        "```txt",
        f"M values: {M_values}",
        "probe_local_top: 8",
        "fallback_local_top: 32",
        "global_k: 32",
        f"policy under test: exact-only if flagged_head_rate >= {threshold}",
        "fixture: first N query heads get concentrated top-32 keys; remaining heads random",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| M | observed flags | flag rate | max abs err | compact p50 ms | exact p50 ms | compact/exact | policy | p50 best | match |",
        "|---:|---:|---:|---:|---:|---:|---:|---|---|---|",
    ]
    for r in results:
        lines.append(f"| {r['M']} | {r['observed_flag_heads']} | {r['flag_rate']:.3f} | {r['error_vs_exact_topk_output']['max_abs']:.6f} | {r['timing']['compact_full_path']['p50_ms']:.4f} | {r['timing']['exact_full_path']['p50_ms']:.4f} | {r['compact_vs_exact_p50_ratio']:.3f} | {r['policy_choice']} | {r['actual_best_p50']} | {'yes' if r['policy_matches_p50_best'] else 'no'} |")

    matches = sum(1 for r in results if r["policy_matches_p50_best"])
    lines += [
        "",
        "## Readout",
        "",
        f"- threshold policy matches p50 best in {matches}/{len(results)} synthetic cases;",
        "- compact path remains favorable for low/mid flag rates;",
        "- exact-only wins when most/all heads are flagged, especially at larger M;",
        "- this validates the threshold direction, not a final serving policy.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_COMPACT_FALLBACK_SHAPE_SWEEP_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_COMPACT_FALLBACK_SHAPE_SWEEP_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
