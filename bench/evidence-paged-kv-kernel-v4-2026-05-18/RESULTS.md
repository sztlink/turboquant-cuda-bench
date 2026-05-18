# Evidence-Paged KV CUDA kernel v4 — 2026-05-18

> v4 pipeline: score tiles → top-k/softmax → value accumulation.

## Boundary

Hybrid JIT CUDA microbench: custom CUDA score and value-accumulation kernels; `torch.topk`/`torch.softmax` sit between them. Not a vLLM integration and not a model-quality benchmark.

## Correctness spot-check

| M rows | K | mode | rows/block | max abs error vs PyTorch top-k pipeline |
|---:|---:|---|---:|---:|
| 2048 | 32 | kernel_pages_scores_topk_value | 8 | 0.000001 |
| 2048 | 128 | kernel_pages_scores_topk_value | 8 | 0.000002 |
| 8192 | 32 | kernel_pages_scores_topk_value | 8 | 0.000006 |
| 8192 | 128 | kernel_pages_scores_topk_value | 8 | 0.000005 |

## Results

| mode | M rows | K | pattern | rows/block | p50 ms | effective GB/s |
|---|---:|---:|---|---:|---:|---:|
| pytorch_topk_value_materialized | 2048 | 32 | 16_evidence_pages_flat_index |  | 1.3767 | 0.81 |
| kernel_gather_scores_topk_value | 2048 | 32 | 16_evidence_pages_flat_index | 8 | 0.1516 | 7.37 |
| kernel_pages_scores_topk_value | 2048 | 32 | 16_evidence_pages | 8 | 0.1546 | 7.22 |
| kernel_gather_scores_topk_value | 2048 | 32 | 16_evidence_pages_flat_index | 32 | 0.1516 | 7.37 |
| kernel_pages_scores_topk_value | 2048 | 32 | 16_evidence_pages | 32 | 0.1516 | 7.36 |
| pytorch_topk_value_materialized | 2048 | 128 | 16_evidence_pages_flat_index |  | 1.3906 | 0.84 |
| kernel_gather_scores_topk_value | 2048 | 128 | 16_evidence_pages_flat_index | 8 | 0.1536 | 7.59 |
| kernel_pages_scores_topk_value | 2048 | 128 | 16_evidence_pages | 8 | 0.1528 | 7.63 |
| kernel_gather_scores_topk_value | 2048 | 128 | 16_evidence_pages_flat_index | 32 | 0.1518 | 7.68 |
| kernel_pages_scores_topk_value | 2048 | 128 | 16_evidence_pages | 32 | 0.1526 | 7.64 |
| pytorch_topk_value_materialized | 8192 | 32 | 16_evidence_pages_flat_index |  | 1.3494 | 3.27 |
| kernel_gather_scores_topk_value | 8192 | 32 | 16_evidence_pages_flat_index | 8 | 0.1364 | 32.33 |
| kernel_pages_scores_topk_value | 8192 | 32 | 16_evidence_pages | 8 | 0.1516 | 29.10 |
| kernel_gather_scores_topk_value | 8192 | 32 | 16_evidence_pages_flat_index | 32 | 0.1444 | 30.54 |
| kernel_pages_scores_topk_value | 8192 | 32 | 16_evidence_pages | 32 | 0.1485 | 29.70 |
| pytorch_topk_value_materialized | 8192 | 128 | 16_evidence_pages_flat_index |  | 1.3875 | 3.21 |
| kernel_gather_scores_topk_value | 8192 | 128 | 16_evidence_pages_flat_index | 8 | 0.1413 | 31.56 |
| kernel_pages_scores_topk_value | 8192 | 128 | 16_evidence_pages | 8 | 0.1468 | 30.37 |
| kernel_gather_scores_topk_value | 8192 | 128 | 16_evidence_pages_flat_index | 32 | 0.1437 | 31.02 |
| kernel_pages_scores_topk_value | 8192 | 128 | 16_evidence_pages | 32 | 0.1434 | 31.09 |
| pytorch_topk_value_materialized | 32768 | 32 | 16_evidence_pages_flat_index |  | 1.3711 | 12.82 |
| kernel_gather_scores_topk_value | 32768 | 32 | 16_evidence_pages_flat_index | 8 | 0.3645 | 48.24 |
| kernel_pages_scores_topk_value | 32768 | 32 | 16_evidence_pages | 8 | 0.3636 | 48.35 |
| kernel_gather_scores_topk_value | 32768 | 32 | 16_evidence_pages_flat_index | 32 | 0.3440 | 51.12 |
| kernel_pages_scores_topk_value | 32768 | 32 | 16_evidence_pages | 32 | 0.3277 | 53.66 |
| pytorch_topk_value_materialized | 32768 | 128 | 16_evidence_pages_flat_index |  | 1.3281 | 13.28 |
| kernel_gather_scores_topk_value | 32768 | 128 | 16_evidence_pages_flat_index | 8 | 0.3381 | 52.15 |
| kernel_pages_scores_topk_value | 32768 | 128 | 16_evidence_pages | 8 | 0.3477 | 50.70 |
| kernel_gather_scores_topk_value | 32768 | 128 | 16_evidence_pages_flat_index | 32 | 0.3268 | 53.95 |
| kernel_pages_scores_topk_value | 32768 | 128 | 16_evidence_pages | 32 | 0.3401 | 51.84 |
| pytorch_topk_value_materialized | 131072 | 32 | 16_evidence_pages_flat_index |  | 2.8910 | 24.31 |
| kernel_gather_scores_topk_value | 131072 | 32 | 16_evidence_pages_flat_index | 8 | 0.3052 | 230.29 |
| kernel_pages_scores_topk_value | 131072 | 32 | 16_evidence_pages | 8 | 0.3093 | 227.22 |
| kernel_gather_scores_topk_value | 131072 | 32 | 16_evidence_pages_flat_index | 32 | 0.2867 | 245.09 |
| kernel_pages_scores_topk_value | 131072 | 32 | 16_evidence_pages | 32 | 0.2846 | 246.94 |
| pytorch_topk_value_materialized | 131072 | 128 | 16_evidence_pages_flat_index |  | 2.9051 | 24.21 |
| kernel_gather_scores_topk_value | 131072 | 128 | 16_evidence_pages_flat_index | 8 | 0.2895 | 242.88 |
| kernel_pages_scores_topk_value | 131072 | 128 | 16_evidence_pages | 8 | 0.3022 | 232.67 |
| kernel_gather_scores_topk_value | 131072 | 128 | 16_evidence_pages_flat_index | 32 | 0.2826 | 248.82 |
| kernel_pages_scores_topk_value | 131072 | 128 | 16_evidence_pages | 32 | 0.2660 | 264.42 |

## Readout

- v4 is the first end-to-end attention-like receipt: scores are produced, top-k/softmax selects evidence, and values are accumulated into `[heads, dim]` output.
- This is intentionally labeled hybrid: top-k/softmax are Torch CUDA calls, while score and value accumulation are custom kernels.
- The key architectural comparison is materialized PyTorch top-k/value vs custom score+value kernels over gather/page evidence layouts.
- Next step: custom top-k/softmax or a vLLM-side experimental attention hook.
