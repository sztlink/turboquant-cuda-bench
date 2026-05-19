# Evidence-Paged KV Phase 2a — selected-page Triton harness — planned

## Status

Script prepared, not run yet.

```txt
07-scripts/vllm-hook/epkv-selected-page-triton-harness.py
```

## Intended boundary

```txt
score: block_table + packed FP8-K slots -> Triton scores [M,Hq]
selection: torch.topk + torch.softmax
value: block_table + packed 4-bit-V slots + top positions/weights -> Triton output [1,Hq,D]
layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
```

## Why this matters

This is the first Phase 2a path designed to read real vLLM packed TurboQuant slots directly for both scores and values.

It should avoid full K/V materialization. It will still materialize the score matrix `[M,Hq]` and still uses Torch top-k/softmax in the middle, so it is a **v4-style** runtime-layout bridge, not a production kernel.

## Run requirement

Running this on the 4090 is an infra benchmark and should use the normal stop-run-restore protocol:

```txt
CONFIRMAR:INFRA rodar Phase 2a selected-page Triton harness na 4090
```

## Non-claims

- Not production attention.
- Not installed into serving.
- Not a serving speedup claim.
- Not a model-quality or evidence-utilization claim.
- Not a PagedAttention/FlashAttention comparison.
