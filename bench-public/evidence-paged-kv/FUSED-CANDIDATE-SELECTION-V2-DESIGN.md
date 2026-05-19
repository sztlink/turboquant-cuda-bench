# Phase 2c — fused candidate selection v2 design

> Status: harness prepared and GPU benchmark receipt recorded.

## Question

Can the Phase 2b weakness be isolated by replacing this boundary:

```txt
candidate scores/positions -> torch.topk -> torch.softmax -> Triton value
```

with:

```txt
candidate scores/positions -> Triton global topK+softmax -> Triton value
```

## Prepared harness

```txt
07-scripts/vllm-hook/epkv-fused-candidate-selection-v2-harness.py
```

## Boundary

```txt
serving: no
model inference: no
real prompts: no
layout: real vLLM TurboQuant packed slot layout
local candidates: Triton chunk-local topK over FP8-K slots
global selection: Triton topK + softmax over candidates
value: Triton 4-bit-V accumulation
```

## Differences from Phase 2b

- candidate positions are `int32`, not `int64`;
- global topK/softmax are Triton kernels, not Torch operations;
- tested configs are restricted to keep the single-program global candidate selector bounded:

```txt
K=32, chunk_rows=512
K=32, chunk_rows=1024
candidate_count_per_head <= 4096
```

## Success criteria

Against Phase 2a/2b receipts:

```txt
correctness vs dequant exact topK reference: max abs ~1e-4 class
no torch.topk / torch.softmax in candidate path
temp bytes below Phase 2a full-score temp
latency not worse than Phase 2b K=32; ideally approaches Phase 2a
```

## Non-claims

- not production attention;
- not serving;
- not a serving speedup claim;
- not model attention;
- not model-quality or evidence-utilization evidence;
- not a comparison against PagedAttention/FlashAttention.

## Benchmark receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-fused-candidate-selection-v2-2026-05-19/RESULTS.md
```

Remote run command used on 4090:

```bash
/home/felipe/vllm-lab/venv-tq-fresh-20260515/bin/python \
  /home/felipe/vllm-lab/epkv-fused-candidate-selection-v2-harness.py
```

Remote output directory:

```txt
/home/felipe/vllm-lab/evidence-paged-kv-fused-candidate-selection-v2-2026-05-19/
```

Readout:

```txt
correctness: max abs <= 0.000199 vs dequant exact topK reference
candidate temp: 6.25–12.5% of full-score temp
candidate temp vs Phase 2b int64 storage: 66.7%
Torch topk/softmax boundary: removed from candidate path
latency: mixed, not a general replacement yet
```

Decision:

```txt
Do not install into serving.
Keep as kernel-design evidence: memory improved, boundary removed, but latency remains shape-sensitive.
```

## Phase 2c.1 breakdown receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-fused-candidate-breakdown-2026-05-19/RESULTS.md
```

Readout:

```txt
global_select_only p50: ~0.016–0.040 ms
value_only p50: ~0.029–0.054 ms
candidate_only p50: ~0.157–1.040 ms
full_path p50: ~0.171–1.053 ms
```

Decision update:

```txt
The Triton global selector is not the bottleneck.
The value kernel is not the bottleneck.
The local candidate-generation kernel is the bottleneck.
Next work should optimize chunk-local candidate generation, not global merge/softmax.
```

## Phase 2c.2 approximate local-top sweep receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-approx-local-top-sweep-2026-05-19/RESULTS.md
```

Readout on random synthetic tensors:

```txt
GLOBAL_K=32
LOCAL_TOP sweep: 4, 8, 16, 32
chunk_rows=512
local_top=4 temp ratio: 1.56% of full-score temp
local_top=8 temp ratio: 3.12% of full-score temp
local_top=32 temp ratio: 12.5% of full-score temp
```

Observed recall:

```txt
local_top=4: exact in 32768/65536 cases, but only ~0.971–0.977 mean recall at 8192
local_top=8: 1.000 recall@32 in all tested shapes
```

Decision update:

```txt
Approximate local-top is promising for synthetic kernel design.
local_top=8 is the safer next candidate than local_top=4 on random fixtures.
Do not install into serving; next validate against adversarial/top-heavy score fixtures.
```

## Phase 2c.3 adversarial local-top receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-adversarial-local-top-2026-05-19/RESULTS.md
```

Adversarial readout:

```txt
one_chunk_32:     local_top=8 recall@32 = 0.25; local_top=32 required
two_chunks_16_16: local_top=8 recall@32 = 0.50; local_top=16 required
spread_32_chunks: local_top=8 exact in both M cases; local_top=4 exact only at 65K
```

Decision update:

```txt
Fixed LOCAL_TOP=8 is not correctness-preserving under top-heavy score concentration.
Required LOCAL_TOP tracks max true-topK concentration per chunk.
Next design needs adaptive/local-overflow detection or exact fallback, not fixed approximate local_top.
```

## Phase 2c.4 adaptive overflow guard receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-adaptive-local-overflow-2026-05-19/RESULTS.md
```

Policy tested:

```txt
probe LOCAL_TOP=8
compute approximate global topK threshold over probe candidates
if any chunk/head local tail score >= threshold: fallback to exact LOCAL_TOP=32
else accept probe
```

Readout:

```txt
accepted probe cases: 4/8
fallback exact cases: 4/8
random + spread cases accepted with recall@32 = 1.0
one_chunk_32 + two_chunks_16_16 adversarial failures flagged and recovered via fallback
```

Timing caveat:

```txt
Detector uses Torch/CPU in this harness (~0.39–0.42 ms wall), so adaptive timings are not final kernel timings.
```

Decision update:

```txt
Adaptive overflow guard is conceptually valid.
Next implementation step is a tiny GPU detector/fallback-mask kernel; still do not install into serving.
```

## Phase 2c.5 GPU overflow detector receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-gpu-overflow-detector-2026-05-19/RESULTS.md
```

Readout:

```txt
Triton detector p50: ~0.0225–0.0352 ms
previous Torch/CPU detector wall: ~0.39–0.42 ms
accepted probe cases: 4/8
fallback exact cases: 4/8
adversarial concentrated cases flagged and recovered
random/spread cases accepted
```

Decision update:

```txt
GPU overflow detector is a viable building block.
Next step is a single adaptive offline path: probe -> GPU detector -> conditional exact fallback.
Still do not install into serving.
```

## Phase 2c.6 single adaptive offline path receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-adaptive-path-2026-05-19/RESULTS.md
```

Readout:

```txt
accepted probe cases: 4/8
fallback exact cases: 4/8
recall@32: 1.0 across tested random/spread/adversarial fixtures
random/spread: accepted cheap probe
one_chunk/two_chunks adversarial: exact fallback
```

Timing caveat:

```txt
adaptive wall timing includes Python CPU flag read/branch
```

Decision update:

```txt
Adaptive policy path is coherent offline.
Next blocker is implementation form: remove Python branch/CPU read and express fallback decision as GPU-side mask/control.
Still do not install into serving.
```

## Phase 2c.7 GPU-side mask/control receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-gpu-mask-control-2026-05-19/RESULTS.md
```

Readout:

```txt
GPU-side mask/control preserves exact-reference output in tested cases
select kernel p50: ~0.048–0.081 ms
branchless dual path computes both probe and exact branches
```

Decision update:

```txt
GPU-side mask/control is feasible.
Branchless dual-path is not the performance path because it computes both branches.
Next useful design is compact fallback: reuse probe for unflagged heads and compute exact LOCAL_TOP=32 only for flagged heads/chunks.
Still do not install into serving.
```

## Phase 2c.8 compact fallback candidate receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-compact-fallback-2026-05-19/RESULTS.md
```

Readout:

```txt
compact fallback preserves exact-reference output in tested cases
random/spread 65K compact full p50: ~0.34 ms
random/spread 65K exact full p50: ~0.96 ms
adversarial all-head fallback 65K compact full p50: ~1.21 ms
adversarial all-head exact full p50: ~0.95 ms
```

Decision update:

```txt
Compact fallback is useful when no heads or few heads are flagged.
When all heads are flagged, compact fallback is slower than exact-only because it pays probe + fallback overhead.
Next useful benchmark: partial-head flag-rate sweep to find the crossover point and decide whether policy should fall back exact-only when many heads are flagged.
Still do not install into serving.
```

## Phase 2c.9 compact fallback flag-rate sweep receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-compact-fallback-flag-sweep-2026-05-19/RESULTS.md
```

Readout for `M=65536` synthetic partial-head fixture:

```txt
0/28 observed flags:  compact/exact p50 ratio 0.352
7/28 observed flags:  compact/exact p50 ratio 0.580–0.605
14/28 observed flags: compact/exact p50 ratio 0.836
21/28 observed flags: compact/exact p50 ratio 1.036
28/28 observed flags: compact/exact p50 ratio 1.277
```

Decision update:

```txt
For this shape/fixture, compact fallback remains favorable through observed 14/28 flagged heads (~50%).
At observed 21/28 flagged heads (~75%), exact-only becomes slightly faster.
Candidate policy: if flagged_head_rate >= ~0.75, use exact-only; otherwise use compact fallback.
Before serving integration, validate this threshold on more shapes and sequence lengths.
Still do not install into serving.
```

## Phase 2c.10 compact fallback shape sweep receipt

Local repo receipt:

```txt
bench/evidence-paged-kv-compact-fallback-shape-sweep-2026-05-19/RESULTS.md
```

Readout over `M={8192,16384,32768,65536}` synthetic partial-head fixtures:

```txt
threshold policy: exact-only if flagged_head_rate >= 0.75
matches p50 best: 18/20 cases
M=16K..65K: threshold direction held across tested flag rates
M=8K: shape-sensitive; exact-only won at 0 flags and was effectively tied at 14 flags
```

Decision update:

```txt
The 0.75 flag-rate exact-only threshold generalizes directionally across M=16K..65K in this synthetic sweep.
For small M (~8K), compact overhead can erase benefits; policy likely needs a sequence-length guard in addition to flag-rate.
Candidate policy v0:
  if M <= 8192: exact-only or measured fallback disabled
  else if flagged_head_rate >= 0.75: exact-only
  else: compact fallback
Do not install into serving before a broader grid and runtime integration plan.
```
