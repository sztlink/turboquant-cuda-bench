#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c — fused candidate selection v2 harness.

Hypothesis: remove the Torch global top-k/softmax boundary from Phase 2b.

Path:

    block_table + packed FP8-K slots
      -> Triton chunk-local candidates [chunks,Hq,K] with int32 positions
      -> Triton global candidate top-k + softmax [K,Hq]
      -> Triton value accumulation from packed 4-bit-V slots

This is still a two/three-kernel offline path, not a production attention path.
The goal is to test the specific boundary:

    torch.topk/torch.softmax over candidates  ->  Triton topk/softmax over candidates

Non-claims:
- not production attention;
- not serving;
- not a serving speedup claim;
- not a model-quality or evidence-utilization claim;
- not a PagedAttention/FlashAttention comparison.
"""
from __future__ import annotations

import json
import math
import os
import platform
import subprocess
import time
import traceback
from pathlib import Path

CUDA_HOME = "/home/felipe/vllm-lab/venv-tq-fresh-20260515/lib/python3.12/site-packages/nvidia/cu13"
os.environ["CUDA_HOME"] = CUDA_HOME
os.environ["PATH"] = f"{CUDA_HOME}/bin:" + os.environ.get("PATH", "")
os.environ["LD_LIBRARY_PATH"] = f"{CUDA_HOME}/lib:/usr/lib/wsl/lib:" + os.environ.get("LD_LIBRARY_PATH", "")

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-fused-candidate-selection-v2-2026-05-19")
OUT.mkdir(parents=True, exist_ok=True)
LOG = OUT / "run.log"


def log(msg: str) -> None:
    line = f"[{time.strftime('%Y-%m-%dT%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


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
    except Exception as e:  # noqa: BLE001
        return f"ERROR {e}"


def sync(torch):
    torch.cuda.synchronize()


def bench(torch, name, fn, repeats=6, warmup=3):
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
        "p10_ms": times[max(0, len(times) // 10)],
        "p90_ms": times[min(len(times) - 1, int(len(times) * 0.9))],
        "min_ms": times[0],
        "max_ms": times[-1],
        "checksum": checksum,
    }


from vllm.triton_utils import tl, triton  # noqa: E402


@triton.jit
def _epkv_chunk_topk_scores_i32_kernel(
    Q_ptr,
    KV_ptr,
    Block_table_ptr,
    Cand_vals_ptr,
    Cand_pos_i32_ptr,
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
    TOP: tl.constexpr,
    ATTN_SCALE: tl.constexpr,
    FP8_E4B15: tl.constexpr,
):
    chunk = tl.program_id(0)
    hq = tl.program_id(1)
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

    base = (chunk * Hq + hq) * TOP
    for kk in tl.static_range(0, TOP):
        mx = tl.max(scores, axis=0)
        is_mx = scores == mx
        pos = tl.min(tl.where(is_mx, rows, 2147483647), axis=0).to(tl.int32)
        pos = tl.where(mx == -float("inf"), -1, pos)
        tl.store(Cand_vals_ptr + base + kk, mx)
        tl.store(Cand_pos_i32_ptr + base + kk, pos)
        scores = tl.where(rows == pos, -float("inf"), scores)


@triton.jit
def _epkv_global_topk_softmax_candidates_kernel(
    Cand_vals_ptr,  # [chunks,Hq,LOCAL_TOP] fp32
    Cand_pos_i32_ptr,  # [chunks,Hq,LOCAL_TOP] int32
    Top_pos_ptr,  # [K,Hq] int64
    Weights_ptr,  # [K,Hq] fp32
    Hq: tl.constexpr,
    NUM_CHUNKS: tl.constexpr,
    LOCAL_TOP: tl.constexpr,
    KTOP: tl.constexpr,
    BLOCK_C: tl.constexpr,
    BLOCK_K: tl.constexpr,
):
    hq = tl.program_id(0)
    offs = tl.arange(0, BLOCK_C)
    koffs = tl.arange(0, BLOCK_K)
    num_cand = NUM_CHUNKS * LOCAL_TOP
    mask = offs < num_cand
    chunk = offs // LOCAL_TOP
    local = offs - chunk * LOCAL_TOP
    cand_offset = (chunk * Hq + hq) * LOCAL_TOP + local
    vals = tl.load(Cand_vals_ptr + cand_offset, mask=mask, other=-float("inf")).to(tl.float32)
    pos = tl.load(Cand_pos_i32_ptr + cand_offset, mask=mask, other=-1).to(tl.int32)
    vals = tl.where(pos >= 0, vals, -float("inf"))

    top_vals = tl.full([BLOCK_K], -float("inf"), dtype=tl.float32)
    top_pos = tl.full([BLOCK_K], -1, dtype=tl.int64)

    for kk in tl.static_range(0, KTOP):
        mx = tl.max(vals, axis=0)
        # Deterministic tie-break: smallest source token position among max scores.
        selected_pos_i32 = tl.min(tl.where(vals == mx, pos, 2147483647), axis=0).to(tl.int32)
        selected_pos_i64 = selected_pos_i32.to(tl.int64)
        top_vals = tl.where(koffs == kk, mx, top_vals)
        top_pos = tl.where(koffs == kk, selected_pos_i64, top_pos)
        vals = tl.where((pos == selected_pos_i32) & (vals == mx), -float("inf"), vals)

    m = tl.max(top_vals, axis=0)
    expv = tl.exp(top_vals - m)
    denom = tl.sum(expv, axis=0)
    weights = expv / denom
    mask_k = koffs < KTOP
    tl.store(Top_pos_ptr + koffs * Hq + hq, top_pos, mask=mask_k)
    tl.store(Weights_ptr + koffs * Hq + hq, weights, mask=mask_k)


@triton.jit
def _epkv_value_accum_kernel(
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


def launch_candidates(torch, q, kv_cache, block_table, M: int, *, Hq: int, D: int, kv_group: int, scale: float, Ktop: int, chunk_rows: int):
    from vllm.v1.attention.ops.triton_turboquant_decode import _use_fp8_e4b15

    num_chunks = math.ceil(M / chunk_rows)
    cand_vals = torch.empty((num_chunks, Hq, Ktop), device="cuda", dtype=torch.float32)
    cand_pos_i32 = torch.empty((num_chunks, Hq, Ktop), device="cuda", dtype=torch.int32)
    block_d = triton.next_power_of_2(D)
    _epkv_chunk_topk_scores_i32_kernel[(num_chunks, Hq)](
        q[0], kv_cache, block_table[0], cand_vals, cand_pos_i32,
        stride_cache_block=kv_cache.stride(0),
        stride_cache_pos=kv_cache.stride(1),
        stride_cache_head=kv_cache.stride(2),
        M=M, Hq=Hq, D=D, KV_GROUP=kv_group,
        BLOCK_SIZE=kv_cache.shape[1], BLOCK_ROWS=chunk_rows,
        BLOCK_D=block_d, TOP=Ktop, ATTN_SCALE=scale,
        FP8_E4B15=_use_fp8_e4b15(0),
        num_warps=8,
        num_stages=1,
    )
    return cand_vals, cand_pos_i32


def next_power_of_2(x: int) -> int:
    return 1 << (x - 1).bit_length()


def launch_triton_global_select(torch, cand_vals, cand_pos_i32, *, Hq: int, Ktop: int):
    num_chunks = cand_vals.shape[0]
    local_top = cand_vals.shape[2]
    cand_count = num_chunks * local_top
    block_c = next_power_of_2(cand_count)
    if block_c > 4096:
        raise ValueError(f"candidate_count too high for v2 single-program global select: {cand_count} -> BLOCK_C={block_c}")
    block_k = next_power_of_2(Ktop)
    top_pos = torch.empty((Ktop, Hq), device="cuda", dtype=torch.long)
    weights = torch.empty((Ktop, Hq), device="cuda", dtype=torch.float32)
    _epkv_global_topk_softmax_candidates_kernel[(Hq,)](
        cand_vals, cand_pos_i32, top_pos, weights,
        Hq=Hq, NUM_CHUNKS=num_chunks, LOCAL_TOP=local_top, KTOP=Ktop,
        BLOCK_C=block_c, BLOCK_K=block_k,
        num_warps=8,
        num_stages=1,
    )
    return top_pos, weights


def launch_value(torch, kv_cache, block_table, top_pos, weights, *, Hq: int, D: int, Ktop: int, kv_group: int, key_packed_size: int, val_data_bytes: int):
    out = torch.empty((Hq, D), device="cuda", dtype=torch.float32)
    block_d = triton.next_power_of_2(D)
    _epkv_value_accum_kernel[(Hq,)](
        kv_cache, block_table[0], top_pos, weights, out,
        stride_cache_block=kv_cache.stride(0),
        stride_cache_pos=kv_cache.stride(1),
        stride_cache_head=kv_cache.stride(2),
        Hq=Hq, D=D, KTOP=Ktop, KV_GROUP=kv_group,
        BLOCK_SIZE=kv_cache.shape[1], BLOCK_D=block_d,
        KPS=key_packed_size, VAL_DATA_BYTES=val_data_bytes,
        num_warps=4,
        num_stages=1,
    )
    return out.unsqueeze(0)


def launch_full_dequant(torch, tq_decode, kv_cache, block_table, centroids, seq_len, *, Hk, D, key_packed_size, value_quant_bits):
    B = block_table.shape[0]
    K_out = torch.empty((B, Hk, seq_len, D), device="cuda", dtype=torch.float16)
    V_out = torch.empty((B, Hk, seq_len, D), device="cuda", dtype=torch.float16)
    cfg = tq_decode._get_layout(D, 0, value_quant_bits, key_packed_size)
    fp8_e4b15 = tq_decode._use_fp8_e4b15(0)
    tq_decode._tq_full_dequant_kv[(seq_len, B * Hk)](
        kv_cache, block_table, centroids, K_out, V_out,
        K_out.stride(0), K_out.stride(1), K_out.stride(2),
        V_out.stride(0), V_out.stride(1), V_out.stride(2),
        kv_cache.stride(0), kv_cache.stride(1), kv_cache.stride(2),
        block_table.stride(0),
        HEAD_DIM=D, BLOCK_SIZE=kv_cache.shape[1], NUM_KV_HEADS=Hk,
        MSE_BYTES=cfg["mse_bytes"], KPS=key_packed_size,
        VQB=value_quant_bits, VAL_DATA_BYTES=cfg["val_data_bytes"], MSE_BITS=0,
        KEY_FP8=1, BLOCK_D=cfg["BLOCK_D"], NORM_CORRECTION=0,
        FP8_E4B15=fp8_e4b15, VALUE_CENTROID=0,
        num_warps=4,
        num_stages=1,
    )
    return K_out, V_out


def ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, Ktop):
    Hq = q.shape[1]
    qf = q[0].float()
    out = []
    for h in range(Hq):
        kh = h // kv_group
        scores = (K_out[0, kh].float() * qf[h]).sum(dim=-1) * scale
        vals, pos = torch.topk(scores, Ktop, dim=0)
        weights = torch.softmax(vals, dim=0)
        v = V_out[0, kh].float().index_select(0, pos)
        out.append((weights[:, None] * v).sum(dim=0))
    return torch.stack(out, dim=0).unsqueeze(0)


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_FUSED_CANDIDATE_SELECTION_V2_START")
    import torch

    from vllm.v1.attention.ops import triton_turboquant_decode as tq_decode
    from vllm.v1.attention.ops.triton_turboquant_decode import triton_turboquant_decode_attention
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
    budgets = [8192, 32768, 65536]
    configs = [(32, 512), (32, 1024)]  # keep candidate_count <= 4096 for single-program global select
    patterns = ["contiguous_pages", "sparse_pages"]

    meta = {
        "host": platform.node(),
        "python": platform.python_version(),
        "torch": torch.__version__,
        "cuda_home": os.environ.get("CUDA_HOME"),
        "cuda_device": torch.cuda.get_device_name(0),
        "nvidia_smi_start": smi(),
        "layout": {
            "kv_cache_dtype": "turboquant_k8v4",
            "B": B, "Hq": Hq, "Hk": Hk, "D": D, "kv_group": kv_group,
            "block_size": block_size, "key_fp8": True,
            "key_packed_size": key_packed_size,
            "value_quant_bits": value_quant_bits,
            "val_data_bytes": val_data_bytes,
            "slot_size": slot_size,
            "max_N": max_N,
            "max_blocks": max_blocks,
        },
        "hypothesis": "replace Torch global top-k/softmax over candidates with Triton global candidate top-k/softmax",
        "boundary": "offline only; no serving; no model inference",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
    key = torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16)
    value = torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16)
    q = torch.randn((B, Hq, D), device="cuda", dtype=torch.bfloat16)
    kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size), device="cuda", dtype=torch.uint8)
    kv_cache.zero_()
    slot_mapping = torch.arange(max_N, device="cuda", dtype=torch.int32)

    log("STORE_START")
    triton_turboquant_store(
        key, value, kv_cache, slot_mapping, PiT, midpoints,
        mse_bits=0, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits,
        key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False,
    )
    sync(torch)
    log("STORE_OK " + smi())

    results = []
    correctness = []

    def make_block_table(M: int, pattern: str):
        n_pages = math.ceil(M / block_size)
        if pattern == "contiguous_pages":
            pages = torch.arange(n_pages, device="cuda", dtype=torch.int32)
        elif pattern == "sparse_pages":
            pages = torch.linspace(0, max_blocks - 1, n_pages, device="cuda").round().to(torch.int32)
            pages = torch.unique_consecutive(pages)
            if pages.numel() < n_pages:
                pages = torch.linspace(0, max_blocks - 1, n_pages + 16, device="cuda").round().to(torch.int32)
                pages = torch.unique_consecutive(pages)[:n_pages]
        else:
            raise ValueError(pattern)
        assert pages.numel() == n_pages
        return pages.unsqueeze(0).contiguous()

    for M in budgets:
        for pattern in patterns:
            block_table = make_block_table(M, pattern)
            seq_lens = torch.tensor([M], device="cuda", dtype=torch.int32)

            def original_decode():
                return triton_turboquant_decode_attention(
                    query=q, kv_cache=kv_cache, block_table=block_table, seq_lens=seq_lens,
                    Pi=PiT, centroids=centroids, scale=scale, mse_bits=0,
                    key_packed_size=key_packed_size, value_quant_bits=value_quant_bits,
                    key_fp8=True, norm_correction=False, PiT=PiT, max_num_kv_splits=32,
                    rotate_values=False, original_head_dim=D, value_centroid=False,
                    sparse_v=False, valid_mask=None,
                )

            r = bench(torch, f"original_tq_decode M={M} pattern={pattern}", original_decode, repeats=5, warmup=3)
            r.update({"mode": "original_turboquant_decode_full_softmax", "M": M, "K": None, "chunk_rows": None, "pattern": pattern})
            results.append(r)
            log("RESULT " + json.dumps(r))

            K_out = V_out = None
            for Ktop, chunk_rows in configs:
                num_chunks = math.ceil(M / chunk_rows)
                cand_count = num_chunks * Ktop
                cand_bytes_i32 = cand_count * Hq * (4 + 4)  # vals fp32 + positions int32
                cand_bytes_i64 = cand_count * Hq * (4 + 8)
                top_bytes = Ktop * Hq * (8 + 4)  # top_pos int64 + weights fp32
                full_score_bytes = M * Hq * 4

                def candidate_path():
                    cand_vals, cand_pos_i32 = launch_candidates(
                        torch, q, kv_cache, block_table, M,
                        Hq=Hq, D=D, kv_group=kv_group, scale=scale,
                        Ktop=Ktop, chunk_rows=chunk_rows,
                    )
                    top_pos, weights = launch_triton_global_select(torch, cand_vals, cand_pos_i32, Hq=Hq, Ktop=Ktop)
                    return launch_value(
                        torch, kv_cache, block_table, top_pos, weights,
                        Hq=Hq, D=D, Ktop=Ktop, kv_group=kv_group,
                        key_packed_size=key_packed_size, val_data_bytes=val_data_bytes,
                    )

                r = bench(torch, f"epkv_fused_candidate_v2 M={M} K={Ktop} chunk={chunk_rows} pattern={pattern}", candidate_path, repeats=5 if M >= 65536 else 6, warmup=3)
                r.update({
                    "mode": "epkv_fused_candidate_selection_v2_triton_global_topk_softmax",
                    "M": M,
                    "K": Ktop,
                    "chunk_rows": chunk_rows,
                    "num_chunks": num_chunks,
                    "pattern": pattern,
                    "candidate_count_per_head": cand_count,
                    "temp_bytes_candidates_i32": cand_bytes_i32,
                    "temp_bytes_candidates_phase2b_i64_equiv": cand_bytes_i64,
                    "temp_bytes_top_pos_weights": top_bytes,
                    "temp_bytes_full_scores_equivalent": full_score_bytes,
                    "candidate_i32_vs_full_score_bytes_ratio": cand_bytes_i32 / full_score_bytes,
                    "candidate_i32_vs_phase2b_i64_bytes_ratio": cand_bytes_i32 / cand_bytes_i64,
                    "torch_topk_softmax_boundary": False,
                })
                results.append(r)
                log("RESULT " + json.dumps(r))

                if K_out is None:
                    K_out, V_out = launch_full_dequant(
                        torch, tq_decode, kv_cache, block_table, centroids, M,
                        Hk=Hk, D=D, key_packed_size=key_packed_size,
                        value_quant_bits=value_quant_bits,
                    )
                    sync(torch)
                out = candidate_path().detach().float()
                ref = ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, Ktop).detach().float()
                corr = {
                    "M": M,
                    "K": Ktop,
                    "chunk_rows": chunk_rows,
                    "pattern": pattern,
                    "check": "fused_candidate_v2_vs_dequant_exact_topk_reference",
                    "max_abs_error": float((out - ref).abs().max().detach().cpu()),
                    "mean_abs_error": float((out - ref).abs().mean().detach().cpu()),
                }
                correctness.append(corr)
                log("CORRECTNESS " + json.dumps(corr))

            del K_out, V_out
            torch.cuda.empty_cache()

    report = {
        "title": "Evidence-Paged KV Phase 2c — fused candidate selection v2 harness",
        "boundary": "Chunk-local candidates from packed slots; Triton global top-k/softmax; Triton value accumulation; no Torch top-k/softmax in candidate path.",
        "meta": meta,
        "correctness": correctness,
        "results": results,
        "nvidia_smi_end": smi(),
    }
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c — fused candidate selection v2 — 2026-05-19",
        "",
        "> Offline candidate-selection v2 over real vLLM TurboQuant packed slots. Triton global top-k/softmax replaces the Phase 2b Torch boundary.",
        "",
        "## Boundary",
        "",
        "```txt",
        "local candidates: block_table + packed FP8-K slots -> [chunks,Hq,K] with int32 positions",
        "global selection: Triton top-k + softmax over candidates",
        "value: packed 4-bit-V slots + selected positions/weights -> [1,Hq,D]",
        "exactness: local K per chunk preserves global top-K",
        "layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128",
        "serving: no",
        "```",
        "",
        "## Correctness",
        "",
        "| M rows | K | chunk rows | pattern | check | max abs | mean abs |",
        "|---:|---:|---:|---|---|---:|---:|",
    ]
    for c in correctness:
        lines.append(f"| {c['M']} | {c['K']} | {c['chunk_rows']} | {c['pattern']} | {c['check']} | {c['max_abs_error']:.6f} | {c['mean_abs_error']:.6f} |")
    lines += [
        "",
        "## Timings",
        "",
        "| mode | M rows | K | chunk rows | pattern | p50 ms | p90 ms | candidates/head | candidate temp MiB | full-score equiv MiB | temp ratio |",
        "|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        cand_mib = r.get("temp_bytes_candidates_i32", 0) / (1024 * 1024)
        full_mib = r.get("temp_bytes_full_scores_equivalent", 0) / (1024 * 1024)
        temp_ratio = r.get("candidate_i32_vs_full_score_bytes_ratio")
        lines.append(
            f"| {r['mode']} | {r['M']} | {'' if r.get('K') is None else r.get('K')} | {'' if r.get('chunk_rows') is None else r.get('chunk_rows')} | {r['pattern']} | {r['p50_ms']:.4f} | {r['p90_ms']:.4f} | {'' if r.get('candidate_count_per_head') is None else r.get('candidate_count_per_head')} | {cand_mib:.2f} | {full_mib:.2f} | {'' if temp_ratio is None else format(temp_ratio, '.3f')} |"
        )
    lines += [
        "",
        "## Readout",
        "",
        "- This tests the specific Phase 2b weakness: Torch global top-k/softmax over candidates.",
        "- Candidate positions are int32 instead of int64, reducing candidate temp bytes before final top positions are emitted.",
        "- Global selection and softmax are Triton kernels; the candidate path has no `torch.topk` or `torch.softmax` boundary.",
        "- This remains offline and is not installed into serving.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not a serving speedup claim.",
        "- Not a model-quality or evidence-utilization claim.",
        "- Not a comparison against PagedAttention/FlashAttention.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_FUSED_CANDIDATE_SELECTION_V2_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_FUSED_CANDIDATE_SELECTION_V2_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
