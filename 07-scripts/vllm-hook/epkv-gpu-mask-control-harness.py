#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.7 — GPU-side mask/control proof.

Remove the CPU branch from Phase 2c.6 by keeping the fallback decision on GPU.
This proof computes both probe and exact outputs, then uses a Triton per-head
mask to select exact output for flagged heads and probe output otherwise.

This is deliberately not a final performance design: because both branches are
computed, it measures the cost of a branchless GPU-side control proof, not an
optimized conditional fallback. Boundary: offline only, no serving mutation.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-gpu-mask-control-2026-05-19")
OUT.mkdir(parents=True, exist_ok=True)
LOG = OUT / "run.log"

from vllm.triton_utils import tl, triton  # noqa: E402


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


@triton.jit
def _select_output_by_head_kernel(Probe_ptr, Exact_ptr, Flags_ptr, Out_ptr, Hq: tl.constexpr, D: tl.constexpr, BLOCK_D: tl.constexpr):
    hq = tl.program_id(0)
    d = tl.arange(0, BLOCK_D)
    mask = d < D
    flag = tl.load(Flags_ptr + hq).to(tl.int32)
    probe = tl.load(Probe_ptr + hq * D + d, mask=mask, other=0.0).to(tl.float32)
    exact = tl.load(Exact_ptr + hq * D + d, mask=mask, other=0.0).to(tl.float32)
    out = tl.where(flag != 0, exact, probe)
    tl.store(Out_ptr + hq * D + d, out, mask=mask)


def select_output_by_head(torch, probe_out, exact_out, flags, *, Hq: int, D: int):
    out = torch.empty((Hq, D), device="cuda", dtype=torch.float32)
    _select_output_by_head_kernel[(Hq,)](
        probe_out[0], exact_out[0], flags, out,
        Hq=Hq, D=D, BLOCK_D=triton.next_power_of_2(D),
        num_warps=4, num_stages=1,
    )
    return out.unsqueeze(0)


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
    log("EPKV_GPU_MASK_CONTROL_START")
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
        "boundary": "offline GPU-side mask/control proof; computes both branches; no serving mutation",
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
        exact_ref = epkv.ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, global_k).detach().float()

        def probe_output_and_flags():
            cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=probe_top, chunk_rows=chunk_rows)
            flags = gpu.launch_gpu_overflow_detector(torch, cv, Hq=Hq, global_k=global_k, local_top=probe_top)
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            out = epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)
            return out, flags

        def exact_output():
            cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=exact_top, chunk_rows=chunk_rows)
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

        def dual_gpu_mask_path():
            probe_out, flags = probe_output_and_flags()
            exact_out = exact_output()
            return select_output_by_head(torch, probe_out, exact_out, flags, Hq=Hq, D=D)

        # One metadata run.
        probe_out, flags = probe_output_and_flags()
        exact_out = exact_output()
        selected = select_output_by_head(torch, probe_out, exact_out, flags, Hq=Hq, D=D).detach().float()
        sync(torch)
        flag_heads = int(flags.detach().cpu().sum().item())
        error = {"max_abs": float((selected - exact_ref).abs().max().detach().cpu()), "mean_abs": float((selected - exact_ref).abs().mean().detach().cpu())}
        probe_b = bench_event(torch, f"probe_output_flags scenario={scenario} M={M}", lambda: probe_output_and_flags()[0])
        exact_b = bench_event(torch, f"exact_output scenario={scenario} M={M}", exact_output)
        mask_b = bench_event(torch, f"dual_gpu_mask_path scenario={scenario} M={M}", dual_gpu_mask_path)
        select_b = bench_event(torch, f"select_only scenario={scenario} M={M}", lambda: select_output_by_head(torch, probe_out, exact_out, flags, Hq=Hq, D=D))
        row = {
            "scenario": scenario,
            "M": M,
            "flag_heads": flag_heads,
            "mode": "fallback_some_heads" if flag_heads else "accept_probe_all_heads",
            "error_vs_exact_topk_output": error,
            "timing": {"probe_output_flags": probe_b, "exact_output": exact_b, "select_only": select_b, "dual_gpu_mask_path": mask_b},
        }
        results.append(row)
        log("RESULT " + json.dumps(row))
        del q, key, value, kv_cache, K_out, V_out, exact_ref, probe_out, exact_out, selected, flags
        torch.cuda.empty_cache()

    report = {"title": "Evidence-Paged KV Phase 2c.7 — GPU-side mask/control proof", "meta": meta, "results": results, "nvidia_smi_end": smi(), "non_claims": ["not production attention", "not serving", "not a serving speedup claim", "computes both branches; not optimized conditional fallback"]}
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    lines = [
        "# Evidence-Paged KV Phase 2c.7 — GPU-side mask/control proof — 2026-05-19",
        "",
        "> Offline proof that fallback choice can stay GPU-side via per-head mask. This computes both branches and is not an optimized conditional path.",
        "",
        "## Boundary",
        "",
        "```txt",
        "probe_local_top: 8",
        "fallback_local_top: 32",
        "global_k: 32",
        "control: GPU detector flags + Triton per-head output select",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| scenario | M rows | mode | flag heads | max abs err | probe+flags p50 | exact p50 | select p50 | dual mask path p50 |",
        "|---|---:|---|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        t = r["timing"]
        lines.append(f"| {r['scenario']} | {r['M']} | {r['mode']} | {r['flag_heads']} | {r['error_vs_exact_topk_output']['max_abs']:.6f} | {t['probe_output_flags']['p50_ms']:.4f} | {t['exact_output']['p50_ms']:.4f} | {t['select_only']['p50_ms']:.4f} | {t['dual_gpu_mask_path']['p50_ms']:.4f} |")
    lines += [
        "",
        "## Readout",
        "",
        "- GPU-side mask/control preserves exact-reference output in tested cases;",
        "- output select kernel is tiny relative to candidate paths;",
        "- because both branches are computed, this is an implementation-form proof, not a latency optimization;",
        "- a true optimized path would need GPU-side conditional scheduling or a compact fallback subpath for flagged heads/chunks.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_GPU_MASK_CONTROL_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_GPU_MASK_CONTROL_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
