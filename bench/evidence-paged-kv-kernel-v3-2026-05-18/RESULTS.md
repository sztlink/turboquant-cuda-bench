# Evidence-Paged KV CUDA kernel v3 — 2026-05-18

> v3 emits attention-like score tiles `[selected_rows, heads]`; no scalar global dot/atomic reduction.

## Boundary

JIT CUDA extension microbench. Not a vLLM integration and not a model-quality benchmark.

## Correctness spot-check

| M rows | mode | rows/block | max abs error vs PyTorch float32 |
|---:|---|---:|---:|
| 512 | kernel_pages_scores_warp | 8 | 0.000023 |
| 2048 | kernel_pages_scores_warp | 8 | 0.000023 |
| 8192 | kernel_pages_scores_warp | 8 | 0.000031 |

## Results

| mode | M rows | pattern | rows/block | p50 ms | effective GB/s |
|---|---:|---|---:|---:|---:|
| pytorch_scores_materialized | 512 | 16_evidence_pages_flat_index |  | 0.2744 | 1.00 |
| kernel_gather_scores_warp | 512 | 16_evidence_pages_flat_index | 4 | 0.0378 | 7.26 |
| kernel_pages_scores_warp | 512 | 16_evidence_pages | 4 | 0.0379 | 7.24 |
| kernel_gather_scores_warp | 512 | 16_evidence_pages_flat_index | 8 | 0.0378 | 7.26 |
| kernel_pages_scores_warp | 512 | 16_evidence_pages | 8 | 0.0379 | 7.24 |
| kernel_gather_scores_warp | 512 | 16_evidence_pages_flat_index | 16 | 0.0378 | 7.26 |
| kernel_pages_scores_warp | 512 | 16_evidence_pages | 16 | 0.0379 | 7.24 |
| kernel_gather_scores_warp | 512 | 16_evidence_pages_flat_index | 32 | 0.0375 | 7.32 |
| kernel_pages_scores_warp | 512 | 16_evidence_pages | 32 | 0.0387 | 7.10 |
| pytorch_scores_materialized | 2048 | 16_evidence_pages_flat_index |  | 0.2499 | 4.39 |
| kernel_gather_scores_warp | 2048 | 16_evidence_pages_flat_index | 4 | 0.0378 | 29.05 |
| kernel_pages_scores_warp | 2048 | 16_evidence_pages | 4 | 0.0379 | 28.97 |
| kernel_gather_scores_warp | 2048 | 16_evidence_pages_flat_index | 8 | 0.0372 | 29.55 |
| kernel_pages_scores_warp | 2048 | 16_evidence_pages | 8 | 0.0376 | 29.19 |
| kernel_gather_scores_warp | 2048 | 16_evidence_pages_flat_index | 16 | 0.0375 | 29.24 |
| kernel_pages_scores_warp | 2048 | 16_evidence_pages | 16 | 0.0379 | 28.97 |
| kernel_gather_scores_warp | 2048 | 16_evidence_pages_flat_index | 32 | 0.0372 | 29.55 |
| kernel_pages_scores_warp | 2048 | 16_evidence_pages | 32 | 0.0377 | 29.15 |
| pytorch_scores_materialized | 8192 | 16_evidence_pages_flat_index |  | 0.2414 | 18.19 |
| kernel_gather_scores_warp | 8192 | 16_evidence_pages_flat_index | 4 | 0.0492 | 89.33 |
| kernel_pages_scores_warp | 8192 | 16_evidence_pages | 4 | 0.0543 | 80.91 |
| kernel_gather_scores_warp | 8192 | 16_evidence_pages_flat_index | 8 | 0.0536 | 81.87 |
| kernel_pages_scores_warp | 8192 | 16_evidence_pages | 8 | 0.0543 | 80.91 |
| kernel_gather_scores_warp | 8192 | 16_evidence_pages_flat_index | 16 | 0.0533 | 82.31 |
| kernel_pages_scores_warp | 8192 | 16_evidence_pages | 16 | 0.0550 | 79.87 |
| kernel_gather_scores_warp | 8192 | 16_evidence_pages_flat_index | 32 | 0.0462 | 94.96 |
| kernel_pages_scores_warp | 8192 | 16_evidence_pages | 32 | 0.0473 | 92.90 |
| pytorch_scores_materialized | 32768 | 16_evidence_pages_flat_index |  | 0.6287 | 27.93 |
| kernel_gather_scores_warp | 32768 | 16_evidence_pages_flat_index | 4 | 0.0348 | 504.47 |
| kernel_pages_scores_warp | 32768 | 16_evidence_pages | 4 | 0.0351 | 499.88 |
| kernel_gather_scores_warp | 32768 | 16_evidence_pages_flat_index | 8 | 0.0351 | 499.88 |
| kernel_pages_scores_warp | 32768 | 16_evidence_pages | 8 | 0.0348 | 504.47 |
| kernel_gather_scores_warp | 32768 | 16_evidence_pages_flat_index | 16 | 0.0348 | 504.47 |
| kernel_pages_scores_warp | 32768 | 16_evidence_pages | 16 | 0.0348 | 504.47 |
| kernel_gather_scores_warp | 32768 | 16_evidence_pages_flat_index | 32 | 0.0348 | 504.93 |
| kernel_pages_scores_warp | 32768 | 16_evidence_pages | 32 | 0.0358 | 490.06 |
| pytorch_scores_materialized | 131072 | 16_evidence_pages_flat_index |  | 2.5804 | 27.23 |
| kernel_gather_scores_warp | 131072 | 16_evidence_pages_flat_index | 4 | 0.0901 | 779.64 |
| kernel_pages_scores_warp | 131072 | 16_evidence_pages | 4 | 0.0930 | 755.49 |
| kernel_gather_scores_warp | 131072 | 16_evidence_pages_flat_index | 8 | 0.0900 | 781.02 |
| kernel_pages_scores_warp | 131072 | 16_evidence_pages | 8 | 0.0943 | 745.23 |
| kernel_gather_scores_warp | 131072 | 16_evidence_pages_flat_index | 16 | 0.0942 | 745.74 |
| kernel_pages_scores_warp | 131072 | 16_evidence_pages | 16 | 0.1012 | 693.89 |
| kernel_gather_scores_warp | 131072 | 16_evidence_pages_flat_index | 32 | 0.1382 | 508.21 |
| kernel_pages_scores_warp | 131072 | 16_evidence_pages | 32 | 0.1413 | 497.16 |

## Readout

- v3 changes the unit of work from one scalar receipt to score tiles shaped like attention logits.
- `kernel_pages_scores_warp` maps grid = page × head × row-tile and one warp = one selected-row/head score.
- This preserves the Evidence-Paged KV premise while removing scalar atomic reduction from v1/v2.
- Next step: add softmax/top-k/value accumulation or wire this score path behind a vLLM-side experimental attention hook.
