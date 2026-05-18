# Evidence-Paged KV CUDA kernel v2 — 2026-05-18

> v2 uses block-per-page/head/tile mapping: no per-row page scan.

## Boundary

JIT CUDA extension microbench. Not a vLLM integration and not a model-quality benchmark.

## Results

| mode | M rows | pattern | tile rows | p50 ms | effective GB/s |
|---|---:|---|---:|---:|---:|
| pytorch_materialized | 512 | 16_evidence_pages_flat_index |  | 0.2237 | 1.19 |
| kernel_gather_dequant_dot | 512 | 16_evidence_pages_flat_index |  | 0.0681 | 3.91 |
| kernel_pages_scan_dequant_dot | 512 | 16_evidence_pages |  | 0.0676 | 3.94 |
| kernel_pages_tiled_dequant_dot | 512 | 16_evidence_pages | 16 | 0.0272 | 9.80 |
| kernel_pages_tiled_dequant_dot | 512 | 16_evidence_pages | 32 | 0.0280 | 9.51 |
| kernel_pages_tiled_dequant_dot | 512 | 16_evidence_pages | 64 | 0.0282 | 9.43 |
| kernel_pages_tiled_dequant_dot | 512 | 16_evidence_pages | 128 | 0.0282 | 9.45 |
| kernel_pages_tiled_dequant_dot | 512 | 16_evidence_pages | 256 | 0.0286 | 9.31 |
| kernel_pages_tiled_dequant_dot | 512 | 16_evidence_pages | 512 | 0.0283 | 9.42 |
| pytorch_materialized | 2048 | 16_evidence_pages_flat_index |  | 0.2252 | 4.73 |
| kernel_gather_dequant_dot | 2048 | 16_evidence_pages_flat_index |  | 0.0667 | 15.98 |
| kernel_pages_scan_dequant_dot | 2048 | 16_evidence_pages |  | 0.0700 | 15.22 |
| kernel_pages_tiled_dequant_dot | 2048 | 16_evidence_pages | 16 | 0.0672 | 15.86 |
| kernel_pages_tiled_dequant_dot | 2048 | 16_evidence_pages | 32 | 0.0674 | 15.79 |
| kernel_pages_tiled_dequant_dot | 2048 | 16_evidence_pages | 64 | 0.0670 | 15.89 |
| kernel_pages_tiled_dequant_dot | 2048 | 16_evidence_pages | 128 | 0.0720 | 14.79 |
| kernel_pages_tiled_dequant_dot | 2048 | 16_evidence_pages | 256 | 0.0714 | 14.91 |
| kernel_pages_tiled_dequant_dot | 2048 | 16_evidence_pages | 512 | 0.0714 | 14.91 |
| pytorch_materialized | 8192 | 16_evidence_pages_flat_index |  | 0.1172 | 36.34 |
| kernel_gather_dequant_dot | 8192 | 16_evidence_pages_flat_index |  | 0.0555 | 76.81 |
| kernel_pages_scan_dequant_dot | 8192 | 16_evidence_pages |  | 0.0696 | 61.23 |
| kernel_pages_tiled_dequant_dot | 8192 | 16_evidence_pages | 16 | 0.0351 | 121.24 |
| kernel_pages_tiled_dequant_dot | 8192 | 16_evidence_pages | 32 | 0.0352 | 120.91 |
| kernel_pages_tiled_dequant_dot | 8192 | 16_evidence_pages | 64 | 0.0352 | 121.02 |
| kernel_pages_tiled_dequant_dot | 8192 | 16_evidence_pages | 128 | 0.0392 | 108.67 |
| kernel_pages_tiled_dequant_dot | 8192 | 16_evidence_pages | 256 | 0.0532 | 80.05 |
| kernel_pages_tiled_dequant_dot | 8192 | 16_evidence_pages | 512 | 0.1142 | 37.31 |
| pytorch_materialized | 32768 | 16_evidence_pages_flat_index |  | 0.2069 | 82.36 |
| kernel_gather_dequant_dot | 32768 | 16_evidence_pages_flat_index |  | 0.1787 | 95.34 |
| kernel_pages_scan_dequant_dot | 32768 | 16_evidence_pages |  | 0.2338 | 72.88 |
| kernel_pages_tiled_dequant_dot | 32768 | 16_evidence_pages | 16 | 0.0780 | 218.59 |
| kernel_pages_tiled_dequant_dot | 32768 | 16_evidence_pages | 32 | 0.0741 | 230.01 |
| kernel_pages_tiled_dequant_dot | 32768 | 16_evidence_pages | 64 | 0.0734 | 232.22 |
| kernel_pages_tiled_dequant_dot | 32768 | 16_evidence_pages | 128 | 0.0750 | 227.17 |
| kernel_pages_tiled_dequant_dot | 32768 | 16_evidence_pages | 256 | 0.0766 | 222.33 |
| kernel_pages_tiled_dequant_dot | 32768 | 16_evidence_pages | 512 | 0.0951 | 179.17 |
| pytorch_materialized | 131072 | 16_evidence_pages_flat_index |  | 1.4500 | 47.00 |
| kernel_gather_dequant_dot | 131072 | 16_evidence_pages_flat_index |  | 0.3356 | 203.12 |
| kernel_pages_scan_dequant_dot | 131072 | 16_evidence_pages |  | 0.5781 | 117.90 |
| kernel_pages_tiled_dequant_dot | 131072 | 16_evidence_pages | 16 | 0.2010 | 339.11 |
| kernel_pages_tiled_dequant_dot | 131072 | 16_evidence_pages | 32 | 0.1854 | 367.61 |
| kernel_pages_tiled_dequant_dot | 131072 | 16_evidence_pages | 64 | 0.1818 | 374.92 |
| kernel_pages_tiled_dequant_dot | 131072 | 16_evidence_pages | 128 | 0.1830 | 372.36 |
| kernel_pages_tiled_dequant_dot | 131072 | 16_evidence_pages | 256 | 0.1963 | 347.18 |
| kernel_pages_tiled_dequant_dot | 131072 | 16_evidence_pages | 512 | 0.2271 | 300.16 |

## Readout

- `kernel_pages_scan_dequant_dot` is the v1 page-table baseline.
- `kernel_pages_tiled_dequant_dot` maps grid = page × head × row-tile, avoiding per-row page scans.
- The useful question is which tile size beats scan/gather at realistic evidence-page budgets.
- Next step after v2: tiled attention-like output instead of scalar dot + atomic accumulation.
