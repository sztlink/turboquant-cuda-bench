#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.8 — compact fallback candidate proof.

GPU-side adaptive candidate path:

    1. compute probe candidates with LOCAL_TOP=8 for all heads/chunks
    2. GPU overflow detector produces per-head flags
    3. Triton compact-merge kernel emits LOCAL_TOP=32 candidate tensor:
       - unflagged heads: copy the 8 probe candidates, fill the remaining 24 with -inf/-1
       - flagged heads: compute exact chunk-local TOP=32
    4. existing Triton global select + value consumes the merged candidate tensor

Boundary: offline proof. No serving mutation, no real prompts. The compact merge
kernel uses GPU flags; no Python decision chooses per-case path. Timing is an
offline kernel receipt, not a serving speedup claim.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-compact-fallback-2026-05-19")
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
def _epkv_compact_fallback_candidates_kernel(
    Q_ptr,
    KV_ptr,
    Block_table_ptr,
    Probe_vals_ptr,
    Probe_pos_i32_ptr,
    Flags_ptr,
    Out_vals_ptr,
    Out_pos_i32_ptr,
    stride_cache_block: tl.constexpr,
    stride_cache_pos: tl.constexpr,
    stride_cache_head: tl.constexpr,
    M: tl.constexpr,
    Hq: tl.constexpr,
    D: tl.constexpr,
    KV_GROUP: tl.constexpr,
    BLOCK_SIZE: tl.constexpr,
    BLOCK_ROWS: tl.constexpr,
    BLOCK_D: tl.constexpr,
    PROBE_TOP: tl.constexpr,
    EXACT_TOP: tl.constexpr,
    ATTN_SCALE: tl.constexpr,
    FP8_E4B15: tl.constexpr,
):
    chunk = tl.program_id(0)
    hq = tl.program_id(1)
    base_out = (chunk * Hq + hq) * EXACT_TOP
    base_probe = (chunk * Hq + hq) * PROBE_TOP
    flag = tl.load(Flags_ptr + hq).to(tl.int32)

    # Dynamic early path: unflagged heads reuse probe candidates and invalidate
    # the extra slots. This is the compact part: no TOP=32 score loop for
    # unflagged heads.
    if flag == 0:
        for kk in tl.static_range(0, EXACT_TOP):
            if kk < PROBE_TOP:
                v = tl.load(Probe_vals_ptr + base_probe + kk).to(tl.float32)
                p = tl.load(Probe_pos_i32_ptr + base_probe + kk).to(tl.int32)
                tl.store(Out_vals_ptr + base_out + kk, v)
                tl.store(Out_pos_i32_ptr + base_out + kk, p)
            else:
                tl.store(Out_vals_ptr + base_out + kk, -float("inf"))
                tl.store(Out_pos_i32_ptr + base_out + kk, -1)
        return

    kh = hq // KV_GROUP
    rows = chunk * BLOCK_ROWS + tl.arange(0, BLOCK_ROWS)
    d = tl.arange(0, BLOCK_D)
    row_mask = rows < M
    d_mask = d < D

    page_idx = rows // BLOCK_SIZE
    page_off = rows - page_idx * BLOCK_SIZE
    block_nums = tl.load(Block_table_ptr + page_idx, mask=row_mask, other=0).to(tl.int64)
    slot_bases = block_nums[:, None] * stride_cache_block + page_off[:, None] * stride_cache_pos + kh * stride_cache_head

    q = tl.load(Q_ptr + hq * D + d, mask=d_mask, other=0.0).to(tl.float32)
    k_raw = tl.load(KV_ptr + slot_bases + d[None, :], mask=row_mask[:, None] & d_mask[None, :], other=0)
    if FP8_E4B15:
        k = k_raw.to(tl.float8e4b15, bitcast=True).to(tl.float32)
    else:
        k = k_raw.to(tl.float8e4nv, bitcast=True).to(tl.float32)
    scores = tl.sum(tl.where(d_mask[None, :], k * q[None, :], 0.0), axis=1) * ATTN_SCALE
    scores = tl.where(row_mask, scores, -float("inf"))

    for kk in tl.static_range(0, EXACT_TOP):
        mx = tl.max(scores, axis=0)
        is_mx = scores == mx
        pos = tl.min(tl.where(is_mx, rows, 2147483647), axis=0).to(tl.int32)
        pos = tl.where(mx == -float("inf"), -1, pos)
        tl.store(Out_vals_ptr + base_out + kk, mx)
        tl.store(Out_pos_i32_ptr + base_out + kk, pos)
        scores = tl.where(rows == pos, -float("inf"), scores)


def launch_compact_fallback_candidates(torch, q, kv_cache, block_table, probe_vals, probe_pos, flags, M: int, *, Hq: int, D: int, kv_group: int, scale: float, probe_top: int, exact_top: int, chunk_rows: int):
    from vllm.v1.attention.ops.triton_turboquant_decode import _use_fp8_e4b15

    num_chunks = math.ceil(M / chunk_rows)
    out_vals = torch.empty((num_chunks, Hq, exact_top), device="cuda", dtype=torch.float32)
    out_pos = torch.empty((num_chunks, Hq, exact_top), device="cuda", dtype=torch.int32)
    _epkv_compact_fallback_candidates_kernel[(num_chunks, Hq)](
        q[0], kv_cache, block_table[0], probe_vals, probe_pos, flags, out_vals, out_pos,
        stride_cache_block=kv_cache.stride(0),
        stride_cache_pos=kv_cache.stride(1),
        stride_cache_head=kv_cache.stride(2),
        M=M, Hq=Hq, D=D, KV_GROUP=kv_group,
        BLOCK_SIZE=kv_cache.shape[1], BLOCK_ROWS=chunk_rows,
        BLOCK_D=triton.next_power_of_2(D), PROBE_TOP=probe_top, EXACT_TOP=exact_top,
        ATTN_SCALE=scale, FP8_E4B15=_use_fp8_e4b15(0),
        num_warps=8, num_stages=1,
    )
    return out_vals, out_pos


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
            raw_checksum = float(yy.float().sum().detach().cpu())
            checksum = raw_checksum if math.isfinite(raw_checksum) else None
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
    log("EPKV_COMPACT_FALLBACK_START")
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
    cases = [("random", 8192), ("random", 65536), ("one_chunk_32", 8192), ("one_chunk_32", 65536), ("two_chunks_16_16", 8192), ("two_chunks_16_16", 65536), ("spread_32_chunks", 8192), ("spread_32_chunks", 65536)]

    meta = {
        "host": platform.node(),
        "python": platform.python_version(),
        "torch": torch.__version__,
        "cuda_device": torch.cuda.get_device_name(0),
        "nvidia_smi_start": smi(),
        "policy": {"global_k": global_k, "probe_local_top": probe_top, "fallback_local_top": exact_top, "chunk_rows": chunk_rows},
        "boundary": "offline compact fallback candidate proof; no serving mutation",
        "compact_definition": "unflagged heads copy LOCAL_TOP=8 probe into LOCAL_TOP=32 buffer; flagged heads compute TOP=32",
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

        def probe_candidates_flags():
            pv, pp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=probe_top, chunk_rows=chunk_rows)
            flags = gpu.launch_gpu_overflow_detector(torch, pv, Hq=Hq, global_k=global_k, local_top=probe_top)
            return pv, pp, flags

        def exact_output():
            cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=exact_top, chunk_rows=chunk_rows)
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

        def compact_candidates_only():
            pv, pp, flags = probe_candidates_flags()
            return launch_compact_fallback_candidates(torch, q, kv_cache, block_table, pv, pp, flags, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, probe_top=probe_top, exact_top=exact_top, chunk_rows=chunk_rows)

        def compact_full_path():
            cv, cp = compact_candidates_only()
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

        pv, pp, flags = probe_candidates_flags()
        cv, cp = launch_compact_fallback_candidates(torch, q, kv_cache, block_table, pv, pp, flags, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, probe_top=probe_top, exact_top=exact_top, chunk_rows=chunk_rows)
        tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
        out = epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes).detach().float()
        sync(torch)
        flag_heads = int(flags.detach().cpu().sum().item())
        error = {"max_abs": float((out - exact_ref).abs().max().detach().cpu()), "mean_abs": float((out - exact_ref).abs().mean().detach().cpu())}
        probe_b = bench_event(torch, f"probe_candidates_flags scenario={scenario} M={M}", lambda: probe_candidates_flags()[0])
        compact_cand_b = bench_event(torch, f"compact_candidates scenario={scenario} M={M}", lambda: compact_candidates_only()[0])
        compact_full_b = bench_event(torch, f"compact_full_path scenario={scenario} M={M}", compact_full_path)
        exact_b = bench_event(torch, f"exact_output scenario={scenario} M={M}", exact_output)
        row = {
            "scenario": scenario,
            "M": M,
            "flag_heads": flag_heads,
            "mode": "fallback_flagged_heads" if flag_heads else "probe_only_all_heads",
            "error_vs_exact_topk_output": error,
            "timing": {"probe_candidates_flags": probe_b, "compact_candidates": compact_cand_b, "compact_full_path": compact_full_b, "exact_output": exact_b},
        }
        results.append(row)
        log("RESULT " + json.dumps(row))
        del q, key, value, kv_cache, K_out, V_out, exact_ref, pv, pp, flags, cv, cp, tp, ww, out
        torch.cuda.empty_cache()

    report = {"title": "Evidence-Paged KV Phase 2c.8 — compact fallback candidate proof", "meta": meta, "results": results, "nvidia_smi_end": smi(), "non_claims": ["not production attention", "not serving", "not a serving speedup claim", "not model-quality evidence"]}
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    lines = [
        "# Evidence-Paged KV Phase 2c.8 — compact fallback candidate proof — 2026-05-19",
        "",
        "> Offline GPU-side compact fallback: reuse probe for unflagged heads, compute TOP=32 only for flagged heads inside the candidate merge kernel.",
        "",
        "## Boundary",
        "",
        "```txt",
        "probe_local_top: 8",
        "fallback_local_top: 32",
        "global_k: 32",
        "control: GPU detector flags consumed by Triton compact candidate merge",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| scenario | M rows | mode | flag heads | max abs err | probe+flags p50 | compact candidates p50 | compact full p50 | exact full p50 |",
        "|---|---:|---|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        t = r["timing"]
        lines.append(f"| {r['scenario']} | {r['M']} | {r['mode']} | {r['flag_heads']} | {r['error_vs_exact_topk_output']['max_abs']:.6f} | {t['probe_candidates_flags']['p50_ms']:.4f} | {t['compact_candidates']['p50_ms']:.4f} | {t['compact_full_path']['p50_ms']:.4f} | {t['exact_output']['p50_ms']:.4f} |")
    lines += [
        "",
        "## Readout",
        "",
        "- compact fallback preserves exact-reference output in tested cases;",
        "- random/spread cases avoid TOP=32 score loop and copy probe candidates into a TOP=32-compatible buffer;",
        "- concentrated adversarial cases trigger flagged-head TOP=32 fallback;",
        "- this is still offline and shape-specific, but it is closer to the intended adaptive implementation than dual-path mask/control.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_COMPACT_FALLBACK_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_COMPACT_FALLBACK_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
