#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2a — selected-page Triton harness.

Offline harness against the real vLLM TurboQuant packed cache layout:

    kv_cache: [num_blocks, block_size, Hk, slot_size] uint8
    turboquant_k8v4: FP8-K + 4-bit-V uniform values

This is the first selected-page path that reads packed vLLM slots directly:

    block_table + packed slots -> Triton score kernel -> torch.topk/softmax
    -> Triton value accumulation kernel

Boundary:
- v4-style because top-k/softmax remain Torch in the middle.
- selected-page because K/V are read from block_table-selected pages.
- not production attention, not serving, not a FlashAttention/PagedAttention comparison.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-selected-page-triton-2026-05-19")
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


def bench(torch, name, fn, repeats=10, warmup=4):
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


# Triton imports happen at runtime on the 4090 vLLM environment.
from vllm.triton_utils import tl, triton  # noqa: E402


@triton.jit
def _epkv_fp8_scores_kernel(
    Q_ptr,  # [Hq, D] bf16/fp16
    KV_ptr,  # [num_blocks, block_size, Hk, slot_size] uint8 flattened strides
    Block_table_ptr,  # [num_pages] int32, B=1 harness
    Scores_ptr,  # [M, Hq] fp32
    stride_cache_block: tl.constexpr,
    stride_cache_pos: tl.constexpr,
    stride_cache_head: tl.constexpr,
    stride_bt_b: tl.constexpr,
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
    slot_base = (
        block_num * stride_cache_block
        + page_off * stride_cache_pos
        + kh * stride_cache_head
    )

    q = tl.load(Q_ptr + hq * D + d, mask=mask, other=0.0).to(tl.float32)
    k_raw = tl.load(KV_ptr + slot_base + d, mask=mask, other=0)
    if FP8_E4B15:
        k = k_raw.to(tl.float8e4b15, bitcast=True).to(tl.float32)
    else:
        k = k_raw.to(tl.float8e4nv, bitcast=True).to(tl.float32)
    score = tl.sum(tl.where(mask, q * k, 0.0), axis=0) * ATTN_SCALE
    tl.store(Scores_ptr + row * Hq + hq, score)


@triton.jit
def _epkv_value_accum_kernel(
    KV_ptr,  # packed slots
    Block_table_ptr,  # [num_pages]
    Top_pos_ptr,  # [K, Hq] int64
    Weights_ptr,  # [K, Hq] fp32
    Out_ptr,  # [Hq, D] fp32
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
        slot_base = (
            block_num * stride_cache_block
            + page_off * stride_cache_pos
            + kh * stride_cache_head
        )
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
        v = v_idx * v_scale + v_zero
        acc += w * v

    tl.store(Out_ptr + hq * D + d, acc, mask=mask)


def launch_epkv_scores(torch, q, kv_cache, block_table, M: int, *, Hq: int, D: int, kv_group: int, scale: float):
    from vllm.v1.attention.ops.triton_turboquant_decode import _use_fp8_e4b15

    scores = torch.empty((M, Hq), device="cuda", dtype=torch.float32)
    BLOCK_D = triton.next_power_of_2(D)
    _epkv_fp8_scores_kernel[(M, Hq)](
        q[0],
        kv_cache,
        block_table[0],
        scores,
        stride_cache_block=kv_cache.stride(0),
        stride_cache_pos=kv_cache.stride(1),
        stride_cache_head=kv_cache.stride(2),
        stride_bt_b=block_table.stride(0),
        M=M,
        Hq=Hq,
        D=D,
        KV_GROUP=kv_group,
        BLOCK_SIZE=kv_cache.shape[1],
        BLOCK_D=BLOCK_D,
        ATTN_SCALE=scale,
        FP8_E4B15=_use_fp8_e4b15(0),
        num_warps=4,
        num_stages=1,
    )
    return scores


def launch_epkv_value(torch, kv_cache, block_table, top_pos, weights, *, Hq: int, D: int, Ktop: int, kv_group: int, key_packed_size: int, val_data_bytes: int):
    out = torch.empty((Hq, D), device="cuda", dtype=torch.float32)
    BLOCK_D = triton.next_power_of_2(D)
    _epkv_value_accum_kernel[(Hq,)](
        kv_cache,
        block_table[0],
        top_pos,
        weights,
        out,
        stride_cache_block=kv_cache.stride(0),
        stride_cache_pos=kv_cache.stride(1),
        stride_cache_head=kv_cache.stride(2),
        Hq=Hq,
        D=D,
        KTOP=Ktop,
        KV_GROUP=kv_group,
        BLOCK_SIZE=kv_cache.shape[1],
        BLOCK_D=BLOCK_D,
        KPS=key_packed_size,
        VAL_DATA_BYTES=val_data_bytes,
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
        kv_cache,
        block_table,
        centroids,
        K_out,
        V_out,
        K_out.stride(0), K_out.stride(1), K_out.stride(2),
        V_out.stride(0), V_out.stride(1), V_out.stride(2),
        kv_cache.stride(0), kv_cache.stride(1), kv_cache.stride(2),
        block_table.stride(0),
        HEAD_DIM=D,
        BLOCK_SIZE=kv_cache.shape[1],
        NUM_KV_HEADS=Hk,
        MSE_BYTES=cfg["mse_bytes"],
        KPS=key_packed_size,
        VQB=value_quant_bits,
        VAL_DATA_BYTES=cfg["val_data_bytes"],
        MSE_BITS=0,
        KEY_FP8=1,
        BLOCK_D=cfg["BLOCK_D"],
        NORM_CORRECTION=0,
        FP8_E4B15=fp8_e4b15,
        VALUE_CENTROID=0,
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
    log("EPKV_SELECTED_PAGE_TRITON_START")
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
    topks = [32, 128]
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
            "max_N": max_N,
            "max_blocks": max_blocks,
        },
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
                pages = torch.linspace(0, max_blocks - 1, n_pages + 8, device="cuda").round().to(torch.int32)
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

            r = bench(torch, f"original_tq_decode M={M} pattern={pattern}", original_decode, repeats=8 if M <= 32768 else 5, warmup=3)
            r.update({"mode": "original_turboquant_decode_full_softmax", "M": M, "K": None, "pattern": pattern})
            results.append(r)
            log("RESULT " + json.dumps(r))

            def scores_only():
                return launch_epkv_scores(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale)

            r = bench(torch, f"epkv_triton_scores M={M} pattern={pattern}", scores_only, repeats=8 if M <= 32768 else 5, warmup=4)
            r.update({"mode": "epkv_triton_scores_from_packed_slots", "M": M, "K": None, "pattern": pattern, "temp_bytes_scores": M * Hq * 4})
            results.append(r)
            log("RESULT " + json.dumps(r))

            # Correctness reference for selected top-k.
            K_out, V_out = launch_full_dequant(
                torch, tq_decode, kv_cache, block_table, centroids, M,
                Hk=Hk, D=D, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits,
            )
            sync(torch)

            for Ktop in topks:
                def epkv_path():
                    scores = launch_epkv_scores(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale)
                    vals, pos = torch.topk(scores, Ktop, dim=0)
                    weights = torch.softmax(vals, dim=0).contiguous()
                    return launch_epkv_value(
                        torch, kv_cache, block_table, pos.contiguous(), weights,
                        Hq=Hq, D=D, Ktop=Ktop, kv_group=kv_group,
                        key_packed_size=key_packed_size, val_data_bytes=val_data_bytes,
                    )

                r = bench(torch, f"epkv_selected_page_triton M={M} K={Ktop} pattern={pattern}", epkv_path, repeats=8 if M <= 32768 else 5, warmup=4)
                r.update({
                    "mode": "epkv_v4_style_triton_scores_torch_topk_triton_value",
                    "M": M,
                    "K": Ktop,
                    "pattern": pattern,
                    "temp_bytes_scores": M * Hq * 4,
                    "temp_bytes_KV_dequant": 0,
                })
                results.append(r)
                log("RESULT " + json.dumps(r))

                out = epkv_path().detach().float()
                ref = ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, Ktop).detach().float()
                corr = {
                    "M": M,
                    "K": Ktop,
                    "pattern": pattern,
                    "check": "epkv_triton_topk_vs_dequant_topk_reference",
                    "max_abs_error": float((out - ref).abs().max().detach().cpu()),
                    "mean_abs_error": float((out - ref).abs().mean().detach().cpu()),
                }
                correctness.append(corr)
                log("CORRECTNESS " + json.dumps(corr))

            del K_out, V_out
            torch.cuda.empty_cache()

    report = {
        "title": "Evidence-Paged KV Phase 2a — selected-page Triton harness",
        "boundary": "Triton score/value kernels read real vLLM packed TQ slots. Torch top-k/softmax remains in the middle.",
        "meta": meta,
        "correctness": correctness,
        "results": results,
        "nvidia_smi_end": smi(),
    }
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2a — selected-page Triton harness — 2026-05-19",
        "",
        "> Triton score/value kernels over real vLLM TurboQuant packed slots. Torch top-k/softmax remains in the middle.",
        "",
        "## Boundary",
        "",
        "```txt",
        "score: block_table + packed FP8-K slots -> scores [M,Hq]",
        "selection: torch.topk + torch.softmax",
        "value: block_table + packed 4-bit-V slots + top positions/weights -> [1,Hq,D]",
        "layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128",
        "```",
        "",
        "## Correctness",
        "",
        "| M rows | K | pattern | check | max abs | mean abs |",
        "|---:|---:|---|---|---:|---:|",
    ]
    for c in correctness:
        lines.append(f"| {c['M']} | {c['K']} | {c['pattern']} | {c['check']} | {c['max_abs_error']:.6f} | {c['mean_abs_error']:.6f} |")
    lines += [
        "",
        "## Timings",
        "",
        "| mode | M rows | K | pattern | p50 ms | p90 ms | temp scores MiB | temp KV MiB |",
        "|---|---:|---:|---|---:|---:|---:|---:|",
    ]
    for r in results:
        temp_scores = r.get("temp_bytes_scores", 0) / (1024 * 1024)
        temp_kv = r.get("temp_bytes_KV_dequant", 0) / (1024 * 1024)
        lines.append(f"| {r['mode']} | {r['M']} | {'' if r.get('K') is None else r.get('K')} | {r['pattern']} | {r['p50_ms']:.4f} | {r['p90_ms']:.4f} | {temp_scores:.2f} | {temp_kv:.2f} |")
    lines += [
        "",
        "## Readout",
        "",
        "- This is the first selected-page path that reads the real packed vLLM TurboQuant slots directly for both scores and values.",
        "- It avoids full K/V materialization; only the score matrix `[M,Hq]` is materialized.",
        "- It remains v4-style because top-k/softmax are Torch operations in the middle.",
        "- This is still offline. It is not installed into the serving path.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not a serving speedup claim.",
        "- Not a model-quality or evidence-utilization claim.",
        "- Not a comparison against PagedAttention/FlashAttention.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_SELECTED_PAGE_TRITON_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_SELECTED_PAGE_TRITON_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
