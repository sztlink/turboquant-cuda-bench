# Evidence-Paged KV CUDA kernel v7 — 2026-05-18

> v7 keeps v6 no-full-score-materialization, but uses warp-per-row scoring inside each page-local top-k block.

## Boundary

Custom CUDA receipt for `K=32`: page-local warp-scored top-k candidates → global merge/softmax → value accumulation. Not a vLLM integration.

## Correctness spot-check

| M rows | K | threads/block | mode | max abs error vs PyTorch top-k pipeline |
|---:|---:|---:|---|---:|
| 8192 | 32 | 256 | v7_fused_page_warp_topk_value | 0.000002 |

## Results

| mode | M rows | K | pattern | threads/block | p50 ms | effective GB/s |
|---|---:|---:|---|---:|---:|---:|
| pytorch_topk_value_materialized | 8192 | 32 | flat_index |  | 0.5913 | 7.24 |
| v5_pages_materialized_scores_custom_topk_value | 8192 | 32 | 16_evidence_pages |  | 0.3348 | 12.78 |
| v7_fused_page_warp_topk_value | 8192 | 32 | 16_evidence_pages | 128 | 0.3185 | 13.43 |
| v7_fused_page_warp_topk_value | 8192 | 32 | 16_evidence_pages | 256 | 0.4424 | 9.67 |
| pytorch_topk_value_materialized | 32768 | 32 | flat_index |  | 0.9759 | 17.48 |
| v5_pages_materialized_scores_custom_topk_value | 32768 | 32 | 16_evidence_pages |  | 0.4178 | 40.83 |
| v7_fused_page_warp_topk_value | 32768 | 32 | 16_evidence_pages | 128 | 0.5059 | 33.72 |
| v7_fused_page_warp_topk_value | 32768 | 32 | 16_evidence_pages | 256 | 0.6727 | 25.36 |
| pytorch_topk_value_materialized | 131072 | 32 | flat_index |  | 2.9122 | 23.41 |
| v5_pages_materialized_scores_custom_topk_value | 131072 | 32 | 16_evidence_pages |  | 0.7076 | 96.35 |
| v7_fused_page_warp_topk_value | 131072 | 32 | 16_evidence_pages | 128 | 1.4520 | 46.95 |
| v7_fused_page_warp_topk_value | 131072 | 32 | 16_evidence_pages | 256 | 1.2446 | 54.78 |
| pytorch_topk_value_materialized | 262144 | 32 | flat_index |  | 5.5241 | 24.68 |
| v5_pages_materialized_scores_custom_topk_value | 262144 | 32 | 16_evidence_pages |  | 1.1112 | 122.69 |
| v7_fused_page_warp_topk_value | 262144 | 32 | 16_evidence_pages | 128 | 2.9296 | 46.54 |
| v7_fused_page_warp_topk_value | 262144 | 32 | 16_evidence_pages | 256 | 1.8698 | 72.92 |

## Readout

- v7 fixes v6's main flaw: row scoring is warp-per-row instead of serial-over-D.
- It still avoids materializing the full `[M,H]` score tensor before top-k.
- Compare against v5 to see whether avoiding score materialization is now worth the local top-k overhead.
- Next step if v7 wins: package this as the Evidence-Paged KV kernel receipt. If it does not, the right target is vLLM hook around the v5-style materialized-score path.
