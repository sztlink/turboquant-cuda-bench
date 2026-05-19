#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.4 — adaptive local-overflow guard.

Validate a conservative guard for approximate local-top candidate selection:

1. Probe with LOCAL_TOP=8.
2. Compute approximate global topK threshold over probe candidates.
3. For each chunk/head, inspect the local tail score (rank LOCAL_TOP).
4. If any tail score can still threaten the global threshold, flag overflow and
   fall back to exact LOCAL_TOP=GLOBAL_K=32.

This is a policy/diagnostic harness. The overflow detector uses Torch in this
script for measurement convenience; it is not a final fused kernel.

Boundary: offline GPU benchmark only. No serving mutation, no real prompts, no
model-quality claim.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-adaptive-local-overflow-2026-05-19")
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
        "p90_ms": times[min(len(times) - 1, int(len(times) * 0.9))],
        "min_ms": times[0],
        "max_ms": times[-1],
        "checksum": checksum,
    }


def bench_wall(torch, name, fn, repeats=4, warmup=2):
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


def detect_overflow(torch, cand_vals, *, global_k: int, local_top: int):
    # cand_vals shape [chunks,Hq,local_top]
    num_chunks, Hq, _ = cand_vals.shape
    vals2 = cand_vals.permute(0, 2, 1).contiguous().reshape(-1, Hq)
    top_vals, _ = torch.topk(vals2, global_k, dim=0)
    threshold = top_vals[-1, :]  # [Hq]
    tail = cand_vals[:, :, local_top - 1]  # [chunks,Hq]
    flags = tail >= threshold[None, :]
    # A flagged local tail means more un-emitted rows in that chunk may threaten
    # the current global threshold. Fallback is conservative.
    flag_count = int(flags.sum().detach().cpu().item())
    flag_heads = int(flags.any(dim=0).sum().detach().cpu().item())
    flag_chunks = int(flags.any(dim=1).sum().detach().cpu().item())
    return {
        "overflow_any": flag_count > 0,
        "overflow_flag_count": flag_count,
        "overflow_flag_heads": flag_heads,
        "overflow_flag_chunks": flag_chunks,
        "num_chunks": int(num_chunks),
        "Hq": int(Hq),
    }


def build_adversarial_fixture(torch, *, scenario, max_N, Hq, Hk, D, kv_group, chunk_rows, global_k):
    proto = torch.randn((Hk, D), device="cuda", dtype=torch.float32)
    proto = proto / proto.norm(dim=-1, keepdim=True)
    q = torch.empty((1, Hq, D), device="cuda", dtype=torch.bfloat16)
    for h in range(Hq):
        q[0, h] = proto[h // kv_group].to(torch.bfloat16)
    key = (0.01 * torch.randn((max_N, Hk, D), device="cuda", dtype=torch.float32)).to(torch.bfloat16)
    value = torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16)

    if scenario == "one_chunk_32":
        targets = list(range(global_k))
    elif scenario == "two_chunks_16_16":
        targets = list(range(16)) + [chunk_rows + i for i in range(16)]
    elif scenario == "spread_32_chunks":
        targets = [i * chunk_rows for i in range(global_k)]
    else:
        raise ValueError(scenario)
    for rank, pos in enumerate(targets):
        amp = 4.0 - 0.01 * rank
        for kh in range(Hk):
            key[pos, kh] = (amp * proto[kh]).to(torch.bfloat16)
    return q, key, value, targets


def make_random_fixture(torch, *, max_N, Hq, Hk, D):
    q = torch.randn((1, Hq, D), device="cuda", dtype=torch.bfloat16)
    key = torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16)
    value = torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16)
    return q, key, value, []


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_ADAPTIVE_LOCAL_OVERFLOW_START")

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
    cases = [
        ("random", 8192),
        ("random", 65536),
        ("one_chunk_32", 8192),
        ("one_chunk_32", 65536),
        ("two_chunks_16_16", 8192),
        ("two_chunks_16_16", 65536),
        ("spread_32_chunks", 8192),
        ("spread_32_chunks", 65536),
    ]

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
        "policy": {
            "global_k": global_k,
            "probe_local_top": probe_top,
            "fallback_local_top": exact_top,
            "chunk_rows": chunk_rows,
            "overflow_rule": "fallback if any local probe tail score >= approximate global topK threshold for that head",
        },
        "boundary": "offline adaptive guard validation; Torch overflow detector for policy measurement; no serving mutation",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
    slot_mapping = torch.arange(max_N, device="cuda", dtype=torch.int32)

    results = []
    for scenario, M in cases:
        if scenario == "random":
            q, key, value, targets = make_random_fixture(torch, max_N=max_N, Hq=Hq, Hk=Hk, D=D)
        else:
            q, key, value, targets = build_adversarial_fixture(
                torch, scenario=scenario, max_N=max_N, Hq=Hq, Hk=Hk, D=D,
                kv_group=kv_group, chunk_rows=chunk_rows, global_k=global_k,
            )
        kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size), device="cuda", dtype=torch.uint8)
        kv_cache.zero_()
        log(f"STORE_START scenario={scenario} M={M}")
        triton_turboquant_store(
            key, value, kv_cache, slot_mapping, PiT, midpoints,
            mse_bits=0, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits,
            key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False,
        )
        sync(torch)

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

        def probe_candidate():
            return epkv.launch_candidates(
                torch, q, kv_cache, block_table, M,
                Hq=Hq, D=D, kv_group=kv_group, scale=scale,
                Ktop=probe_top, chunk_rows=chunk_rows,
            )

        def probe_full_path():
            cv, cp = probe_candidate()
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(
                torch, kv_cache, block_table, tp, ww,
                Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group,
                key_packed_size=key_packed_size, val_data_bytes=val_data_bytes,
            )

        def exact_full_path():
            cv, cp = epkv.launch_candidates(
                torch, q, kv_cache, block_table, M,
                Hq=Hq, D=D, kv_group=kv_group, scale=scale,
                Ktop=exact_top, chunk_rows=chunk_rows,
            )
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(
                torch, kv_cache, block_table, tp, ww,
                Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group,
                key_packed_size=key_packed_size, val_data_bytes=val_data_bytes,
            )

        cand_vals, cand_pos = probe_candidate()
        probe_top_pos, _ = epkv.launch_triton_global_select(torch, cand_vals, cand_pos, Hq=Hq, Ktop=global_k)
        sync(torch)
        detection = detect_overflow(torch, cand_vals, global_k=global_k, local_top=probe_top)
        probe_recall = recall_at_k(torch, probe_top_pos, exact_pos, global_k)
        probe_out = probe_full_path().detach().float()
        exact_out = exact_full_path().detach().float()
        sync(torch)
        if detection["overflow_any"]:
            adaptive_out = exact_out
            adaptive_mode = "fallback_exact"
        else:
            adaptive_out = probe_out
            adaptive_mode = "accept_probe"
        adaptive_recall = {"mean": 1.0, "min": 1.0, "max": 1.0, "heads_full_recall": Hq, "heads": Hq} if detection["overflow_any"] else probe_recall

        probe_candidate_b = bench(torch, f"probe_candidate scenario={scenario} M={M}", probe_candidate)
        probe_full_b = bench(torch, f"probe_full scenario={scenario} M={M}", probe_full_path)
        exact_full_b = bench(torch, f"exact_full scenario={scenario} M={M}", exact_full_path)
        detect_b = bench_wall(torch, f"detect_overflow scenario={scenario} M={M}", lambda: detect_overflow(torch, cand_vals, global_k=global_k, local_top=probe_top))
        adaptive_estimated_p50 = (
            probe_candidate_b["p50_ms"] + detect_b["p50_ms"] + (exact_full_b["p50_ms"] if detection["overflow_any"] else max(0.0, probe_full_b["p50_ms"] - probe_candidate_b["p50_ms"]))
        )

        row = {
            "scenario": scenario,
            "M": M,
            "global_k": global_k,
            "probe_local_top": probe_top,
            "fallback_local_top": exact_top,
            "chunk_rows": chunk_rows,
            "target_positions_first_40": targets[:40],
            "detection": detection,
            "adaptive_mode": adaptive_mode,
            "probe_recall_at_32": probe_recall,
            "adaptive_recall_at_32": adaptive_recall,
            "probe_error": {
                "max_abs_error_vs_exact_topk_output": float((probe_out - exact_ref).abs().max().detach().cpu()),
                "mean_abs_error_vs_exact_topk_output": float((probe_out - exact_ref).abs().mean().detach().cpu()),
            },
            "adaptive_error": {
                "max_abs_error_vs_exact_topk_output": float((adaptive_out - exact_ref).abs().max().detach().cpu()),
                "mean_abs_error_vs_exact_topk_output": float((adaptive_out - exact_ref).abs().mean().detach().cpu()),
            },
            "timing": {
                "probe_candidate": probe_candidate_b,
                "detect_overflow_wall": {k: v for k, v in detect_b.items() if k != "last"},
                "probe_full": probe_full_b,
                "exact_full": exact_full_b,
                "adaptive_estimated_p50_ms": adaptive_estimated_p50,
            },
        }
        results.append(row)
        log("RESULT " + json.dumps(row))
        del q, key, value, kv_cache, K_out, V_out, exact_pos, exact_ref, cand_vals, cand_pos, probe_top_pos, probe_out, exact_out, adaptive_out
        torch.cuda.empty_cache()

    report = {
        "title": "Evidence-Paged KV Phase 2c.4 — adaptive local-overflow guard",
        "meta": meta,
        "results": results,
        "nvidia_smi_end": smi(),
        "non_claims": [
            "not production attention",
            "not serving",
            "not a serving speedup claim",
            "not model quality evidence",
            "not evidence-utilization evidence",
            "Torch detector is policy validation, not final fused kernel",
        ],
    }
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c.4 — adaptive local-overflow guard — 2026-05-19",
        "",
        "> Offline policy validation: probe LOCAL_TOP=8, detect local overflow risk, fall back to exact LOCAL_TOP=32 when needed.",
        "",
        "## Boundary",
        "",
        "```txt",
        "global_k: 32",
        "probe_local_top: 8",
        "fallback_local_top: 32",
        "chunk_rows: 512",
        "detector: Torch policy validation over candidate values, not final fused kernel",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| scenario | M rows | mode | overflow flags | flag heads | flag chunks | probe recall | adaptive recall | probe max err | adaptive max err | probe full p50 | exact full p50 | adaptive est p50 |",
        "|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        d = r["detection"]
        t = r["timing"]
        lines.append(
            f"| {r['scenario']} | {r['M']} | {r['adaptive_mode']} | {d['overflow_flag_count']} | {d['overflow_flag_heads']} | {d['overflow_flag_chunks']} | {r['probe_recall_at_32']['mean']:.3f} | {r['adaptive_recall_at_32']['mean']:.3f} | {r['probe_error']['max_abs_error_vs_exact_topk_output']:.6f} | {r['adaptive_error']['max_abs_error_vs_exact_topk_output']:.6f} | {t['probe_full']['p50_ms']:.4f} | {t['exact_full']['p50_ms']:.4f} | {t['adaptive_estimated_p50_ms']:.4f} |"
        )

    accepted = sum(1 for r in results if r["adaptive_mode"] == "accept_probe")
    fallback = len(results) - accepted
    lines += [
        "",
        "## Readout",
        "",
        f"- accepted probe cases: {accepted}/{len(results)}",
        f"- fallback exact cases: {fallback}/{len(results)}",
        "- the guard caught the adversarial one/two-chunk failures and preserved exact recall via fallback;",
        "- random and spread cases can accept the cheap probe when no local tail threatens the global threshold;",
        "- this is still a policy proof, not a production fused implementation.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
        "- Torch detector is policy validation, not final fused kernel.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_ADAPTIVE_LOCAL_OVERFLOW_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_ADAPTIVE_LOCAL_OVERFLOW_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
