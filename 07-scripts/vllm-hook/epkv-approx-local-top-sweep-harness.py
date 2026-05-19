#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.2 — approximate local-top sweep.

Question: can local candidate generation get cheaper if each chunk emits fewer
than global K candidates?

Exact Phase 2c uses LOCAL_TOP == GLOBAL_K == 32 per chunk. This sweep tests:

    GLOBAL_K=32
    LOCAL_TOP in {4, 8, 16, 32}
    chunk_rows=512

Metrics:
- candidate_only latency;
- full_path latency;
- recall@32 against exact full topK over dequantized K;
- output max/mean abs against exact topK reference;
- candidate temp ratio.

Boundary: offline GPU benchmark only. No serving mutation, no real prompts, no
model-quality claim. LOCAL_TOP < GLOBAL_K is approximate candidate selection,
not exact topK.
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
BASE = HERE / "epkv-fused-candidate-selection-v2-harness.py"
spec = importlib.util.spec_from_file_location("epkv_v2", BASE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load {BASE}")
epkv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(epkv)

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-approx-local-top-sweep-2026-05-19")
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
    except Exception as exc:  # noqa: BLE001
        return f"ERROR {exc}"


def sync(torch):
    torch.cuda.synchronize()


def bench(torch, name, fn, repeats=5, warmup=3):
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


def exact_top_pos_per_head(torch, q, K_out, scale, kv_group, global_k):
    Hq = q.shape[1]
    qf = q[0].float()
    cols = []
    for h in range(Hq):
        kh = h // kv_group
        scores = (K_out[0, kh].float() * qf[h]).sum(dim=-1) * scale
        _, pos = torch.topk(scores, global_k, dim=0)
        cols.append(pos)
    return torch.stack(cols, dim=1).contiguous()  # [K,Hq]


def recall_at_k(torch, approx_pos, exact_pos, global_k):
    Hq = exact_pos.shape[1]
    recalls = []
    for h in range(Hq):
        a = set(int(x) for x in approx_pos[:, h].detach().cpu().tolist())
        e = set(int(x) for x in exact_pos[:, h].detach().cpu().tolist())
        recalls.append(len(a & e) / float(global_k))
    return {
        "mean": float(sum(recalls) / len(recalls)),
        "min": float(min(recalls)),
        "max": float(max(recalls)),
        "heads_full_recall": int(sum(1 for r in recalls if r == 1.0)),
        "heads": Hq,
    }


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_APPROX_LOCAL_TOP_SWEEP_START")

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
    budgets = [8192, 32768, 65536]
    patterns = ["contiguous_pages", "sparse_pages"]
    global_k = 32
    local_tops = [4, 8, 16, 32]
    chunk_rows = 512

    meta = {
        "host": platform.node(),
        "python": platform.python_version(),
        "torch": torch.__version__,
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
            "key_packed_size": key_packed_size,
            "value_quant_bits": value_quant_bits,
            "slot_size": slot_size,
            "max_N": max_N,
        },
        "sweep": {
            "global_k": global_k,
            "local_tops": local_tops,
            "chunk_rows": chunk_rows,
        },
        "boundary": "offline approximate candidate sweep; no serving mutation",
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

    results = []
    for M in budgets:
        for pattern in patterns:
            block_table = make_block_table(M, pattern)
            log(f"DEQUANT_REFERENCE_START M={M} pattern={pattern}")
            K_out, V_out = epkv.launch_full_dequant(
                torch, tq_decode, kv_cache, block_table, centroids, M,
                Hk=Hk, D=D, key_packed_size=key_packed_size,
                value_quant_bits=value_quant_bits,
            )
            sync(torch)
            exact_pos = exact_top_pos_per_head(torch, q, K_out, scale, kv_group, global_k)
            exact_ref = epkv.ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, global_k).detach().float()
            sync(torch)
            log(f"DEQUANT_REFERENCE_OK M={M} pattern={pattern}")

            for local_top in local_tops:
                num_chunks = math.ceil(M / chunk_rows)
                cand_count = num_chunks * local_top
                cand_bytes_i32 = cand_count * Hq * (4 + 4)
                full_score_bytes = M * Hq * 4

                def candidate_only():
                    return epkv.launch_candidates(
                        torch, q, kv_cache, block_table, M,
                        Hq=Hq, D=D, kv_group=kv_group, scale=scale,
                        Ktop=local_top, chunk_rows=chunk_rows,
                    )

                def full_path():
                    cv, cp = candidate_only()
                    tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
                    return epkv.launch_value(
                        torch, kv_cache, block_table, tp, ww,
                        Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group,
                        key_packed_size=key_packed_size, val_data_bytes=val_data_bytes,
                    )

                br_cand = bench(torch, f"candidate_only M={M} local_top={local_top} pattern={pattern}", candidate_only, repeats=5, warmup=3)
                out = full_path().detach().float()
                cv, cp = candidate_only()
                tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
                sync(torch)
                rec = recall_at_k(torch, tp, exact_pos, global_k)
                err = {
                    "max_abs_error_vs_exact_topk_output": float((out - exact_ref).abs().max().detach().cpu()),
                    "mean_abs_error_vs_exact_topk_output": float((out - exact_ref).abs().mean().detach().cpu()),
                }
                br_full = bench(torch, f"full_path M={M} local_top={local_top} pattern={pattern}", full_path, repeats=5, warmup=3)
                row = {
                    "M": M,
                    "pattern": pattern,
                    "global_k": global_k,
                    "local_top": local_top,
                    "chunk_rows": chunk_rows,
                    "num_chunks": num_chunks,
                    "candidate_count_per_head": cand_count,
                    "temp_bytes_candidates_i32": cand_bytes_i32,
                    "temp_bytes_full_scores_equivalent": full_score_bytes,
                    "candidate_i32_vs_full_score_bytes_ratio": cand_bytes_i32 / full_score_bytes,
                    "candidate_only": br_cand,
                    "full_path": br_full,
                    "recall_at_32": rec,
                    **err,
                    "approximate": local_top < global_k,
                }
                results.append(row)
                log("RESULT " + json.dumps(row))
                del cv, cp, tp, ww, out
            del K_out, V_out, exact_pos, exact_ref
            torch.cuda.empty_cache()

    report = {
        "title": "Evidence-Paged KV Phase 2c.2 — approximate local-top sweep",
        "meta": meta,
        "results": results,
        "nvidia_smi_end": smi(),
        "non_claims": [
            "not production attention",
            "not serving",
            "not a serving speedup claim",
            "not model quality evidence",
            "not evidence-utilization evidence",
            "approximate local top is not exact topK unless local_top equals global_k",
        ],
    }
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c.2 — approximate local-top sweep — 2026-05-19",
        "",
        "> Offline approximate candidate sweep. LOCAL_TOP < GLOBAL_K is approximate, measured by recall@32 and output error vs exact topK reference.",
        "",
        "## Boundary",
        "",
        "```txt",
        "global_k: 32",
        "local_top: 4, 8, 16, 32",
        "chunk_rows: 512",
        "layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128",
        "serving: no",
        "```",
        "",
        "## Sweep results",
        "",
        "| M rows | pattern | local top | candidates/head | candidate p50 ms | full p50 ms | recall@32 mean | recall@32 min | heads full recall | max abs err | mean abs err | temp ratio |",
        "|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        lines.append(
            f"| {r['M']} | {r['pattern']} | {r['local_top']} | {r['candidate_count_per_head']} | {r['candidate_only']['p50_ms']:.4f} | {r['full_path']['p50_ms']:.4f} | {r['recall_at_32']['mean']:.3f} | {r['recall_at_32']['min']:.3f} | {r['recall_at_32']['heads_full_recall']}/{r['recall_at_32']['heads']} | {r['max_abs_error_vs_exact_topk_output']:.6f} | {r['mean_abs_error_vs_exact_topk_output']:.6f} | {r['candidate_i32_vs_full_score_bytes_ratio']:.3f} |"
        )

    lines += ["", "## Automatic readout", ""]
    for M in budgets:
        for pattern in patterns:
            subset = [r for r in results if r["M"] == M and r["pattern"] == pattern]
            viable = [r for r in subset if r["recall_at_32"]["mean"] >= 0.95]
            best = min(subset, key=lambda r: r["full_path"]["p50_ms"])
            if viable:
                best_viable = min(viable, key=lambda r: r["full_path"]["p50_ms"])
                lines.append(f"- M={M} pattern={pattern}: fastest recall>=0.95 local_top={best_viable['local_top']} full_p50={best_viable['full_path']['p50_ms']:.4f} ms recall={best_viable['recall_at_32']['mean']:.3f}; fastest overall local_top={best['local_top']} recall={best['recall_at_32']['mean']:.3f}.")
            else:
                lines.append(f"- M={M} pattern={pattern}: no local_top reached mean recall>=0.95; fastest overall local_top={best['local_top']} full_p50={best['full_path']['p50_ms']:.4f} ms recall={best['recall_at_32']['mean']:.3f}.")

    lines += [
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
        "- LOCAL_TOP < GLOBAL_K is approximate candidate selection, not exact topK.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_APPROX_LOCAL_TOP_SWEEP_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_APPROX_LOCAL_TOP_SWEEP_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
