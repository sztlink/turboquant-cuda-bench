# Evidence-Paged KV CUDA kernel v5 — 2026-05-18

> v5 replaces `torch.topk`/`torch.softmax` with a staged custom CUDA top-k/softmax receipt.

## Boundary

Custom CUDA score kernels + staged custom top-k/softmax + custom value accumulation. Top-k is not fully fused into score generation; it materializes scores and uses per-chunk single-thread candidate selection. Not vLLM integration.

## Correctness spot-check

| M rows | K | B chunks/head | mode | max abs error vs PyTorch top-k pipeline |
|---:|---:|---:|---|---:|
| 8192 | 32 | 64 | kernel_pages_custom_topk_value | 0.000009 |
| 8192 | 128 | 64 | kernel_pages_custom_topk_value | 0.000009 |

## Results

| mode | M rows | K | B chunks/head | pattern | p50 ms | effective GB/s |
|---|---:|---:|---:|---|---:|---:|
| pytorch_topk_value_materialized | 8192 | 32 |  | flat_index | 1.4172 | 3.11 |
| kernel_gather_custom_topk_value | 8192 | 32 | 32 | flat_index | 0.3308 | 13.33 |
| kernel_pages_custom_topk_value | 8192 | 32 | 32 | 16_evidence_pages | 0.3338 | 13.21 |
| kernel_gather_custom_topk_value | 8192 | 32 | 64 | flat_index | 0.3604 | 12.23 |
| kernel_pages_custom_topk_value | 8192 | 32 | 64 | 16_evidence_pages | 0.3410 | 12.93 |
| pytorch_topk_value_materialized | 8192 | 128 |  | flat_index | 0.5652 | 7.89 |
| kernel_gather_custom_topk_value | 8192 | 128 | 32 | flat_index | 2.7308 | 1.63 |
| kernel_pages_custom_topk_value | 8192 | 128 | 32 | 16_evidence_pages | 2.5272 | 1.76 |
| kernel_gather_custom_topk_value | 8192 | 128 | 64 | flat_index | 3.0116 | 1.48 |
| kernel_pages_custom_topk_value | 8192 | 128 | 64 | 16_evidence_pages | 3.0392 | 1.47 |
| pytorch_topk_value_materialized | 32768 | 32 |  | flat_index | 1.4124 | 12.45 |
| kernel_gather_custom_topk_value | 32768 | 32 | 32 | flat_index | 0.4014 | 43.81 |
| kernel_pages_custom_topk_value | 32768 | 32 | 32 | 16_evidence_pages | 0.3982 | 44.15 |
| kernel_gather_custom_topk_value | 32768 | 32 | 64 | flat_index | 0.3901 | 45.07 |
| kernel_pages_custom_topk_value | 32768 | 32 | 64 | 16_evidence_pages | 0.3942 | 44.60 |
| pytorch_topk_value_materialized | 32768 | 128 |  | flat_index | 1.3666 | 12.90 |
| kernel_gather_custom_topk_value | 32768 | 128 | 32 | flat_index | 3.0505 | 5.78 |
| kernel_pages_custom_topk_value | 32768 | 128 | 32 | 16_evidence_pages | 3.0507 | 5.78 |
| kernel_gather_custom_topk_value | 32768 | 128 | 64 | flat_index | 3.7402 | 4.71 |
| kernel_pages_custom_topk_value | 32768 | 128 | 64 | 16_evidence_pages | 3.7334 | 4.72 |
| pytorch_topk_value_materialized | 131072 | 32 |  | flat_index | 2.9286 | 24.00 |
| kernel_gather_custom_topk_value | 131072 | 32 | 32 | flat_index | 0.7803 | 90.06 |
| kernel_pages_custom_topk_value | 131072 | 32 | 32 | 16_evidence_pages | 0.7885 | 89.13 |
| kernel_gather_custom_topk_value | 131072 | 32 | 64 | flat_index | 0.6451 | 108.93 |
| kernel_pages_custom_topk_value | 131072 | 32 | 64 | 16_evidence_pages | 0.6540 | 107.46 |
| pytorch_topk_value_materialized | 131072 | 128 |  | flat_index | 2.9020 | 24.23 |
| kernel_gather_custom_topk_value | 131072 | 128 | 32 | flat_index | 3.8728 | 18.16 |
| kernel_pages_custom_topk_value | 131072 | 128 | 32 | 16_evidence_pages | 3.8840 | 18.11 |
| kernel_gather_custom_topk_value | 131072 | 128 | 64 | flat_index | 4.7698 | 14.74 |
| kernel_pages_custom_topk_value | 131072 | 128 | 64 | 16_evidence_pages | 4.7930 | 14.67 |

## Readout

- v5 removes Torch top-k/softmax from the kernel pipeline, but the top-k implementation is intentionally simple/staged.
- This is a receipt for semantic shape and integration boundary, not a claim of optimal top-k performance.
- Next step: fuse score generation with candidate top-k per page, then merge page candidates globally.
