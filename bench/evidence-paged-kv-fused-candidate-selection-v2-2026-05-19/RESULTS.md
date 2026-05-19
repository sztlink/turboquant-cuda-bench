# Evidence-Paged KV Phase 2c — fused candidate selection v2 — 2026-05-19

> Offline candidate-selection v2 over real vLLM TurboQuant packed slots. Triton global top-k/softmax replaces the Phase 2b Torch boundary.

## Boundary

```txt
local candidates: block_table + packed FP8-K slots -> [chunks,Hq,K] with int32 positions
global selection: Triton top-k + softmax over candidates
value: packed 4-bit-V slots + selected positions/weights -> [1,Hq,D]
exactness: local K per chunk preserves global top-K
layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
serving: no
```

## Correctness

| M rows | K | chunk rows | pattern | check | max abs | mean abs |
|---:|---:|---:|---|---|---:|---:|
| 8192 | 32 | 512 | contiguous_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000144 | 0.000029 |
| 8192 | 32 | 1024 | contiguous_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000144 | 0.000029 |
| 8192 | 32 | 512 | sparse_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000164 | 0.000029 |
| 8192 | 32 | 1024 | sparse_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000164 | 0.000029 |
| 32768 | 32 | 512 | contiguous_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000198 | 0.000029 |
| 32768 | 32 | 1024 | contiguous_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000198 | 0.000029 |
| 32768 | 32 | 512 | sparse_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000142 | 0.000030 |
| 32768 | 32 | 1024 | sparse_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000142 | 0.000030 |
| 65536 | 32 | 512 | contiguous_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000140 | 0.000029 |
| 65536 | 32 | 1024 | contiguous_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000140 | 0.000029 |
| 65536 | 32 | 512 | sparse_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000140 | 0.000029 |
| 65536 | 32 | 1024 | sparse_pages | fused_candidate_v2_vs_dequant_exact_topk_reference | 0.000140 | 0.000029 |

## Timings

| mode | M rows | K | chunk rows | pattern | p50 ms | p90 ms | candidates/head | candidate temp MiB | full-score equiv MiB | temp ratio |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| original_turboquant_decode_full_softmax | 8192 |  |  | contiguous_pages | 0.0943 | 0.1560 |  | 0.00 | 0.00 |  |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 8192 | 32 | 512 | contiguous_pages | 0.1731 | 0.2600 | 512 | 0.11 | 0.88 | 0.125 |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 8192 | 32 | 1024 | contiguous_pages | 0.6716 | 0.7187 | 256 | 0.05 | 0.88 | 0.062 |
| original_turboquant_decode_full_softmax | 8192 |  |  | sparse_pages | 0.3103 | 0.3236 |  | 0.00 | 0.00 |  |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 8192 | 32 | 512 | sparse_pages | 0.6226 | 0.6380 | 512 | 0.11 | 0.88 | 0.125 |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 8192 | 32 | 1024 | sparse_pages | 0.6574 | 0.6720 | 256 | 0.05 | 0.88 | 0.062 |
| original_turboquant_decode_full_softmax | 32768 |  |  | contiguous_pages | 0.9533 | 0.9747 |  | 0.00 | 0.00 |  |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 32768 | 32 | 512 | contiguous_pages | 4.0714 | 4.6788 | 2048 | 0.44 | 3.50 | 0.125 |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 32768 | 32 | 1024 | contiguous_pages | 4.9695 | 5.3520 | 1024 | 0.22 | 3.50 | 0.062 |
| original_turboquant_decode_full_softmax | 32768 |  |  | sparse_pages | 2.3982 | 2.4248 |  | 0.00 | 0.00 |  |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 32768 | 32 | 512 | sparse_pages | 4.7094 | 4.7176 | 2048 | 0.44 | 3.50 | 0.125 |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 32768 | 32 | 1024 | sparse_pages | 5.0600 | 7.7302 | 1024 | 0.22 | 3.50 | 0.062 |
| original_turboquant_decode_full_softmax | 65536 |  |  | contiguous_pages | 4.7073 | 4.7350 |  | 0.00 | 0.00 |  |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 65536 | 32 | 512 | contiguous_pages | 3.8984 | 3.9036 | 4096 | 0.88 | 7.00 | 0.125 |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 65536 | 32 | 1024 | contiguous_pages | 9.8580 | 10.2568 | 2048 | 0.44 | 7.00 | 0.062 |
| original_turboquant_decode_full_softmax | 65536 |  |  | sparse_pages | 4.6295 | 5.0696 |  | 0.00 | 0.00 |  |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 65536 | 32 | 512 | sparse_pages | 0.9243 | 1.0254 | 4096 | 0.88 | 7.00 | 0.125 |
| epkv_fused_candidate_selection_v2_triton_global_topk_softmax | 65536 | 32 | 1024 | sparse_pages | 1.1519 | 1.1593 | 2048 | 0.44 | 7.00 | 0.062 |

## Readout

- This tests the specific Phase 2b weakness: Torch global top-k/softmax over candidates.
- Candidate positions are int32 instead of int64, reducing candidate temp bytes before final top positions are emitted.
- Global selection and softmax are Triton kernels; the candidate path has no `torch.topk` or `torch.softmax` boundary.
- Correctness stayed in the same class as Phase 2a/2b: max abs error <= `0.000199` vs dequant exact topK reference.
- Candidate temp fell to `6.25–12.5%` of full-score temp for tested configs, and to `66.7%` of Phase 2b int64 candidate storage.
- Latency is mixed:
  - positive receipts: `8192 contiguous K=32/chunk=512` p50 `0.173 ms`, and `65536 sparse K=32/chunk=512` p50 `0.924 ms`;
  - negative receipts: `32768` rows are much slower than Phase 2a/2b; `65536 contiguous` is also slower than Phase 2a/2b.
- Readout: the Torch boundary was removed and memory improved, but the single-program global candidate selector is not a general replacement yet. Continue only as kernel design work; do not install into serving.
- This remains offline and is not installed into serving.

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality or evidence-utilization claim.
- Not a comparison against PagedAttention/FlashAttention.
