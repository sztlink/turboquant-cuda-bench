# vLLM hook preparation — Evidence-Paged KV v4/v5

> Goal: prepare a runtime contact experiment, not a production integration.

## Why v4/v5, not v7 first?

- **v4** is the clearest end-to-end attention-like receipt: score → top-k/softmax → value.
- **v5** is the best current custom `K=32` path in microbenchmarks.
- **v7** is cleaner architecturally but still loses to v5 at larger M.

The first vLLM hook should test whether the practical v4/v5 shape survives runtime overheads.

## Hook hypothesis

```txt
A selected-evidence KV path can be inserted experimentally around vLLM attention/KV handling and produce measurable runtime behavior without claiming production speedup.
```

## Non-goals

- Production attention replacement.
- PagedAttention/FlashAttention comparison.
- Serving speedup claim.
- Model-quality or answer-quality claim.
- Full Evidence-Paged architecture.

## Minimal experiment shape

1. Identify a narrow vLLM-side insertion point where selected row/page metadata can be passed to an experimental attention path.
2. Use a v4/v5-style materialized score path first.
3. Restrict to a controlled decode/prefill micro-workload, not arbitrary serving.
4. Measure:
   - latency p50/p90;
   - temporary allocations;
   - overhead of metadata preparation;
   - correctness against standard attention on the selected subset;
   - failure modes when selected pages are sparse vs contiguous.

## Candidate implementation order

### Phase 0 — static hook scout

- Locate the vLLM attention backend used by current 4090 service.
- Identify whether an out-of-tree extension can be loaded without rebuilding the full server.
- Identify the tensors available at the hook boundary: Q, K/V cache layout, block tables, sequence metadata.

Prepared and applied observe-only scout:

- [`../../07-scripts/vllm-hook/README.md`](../../07-scripts/vllm-hook/README.md)
- [`../../bench/evidence-paged-kv-vllm-hook-scout-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-vllm-hook-scout-2026-05-19/RESULTS.md)

Phase 0 result:

```txt
/health -> HTTP 200
chat smoke: 17 * 23 -> 391
captured events: 64
boundary: query [1,28,128], kv_cache [15442,16,4,196], block_table [1,4096]
layout: turboquant_k8v4 = FP8-K + 4-bit-V packed slot_size=196
```

### Phase 1 — offline harness near vLLM layout

- Reproduce v4/v5 benchmark using tensors shaped closer to vLLM KV cache/block tables.
- Keep outside production vLLM server.
- Compare with current receipt numbers.

Phase 1 receipt:

- [`../../bench/evidence-paged-kv-vllm-layout-harness-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-vllm-layout-harness-2026-05-19/RESULTS.md)

Phase 1 result:

```txt
layout validated: FP8-K + 4-bit-V packed slot_size=196
correctness: dequant+full-softmax vs original TurboQuant decode max abs ~1e-4
boundary usable: block_table + packed TQ slots can represent selected evidence pages offline
caveat: current top-k rows are Python/Torch-loop reference paths, not final kernels
```

### Phase 2 — experimental hook

- Add a guarded experimental path behind an env flag.
- Run only on synthetic selected-evidence workloads.
- Validate health restoration after every run.

Phase 2a offline selected-page Triton receipt:

- [`../../bench/evidence-paged-kv-selected-page-triton-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-selected-page-triton-2026-05-19/RESULTS.md)

Phase 2a result:

```txt
first selected-page path over real packed vLLM TQ slots
score: Triton FP8-K packed slots -> scores [M,Hq]
selection: torch.topk/softmax
value: Triton 4-bit-V packed slots -> [1,Hq,D]
no full K/V materialization; temp scores only
correctness vs dequant top-k reference: ~1e-4 max abs error
65K rows: ~1.05-1.15 ms selected-page path, temp scores 7 MiB
```

Phase 2b candidate-fusion receipt:

- [`../../bench/evidence-paged-kv-page-candidate-triton-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-page-candidate-triton-2026-05-19/RESULTS.md)

Phase 2b result:

```txt
chunk-local exact top-k candidates over real packed slots
correctness restored: ~1e-4 max abs error vs dequant exact top-k reference
K=32 at 65K rows: ~1.46 ms, temp candidates 5.25 MiB (75% of full-score temp)
K=128 at 65K rows: ~6.42 ms, temp candidates 10.50 MiB (1.5x full-score temp)
readout: partially falsified — less memory for K=32, but slower than Phase 2a; K=128 worse
```

Current hook candidate decision:

```txt
Prefer Phase 2a for any guarded runtime hook.
Do not install Phase 2b into serving unless candidate storage/local selection is redesigned.
```

Phase 2c fused candidate-selection v2 design:

- [`FUSED-CANDIDATE-SELECTION-V2-DESIGN.md`](FUSED-CANDIDATE-SELECTION-V2-DESIGN.md)
- [`../../07-scripts/vllm-hook/epkv-fused-candidate-selection-v2-harness.py`](../../07-scripts/vllm-hook/epkv-fused-candidate-selection-v2-harness.py)

Phase 2c targets the specific Phase 2b weakness: replacing the Torch global `topk`/`softmax` over candidates with a Triton global candidate selection + softmax kernel, while also storing candidate positions as `int32`.

Phase 2c GPU receipt:

- [`../../bench/evidence-paged-kv-fused-candidate-selection-v2-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-fused-candidate-selection-v2-2026-05-19/RESULTS.md)

Phase 2c result:

```txt
correctness: max abs <= 0.000199 vs dequant exact topK reference
candidate temp: 6.25–12.5% of full-score temp
candidate temp vs Phase 2b int64 storage: 66.7%
Torch topk/softmax boundary: removed from candidate path
latency: mixed; not a general replacement yet
```

Decision implication:

```txt
Do not install Phase 2c into serving.
Keep as kernel-design evidence: memory improved and Torch boundary removed, but latency remains shape-sensitive.
```

Phase 2a guarded runtime hook receipt:

- [`../../bench/evidence-paged-kv-runtime-hook-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-runtime-hook-2026-05-19/RESULTS.md)

Runtime hook result:

```txt
installed into vLLM TurboQuant backend behind VLLM_EPKV_RUNTIME_HOOK
controlled temporary-on test produced 64 runtime decode events
short prompt smoke succeeded: 7 * 8 -> 56
steady sync timing p50 ~0.194 ms at seq_len 43-45, K=32
service restored to default-off: VLLM_EPKV_RUNTIME_HOOK=0
/health -> HTTP 200 after restore
```

Phase 2a runtime benchmark design:

- [`RUNTIME-BENCHMARK-DESIGN.md`](RUNTIME-BENCHMARK-DESIGN.md)
- [`RUNTIME-GATE-REDESIGN.md`](RUNTIME-GATE-REDESIGN.md)
- [`../../07-scripts/vllm-hook/epkv-runtime-benchmark.py`](../../07-scripts/vllm-hook/epkv-runtime-benchmark.py)

Design readout:

```txt
Track A: offline direct call into runtime_hook.maybe_decode, no service mutation
Track B: optional serving probe only after Track A and explicit infra confirmation
Track C: VLLM_EPKV_RUNTIME_DRY_RUN=1 for telemetry-only fallback to original TurboQuant
Trace: VLLM_EPKV_RUNTIME_TRACE_SELECTION=1 logs compact selected-position summaries
bridge gate: cost/stability/telemetry completeness, not speedup
```

New safety/telemetry flags prepared in the source hook:

```txt
VLLM_EPKV_RUNTIME_DRY_RUN=1
VLLM_EPKV_RUNTIME_TRACE_SELECTION=1
VLLM_EPKV_RUNTIME_TRACE_TOP_N=32
```

When combined with `VLLM_EPKV_RUNTIME_HOOK=1`, dry-run mode executes the Phase 2a kernels and logs timing, but returns `None` so the backend falls back to the original TurboQuant output. Selection tracing logs positions only — sampled selected positions by head plus a histogram — never raw prompt text or token ids. All flags are default-off.

Phase 2a Track A runtime benchmark receipt:

- [`../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md)

Track A result:

```txt
offline direct-call benchmark completed on 4090 while vLLM service stayed healthy
trace telemetry: 272/272 events include selected-position summaries and timing
service after run: /health 200; chat smoke 13*37 -> 481
cost-ratio gate: failed under original p90_hook / p90_original_tq <= 2.5 threshold
readout: telemetry substrate validated; do not run real-prompt hook-on bridge yet under the original gate
```

### Phase 3 — evidence-utilization bridge

- Only after runtime viability: connect selected evidence pages to retrieval/answer-closure fixtures.
- Measure whether runtime-selected pages correspond to answer-closure behavior.

## Evidence-utilization bridge

Bridge spec:

- [`../evidence-utilization/EPKV-BRIDGE-SPEC.md`](../evidence-utilization/EPKV-BRIDGE-SPEC.md)

Bridge intent:

```txt
Do not claim Evidence-Paged KV fixes retrieved≠used.
First connect evidence fixtures to runtime-selected positions/pages so answer closure can be studied as an alignment problem.
```

Recommended first bridge mode after Track A:

```txt
metadata/offline bridge first
baseline default-off answer run remains safe
phase2a hook-on dry-run real-prompt trace is paused until absolute telemetry gate + serving baseline exist
```

Metadata/offline bridge receipts:

- [`../../bench/evidence-utilization-epkv-bridge-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-2026-05-19/RESULTS.md)
- [`../../bench/evidence-utilization-epkv-bridge-tokenized-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-tokenized-2026-05-19/RESULTS.md)
- [`../../bench/evidence-utilization-epkv-bridge-replay-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-replay-2026-05-19/RESULTS.md)
- [`../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md)

Path B serving receipts:

- [`../../bench/evidence-utilization-epkv-serving-baseline-b0-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-serving-baseline-b0-2026-05-19/RESULTS.md)
- [`../../bench/evidence-utilization-epkv-serving-dryrun-b1-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-serving-dryrun-b1-2026-05-19/RESULTS.md)

B1 readout: synthetic dry-run contact succeeded and service was restored to default-off, but event cap was hit before all prompt bands were represented.

B1.1 serving receipt:

- [`../../bench/evidence-utilization-epkv-serving-dryrun-b11-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-serving-dryrun-b11-2026-05-19/RESULTS.md)

B1.1 fixed the event-cap issue and covered all prompt bands (`3232` steady events, cap not hit, `3232/3232` selected summaries). It remains synthetic-only; real-prompt hook-on remains paused.

Offline KV replay v0.3 receipt:

- [`../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md)

v0.3 constructs deterministic synthetic Q/K tensors from token/page bridge spans and runs real offline score+topK to emit selected-position/page overlap records. This validates bridge plumbing only; it is not model attention or serving behavior.

## Stop criteria

Stop or downgrade if:

- metadata preparation dominates runtime;
- vLLM KV layout makes selected evidence access too invasive;
- correctness against selected-subset baseline is unstable;
- hook requires broad production-path changes before any signal.

## Output expected

The first hook milestone should produce:

```txt
bench/evidence-paged-kv-vllm-hook-scout-YYYY-MM-DD/RESULTS.md
```

with:

- hook boundary diagram;
- tensors observed;
- insertion feasibility;
- next experiment decision: proceed / redesign / stop.
