#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.3 — adversarial local-top fixtures.

Stress-test approximate local candidate selection from Phase 2c.2.

Phase 2c.2 showed LOCAL_TOP=8 recovered exact topK on random synthetic
fixtures. This harness constructs top-heavy score distributions where the true
GLOBAL_K=32 positions are concentrated in one or two chunks, which should expose
LOCAL_TOP < GLOBAL_K recall limits.

Boundary: offline GPU benchmark only. No serving mutation, no real prompts, no
model-quality claim. LOCAL_TOP < GLOBAL_K is approximate candidate selection.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-adversarial-local-top-2026-05-19")
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


def bench(torch, name, fn, repeats=4, warmup=2):
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
    return torch.stack(cols, dim=1).contiguous()


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


def build_fixture(torch, *, scenario, max_N, Hq, Hk, D, kv_group, chunk_rows, global_k):
    # One unit-norm prototype per KV head. Query heads in a KV group share the
    # prototype so adversarial top-heavy positions are controlled and readable.
    proto = torch.randn((Hk, D), device="cuda", dtype=torch.float32)
    proto = proto / proto.norm(dim=-1, keepdim=True)
    q = torch.empty((1, Hq, D), device="cuda", dtype=torch.bfloat16)
    for h in range(Hq):
        q[0, h] = proto[h // kv_group].to(torch.bfloat16)

    # Low-amplitude background keeps non-target scores far below target rows.
    key = (0.01 * torch.randn((max_N, Hk, D), device="cuda", dtype=torch.float32)).to(torch.bfloat16)
    value = torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16)

    def set_target(pos: int, rank: int):
        amp = 4.0 - 0.01 * rank
        for kh in range(Hk):
            key[pos, kh] = (amp * proto[kh]).to(torch.bfloat16)

    if scenario == "one_chunk_32":
        targets = list(range(global_k))
    elif scenario == "two_chunks_16_16":
        targets = list(range(16)) + [chunk_rows + i for i in range(16)]
    elif scenario == "spread_32_chunks":
        targets = [i * chunk_rows for i in range(global_k)]
    else:
        raise ValueError(scenario)
    for rank, pos in enumerate(targets):
        set_target(pos, rank)
    return q, key, value, targets


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_ADVERSARIAL_LOCAL_TOP_START")

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
    budgets = [8192, 65536]
    global_k = 32
    local_tops = [4, 8, 16, 32]
    chunk_rows = 512
    scenarios = ["one_chunk_32", "two_chunks_16_16", "spread_32_chunks"]

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
            "scenarios": scenarios,
        },
        "boundary": "offline adversarial candidate recall; contiguous logical pages only; no serving mutation",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
    slot_mapping = torch.arange(max_N, device="cuda", dtype=torch.int32)

    results = []
    for scenario in scenarios:
        q, key, value, target_positions = build_fixture(
            torch, scenario=scenario, max_N=max_N, Hq=Hq, Hk=Hk, D=D,
            kv_group=kv_group, chunk_rows=chunk_rows, global_k=global_k,
        )
        kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size), device="cuda", dtype=torch.uint8)
        kv_cache.zero_()
        log(f"STORE_START scenario={scenario}")
        triton_turboquant_store(
            key, value, kv_cache, slot_mapping, PiT, midpoints,
            mse_bits=0, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits,
            key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False,
        )
        sync(torch)
        log(f"STORE_OK scenario={scenario} " + smi())

        for M in budgets:
            n_pages = math.ceil(M / block_size)
            block_table = torch.arange(n_pages, device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
            K_out, V_out = epkv.launch_full_dequant(
                torch, tq_decode, kv_cache, block_table, centroids, M,
                Hk=Hk, D=D, key_packed_size=key_packed_size,
                value_quant_bits=value_quant_bits,
            )
            sync(torch)
            exact_pos = exact_top_pos_per_head(torch, q, K_out, scale, kv_group, global_k)
            exact_ref = epkv.ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, global_k).detach().float()
            sync(torch)

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

                br_cand = bench(torch, f"candidate_only scenario={scenario} M={M} local_top={local_top}", candidate_only)
                out = full_path().detach().float()
                cv, cp = candidate_only()
                tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
                sync(torch)
                rec = recall_at_k(torch, tp, exact_pos, global_k)
                err = {
                    "max_abs_error_vs_exact_topk_output": float((out - exact_ref).abs().max().detach().cpu()),
                    "mean_abs_error_vs_exact_topk_output": float((out - exact_ref).abs().mean().detach().cpu()),
                }
                br_full = bench(torch, f"full_path scenario={scenario} M={M} local_top={local_top}", full_path)
                row = {
                    "scenario": scenario,
                    "M": M,
                    "global_k": global_k,
                    "local_top": local_top,
                    "chunk_rows": chunk_rows,
                    "num_chunks": num_chunks,
                    "candidate_count_per_head": cand_count,
                    "target_positions_first_40": target_positions[:40],
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
        del q, key, value, kv_cache
        torch.cuda.empty_cache()

    report = {
        "title": "Evidence-Paged KV Phase 2c.3 — adversarial local-top fixtures",
        "meta": meta,
        "results": results,
        "nvidia_smi_end": smi(),
        "non_claims": [
            "not production attention",
            "not serving",
            "not a serving speedup claim",
            "not model quality evidence",
            "not evidence-utilization evidence",
            "LOCAL_TOP < GLOBAL_K is approximate candidate selection",
        ],
    }
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c.3 — adversarial local-top fixtures — 2026-05-19",
        "",
        "> Offline adversarial candidate recall test. LOCAL_TOP < GLOBAL_K is approximate and expected to fail when true topK concentrate inside too few chunks.",
        "",
        "## Boundary",
        "",
        "```txt",
        "global_k: 32",
        "local_top: 4, 8, 16, 32",
        "chunk_rows: 512",
        "scenarios: one_chunk_32, two_chunks_16_16, spread_32_chunks",
        "layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| scenario | M rows | local top | candidates/head | full p50 ms | recall@32 mean | recall@32 min | heads full recall | max abs err | mean abs err | temp ratio |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        lines.append(
            f"| {r['scenario']} | {r['M']} | {r['local_top']} | {r['candidate_count_per_head']} | {r['full_path']['p50_ms']:.4f} | {r['recall_at_32']['mean']:.3f} | {r['recall_at_32']['min']:.3f} | {r['recall_at_32']['heads_full_recall']}/{r['recall_at_32']['heads']} | {r['max_abs_error_vs_exact_topk_output']:.6f} | {r['mean_abs_error_vs_exact_topk_output']:.6f} | {r['candidate_i32_vs_full_score_bytes_ratio']:.3f} |"
        )

    lines += ["", "## Automatic readout", ""]
    for scenario in scenarios:
        for M in budgets:
            subset = [r for r in results if r["scenario"] == scenario and r["M"] == M]
            exacts = [r for r in subset if r["recall_at_32"]["mean"] == 1.0]
            if exacts:
                best = min(exacts, key=lambda r: r["full_path"]["p50_ms"])
                lines.append(f"- scenario={scenario} M={M}: smallest exact local_top={min(r['local_top'] for r in exacts)}; fastest exact local_top={best['local_top']} full_p50={best['full_path']['p50_ms']:.4f} ms.")
            else:
                best = max(subset, key=lambda r: r["recall_at_32"]["mean"])
                lines.append(f"- scenario={scenario} M={M}: no exact local_top; best recall local_top={best['local_top']} recall={best['recall_at_32']['mean']:.3f}.")

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
    log("EPKV_ADVERSARIAL_LOCAL_TOP_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_ADVERSARIAL_LOCAL_TOP_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
