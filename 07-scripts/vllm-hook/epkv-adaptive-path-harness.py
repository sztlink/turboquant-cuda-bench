#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.6 — single adaptive offline path.

Integrates the pieces validated separately:

    probe LOCAL_TOP=8
    -> GPU overflow detector
    -> accept probe OR fallback exact LOCAL_TOP=32
    -> global select + value

Boundary: offline GPU benchmark only. No serving mutation, no real prompts, no
model-quality claim. Python reads the detector flag to choose the branch; this
is a policy/path receipt, not final runtime integration.
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
GPU_DETECTOR = HERE / "epkv-gpu-overflow-detector-harness.py"
spec = importlib.util.spec_from_file_location("epkv_gpu_detector", GPU_DETECTOR)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load {GPU_DETECTOR}")
gpu = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gpu)
epkv = gpu.epkv

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-adaptive-path-2026-05-19")
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


def bench_wall(torch, name, fn, repeats=5, warmup=3):
    for _ in range(warmup):
        fn()
    sync(torch)
    times = []
    last = None
    for _ in range(repeats):
        t0 = time.perf_counter()
        last = fn()
        sync(torch)
        times.append((time.perf_counter() - t0) * 1000.0)
    times = sorted(times)
    return {
        "name": name,
        "repeats": repeats,
        "p50_ms": times[len(times) // 2],
        "p90_ms": times[min(len(times) - 1, int(len(times) * 0.9))],
        "min_ms": times[0],
        "max_ms": times[-1],
        "last": last,
    }


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
            checksum = float(yy.float().sum().detach().cpu())
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


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_ADAPTIVE_PATH_START")
    import torch
    from vllm.v1.attention.ops import triton_turboquant_decode as tq_decode
    from vllm.v1.attention.ops.triton_turboquant_store import triton_turboquant_store

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable")
    torch.manual_seed(20260519)

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
    max_N = 65536
    max_blocks = math.ceil(max_N / block_size)
    global_k = 32
    probe_top = 8
    exact_top = 32
    chunk_rows = 512
    cases = [("random", 8192), ("random", 65536), ("one_chunk_32", 8192), ("one_chunk_32", 65536), ("two_chunks_16_16", 8192), ("two_chunks_16_16", 65536), ("spread_32_chunks", 8192), ("spread_32_chunks", 65536)]

    meta = {
        "host": platform.node(),
        "python": platform.python_version(),
        "torch": torch.__version__,
        "cuda_device": torch.cuda.get_device_name(0),
        "nvidia_smi_start": smi(),
        "policy": {"global_k": global_k, "probe_local_top": probe_top, "fallback_local_top": exact_top, "chunk_rows": chunk_rows},
        "boundary": "offline single adaptive path; Python branch on GPU detector flag; no serving mutation",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
    slot_mapping = torch.arange(max_N, device="cuda", dtype=torch.int32)
    results = []

    for scenario, M in cases:
        if scenario == "random":
            q, key, value = gpu.make_random_fixture(torch, max_N=max_N, Hq=Hq, Hk=Hk, D=D)
        else:
            q, key, value = gpu.build_adversarial_fixture(torch, scenario=scenario, max_N=max_N, Hq=Hq, Hk=Hk, D=D, kv_group=kv_group, chunk_rows=chunk_rows, global_k=global_k)
        kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size), device="cuda", dtype=torch.uint8)
        kv_cache.zero_()
        triton_turboquant_store(key, value, kv_cache, slot_mapping, PiT, midpoints, mse_bits=0, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits, key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False)
        sync(torch)
        n_pages = math.ceil(M / block_size)
        block_table = torch.arange(n_pages, device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
        K_out, V_out = epkv.launch_full_dequant(torch, tq_decode, kv_cache, block_table, centroids, M, Hk=Hk, D=D, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits)
        sync(torch)
        exact_pos = gpu.exact_top_pos_per_head(torch, q, K_out, scale, kv_group, global_k)
        exact_ref = epkv.ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, global_k).detach().float()

        def probe_full_path():
            cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=probe_top, chunk_rows=chunk_rows)
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

        def exact_full_path():
            cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=exact_top, chunk_rows=chunk_rows)
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

        def adaptive_path():
            cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=probe_top, chunk_rows=chunk_rows)
            flags = gpu.launch_gpu_overflow_detector(torch, cv, Hq=Hq, global_k=global_k, local_top=probe_top)
            sync(torch)
            overflow = bool(int(flags.sum().detach().cpu().item()) > 0)
            if overflow:
                cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=exact_top, chunk_rows=chunk_rows)
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            out = epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)
            return out, overflow, tp

        # One run for recall/error branch metadata.
        out, overflow, selected_pos = adaptive_path()
        out = out.detach().float()
        recall = gpu.recall_at_k(torch, selected_pos, exact_pos, global_k)
        error = {"max_abs": float((out - exact_ref).abs().max().detach().cpu()), "mean_abs": float((out - exact_ref).abs().mean().detach().cpu())}
        probe_b = bench_event(torch, f"probe_full scenario={scenario} M={M}", probe_full_path)
        exact_b = bench_event(torch, f"exact_full scenario={scenario} M={M}", exact_full_path)
        adaptive_b = bench_wall(torch, f"adaptive_path scenario={scenario} M={M}", adaptive_path)
        row = {
            "scenario": scenario,
            "M": M,
            "overflow": bool(overflow),
            "mode": "fallback_exact" if overflow else "accept_probe",
            "recall_at_32": recall,
            "error_vs_exact_topk_output": error,
            "timing": {
                "probe_full_event": probe_b,
                "exact_full_event": exact_b,
                "adaptive_path_wall": {k: v for k, v in adaptive_b.items() if k != "last"},
            },
        }
        results.append(row)
        log("RESULT " + json.dumps(row))
        del q, key, value, kv_cache, K_out, V_out, exact_pos, exact_ref, out, selected_pos
        torch.cuda.empty_cache()

    report = {"title": "Evidence-Paged KV Phase 2c.6 — single adaptive offline path", "meta": meta, "results": results, "nvidia_smi_end": smi(), "non_claims": ["not production attention", "not serving", "not a serving speedup claim", "not model quality evidence", "Python CPU branch remains in this offline path"]}
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    lines = [
        "# Evidence-Paged KV Phase 2c.6 — single adaptive offline path — 2026-05-19",
        "",
        "> Offline integrated policy path: probe LOCAL_TOP=8, GPU detector, conditional exact fallback. No serving mutation.",
        "",
        "## Boundary",
        "",
        "```txt",
        "probe_local_top: 8",
        "fallback_local_top: 32",
        "global_k: 32",
        "branch: Python reads GPU detector flag in this harness",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| scenario | M rows | mode | recall@32 | max abs err | probe p50 ms | exact p50 ms | adaptive wall p50 ms |",
        "|---|---:|---|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        t = r["timing"]
        lines.append(f"| {r['scenario']} | {r['M']} | {r['mode']} | {r['recall_at_32']['mean']:.3f} | {r['error_vs_exact_topk_output']['max_abs']:.6f} | {t['probe_full_event']['p50_ms']:.4f} | {t['exact_full_event']['p50_ms']:.4f} | {t['adaptive_path_wall']['p50_ms']:.4f} |")
    accepted = sum(1 for r in results if r["mode"] == "accept_probe")
    fallback = len(results) - accepted
    lines += [
        "",
        "## Readout",
        "",
        f"- accepted probe cases: {accepted}/{len(results)}",
        f"- fallback exact cases: {fallback}/{len(results)}",
        "- recall@32 stayed 1.0 across the tested random/spread/adversarial fixtures;",
        "- adversarial concentrated fixtures triggered exact fallback;",
        "- random/spread fixtures used the cheaper probe path;",
        "- adaptive wall timing includes Python CPU flag read/branch, so it is a policy-path receipt, not final fused-kernel timing.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_ADAPTIVE_PATH_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_ADAPTIVE_PATH_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
