#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.9 — compact fallback flag-rate sweep.

Offline crossover study for compact fallback policy:

    probe LOCAL_TOP=8 for all heads
    detector flags a partial set of heads
    compact merge computes TOP=32 only for flagged heads
    compare compact full path vs exact-only full path

Fixtures deliberately create concentrated top-32 evidence for the first N query
heads while leaving the remaining heads random/spread-like. This is a policy
crossover benchmark, not model behavior evidence and not serving.
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
COMPACT = HERE / "epkv-compact-fallback-harness.py"
spec = importlib.util.spec_from_file_location("epkv_compact", COMPACT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load {COMPACT}")
compact = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compact)
gpu = compact.gpu
epkv = compact.epkv

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-compact-fallback-flag-sweep-2026-05-19")
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


def make_partial_head_fixture(torch, *, max_N, Hq, Hk, D, kv_group, global_k, target_flag_heads):
    qf = torch.randn((Hq, D), device="cuda", dtype=torch.float32)
    qf = qf / qf.norm(dim=-1, keepdim=True)
    q = qf.unsqueeze(0).to(torch.bfloat16)
    key = (0.01 * torch.randn((max_N, Hk, D), device="cuda", dtype=torch.float32)).to(torch.bfloat16)
    value = torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16)
    # For each target head, place 32 strong keys in the first chunk for its KV head.
    # Within a KV group, allocate disjoint positions per query head to avoid collisions.
    for h in range(target_flag_heads):
        kh = h // kv_group
        local_h = h % kv_group
        base = local_h * global_k
        for rank in range(global_k):
            pos = base + rank
            amp = 4.0 - 0.01 * rank
            key[pos, kh] = (amp * qf[h]).to(torch.bfloat16)
    return q, key, value


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_COMPACT_FALLBACK_FLAG_SWEEP_START")
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
    M = 65536
    max_blocks = math.ceil(max_N / block_size)
    global_k = 32
    probe_top = 8
    exact_top = 32
    chunk_rows = 512
    requested_flag_counts = [0, 1, 2, 4, 7, 14, 21, 28]

    meta = {
        "host": platform.node(),
        "python": platform.python_version(),
        "torch": torch.__version__,
        "cuda_device": torch.cuda.get_device_name(0),
        "nvidia_smi_start": smi(),
        "policy": {"global_k": global_k, "probe_local_top": probe_top, "fallback_local_top": exact_top, "chunk_rows": chunk_rows},
        "boundary": "offline partial-head flag-rate crossover sweep; no serving mutation",
        "fixture": "first N query heads get concentrated top-32 keys; remaining heads random",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
    slot_mapping = torch.arange(max_N, device="cuda", dtype=torch.int32)
    block_table = torch.arange(math.ceil(M / block_size), device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
    results = []

    for requested in requested_flag_counts:
        q, key, value = make_partial_head_fixture(torch, max_N=max_N, Hq=Hq, Hk=Hk, D=D, kv_group=kv_group, global_k=global_k, target_flag_heads=requested)
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
        flag_list = [int(x) for x in flags.detach().cpu().tolist()]
        error = {"max_abs": float((out - exact_ref).abs().max().detach().cpu()), "mean_abs": float((out - exact_ref).abs().mean().detach().cpu())}
        compact_b = bench_event(torch, f"compact_full requested_flags={requested} observed_flags={observed_flags} M={M}", compact_full_path)
        exact_b = bench_event(torch, f"exact_full requested_flags={requested} observed_flags={observed_flags} M={M}", exact_full_path)
        speed_ratio = compact_b["p50_ms"] / exact_b["p50_ms"] if exact_b["p50_ms"] else None
        row = {
            "requested_flag_heads": requested,
            "observed_flag_heads": observed_flags,
            "flag_rate": observed_flags / Hq,
            "flag_list": flag_list,
            "M": M,
            "error_vs_exact_topk_output": error,
            "timing": {"compact_full_path": compact_b, "exact_full_path": exact_b},
            "compact_vs_exact_p50_ratio": speed_ratio,
        }
        results.append(row)
        log("RESULT " + json.dumps(row))
        del q, key, value, kv_cache, K_out, V_out, exact_ref, pv, pp, flags, out
        torch.cuda.empty_cache()

    report = {"title": "Evidence-Paged KV Phase 2c.9 — compact fallback flag-rate sweep", "meta": meta, "results": results, "nvidia_smi_end": smi(), "non_claims": ["not production attention", "not serving", "not a serving speedup claim", "not model-quality evidence"]}
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c.9 — compact fallback flag-rate sweep — 2026-05-19",
        "",
        "> Offline partial-head crossover sweep for compact fallback policy. No serving mutation.",
        "",
        "## Boundary",
        "",
        "```txt",
        "M: 65536",
        "probe_local_top: 8",
        "fallback_local_top: 32",
        "global_k: 32",
        "fixture: first N query heads get concentrated top-32 keys; remaining heads random",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| requested flagged heads | observed flagged heads | flag rate | max abs err | compact p50 ms | exact p50 ms | compact/exact p50 |",
        "|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        lines.append(f"| {r['requested_flag_heads']} | {r['observed_flag_heads']} | {r['flag_rate']:.3f} | {r['error_vs_exact_topk_output']['max_abs']:.6f} | {r['timing']['compact_full_path']['p50_ms']:.4f} | {r['timing']['exact_full_path']['p50_ms']:.4f} | {r['compact_vs_exact_p50_ratio']:.3f} |")

    below = [r for r in results if r["compact_vs_exact_p50_ratio"] < 1.0]
    above = [r for r in results if r["compact_vs_exact_p50_ratio"] >= 1.0]
    last_below = below[-1] if below else None
    first_above = above[0] if above else None
    lines += [
        "",
        "## Readout",
        "",
        f"- compact faster-than-exact cases: {len(below)}/{len(results)}",
        f"- compact slower/equal cases: {len(above)}/{len(results)}",
    ]
    if last_below:
        lines.append(f"- last faster observed flag count: {last_below['observed_flag_heads']}/28 (ratio {last_below['compact_vs_exact_p50_ratio']:.3f})")
    if first_above:
        lines.append(f"- first slower/equal observed flag count: {first_above['observed_flag_heads']}/28 (ratio {first_above['compact_vs_exact_p50_ratio']:.3f})")
    lines += [
        "- This sweep measures offline policy crossover only; the fixture is synthetic and not prompt/model behavior.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_COMPACT_FALLBACK_FLAG_SWEEP_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_COMPACT_FALLBACK_FLAG_SWEEP_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
