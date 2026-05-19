# Phase 2c — fused candidate selection v2 design

> Status: harness prepared, GPU benchmark not run in this commit.

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

## Run command, if infra-confirmed

On the 4090 vLLM environment:

```bash
/home/felipe/vllm-lab/venv-tq-fresh-20260515/bin/python \
  /home/felipe/vllm-lab/epkv-fused-candidate-selection-v2-harness.py
```

Expected remote output directory:

```txt
/home/felipe/vllm-lab/evidence-paged-kv-fused-candidate-selection-v2-2026-05-19/
```
