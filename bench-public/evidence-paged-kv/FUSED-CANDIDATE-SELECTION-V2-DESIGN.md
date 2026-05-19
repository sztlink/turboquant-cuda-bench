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
