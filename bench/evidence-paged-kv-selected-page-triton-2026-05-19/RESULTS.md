# Evidence-Paged KV Phase 2a — selected-page Triton harness — 2026-05-19

> Triton score/value kernels over real vLLM TurboQuant packed slots. Torch top-k/softmax remains in the middle.

## Boundary

```txt
score: block_table + packed FP8-K slots -> scores [M,Hq]
selection: torch.topk + torch.softmax
value: block_table + packed 4-bit-V slots + top positions/weights -> [1,Hq,D]
layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
```

## Correctness

| M rows | K | pattern | check | max abs | mean abs |
|---:|---:|---|---|---:|---:|
| 8192 | 32 | contiguous_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000144 | 0.000029 |
| 8192 | 128 | contiguous_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000090 | 0.000015 |
| 8192 | 32 | sparse_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000164 | 0.000029 |
| 8192 | 128 | sparse_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000072 | 0.000015 |
| 32768 | 32 | contiguous_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000198 | 0.000029 |
| 32768 | 128 | contiguous_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000081 | 0.000015 |
| 32768 | 32 | sparse_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000142 | 0.000030 |
| 32768 | 128 | sparse_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000075 | 0.000015 |
| 65536 | 32 | contiguous_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000140 | 0.000029 |
| 65536 | 128 | contiguous_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000066 | 0.000015 |
| 65536 | 32 | sparse_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000140 | 0.000029 |
| 65536 | 128 | sparse_pages | epkv_triton_topk_vs_dequant_topk_reference | 0.000066 | 0.000015 |

## Timings

| mode | M rows | K | pattern | p50 ms | p90 ms | temp scores MiB | temp KV MiB |
|---|---:|---:|---|---:|---:|---:|---:|
| original_turboquant_decode_full_softmax | 8192 |  | contiguous_pages | 0.0932 | 0.1521 | 0.00 | 0.00 |
| epkv_triton_scores_from_packed_slots | 8192 |  | contiguous_pages | 0.1475 | 0.4921 | 0.88 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 8192 | 32 | contiguous_pages | 0.2232 | 0.2510 | 0.88 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 8192 | 128 | contiguous_pages | 2.1555 | 2.5449 | 0.88 | 0.00 |
| original_turboquant_decode_full_softmax | 8192 |  | sparse_pages | 0.7004 | 1.1372 | 0.00 | 0.00 |
| epkv_triton_scores_from_packed_slots | 8192 |  | sparse_pages | 1.1612 | 1.9454 | 0.88 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 8192 | 32 | sparse_pages | 2.0572 | 2.5106 | 0.88 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 8192 | 128 | sparse_pages | 2.1617 | 2.2200 | 0.88 | 0.00 |
| original_turboquant_decode_full_softmax | 32768 |  | contiguous_pages | 0.2847 | 2.4453 | 0.00 | 0.00 |
| epkv_triton_scores_from_packed_slots | 32768 |  | contiguous_pages | 0.5078 | 0.5194 | 3.50 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 32768 | 32 | contiguous_pages | 0.6582 | 0.6994 | 3.50 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 32768 | 128 | contiguous_pages | 0.6625 | 0.6748 | 3.50 | 0.00 |
| original_turboquant_decode_full_softmax | 32768 |  | sparse_pages | 0.2335 | 0.2406 | 0.00 | 0.00 |
| epkv_triton_scores_from_packed_slots | 32768 |  | sparse_pages | 0.4811 | 0.4904 | 3.50 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 32768 | 32 | sparse_pages | 0.6595 | 0.6656 | 3.50 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 32768 | 128 | sparse_pages | 0.6502 | 0.6765 | 3.50 | 0.00 |
| original_turboquant_decode_full_softmax | 65536 |  | contiguous_pages | 0.4466 | 0.4615 | 0.00 | 0.00 |
| epkv_triton_scores_from_packed_slots | 65536 |  | contiguous_pages | 0.9112 | 0.9574 | 7.00 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 65536 | 32 | contiguous_pages | 1.1479 | 1.1539 | 7.00 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 65536 | 128 | contiguous_pages | 1.0604 | 1.0863 | 7.00 | 0.00 |
| original_turboquant_decode_full_softmax | 65536 |  | sparse_pages | 0.4220 | 0.4366 | 0.00 | 0.00 |
| epkv_triton_scores_from_packed_slots | 65536 |  | sparse_pages | 0.8735 | 0.8826 | 7.00 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 65536 | 32 | sparse_pages | 1.0537 | 1.0834 | 7.00 | 0.00 |
| epkv_v4_style_triton_scores_torch_topk_triton_value | 65536 | 128 | sparse_pages | 1.0465 | 1.0566 | 7.00 | 0.00 |

## Readout

- This is the first selected-page path that reads the real packed vLLM TurboQuant slots directly for both scores and values.
- It avoids full K/V materialization; only the score matrix `[M,Hq]` is materialized.
- Correctness vs the dequantized top-k reference is stable at ~`1e-4` max absolute error.
- The previous Phase 1 Python/Torch-loop top-k reference was ~12 ms at 65K rows; this Phase 2a Triton score/value path is ~1.05–1.15 ms at 65K rows while avoiding temporary K/V materialization.
- It remains v4-style because top-k/softmax are Torch operations in the middle.
- This is still offline. It is not installed into the serving path.

## Phase 2b target

The bottleneck is now clear:

```txt
scores materialization [M,Hq] + Torch top-k/softmax boundary
```

Phase 2b should either:

1. fuse per-page candidate selection before materializing full scores; or
2. install this Phase 2a path behind an env flag only for controlled selected-page decode experiments, with no production claim.

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality or evidence-utilization claim.
- Not a comparison against PagedAttention/FlashAttention.
