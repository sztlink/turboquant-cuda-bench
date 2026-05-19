# Evidence-Paged KV Phase 2b — page/chunk candidate Triton harness — 2026-05-19

> Chunk-local exact top-k candidates over real vLLM TurboQuant packed slots. Torch global top-k/softmax remains in the middle.

## Boundary

```txt
local candidates: block_table + packed FP8-K slots -> [chunks,Hq,K]
global selection: torch.topk/softmax over candidates
value: packed 4-bit-V slots + selected positions/weights -> [1,Hq,D]
exactness: local K per chunk preserves global top-K
layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
```

## Correctness

| M rows | K | chunk rows | pattern | check | max abs | mean abs |
|---:|---:|---:|---|---|---:|---:|
| 8192 | 32 | 128 | contiguous_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000144 | 0.000029 |
| 8192 | 128 | 256 | contiguous_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000090 | 0.000015 |
| 8192 | 32 | 128 | sparse_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000164 | 0.000029 |
| 8192 | 128 | 256 | sparse_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000072 | 0.000015 |
| 32768 | 32 | 128 | contiguous_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000198 | 0.000029 |
| 32768 | 128 | 256 | contiguous_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000081 | 0.000015 |
| 32768 | 32 | 128 | sparse_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000142 | 0.000030 |
| 32768 | 128 | 256 | sparse_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000075 | 0.000015 |
| 65536 | 32 | 128 | contiguous_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000140 | 0.000029 |
| 65536 | 128 | 256 | contiguous_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000066 | 0.000015 |
| 65536 | 32 | 128 | sparse_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000140 | 0.000029 |
| 65536 | 128 | 256 | sparse_pages | page_candidate_vs_dequant_exact_topk_reference | 0.000066 | 0.000015 |

## Timings

| mode | M rows | K | chunk rows | pattern | p50 ms | p90 ms | candidates/head | candidate temp MiB | full-score equiv MiB | temp ratio |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| original_turboquant_decode_full_softmax | 8192 |  |  | contiguous_pages | 0.1204 | 0.2323 |  | 0.00 | 0.00 |  |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 8192 | 32 | 128 | contiguous_pages | 0.2847 | 0.3481 | 2048 | 0.66 | 0.88 | 0.750 |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 8192 | 128 | 256 | contiguous_pages | 0.9941 | 1.0045 | 4096 | 1.31 | 0.88 | 1.500 |
| original_turboquant_decode_full_softmax | 8192 |  |  | sparse_pages | 0.1075 | 0.1159 |  | 0.00 | 0.00 |  |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 8192 | 32 | 128 | sparse_pages | 0.2826 | 0.2882 | 2048 | 0.66 | 0.88 | 0.750 |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 8192 | 128 | 256 | sparse_pages | 0.9798 | 0.9958 | 4096 | 1.31 | 0.88 | 1.500 |
| original_turboquant_decode_full_softmax | 32768 |  |  | contiguous_pages | 0.2570 | 0.2704 |  | 0.00 | 0.00 |  |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 32768 | 32 | 128 | contiguous_pages | 0.8201 | 0.8323 | 8192 | 2.62 | 3.50 | 0.750 |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 32768 | 128 | 256 | contiguous_pages | 3.5492 | 3.5768 | 16384 | 5.25 | 3.50 | 1.500 |
| original_turboquant_decode_full_softmax | 32768 |  |  | sparse_pages | 0.2556 | 0.2643 |  | 0.00 | 0.00 |  |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 32768 | 32 | 128 | sparse_pages | 0.8192 | 0.8316 | 8192 | 2.62 | 3.50 | 0.750 |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 32768 | 128 | 256 | sparse_pages | 3.5287 | 3.5571 | 16384 | 5.25 | 3.50 | 1.500 |
| original_turboquant_decode_full_softmax | 65536 |  |  | contiguous_pages | 0.4506 | 0.4600 |  | 0.00 | 0.00 |  |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 65536 | 32 | 128 | contiguous_pages | 1.5427 | 1.5552 | 16384 | 5.25 | 7.00 | 0.750 |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 65536 | 128 | 256 | contiguous_pages | 6.8106 | 6.8782 | 32768 | 10.50 | 7.00 | 1.500 |
| original_turboquant_decode_full_softmax | 65536 |  |  | sparse_pages | 0.4003 | 0.4033 |  | 0.00 | 0.00 |  |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 65536 | 32 | 128 | sparse_pages | 1.4572 | 1.4653 | 16384 | 5.25 | 7.00 | 0.750 |
| epkv_page_candidate_triton_local_topk_torch_global_topk | 65536 | 128 | 256 | sparse_pages | 6.4164 | 6.5691 | 32768 | 10.50 | 7.00 | 1.500 |

## Readout

- This is the first candidate-reduced path over real packed vLLM TurboQuant slots.
- Correctness is restored after fixing candidate tensor layout: max absolute error stays around `1e-4` vs exact dequant top-k reference.
- It avoids full K/V materialization and avoids full `[M,Hq]` score materialization.
- For `K=32`, candidate temp is 75% of full-score temp (`5.25 MiB` vs `7.00 MiB` at 65K rows), but runtime is slower than Phase 2a.
- For `K=128`, candidate temp is worse than full-score temp (`1.5×`) because candidate positions are stored as int64 and local K is large.
- The hypothesis is therefore **partially falsified**: chunk-local exact candidates reduce score materialization for small K, but the local top-k kernel and candidate traffic do not yet beat the simpler Phase 2a full-score path.
- It remains hybrid because global top-k/softmax are still Torch operations over candidates.
- This is offline and not installed into serving.

## Comparison against Phase 2a

Phase 2a selected-page full-score path at 65K rows:

```txt
K=32 sparse:  ~1.05 ms, temp scores 7.00 MiB
K=128 sparse: ~1.05 ms, temp scores 7.00 MiB
```

Phase 2b candidate path at 65K rows:

```txt
K=32 sparse:  ~1.46 ms, temp candidates 5.25 MiB
K=128 sparse: ~6.42 ms, temp candidates 10.50 MiB
```

Decision implication:

```txt
Do not install Phase 2b candidate path into vLLM serving yet.
Prefer Phase 2a as the current runtime hook candidate.
Only continue candidate fusion if positions are compressed/int32 and local selection is redesigned.
```

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality or evidence-utilization claim.
- Not a comparison against PagedAttention/FlashAttention.
