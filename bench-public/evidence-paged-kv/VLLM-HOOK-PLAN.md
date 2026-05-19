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

Phase 2c.1 latency-breakdown receipt:

- [`../../bench/evidence-paged-kv-fused-candidate-breakdown-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-fused-candidate-breakdown-2026-05-19/RESULTS.md)

Breakdown result:

```txt
global_select_only p50: ~0.016–0.040 ms
value_only p50: ~0.029–0.054 ms
candidate_only p50: ~0.157–1.040 ms
full_path p50: ~0.171–1.053 ms
```

Updated decision implication:

```txt
The global Triton topK/softmax selector is not the bottleneck.
The value kernel is not the bottleneck.
The local candidate-generation kernel is the bottleneck.
Next kernel work should optimize local candidate generation, not global merge/softmax.
```

Phase 2c.2 approximate local-top sweep receipt:

- [`../../bench/evidence-paged-kv-approx-local-top-sweep-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-approx-local-top-sweep-2026-05-19/RESULTS.md)

Phase 2c.2 result on random synthetic tensors:

```txt
GLOBAL_K=32, chunk_rows=512
LOCAL_TOP=4: temp 1.56% of full-score, exact at 32768/65536, ~0.97 recall at 8192
LOCAL_TOP=8: temp 3.12% of full-score, recall@32 1.000 across tested shapes
```

Decision implication:

```txt
Approximate local-top is promising for kernel design on random fixtures.
LOCAL_TOP=8 is the safer random-fixture candidate than LOCAL_TOP=4.
Do not install into serving; next validate against adversarial/top-heavy score fixtures.
```

Phase 2c.3 adversarial local-top receipt:

- [`../../bench/evidence-paged-kv-adversarial-local-top-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-adversarial-local-top-2026-05-19/RESULTS.md)

Adversarial result:

```txt
one_chunk_32:     local_top=8 recall@32 = 0.25; local_top=32 required
two_chunks_16_16: local_top=8 recall@32 = 0.50; local_top=16 required
spread_32_chunks: local_top=8 exact in both M cases; local_top=4 exact only at 65K
```

Updated decision implication:

```txt
Fixed LOCAL_TOP=8 is not correctness-preserving under top-heavy score concentration.
Required LOCAL_TOP tracks max true-topK concentration per chunk.
Next design needs adaptive/local-overflow detection or exact fallback, not fixed approximate local_top.
```

Phase 2c.4 adaptive overflow guard receipt:

- [`../../bench/evidence-paged-kv-adaptive-local-overflow-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-adaptive-local-overflow-2026-05-19/RESULTS.md)

Adaptive policy result:

```txt
probe LOCAL_TOP=8
if local tail score >= approximate global topK threshold: fallback exact LOCAL_TOP=32
accepted probe cases: 4/8
fallback exact cases: 4/8
adversarial one/two-chunk failures caught and recovered
random/spread cases accepted with recall@32 = 1.0
```

Caveat:

```txt
Current detector uses Torch/CPU for policy validation, not a final GPU kernel.
Adaptive timings include detector wall overhead and are not final kernel performance.
```

Updated decision implication:

```txt
Adaptive overflow guard is conceptually valid.
Next implementation step is a tiny GPU detector/fallback-mask kernel; still do not install into serving.
```

Phase 2c.5 GPU overflow detector receipt:

- [`../../bench/evidence-paged-kv-gpu-overflow-detector-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-gpu-overflow-detector-2026-05-19/RESULTS.md)

GPU detector result:

```txt
Triton detector p50: ~0.0225–0.0352 ms
previous Torch/CPU detector wall: ~0.39–0.42 ms
accepted probe cases: 4/8
fallback exact cases: 4/8
adversarial concentrated cases flagged and recovered
random/spread cases accepted
```

Updated decision implication:

```txt
GPU overflow detector is a viable building block.
Next step is a single adaptive offline path: probe -> GPU detector -> conditional exact fallback.
Still do not install into serving.
```

Phase 2c.6 single adaptive offline path receipt:

- [`../../bench/evidence-paged-kv-adaptive-path-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-adaptive-path-2026-05-19/RESULTS.md)

Adaptive path result:

```txt
accepted probe cases: 4/8
fallback exact cases: 4/8
recall@32: 1.0 across tested random/spread/adversarial fixtures
random/spread: accepted cheap probe
one_chunk/two_chunks adversarial: exact fallback
```

Caveat:

```txt
adaptive wall timing includes Python CPU flag read/branch
```

Updated decision implication:

```txt
Adaptive policy path is coherent offline.
Next blocker is implementation form: remove Python branch/CPU read and express fallback decision as GPU-side mask/control.
Still do not install into serving.
```

Phase 2c.7 GPU-side mask/control receipt:

- [`../../bench/evidence-paged-kv-gpu-mask-control-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-gpu-mask-control-2026-05-19/RESULTS.md)

GPU-side mask/control result:

```txt
GPU-side mask/control preserves exact-reference output in tested cases
select kernel p50: ~0.048–0.081 ms
branchless dual path computes both probe and exact branches
```

Updated decision implication:

```txt
GPU-side mask/control is feasible.
Branchless dual-path is not the performance path because it computes both branches.
Next useful design is compact fallback: reuse probe for unflagged heads and compute exact LOCAL_TOP=32 only for flagged heads/chunks.
Still do not install into serving.
```

Phase 2c.8 compact fallback candidate receipt:

- [`../../bench/evidence-paged-kv-compact-fallback-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-compact-fallback-2026-05-19/RESULTS.md)

Compact fallback result:

```txt
compact fallback preserves exact-reference output in tested cases
random/spread 65K compact full p50: ~0.34 ms
random/spread 65K exact full p50: ~0.96 ms
adversarial all-head fallback 65K compact full p50: ~1.21 ms
adversarial all-head exact full p50: ~0.95 ms
```

Updated decision implication:

```txt
Compact fallback is useful when no heads or few heads are flagged.
When all heads are flagged, compact fallback is slower than exact-only because it pays probe + fallback overhead.
Next useful benchmark: partial-head flag-rate sweep to find the crossover point and decide whether policy should fall back exact-only when many heads are flagged.
Still do not install into serving.
```

Phase 2c.9 compact fallback flag-rate sweep receipt:

- [`../../bench/evidence-paged-kv-compact-fallback-flag-sweep-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-compact-fallback-flag-sweep-2026-05-19/RESULTS.md)

Flag-rate crossover result for `M=65536` synthetic partial-head fixture:

```txt
0/28 observed flags:  compact/exact p50 ratio 0.352
7/28 observed flags:  compact/exact p50 ratio 0.580–0.605
14/28 observed flags: compact/exact p50 ratio 0.836
21/28 observed flags: compact/exact p50 ratio 1.036
28/28 observed flags: compact/exact p50 ratio 1.277
```

Updated decision implication:

```txt
For this shape/fixture, compact fallback remains favorable through observed 14/28 flagged heads (~50%).
At observed 21/28 flagged heads (~75%), exact-only becomes slightly faster.
Candidate policy: if flagged_head_rate >= ~0.75, use exact-only; otherwise use compact fallback.
Before serving integration, validate this threshold on more shapes and sequence lengths.
Still do not install into serving.
```

Phase 2c.10 compact fallback shape sweep receipt:

- [`../../bench/evidence-paged-kv-compact-fallback-shape-sweep-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-compact-fallback-shape-sweep-2026-05-19/RESULTS.md)

Shape sweep result over `M={8192,16384,32768,65536}` synthetic partial-head fixtures:

```txt
threshold policy: exact-only if flagged_head_rate >= 0.75
matches p50 best: 18/20 cases
M=16K..65K: threshold direction held across tested flag rates
M=8K: shape-sensitive; exact-only won at 0 flags and was effectively tied at 14 flags
```

Updated decision implication:

```txt
The 0.75 flag-rate exact-only threshold generalizes directionally across M=16K..65K in this synthetic sweep.
For small M (~8K), compact overhead can erase benefits; policy likely needs a sequence-length guard in addition to flag-rate.
Candidate policy v0:
  if M <= 8192: exact-only or measured fallback disabled
  else if flagged_head_rate >= 0.75: exact-only
  else: compact fallback
Do not install into serving before a broader grid and runtime integration plan.
```

Phase 2c.11 compact fallback policy grid receipt:

- [`../../bench/evidence-paged-kv-compact-fallback-policy-grid-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-compact-fallback-policy-grid-2026-05-19/RESULTS.md)

Policy grid result:

```txt
M values: 4096, 8192, 12288, 16384, 24576, 32768, 49152, 65536
requested flagged heads: 0, 7, 14, 21, 28
best policy accuracy: 40/40 synthetic cases
best seq_guard: 4096
flag_threshold 0.625 and 0.75 tie on sampled grid
```

Updated decision implication:

```txt
Candidate policy v1:
  if M <= 4096: exact-only / compact disabled
  else if flagged_head_rate >= 0.75: exact-only
  else: compact fallback

The 0.625 threshold also fits this grid, but 0.75 preserves the previous boundary and is equivalent for sampled rates.
Timing is shape-sensitive; some non-power-of-two lengths show large p50 swings.
Do not install into serving. Next: runtime integration design doc with invariants, telemetry, kill switch, and exact-restore requirements.
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
