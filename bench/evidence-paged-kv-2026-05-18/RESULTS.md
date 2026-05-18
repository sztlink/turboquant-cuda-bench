# Evidence-Paged KV microbench v0 — 2026-05-18

> PagedAttention pages by sequence position. Evidence-Paged KV asks what it costs to page by answer utility.

## Boundary

This is a PyTorch material microbench on RTX 4090, not a production vLLM kernel and not a model-quality benchmark.

## Shape

- simulated KV rows: `1048576`
- KV heads: `4`
- head dim: `128`
- hot GPU tail rows: `4096`
- pinned host memory: `True`

## Results

| mode | M rows | pattern | p50 ms | effective GB/s |
|---|---:|---|---:|---:|
| all_gpu_bf16 | 512 | contiguous_tail | 0.1395 | 3.76 |
| cold_host_u8_dequant | 512 | contiguous_tail | 0.2073 | 1.28 |
| all_gpu_bf16 | 512 | evidence_sorted_segments | 0.0551 | 9.51 |
| cold_host_u8_dequant | 512 | evidence_sorted_segments | 0.1923 | 1.38 |
| cold_host_u8_sorted_pages | 512 | evidence_sorted_segments | 0.2096 | 1.27 |
| all_gpu_bf16 | 512 | decoy_rank16_interleaved | 0.0564 | 9.29 |
| cold_host_u8_dequant | 512 | decoy_rank16_interleaved | 0.1645 | 1.62 |
| cold_host_u8_sorted_pages | 512 | decoy_rank16_interleaved | 0.1610 | 1.65 |
| all_gpu_bf16 | 512 | random_global | 0.0612 | 8.57 |
| cold_host_u8_dequant | 512 | random_global | 0.1666 | 1.60 |
| cold_host_u8_sorted_pages | 512 | random_global | 0.2006 | 1.33 |
| hot_tail_plus_cold_evidence | 512 | hot_tail+evidence_sorted_segments | 0.2362 | 3.35 |
| all_gpu_bf16 | 2048 | contiguous_tail | 0.0519 | 40.38 |
| cold_host_u8_dequant | 2048 | contiguous_tail | 0.1955 | 5.45 |
| all_gpu_bf16 | 2048 | evidence_sorted_segments | 0.0631 | 33.23 |
| cold_host_u8_dequant | 2048 | evidence_sorted_segments | 0.1976 | 5.39 |
| cold_host_u8_sorted_pages | 2048 | evidence_sorted_segments | 0.3496 | 3.05 |
| all_gpu_bf16 | 2048 | decoy_rank16_interleaved | 0.0708 | 29.60 |
| cold_host_u8_dequant | 2048 | decoy_rank16_interleaved | 0.1986 | 5.36 |
| cold_host_u8_sorted_pages | 2048 | decoy_rank16_interleaved | 0.2163 | 4.92 |
| all_gpu_bf16 | 2048 | random_global | 0.0631 | 33.22 |
| cold_host_u8_dequant | 2048 | random_global | 0.2146 | 4.96 |
| cold_host_u8_sorted_pages | 2048 | random_global | 0.2512 | 4.24 |
| hot_tail_plus_cold_evidence | 2048 | hot_tail+evidence_sorted_segments | 0.2739 | 11.54 |
| all_gpu_bf16 | 8192 | contiguous_tail | 0.0661 | 126.88 |
| cold_host_u8_dequant | 8192 | contiguous_tail | 0.3754 | 11.35 |
| all_gpu_bf16 | 8192 | evidence_sorted_segments | 0.0608 | 138.04 |
| cold_host_u8_dequant | 8192 | evidence_sorted_segments | 0.3858 | 11.04 |
| cold_host_u8_sorted_pages | 8192 | evidence_sorted_segments | 0.4420 | 9.64 |
| all_gpu_bf16 | 8192 | decoy_rank16_interleaved | 0.0730 | 114.87 |
| cold_host_u8_dequant | 8192 | decoy_rank16_interleaved | 0.4237 | 10.05 |
| cold_host_u8_sorted_pages | 8192 | decoy_rank16_interleaved | 0.4593 | 9.27 |
| all_gpu_bf16 | 8192 | random_global | 0.0655 | 128.13 |
| cold_host_u8_dequant | 8192 | random_global | 0.4299 | 9.91 |
| cold_host_u8_sorted_pages | 8192 | random_global | 0.6343 | 6.72 |
| hot_tail_plus_cold_evidence | 8192 | hot_tail+evidence_sorted_segments | 0.4964 | 17.03 |
| all_gpu_bf16 | 32768 | contiguous_tail | 0.1637 | 204.96 |
| cold_host_u8_dequant | 32768 | contiguous_tail | 1.2260 | 13.90 |
| all_gpu_bf16 | 32768 | evidence_sorted_segments | 0.1647 | 203.73 |
| cold_host_u8_dequant | 32768 | evidence_sorted_segments | 1.2048 | 14.14 |
| cold_host_u8_sorted_pages | 32768 | evidence_sorted_segments | 1.3630 | 12.50 |
| all_gpu_bf16 | 32768 | decoy_rank16_interleaved | 0.1683 | 199.39 |
| cold_host_u8_dequant | 32768 | decoy_rank16_interleaved | 1.6498 | 10.33 |
| cold_host_u8_sorted_pages | 32768 | decoy_rank16_interleaved | 1.6514 | 10.32 |
| all_gpu_bf16 | 32768 | random_global | 0.1731 | 193.89 |
| cold_host_u8_dequant | 32768 | random_global | 1.3745 | 12.40 |
| cold_host_u8_sorted_pages | 32768 | random_global | 1.5545 | 10.96 |
| hot_tail_plus_cold_evidence | 32768 | hot_tail+evidence_sorted_segments | 1.4329 | 14.82 |

## Readout

- This v0 materializes the cost boundary between all-hot GPU KV and cold host uint8 KV fetched on demand.
- The meaningful next step is a small CUDA extension or vLLM hook that avoids CPU-side index_select overhead and pages contiguous evidence blocks explicitly.
- The public framing remains: `fit context != retrieve evidence != use evidence`. Evidence-Paged KV is the systems version of that claim.
