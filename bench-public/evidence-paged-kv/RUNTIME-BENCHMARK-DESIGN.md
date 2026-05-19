# Evidence-Paged KV Phase 2a — runtime benchmark design

> **Status:** design accepted; source hook + Track A offline harness + selection tracing prepared by Pi on 2026-05-19. Original design authored by codex-fallback (claude CLI) in response to `msg_f7cff5a24b274c26`.
> **Execution owner:** Pi (4090 host). No infra change, no service restart, no production touch happens at the design stage.
> **Scope:** a controlled runtime benchmark for the guarded Phase 2a hook (`evidence_paged_kv.runtime.phase2a.v0`).
> **Non-goals:** serving speedup claim, PagedAttention/FlashAttention comparison, answer-quality claim, evidence-utilization claim.

## Why this benchmark exists

The Phase 2a runtime hook passed the *runtime-contact gate*:

```txt
hook installed behind VLLM_EPKV_RUNTIME_HOOK
controlled temporary-on run produced 64 decode events
short prompt smoke succeeded
service restored to default-off
```

It did **not** answer:

```txt
is the steady-state cost of the hook bounded enough that we can enable it as
telemetry-only during an evidence-utilization bridge fixture without distorting
either the timing budget or the produced answers?
```

That is the only question this benchmark must answer. It is a cost/stability characterization, not a speedup study.

## Production target (unchanged)

```txt
host: 4090 render server / WSL Ubuntu-24.04
vLLM checkout: /home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
backend patched: vllm/v1/attention/backends/turboquant_attn.py
hook module: vllm/v1/attention/evidence_paged_kv/runtime_hook.py
service: VLLM-AutoStart
model: Qwen/Qwen2.5-7B-Instruct
kv_cache_dtype: turboquant_k8v4
default state: VLLM_EPKV_RUNTIME_HOOK=0
```

## Approach (recommended order)

### Track A — offline harness against the real hook function (primary, lowest-risk)

Reuse the venv that runs the patched vLLM, import `runtime_hook.maybe_decode` directly, drive it against a synthetic `kv_cache` populated by `triton_turboquant_store` exactly like `epkv-selected-page-triton-harness.py` already does. Compare:

```txt
baseline_original_tq_decode  = triton_turboquant_decode_attention(...)
phase2a_via_hook             = runtime_hook.maybe_decode(impl=fake_impl, query, kv_cache, attn_metadata=...)
```

The fake `impl` only needs `tq_config` (FP8-K + 4-bit-V uniform, no rotate, no centroid) and `scale`. The fake `attn_metadata` is a `SimpleNamespace(block_table, seq_lens)`. The hook code path is the **same function** the live service would call — there is no second implementation drifting.

**Pros:**
- Touches zero serving state. Pi only needs to `source` the venv and run a script.
- Hook output is consumed by the harness, not by users — approximate output is fine because nothing reads it as an answer.
- Sweeps `seq_len ∈ {64, 512, 2048, 8192}` and `K ∈ {32, 128}` with `BLOCK_D` re-compile budgeted into warmup.
- The `temp_scores_bytes = M·Hq·4` invariant is checked numerically, not just logged.
- Reusable correctness check against `launch_full_dequant + ref_topk_from_dequant` already in the Phase 2a Triton harness.

**Cons:**
- Not literally "the serving runtime". It exercises the same kernels through the same hook function, but request-batching, scheduler queuing, attention metadata population, KV cache write traffic, and Python frame overhead from the vLLM attention impl are not measured.

**Why this is still the right primary:** the question we need to answer is *kernel + hook function* cost as a function of `seq_len` and `K`. That isolates the variable we control. Serving-path overhead is a separate concern measured by Track B.

### Track B — serving-path probe (secondary, only after Track A)

If and only if Track A shows steady cost is bounded, run a *very* small serving probe with synthetic prompts:

- `VLLM_EPKV_RUNTIME_HOOK=1`
- `VLLM_EPKV_RUNTIME_MAX_EVENTS=256` (a hard cap; service falls back to original TQ after the cap)
- `VLLM_EPKV_RUNTIME_SYNC_TIMING=1`
- single-stream client hitting `/v1/completions` with `max_tokens=8`, controlled `n=1`, and four pre-built prompts whose tokenized length lands near `{64, 512, 2048, 8192}`.

The synthetic prompts deliberately ignore answer quality (the assistant text is discarded). The point is to thread real serving overhead through the hook without exposing real users to approximate output.

**Pros:**
- Confirms Track A numbers survive the rest of vLLM's stack.
- Reuses the existing default-on/temporary-on/restore protocol that already worked once on 2026-05-19.

**Cons:**
- Mutates running service state. Requires explicit infra confirmation from Felipe before any run.
- Approximate output is briefly emitted by the service while the hook is hot — acceptable only because the prompts are synthetic and the client discards the text.

### Track C — dry-run telemetry (prepared patch, see below)

Add a third hook mode that runs the Phase 2a kernels for *timing only* and then returns `None`, so the service falls back to original TurboQuant and emits the original (correct) output. This lets us measure hook overhead on **real** prompts in the future without ever changing answer behavior. It is a strict superset of the current behavior.

Track C is opt-in and not required for the first benchmark. It is the cleanest answer to the inbox question "*como evitar que o hook devolva resposta aproximada para prompts reais e ainda medir runtime*" once we want to look at non-synthetic prompts.

## Variables and matrix

| Axis | Values | Notes |
|---|---|---|
| `seq_len` (M) | 64, 512, 2048, 8192 | each value forces a fresh Triton compile of `_epkv_scores_kernel` because `M` is a `constexpr`. Each gets its own warmup budget. |
| `K` (top-k) | 32, 128 | 32 is the production-intent value. 128 is included only to characterize value-kernel scaling. |
| `pattern` | `contiguous_pages` | sparse_pages is out of scope for the runtime benchmark (the Phase 2a hook only sees what vLLM hands it). Keeping contiguous matches what the runtime hook actually saw on 2026-05-19 (seq_len 43–45, single page). |
| `mode` | `original_tq_decode`, `epkv_via_hook` | baseline vs hook. No third mode in Track A. |
| `repeats` | warmup 4, steady ≥ 30 | enough events per bucket for stable p50/p90. Triton compile counts as warmup, not steady. |

`seq_len=8192` is included **conditionally**. Run it only if the 2048 numbers are stable and within ~2× the original TurboQuant cost. If 2048 already shows runaway p90 or temp memory beyond the 32 MiB band (`8192 · 28 · 4 ≈ 0.9 MiB` scores; harmless), continue. If not, drop 8192.

## Compile/warmup isolation

The 2026-05-19 receipt already saw a 774 ms first event vs 0.19 ms steady median — pure Triton compile. The benchmark must keep that split visible per bucket:

```txt
warmup events:    first `warmup_n` calls per (seq_len, K) bucket. Discard their timings.
steady events:    remaining `steady_n` calls per bucket. Report min / p10 / p50 / p90 / max.
first_compile_ms: log the first warmup call separately so we keep the cold-start signal.
```

Concretely:
- `warmup_n = 4` (matches the existing Phase 2a Triton harness `bench(...)`).
- `steady_n ≥ 30` per bucket. With 4 buckets × 2 modes × 2 K-values, plus warmup, that is roughly 4·2·2·(4+30) = 544 hook invocations end-to-end. Easily under any reasonable `MAX_EVENTS` cap.
- Use `torch.cuda.Event(enable_timing=True)` start/end pairs plus `torch.cuda.synchronize(query.device)` once per call (the hook already does this when `SYNC_TIMING=1`).
- For Track B specifically, pre-warm the service by sending 2 dummy completions at each prompt length before the recorded run starts; their hook events are tagged `warmup` via `VLLM_EPKV_RUNTIME_TAG`.

## Answers to the inbox questions

### Q1 — how to avoid the hook returning approximate output on real prompts while still measuring runtime

Three layered answers, recommended in this order:

1. **Don't go through real prompts at all for the first benchmark.** Track A uses synthetic Q + a synthetic populated KV cache. The hook output is consumed only by the harness; no real prompt is ever processed under the approximate path.
2. **If a serving probe is needed (Track B), keep prompts synthetic and short, bound by `VLLM_EPKV_RUNTIME_MAX_EVENTS`.** The current hook already enforces `max_events`; bump it from 64 → 256 and use `MAX_SEQ` to clamp the seq_len band per bucket.
3. **Use dry-run telemetry mode (Track C / prepared patch).** When `VLLM_EPKV_RUNTIME_DRY_RUN=1`, the hook runs the kernels for `elapsed_ms_sync_timing` and writes an event, then returns `None` so vLLM falls back to original TurboQuant. Approximate output is **never** emitted; original output is always emitted. This is the only mode that is safe to enable on non-synthetic traffic in a future bridge experiment.

Track C is also the right substrate for the evidence-utilization bridge. The source hook now has default-off selection tracing (`VLLM_EPKV_RUNTIME_TRACE_SELECTION=1`, `VLLM_EPKV_RUNTIME_TRACE_TOP_N=32`) that records positions only, not prompt text or token ids.

### Q2 — how to isolate compile/warmup from steady-state

- Make `seq_len` and `K` the bucket key. Compile happens once per `(seq_len, K)` because both are `constexpr` in the Triton kernels. Treat the first call in each bucket as `warmup`, the next 3 as `discard`, then start the `steady` window.
- Tag each event with its bucket via `VLLM_EPKV_RUNTIME_TAG=phase2a-bench-M{seq}-K{k}-warmup` or `...-steady`. The existing `_ENV_TAG` plumbing already supports this — no code change needed.
- At analysis time partition `events.jsonl` by tag. Compute `first_compile_ms = events[tag.endswith('warmup')][0].elapsed_ms_sync_timing`, then summarize the steady set.
- For Track A, the harness controls the loop directly and can use the existing `bench()` helper from `epkv-selected-page-triton-harness.py` verbatim — warmup is structurally separated from the timing window.
- For Track B, run the prewarm sub-script (2 calls per bucket) before flipping the tag to `steady`.

### Q3 — metric that decides whether we proceed to the evidence-utilization bridge

The bridge is observational. A speedup is *not* required. The bridge is unblocked when **all four** of the following hold:

1. **Cost ceiling.** Steady `p90_hook / p90_original_tq ≤ 2.5` for `seq_len ∈ {64, 512, 2048}`. This is the budget that lets us run the hook in telemetry mode during a bridge fixture without distorting wallclock to the point that the fixture stops representing normal answer behavior.
2. **Stability.** Per-bucket steady max ≤ 5× steady p50 across the run. The 2026-05-19 receipt had one 28 ms outlier vs 0.19 ms p50 (~150×). We need to either confirm that was a one-off Triton autotuning artifact or accept a defined exclusion rule.
3. **Restore fidelity.** Service returns to `VLLM_EPKV_RUNTIME_HOOK=0`, `/health → 200`, chat smoke (e.g. `13*37 → 481`) before and after the run.
4. **Telemetry completeness.** Every recorded event has `seq_len`, `K`, `temp_scores_bytes`, `elapsed_ms_sync_timing`, `elapsed_ms_wall` non-null, `query_shape == [1, 28, 128]`, `kv_cache_shape == [num_blocks, 16, 4, 196]` consistent with the production layout. No `decision != returned_phase2a_output` events except the intentional fallback after `MAX_EVENTS`.

If 1–3 hold but 2 fails systematically, the readout is *"hook usable for telemetry only if outlier band is excluded"* and the bridge starts in **Option B** (offline metadata-only) form from the EPKV-BRIDGE-SPEC.

If 1 fails (`p90_hook > 2.5 × p90_original_tq` at modest seq_len), pause the bridge and go look at Phase 2b candidate fusion before runtime is re-attempted.

## Risks

| # | Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|---|
| R1 | Track A diverges from real serving cost because vLLM Python overhead is not measured | medium | low | Track B exists exactly to check this. Track A bounds the kernel cost, which is the variable we can control. |
| R2 | Triton recompile per `seq_len` bucket inflates total wallclock and confuses casual readers | high | low | First-compile is reported separately. The summary table only uses steady stats. |
| R3 | The 28 ms steady-max outlier seen on 2026-05-19 recurs and pollutes p90 | medium | medium | Report p50, p90, and max. If max is systematically far from p90, gate decision on p90 only and document the outlier in RESULTS.md. Consider repeating the bucket. |
| R4 | Running Track B perturbs the service that other users depend on | medium | high | Track B is **opt-in only with explicit Felipe + Pi confirmation**. The existing 2026-05-19 protocol already worked once; reuse exactly that sequence (temp-on flag, run, flag off, /health, chat smoke). |
| R5 | Real-prompt benchmark would return approximate output to users | low (Track A doesn't do this) | high | Track A is offline. Track B uses synthetic prompts the client discards. Track C (dry-run, prepared patch) is the only mode safe for real prompts; it returns None on every call. |
| R6 | `MAX_EVENTS` cap interacts badly with the benchmark loop | low | low | Compute total expected events up front (≤ 544 for Track A). Set `VLLM_EPKV_RUNTIME_MAX_EVENTS=2048` for Track A's process. Track B keeps the cap tighter (≤ 256) since it perturbs the service. |
| R7 | Patch to `runtime_hook.py` (Track C) introduces a regression in the existing default-off / hook-on path | low | medium | The prepared patch is additive: a new env var, an extra branch *after* the kernels and *before* the return. The existing return path stays byte-for-byte. Pi reviews before deployment to 4090. |
| R8 | Analysis script reads raw prompt text from somewhere by accident | low | high | Never log prompt text. The benchmark records only shapes, K, seq_len, tag, and timing — same as the existing `events.jsonl` schema. The bridge spec's privacy rule applies here pre-emptively. |
| R9 | Track A misuses the hook's global `_seen` counter, capping events early | low | low | Track A drives `maybe_decode` in a hot loop. The hook's `_seen` is a module-level counter. The harness should either set `VLLM_EPKV_RUNTIME_MAX_EVENTS` high or reset the counter between buckets via `runtime_hook._seen = 0`. Document this in the script header. |

## Prepared patch (confidence: high)

Two minimal files are prepared in the repo source tree. Deployment to the 4090 vLLM checkout still requires Pi/Felipe infra protocol.

### Patch 1 — add dry-run telemetry mode to the hook

File: `vllm/v1/attention/evidence_paged_kv/runtime_hook.py` (the deployed copy on the 4090). Source-of-truth in repo: `07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py`.

The change is additive and preserves existing behavior when the new env var is unset.

```diff
 _ENV_TAG = "VLLM_EPKV_RUNTIME_TAG"
+_ENV_DRY_RUN = "VLLM_EPKV_RUNTIME_DRY_RUN"
```

Inside `maybe_decode`, after `out = _decode_phase2a(...)` and the elapsed_ms block, before `if out is None: return None`:

```diff
         if out is None:
             return None
+        dry_run = os.environ.get(_ENV_DRY_RUN, "0") == "1"
         event = {
             "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
             "tag": os.environ.get(_ENV_TAG, ""),
             "event_index": _seen,
             "hook": "evidence_paged_kv.runtime.phase2a.v0",
-            "mode": "guarded_runtime_selected_page",
-            "decision": "returned_phase2a_output",
+            "mode": "guarded_runtime_selected_page_dry_run" if dry_run else "guarded_runtime_selected_page",
+            "decision": "telemetry_only_fallback_to_original_tq" if dry_run else "returned_phase2a_output",
             "elapsed_ms_sync_timing": elapsed_ms,
             ...
         }
         _write_event(event)
         ...
         _seen += 1
-        return out
+        return None if dry_run else out
```

Semantics:
- `VLLM_EPKV_RUNTIME_HOOK=0` (default): no change, no kernels run.
- `VLLM_EPKV_RUNTIME_HOOK=1` and `VLLM_EPKV_RUNTIME_DRY_RUN=0` (current): unchanged behavior — hook returns Phase 2a output (approximate).
- `VLLM_EPKV_RUNTIME_HOOK=1` and `VLLM_EPKV_RUNTIME_DRY_RUN=1` (new): hook runs kernels for timing, logs event with `decision: telemetry_only_fallback_to_original_tq`, returns `None`. vLLM falls back to original TurboQuant. Real prompts get the original (correct) output. Events include both CUDA event timing (`elapsed_ms_sync_timing`) and Python wall timing (`elapsed_ms_wall`) so selection telemetry copy overhead is visible.

The `bench-public/evidence-paged-kv/VLLM-HOOK-PLAN.md` and `EPKV-BRIDGE-SPEC.md` now mention `DRY_RUN` and `TRACE_SELECTION`. Deployment to the 4090 checkout remains a separate infra-confirmed step.

### Patch 2 — new script `07-scripts/vllm-hook/epkv-runtime-benchmark.py` (Track A)

Standalone, follows the same shape as `epkv-selected-page-triton-harness.py`. Imports `vllm.v1.attention.evidence_paged_kv.runtime_hook` (the installed copy) and exercises `maybe_decode` directly. The repo now contains the implementation at [`../../07-scripts/vllm-hook/epkv-runtime-benchmark.py`](../../07-scripts/vllm-hook/epkv-runtime-benchmark.py). Original sketch:

```python
#!/usr/bin/env python3
"""Evidence-Paged KV Phase 2a — controlled runtime benchmark (Track A, offline).

Drives runtime_hook.maybe_decode against a synthetic KV cache populated via
triton_turboquant_store. Sweeps seq_len in {64, 512, 2048, 8192} and K in
{32, 128}, partitions warmup vs steady, and writes summary + jsonl.

Does NOT modify the running vLLM service. Does NOT call /v1/completions.
"""
# ... CUDA_HOME / PATH / LD_LIBRARY_PATH setup identical to
# epkv-selected-page-triton-harness.py ...

import math, os, json, platform, time, types
from pathlib import Path

OUT = Path("/home/felipe/vllm-lab/evidence-paged-kv-runtime-benchmark-2026-05-19")
OUT.mkdir(parents=True, exist_ok=True)

# Force hook on, sync timing on, no dry-run (the harness already discards out).
os.environ["VLLM_EPKV_RUNTIME_HOOK"] = "1"
os.environ["VLLM_EPKV_RUNTIME_SYNC_TIMING"] = "1"
os.environ["VLLM_EPKV_RUNTIME_LOG"] = str(OUT / "events.jsonl")
os.environ["VLLM_EPKV_RUNTIME_MAX_EVENTS"] = "8192"

import torch
from vllm.v1.attention.ops import triton_turboquant_decode as tq_decode
from vllm.v1.attention.ops.triton_turboquant_decode import (
    triton_turboquant_decode_attention,
)
from vllm.v1.attention.ops.triton_turboquant_store import triton_turboquant_store
from vllm.v1.attention.evidence_paged_kv import runtime_hook

# Layout matches the production hook receipt:
B, Hq, Hk, D = 1, 28, 4, 128
kv_group = Hq // Hk
block_size = 16
key_packed_size = 128
value_quant_bits = 4
val_data_bytes = math.ceil(D * value_quant_bits / 8)
slot_size = key_packed_size + val_data_bytes + 4
scale = 1.0 / math.sqrt(D)
seq_lens_to_bench = [64, 512, 2048, 8192]
ks = [32, 128]
warmup_n = 4
steady_n = 30
max_M = max(seq_lens_to_bench)
max_blocks = math.ceil(max_M / block_size)

# tq_config mirrors what TurboQuantAttentionImpl exposes:
tq_config = types.SimpleNamespace(
    key_fp8=True,
    effective_value_quant_bits=4,
    value_centroid=False,
    rotate_values=False,
    key_packed_size=key_packed_size,
)
impl = types.SimpleNamespace(tq_config=tq_config, scale=scale)

# Populate kv_cache once, reuse across buckets.
PiT = torch.eye(D, device="cuda", dtype=torch.float32)
midpoints = torch.zeros((15,), device="cuda", dtype=torch.float32)
key = torch.randn((max_M, Hk, D), device="cuda", dtype=torch.bfloat16)
value = torch.randn((max_M, Hk, D), device="cuda", dtype=torch.bfloat16)
q = torch.randn((B, Hq, D), device="cuda", dtype=torch.bfloat16)
kv_cache = torch.empty((max_blocks, block_size, Hk, slot_size),
                       device="cuda", dtype=torch.uint8).zero_()
slot_mapping = torch.arange(max_M, device="cuda", dtype=torch.int32)
triton_turboquant_store(
    key, value, kv_cache, slot_mapping, PiT, midpoints,
    mse_bits=0, key_packed_size=key_packed_size,
    value_quant_bits=value_quant_bits, key_fp8=True,
    rotate_values=False, padded_head_dim=D, value_centroid=False,
)
torch.cuda.synchronize()

def make_attn_metadata(M):
    n_pages = math.ceil(M / block_size)
    pages = torch.arange(n_pages, device="cuda", dtype=torch.int32).unsqueeze(0).contiguous()
    seq_lens = torch.tensor([M], device="cuda", dtype=torch.int32)
    return types.SimpleNamespace(block_table=pages, seq_lens=seq_lens)

def run_bench():
    results = []
    for M in seq_lens_to_bench:
        attn_metadata = make_attn_metadata(M)
        # original TurboQuant baseline
        baseline = bench_call(
            lambda: triton_turboquant_decode_attention(
                query=q, kv_cache=kv_cache,
                block_table=attn_metadata.block_table,
                seq_lens=attn_metadata.seq_lens,
                Pi=PiT, centroids=torch.linspace(-1, 1, 16, device="cuda"),
                scale=scale, mse_bits=0, key_packed_size=key_packed_size,
                value_quant_bits=value_quant_bits, key_fp8=True,
                norm_correction=False, PiT=PiT, max_num_kv_splits=32,
                rotate_values=False, original_head_dim=D,
                value_centroid=False, sparse_v=False, valid_mask=None,
            ),
            warmup_n, steady_n,
        )
        baseline.update(mode="original_tq_decode", M=M, K=None)
        results.append(baseline)

        for K in ks:
            os.environ["VLLM_EPKV_RUNTIME_K"] = str(K)
            os.environ["VLLM_EPKV_RUNTIME_MAX_SEQ"] = str(max_M + 1)
            os.environ["VLLM_EPKV_RUNTIME_TAG"] = f"bench-M{M}-K{K}"
            runtime_hook._seen = 0  # reset module-level counter per bucket
            hooked = bench_call(
                lambda: runtime_hook.maybe_decode(
                    impl=impl, query=q, kv_cache=kv_cache,
                    attn_metadata=attn_metadata, layer=None,
                ),
                warmup_n, steady_n,
            )
            hooked.update(mode="epkv_via_hook", M=M, K=K,
                          temp_scores_bytes=M * Hq * 4)
            results.append(hooked)
    return results

# bench_call() mirrors the bench() helper in
# epkv-selected-page-triton-harness.py but reports first_compile_ms
# separately and never folds warmup into the steady distribution.
```

The script ends by writing `RESULTS.md` and `summary.json` to `OUT` with the same table shape as the Phase 2a selected-page receipt. Pi copies the receipt back into `bench/evidence-paged-kv-runtime-benchmark-YYYY-MM-DD/` in the repo.

### Output convention

```txt
bench/evidence-paged-kv-runtime-benchmark-2026-05-19/
├── RESULTS.md         # tables, readout, non-claims
├── summary.json       # per-bucket warmup_first_ms, steady_min/p10/p50/p90/max
└── events.jsonl       # raw events, tagged per bucket
```

`RESULTS.md` must explicitly include:

```txt
- non-claims (carry-over from runtime-hook receipt);
- per-bucket first_compile_ms;
- per-bucket steady p50/p90 for both baseline and hook;
- the ratio p90_hook / p90_original_tq for each bucket (the Q3 gate);
- final /health and chat smoke transcript bracketing the run (Track B only).
```

## Execution protocol (handed to Pi)

This is the protocol Pi follows. Codex does not execute any of it.

```txt
0. Confirm with Felipe before any service mutation.
1. Apply Patch 1 to runtime_hook.py via patch-turboquant-runtime-hook.py-style
   wrapper or by direct edit on the 4090 (Pi's call). Service stays default-off.
2. Run /health and chat smoke pre-run on the 4090 service. Record.
3. Track A: run epkv-runtime-benchmark.py inside the venv. No service mutation.
4. If Track A passes the Q3 gates, propose Track B to Felipe with explicit
   temporary-on flag set, MAX_EVENTS=256, MAX_SEQ=8193, DRY_RUN=0, tag
   "phase2a-bench-track-b-YYYY-MM-DD". Run, then restore.
5. Post-run: /health and chat smoke again. Record.
6. Copy receipts into the repo at bench/evidence-paged-kv-runtime-benchmark-YYYY-MM-DD/.
7. Update VLLM-HOOK-PLAN.md and (if applicable) EPKV-BRIDGE-SPEC.md to
   reference the new receipt and the DRY_RUN flag.
```

## Open questions for Pi/Felipe

1. Is Track B worth the service mutation for this round, or is Track A alone enough to gate the bridge? Codex's recommendation: **Track A only for this round**; revisit Track B if/when telemetry mode (Patch 1) needs serving-path validation.
2. Should the `MAX_SEQ` clamp in production stay at `256` (currently) or rise to `8192` for Track A's run? Codex's recommendation: keep production default at `256`; Track A overrides via its own env in-process.
3. Is the suggested `p90_hook / p90_original_tq ≤ 2.5` threshold the right one, or should it be tighter? Felipe call. Document the chosen value in `RESULTS.md`.

## Non-claims (carry-over and pre-emptive)

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality improvement claim.
- Not an evidence-utilization improvement claim.
- Not a PagedAttention/FlashAttention comparison.
- Not a guarantee that Track A numbers transfer 1:1 to live serving — that is Track B's job.
