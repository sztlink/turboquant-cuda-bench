# Evidence-Paged KV CUDA kernel v6 — 2026-05-18

> v6 fuses per-page score generation with page-local top-k, avoiding full `[M, H]` score materialization.

## Boundary

Custom CUDA receipt for `K=32`: per-page local top-k candidates → global merge/softmax → value accumulation. Not a vLLM integration. K=128 is intentionally out of scope for this v6.

## Correctness spot-check

| M rows | K | threads/block | mode | max abs error vs PyTorch top-k pipeline |
|---:|---:|---:|---|---:|
| 8192 | 32 | 64 | v6_fused_page_local_topk_value | 0.000009 |

## Results

| mode | M rows | K | pattern | threads/block | p50 ms | effective GB/s |
|---|---:|---:|---|---:|---:|---:|
| pytorch_topk_value_materialized | 8192 | 32 | flat_index |  | 0.5860 | 7.30 |
| v5_pages_materialized_scores_custom_topk_value | 8192 | 32 | 16_evidence_pages |  | 0.3277 | 13.06 |
| v6_fused_page_local_topk_value | 8192 | 32 | 16_evidence_pages | 64 | 0.3901 | 10.97 |
| pytorch_topk_value_materialized | 32768 | 32 | flat_index |  | 0.9492 | 17.97 |
| v5_pages_materialized_scores_custom_topk_value | 32768 | 32 | 16_evidence_pages |  | 0.4204 | 40.57 |
| v6_fused_page_local_topk_value | 32768 | 32 | 16_evidence_pages | 64 | 0.7196 | 23.70 |
| pytorch_topk_value_materialized | 131072 | 32 | flat_index |  | 2.9133 | 23.40 |
| v5_pages_materialized_scores_custom_topk_value | 131072 | 32 | 16_evidence_pages |  | 0.7127 | 95.66 |
| v6_fused_page_local_topk_value | 131072 | 32 | 16_evidence_pages | 64 | 1.9958 | 34.16 |
| pytorch_topk_value_materialized | 262144 | 32 | flat_index |  | 5.5050 | 24.77 |
| v5_pages_materialized_scores_custom_topk_value | 262144 | 32 | 16_evidence_pages |  | 1.0997 | 123.97 |
| v6_fused_page_local_topk_value | 262144 | 32 | 16_evidence_pages | 64 | 3.6321 | 37.54 |

## Readout

- v6 is the first Evidence-Paged receipt that does not materialize all selected scores before top-k.
- Each page/head block produces local top-k candidates; a tiny global merge picks final top-k per head; value accumulation reuses the page table.
- This is the correct architectural shape, but stage-1 row scoring is intentionally simple and not yet warp-tiled over D.
- Next step: warp-tiled per-row scoring inside the fused page-local top-k, or a vLLM-side hook if the receipt is sufficient.
