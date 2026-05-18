# AYA KV-Kernel Lab — 2026-05-18

Overnight 4090 microbenchmark for KV/evidence access patterns.

## Status
- custom CUDA extension built: `False`
- GPU: `NVIDIA GeForce RTX 4090`
- torch: `2.11.0+cu130`

## Shape
- KV rows: `65536`
- KV heads: `4`
- head dim: `128`

## Results

| path | M | pattern | p50 ms | eff GB/s |
|---|---:|---|---:|---:|
| bf16_index_select_dot | 512 | contiguous_tail | 0.0503 | 10.42 |
| bf16_index_select_dot | 512 | prefix_window_segments | 0.0522 | 10.04 |
| bf16_index_select_dot | 512 | decoy_rank16_interleaved | 0.0502 | 10.45 |
| bf16_index_select_dot | 512 | random_global | 0.0510 | 10.28 |
| bf16_index_select_dot | 2048 | contiguous_tail | 0.0559 | 37.51 |
| bf16_index_select_dot | 2048 | prefix_window_segments | 0.0511 | 41.04 |
| bf16_index_select_dot | 2048 | decoy_rank16_interleaved | 0.0554 | 37.86 |
| bf16_index_select_dot | 2048 | random_global | 0.0533 | 39.34 |
| bf16_index_select_dot | 8192 | contiguous_tail | 0.0493 | 170.22 |
| bf16_index_select_dot | 8192 | prefix_window_segments | 0.0480 | 174.65 |
| bf16_index_select_dot | 8192 | decoy_rank16_interleaved | 0.0490 | 171.34 |
| bf16_index_select_dot | 8192 | random_global | 0.0483 | 173.84 |

## Reading boundary

This is a microkernel/material receipt, not a model-quality benchmark. It tests the cost shape of access patterns that resemble evidence utilization, decoy interleaving, and KV budget selection.
