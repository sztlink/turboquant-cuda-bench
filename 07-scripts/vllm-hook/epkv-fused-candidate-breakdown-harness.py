#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2c.1 — fused candidate latency breakdown.

Break down the Phase 2c path into separately timed components:

    candidate_only
    global_select_only
    value_only
    candidate_plus_global_select
    full_path

Boundary: offline GPU benchmark only. No serving mutation, no model inference, no
real prompts, no speedup claim.
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

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-fused-candidate-breakdown-2026-05-19")
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
        "p10_ms": times[max(0, len(times) // 10)],
        "p90_ms": times[min(len(times) - 1, int(len(times) * 0.9))],
        "min_ms": times[0],
        "max_ms": times[-1],
        "checksum": checksum,
    }


def main():
    LOG.write_text("", encoding="utf-8")
    log("EPKV_FUSED_CANDIDATE_BREAKDOWN_START")

    import torch
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
    configs = [(32, 512), (32, 1024)]
    patterns = ["contiguous_pages", "sparse_pages"]

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
        "boundary": "offline component benchmark; no serving mutation",
    }
    log("META " + json.dumps(meta))

    PiT = torch.eye(D, device="cuda", dtype=torch.float32)
    midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
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
            for Ktop, chunk_rows in configs:
                num_chunks = math.ceil(M / chunk_rows)
                cand_count = num_chunks * Ktop
                cand_bytes_i32 = cand_count * Hq * (4 + 4)
                full_score_bytes = M * Hq * 4

                def candidate_only():
                    return epkv.launch_candidates(
                        torch, q, kv_cache, block_table, M,
                        Hq=Hq, D=D, kv_group=kv_group, scale=scale,
                        Ktop=Ktop, chunk_rows=chunk_rows,
                    )

                cand_vals, cand_pos_i32 = candidate_only()
                sync(torch)

                def global_select_only():
                    return epkv.launch_triton_global_select(torch, cand_vals, cand_pos_i32, Hq=Hq, Ktop=Ktop)

                top_pos, weights = global_select_only()
                sync(torch)

                def value_only():
                    return epkv.launch_value(
                        torch, kv_cache, block_table, top_pos, weights,
                        Hq=Hq, D=D, Ktop=Ktop, kv_group=kv_group,
                        key_packed_size=key_packed_size, val_data_bytes=val_data_bytes,
                    )

                def candidate_plus_global_select():
                    cv, cp = candidate_only()
                    return epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=Ktop)

                def full_path():
                    cv, cp = candidate_only()
                    tp, ww = epkv.launch_triton_global_select(torch, cv, cp, Hq=Hq, Ktop=Ktop)
                    return epkv.launch_value(
                        torch, kv_cache, block_table, tp, ww,
                        Hq=Hq, D=D, Ktop=Ktop, kv_group=kv_group,
                        key_packed_size=key_packed_size, val_data_bytes=val_data_bytes,
                    )

                component_fns = [
                    ("candidate_only", candidate_only),
                    ("global_select_only", global_select_only),
                    ("value_only", value_only),
                    ("candidate_plus_global_select", candidate_plus_global_select),
                    ("full_path", full_path),
                ]
                for component, fn in component_fns:
                    r = bench(torch, f"{component} M={M} K={Ktop} chunk={chunk_rows} pattern={pattern}", fn, repeats=5 if M >= 65536 else 7, warmup=4)
                    r.update({
                        "component": component,
                        "M": M,
                        "K": Ktop,
                        "chunk_rows": chunk_rows,
                        "num_chunks": num_chunks,
                        "pattern": pattern,
                        "candidate_count_per_head": cand_count,
                        "temp_bytes_candidates_i32": cand_bytes_i32,
                        "temp_bytes_full_scores_equivalent": full_score_bytes,
                        "candidate_i32_vs_full_score_bytes_ratio": cand_bytes_i32 / full_score_bytes,
                    })
                    results.append(r)
                    log("RESULT " + json.dumps(r))

                del cand_vals, cand_pos_i32, top_pos, weights
            torch.cuda.empty_cache()

    summary = {
        "title": "Evidence-Paged KV Phase 2c.1 — fused candidate latency breakdown",
        "meta": meta,
        "results": results,
        "nvidia_smi_end": smi(),
        "non_claims": [
            "not production attention",
            "not serving",
            "not a serving speedup claim",
            "not model quality evidence",
            "not evidence-utilization evidence",
        ],
    }
    (OUT / "results.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    lines = [
        "# Evidence-Paged KV Phase 2c.1 — fused candidate latency breakdown — 2026-05-19",
        "",
        "> Offline component timing for Phase 2c. No serving mutation, no model inference.",
        "",
        "## Boundary",
        "",
        "```txt",
        "components: candidate_only, global_select_only, value_only, candidate_plus_global_select, full_path",
        "layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128",
        "serving: no",
        "```",
        "",
        "## Component timings",
        "",
        "| component | M rows | K | chunk rows | pattern | p50 ms | p90 ms | candidates/head | temp ratio |",
        "|---|---:|---:|---:|---|---:|---:|---:|---:|",
    ]
    for r in results:
        lines.append(
            f"| {r['component']} | {r['M']} | {r['K']} | {r['chunk_rows']} | {r['pattern']} | {r['p50_ms']:.4f} | {r['p90_ms']:.4f} | {r['candidate_count_per_head']} | {r['candidate_i32_vs_full_score_bytes_ratio']:.3f} |"
        )

    # A concise automatic diagnosis per shape using component-only p50 timings.
    lines += ["", "## Automatic diagnosis", ""]
    grouped = {}
    for r in results:
        key = (r["M"], r["K"], r["chunk_rows"], r["pattern"])
        grouped.setdefault(key, {})[r["component"]] = r
    for key, g in grouped.items():
        M, Ktop, chunk_rows, pattern = key
        parts = {k: g[k]["p50_ms"] for k in ["candidate_only", "global_select_only", "value_only"] if k in g}
        dominant = max(parts.items(), key=lambda kv: kv[1])[0]
        full = g.get("full_path", {}).get("p50_ms")
        payload = {k: round(v, 4) for k, v in parts.items()}
        if full is not None:
            payload["full_path"] = round(full, 4)
        lines.append(f"- M={M} K={Ktop} chunk={chunk_rows} pattern={pattern}: dominant component p50 = `{dominant}`; parts={json.dumps(payload)}")

    lines += [
        "",
        "## Non-claims",
        "",
        "- Not production attention.",
        "- Not serving.",
        "- Not a serving speedup claim.",
        "- Not model-quality or evidence-utilization evidence.",
        "- Not a PagedAttention/FlashAttention comparison.",
    ]
    (OUT / "RESULTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    log("EPKV_FUSED_CANDIDATE_BREAKDOWN_DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("EPKV_FUSED_CANDIDATE_BREAKDOWN_FAILED")
        (OUT / "ERROR.txt").write_text(traceback.format_exc(), encoding="utf-8")
        raise
