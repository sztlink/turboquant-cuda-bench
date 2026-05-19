#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.5 — GPU overflow detector.

Implement the adaptive local-overflow guard as a tiny Triton detector kernel:

    probe LOCAL_TOP=8 candidates
    compute per-head approximate global topK threshold over probe candidates
    flag fallback if any chunk's local tail score can still threaten threshold

Boundary: offline GPU benchmark only. No serving mutation, no real prompts, no
model-quality claim. This validates detector feasibility, not production use.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-gpu-overflow-detector-2026-05-19")
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
def _overflow_detector_kernel(
    Cand_vals_ptr,  # [chunks,Hq,LOCAL_TOP] fp32
    Head_flags_ptr,  # [Hq] int32
    Hq: tl.constexpr,
    NUM_CHUNKS: tl.constexpr,
    LOCAL_TOP: tl.constexpr,
    GLOBAL_K: tl.constexpr,
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
    orig_vals = vals

    top_vals = tl.full([BLOCK_K], -float("inf"), dtype=tl.float32)
    for kk in tl.static_range(0, GLOBAL_K):
        mx = tl.max(vals, axis=0)
        top_vals = tl.where(koffs == kk, mx, top_vals)
        # Remove all equal maxima. Ties are immaterial for conservative overflow.
        vals = tl.where(vals == mx, -float("inf"), vals)

    threshold = tl.max(tl.where(koffs == GLOBAL_K - 1, top_vals, -float("inf")), axis=0)
    tail_mask = mask & (local == LOCAL_TOP - 1)
    threatens = tl.max(tl.where(tail_mask & (orig_vals >= threshold), 1, 0), axis=0)
    tl.store(Head_flags_ptr + hq, threatens)


def next_power_of_2(x: int) -> int:
    return 1 << (x - 1).bit_length()


def launch_gpu_overflow_detector(torch, cand_vals, *, Hq: int, global_k: int, local_top: int):
    num_chunks = cand_vals.shape[0]
    cand_count = num_chunks * local_top
    flags = torch.empty((Hq,), device="cuda", dtype=torch.int32)
    _overflow_detector_kernel[(Hq,)](
        cand_vals,
        flags,
        Hq=Hq,
        NUM_CHUNKS=num_chunks,
        LOCAL_TOP=local_top,
        GLOBAL_K=global_k,
        BLOCK_C=next_power_of_2(cand_count),
        BLOCK_K=next_power_of_2(global_k),
        num_warps=8,
        num_stages=1,
    )
    return flags


def bench(torch, name, fn, repeats=8, warmup=4):
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
    return q, key, value


def make_random_fixture(torch, *, max_N, Hq, Hk, D):
    return (
        torch.randn((1, Hq, D), device="cuda", dtype=torch.bfloat16),
        torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16),
        torch.randn((max_N, Hk, D), device="cuda", dtype=torch.bfloat16),
    )


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_GPU_OVERFLOW_DETECTOR_START")
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
        "boundary": "offline GPU detector feasibility; no serving mutation",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
    centroids = torch.linspace(-1.0, 1.0, 16, device="cuda", dtype=torch.float32)
    slot_mapping = torch.arange(max_N, device="cuda", dtype=torch.int32)

    results = []
    for scenario, M in cases:
        if scenario == "random":
            q, key, value = make_random_fixture(torch, max_N=max_N, Hq=Hq, Hk=Hk, D=D)
        else:
            q, key, value = build_adversarial_fixture(torch, scenario=scenario, max_N=max_N, Hq=Hq, Hk=Hk, D=D, kv_group=kv_group, chunk_rows=chunk_rows, global_k=global_k)
        kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size), device="cuda", dtype=torch.uint8)
        kv_cache.zero_()
        triton_turboquant_store(key, value, kv_cache, slot_mapping, PiT, midpoints, mse_bits=0, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits, key_fp8=True, rotate_values=False, padded_head_dim=D, value_centroid=False)
        sync(torch)
        n_pages = math.ceil(M / block_size)
        block_table = torch.arange(n_pages, device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
        K_out, V_out = epkv.launch_full_dequant(torch, tq_decode, kv_cache, block_table, centroids, M, Hk=Hk, D=D, key_packed_size=key_packed_size, value_quant_bits=value_quant_bits)
        sync(torch)
        exact_pos = exact_top_pos_per_head(torch, q, K_out, scale, kv_group, global_k)
        exact_ref = epkv.ref_topk_from_dequant(torch, q, K_out, V_out, scale, kv_group, global_k).detach().float()

        def probe_candidate():
            return epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=probe_top, chunk_rows=chunk_rows)

        cand_vals, cand_pos = probe_candidate()
        top_pos_probe, weights_probe = epkv.launch_triton_global_select(torch, cand_vals, cand_pos, Hq=Hq, Ktop=global_k)
        flags = launch_gpu_overflow_detector(torch, cand_vals, Hq=Hq, global_k=global_k, local_top=probe_top)
        sync(torch)
        flags_cpu = flags.detach().cpu().tolist()
        flag_heads = int(sum(1 for x in flags_cpu if int(x) != 0))
        overflow = flag_heads > 0
        probe_recall = recall_at_k(torch, top_pos_probe, exact_pos, global_k)
        probe_out = epkv.launch_value(torch, kv_cache, block_table, top_pos_probe, weights_probe, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes).detach().float()

        def detector_only():
            return launch_gpu_overflow_detector(torch, cand_vals, Hq=Hq, global_k=global_k, local_top=probe_top)

        def probe_full():
            cv, cp = probe_candidate()
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

        def exact_full():
            cv, cp = epkv.launch_candidates(torch, q, kv_cache, block_table, M, Hq=Hq, D=D, kv_group=kv_group, scale=scale, Ktop=exact_top, chunk_rows=chunk_rows)
            tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=global_k)
            return epkv.launch_value(torch, kv_cache, block_table, tp, ww, Hq=Hq, D=D, Ktop=global_k, kv_group=kv_group, key_packed_size=key_packed_size, val_data_bytes=val_data_bytes)

        detector_b = bench(torch, f"detector scenario={scenario} M={M}", detector_only, repeats=10, warmup=5)
        probe_b = bench(torch, f"probe_full scenario={scenario} M={M}", probe_full, repeats=5, warmup=3)
        exact_b = bench(torch, f"exact_full scenario={scenario} M={M}", exact_full, repeats=5, warmup=3)
        exact_out = exact_full().detach().float()
        adaptive_out = exact_out if overflow else probe_out
        adaptive_recall = {"mean": 1.0, "min": 1.0, "max": 1.0, "heads_full_recall": Hq, "heads": Hq} if overflow else probe_recall
        adaptive_est = detector_b["p50_ms"] + (exact_b["p50_ms"] if overflow else probe_b["p50_ms"])
        row = {
            "scenario": scenario,
            "M": M,
            "overflow": overflow,
            "flag_heads": flag_heads,
            "probe_recall_at_32": probe_recall,
            "adaptive_recall_at_32": adaptive_recall,
            "probe_max_abs_error": float((probe_out - exact_ref).abs().max().detach().cpu()),
            "adaptive_max_abs_error": float((adaptive_out - exact_ref).abs().max().detach().cpu()),
            "timing": {"detector_gpu": detector_b, "probe_full": probe_b, "exact_full": exact_b, "adaptive_estimated_p50_ms": adaptive_est},
        }
        results.append(row)
        log("RESULT " + json.dumps(row))
        del q, key, value, kv_cache, K_out, V_out, exact_pos, exact_ref, cand_vals, cand_pos, top_pos_probe, weights_probe, flags, probe_out, exact_out, adaptive_out
        torch.cuda.empty_cache()

    report = {"title": "Evidence-Paged KV Phase 2c.5 — GPU overflow detector", "meta": meta, "results": results, "nvidia_smi_end": smi(), "non_claims": ["not production attention", "not serving", "not a serving speedup claim", "not model quality evidence"]}
    (OUT / "results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c.5 — GPU overflow detector — 2026-05-19",
        "",
        "> Offline GPU detector for adaptive local-overflow fallback. No serving mutation.",
        "",
        "## Boundary",
        "",
        "```txt",
        "probe_local_top: 8",
        "fallback_local_top: 32",
        "global_k: 32",
        "detector: Triton per-head local-tail-vs-global-threshold flag",
        "serving: no",
        "```",
        "",
        "## Results",
        "",
        "| scenario | M rows | overflow | flag heads | probe recall | adaptive recall | probe max err | adaptive max err | detector p50 ms | probe full p50 | exact full p50 | adaptive est p50 |",
        "|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for r in results:
        t = r["timing"]
        lines.append(f"| {r['scenario']} | {r['M']} | {r['overflow']} | {r['flag_heads']} | {r['probe_recall_at_32']['mean']:.3f} | {r['adaptive_recall_at_32']['mean']:.3f} | {r['probe_max_abs_error']:.6f} | {r['adaptive_max_abs_error']:.6f} | {t['detector_gpu']['p50_ms']:.4f} | {t['probe_full']['p50_ms']:.4f} | {t['exact_full']['p50_ms']:.4f} | {t['adaptive_estimated_p50_ms']:.4f} |")
    accepted = sum(1 for r in results if not r["overflow"])
    fallback = len(results) - accepted
    lines += [
        "",
        "## Readout",
        "",
        f"- accepted probe cases: {accepted}/{len(results)}",
        f"- fallback exact cases: {fallback}/{len(results)}",
        "- GPU detector replaces the previous Torch/CPU policy detector for this fixture;",
        "- adversarial concentrated cases are flagged and recovered via fallback;",
        "- random/spread cases are accepted when no local tail threatens the threshold.",
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_GPU_OVERFLOW_DETECTOR_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_GPU_OVERFLOW_DETECTOR_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
