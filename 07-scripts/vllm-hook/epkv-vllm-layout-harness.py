#!/usr/bin/env python3
"""Evidence-Paged KV Phase 1 — vLLM layout harness.

Offline harness for the real TurboQuant vLLM cache layout observed by the
observe-only hook:

    kv_cache: [num_blocks, block_size, Hk, slot_size] uint8
    turboquant_k8v4: FP8-K + 4-bit-V uniform values

This does not patch serving and does not replace production attention.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-vllm-layout-harness-2026-05-19")
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


def bench(torch, name, fn, repeats=8, warmup=3):
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
        if checksum is None:
            if isinstance(y, tuple):
                yy = y[0]
            else:
                yy = y
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


def launch_full_dequant(torch, tq_decode, kv_cache, block_table, centroids, seq_len, *, Hk, D, key_packed_size, value_quant_bits, key_fp8):
    B = block_table.shape[0]
    K_out = torch.empty((B, Hk, seq_len, D), device="cuda", dtype=torch.float16)
    V_out = torch.empty((B, Hk, seq_len, D), device="cuda", dtype=torch.float16)
    cfg = tq_decode._get_layout(D, 0, value_quant_bits, key_packed_size)
    fp8_e4b15 = tq_decode._use_fp8_e4b15(0)
    grid = (seq_len, B * Hk)
    tq_decode._tq_full_dequant_kv[grid](
        kv_cache,
        block_table,
        centroids,
        K_out,
        V_out,
        K_out.stride(0),
        K_out.stride(1),
        K_out.stride(2),
        V_out.stride(0),
        V_out.stride(1),
        V_out.stride(2),
        kv_cache.stride(0),
        kv_cache.stride(1),
        kv_cache.stride(2),
        block_table.stride(0),
        HEAD_DIM=D,
        BLOCK_SIZE=kv_cache.shape[1],
        NUM_KV_HEADS=Hk,
        MSE_BYTES=cfg["mse_bytes"],
        KPS=key_packed_size,
        VQB=value_quant_bits,
        VAL_DATA_BYTES=cfg["val_data_bytes"],
        MSE_BITS=0,
        KEY_FP8=1 if key_fp8 else 0,
        BLOCK_D=cfg["BLOCK_D"],
        NORM_CORRECTION=0,
        FP8_E4B15=fp8_e4b15,
        VALUE_CENTROID=0,
        num_warps=4,
        num_stages=1,
    )
    return K_out, V_out


def full_softmax_from_dequant(torch, q, K_out, V_out, scale, kv_group):
    # q [1,Hq,D], K/V [1,Hk,M,D] -> [1,Hq,D]
    Hq = q.shape[1]
    out = []
    qf = q[0].float()
    for h in range(Hq):
        kh = h // kv_group
        k = K_out[0, kh].float()
        v = V_out[0, kh].float()
        scores = (k * qf[h]).sum(dim=-1) * scale
        w = torch.softmax(scores, dim=0)
        out.append((w[:, None] * v).sum(dim=0))
    return torch.stack(out, dim=0).unsqueeze(0).to(q.dtype)


def topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, Ktop):
    Hq = q.shape[1]
    out = []
    qf = q[0].float()
    for h in range(Hq):
        kh = h // kv_group
        k = K_out[0, kh].float()
        v = V_out[0, kh].float()
        scores = (k * qf[h]).sum(dim=-1) * scale
        vals, pos = torch.topk(scores, Ktop, dim=0)
        w = torch.softmax(vals, dim=0)
        out.append((w[:, None] * v.index_select(0, pos)).sum(dim=0))
    return torch.stack(out, dim=0).unsqueeze(0).to(q.dtype)


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_VLLM_LAYOUT_HARNESS_START")
    import torch

    # Import from the production vLLM checkout. The script is run from that repo.
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
    slot_size = key_packed_size + val_data_bytes + 4  # value scale fp16 + zero fp16
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

    # Identity PiT is unused for FP8-K but required by the store signature.
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
            # Select pages spread across the larger cache, preserving an evidence-page order.
            pages = torch.linspace(0, max_blocks - 1, n_pages, device="cuda").round().to(torch.int32)
            pages = torch.unique_consecutive(pages)
            if pages.numel() < n_pages:
                # Rare rounding collision repair.
                pages = torch.linspace(0, max_blocks - 1, n_pages + 8, device="cuda").round().to(torch.int32)
                pages = torch.unique_consecutive(pages)[:n_pages]
        else:
            raise ValueError(pattern)
        assert pages.numel() == n_pages, (pattern, M, pages.numel(), n_pages)
        return pages.unsqueeze(0).contiguous()

    for M in budgets:
        for pattern in patterns:
            block_table = make_block_table(M, pattern)
            seq_lens = torch.tensor([M], device="cuda", dtype=torch.int32)
            valid_mask = None
            # The original TQ decode over the selected block table is full-softmax.
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
                    valid_mask=valid_mask,
                )

            def dequant_only():
                return launch_full_dequant(
                    torch,
                    tq_decode,
                    kv_cache,
                    block_table,
                    centroids,
                    M,
                    Hk=Hk,
                    D=D,
                    key_packed_size=key_packed_size,
                    value_quant_bits=value_quant_bits,
                    key_fp8=True,
                )[0]

            # Keep one materialized K/V for reference/correctness in this scenario.
            K_out, V_out = launch_full_dequant(
                torch,
                tq_decode,
                kv_cache,
                block_table,
                centroids,
                M,
                Hk=Hk,
                D=D,
                key_packed_size=key_packed_size,
                value_quant_bits=value_quant_bits,
                key_fp8=True,
            )
            sync(torch)

            def ref_full():
                return full_softmax_from_dequant(torch, q, K_out, V_out, scale, kv_group)

            r = bench(torch, f"original_tq_decode M={M} pattern={pattern}", original_decode, repeats=8 if M <= 32768 else 5, warmup=3)
            r.update({"mode": "original_turboquant_decode_full_softmax", "M": M, "K": None, "pattern": pattern})
            results.append(r)
            log("RESULT " + json.dumps(r))

            r = bench(torch, f"dequant_selected M={M} pattern={pattern}", dequant_only, repeats=5, warmup=2)
            temp_bytes = B * Hk * M * D * 2 * 2
            r.update({"mode": "layout_full_dequant_KV", "M": M, "K": None, "pattern": pattern, "temp_bytes": temp_bytes})
            results.append(r)
            log("RESULT " + json.dumps(r))

            # Correctness: dequant + full softmax should match original decode closely enough for fp8/bf16 path.
            out_orig = original_decode().detach().float()
            out_ref = ref_full().detach().float()
            corr = {
                "M": M,
                "pattern": pattern,
                "check": "dequant_full_softmax_vs_original_tq_decode",
                "max_abs_error": float((out_orig - out_ref).abs().max().detach().cpu()),
                "mean_abs_error": float((out_orig - out_ref).abs().mean().detach().cpu()),
            }
            correctness.append(corr)
            log("CORRECTNESS " + json.dumps(corr))

            for Ktop in topks:
                def topk_path():
                    return topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, Ktop)

                r = bench(torch, f"topk_from_vllm_layout M={M} K={Ktop} pattern={pattern}", topk_path, repeats=8 if M <= 32768 else 5, warmup=3)
                score_bytes = M * Hq * 4
                r.update({
                    "mode": "epkv_v4_style_materialized_topk_from_vllm_layout",
                    "M": M,
                    "K": Ktop,
                    "pattern": pattern,
                    "temp_bytes_KV_dequant": temp_bytes,
                    "temp_bytes_scores": score_bytes,
                })
                results.append(r)
                log("RESULT " + json.dumps(r))

                out_topk = topk_path().detach().float()
                delta = {
                    "M": M,
                    "K": Ktop,
                    "pattern": pattern,
                    "check": "topk_selected_vs_full_softmax_selected",
                    "max_abs_delta": float((out_topk - out_ref).abs().max().detach().cpu()),
                    "mean_abs_delta": float((out_topk - out_ref).abs().mean().detach().cpu()),
                }
                correctness.append(delta)
                log("DELTA " + json.dumps(delta))

            del K_out, V_out
            torch.cuda.empty_cache()

    report = {
        "title": "Evidence-Paged KV Phase 1 — vLLM layout harness",
        "boundary": "Offline harness against real vLLM TurboQuant cache layout. Not serving, not production attention.",
        "meta": meta,
        "correctness": correctness,
        "results": results,
        "nvidia_smi_end": smi(),
    }
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 1 — vLLM layout harness — 2026-05-19",
        "",
        "> Offline harness against the real vLLM TurboQuant cache layout captured by the observe-only hook.",
        "",
        "## Boundary",
        "",
        "```txt",
        "kv_cache: [num_blocks, block_size, Hk, slot_size] uint8",
        "observed production shape: [15442, 16, 4, 196]",
        "harness layout: turboquant_k8v4 = FP8-K + 4-bit-V uniform values",
        "slot_size = 128 key bytes + 64 value-index bytes + 4 value scale/zero bytes = 196",
        "```",
        "",
        "## Correctness / deltas",
        "",
        "| M rows | K | pattern | check | max abs | mean abs |",
        "|---:|---:|---|---|---:|---:|",
    ]
    for c in correctness:
        lines.append(
            f"| {c.get('M')} | {'' if c.get('K') is None else c.get('K')} | {c.get('pattern')} | {c.get('check')} | {c.get('max_abs_error', c.get('max_abs_delta')):.6f} | {c.get('mean_abs_error', c.get('mean_abs_delta')):.6f} |"
        )
    lines += [
        "",
        "## Timings",
        "",
        "| mode | M rows | K | pattern | p50 ms | p90 ms | temp KV MiB | temp scores MiB |",
        "|---|---:|---:|---|---:|---:|---:|---:|",
    ]
    for r in results:
        temp_kv = r.get("temp_bytes", r.get("temp_bytes_KV_dequant", 0)) / (1024 * 1024)
        temp_scores = r.get("temp_bytes_scores", 0) / (1024 * 1024)
        lines.append(
            f"| {r['mode']} | {r['M']} | {'' if r.get('K') is None else r.get('K')} | {r['pattern']} | {r['p50_ms']:.4f} | {r['p90_ms']:.4f} | {temp_kv:.2f} | {temp_scores:.2f} |"
        )
    lines += [
        "",
        "## Readout",
        "",
        "- The real vLLM cache boundary is usable offline via `block_table + packed TQ slots`.",
        "- The harness validates the FP8-K / 4-bit-V unpack path by comparing dequant+full-softmax against original TurboQuant decode.",
        "- The current v4-style top-k path still materializes selected K/V and scores; this is a layout bridge, not the final kernel.",
        "- Next Phase 2 should only insert an experimental selected-page path if the temp-memory and timing envelope is acceptable.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not a serving speedup claim.",
        "- Not a model-quality or evidence-utilization claim.",
        "- Not a comparison against PagedAttention/FlashAttention.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_VLLM_LAYOUT_HARNESS_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_VLLM_LAYOUT_HARNESS_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
