# Evidence-Paged KV CUDA kernel v1 — 2026-05-18

> Fused CUDA receipt for gather/page + uint8 dequant + dot.

## Boundary

JIT CUDA extension microbench. Not a vLLM integration. Not a model-quality benchmark.

## Build

- CUDA_HOME: `/home/felipe/vllm-lab/venv-tq-fresh-20260515/lib/python3.12/site-packages/nvidia/cu13`
- GPU: `NVIDIA GeForce RTX 4090`
- torch: `2.11.0+cu130`

## Results

| mode | M rows | pattern | p50 ms | effective GB/s |
|---|---:|---|---:|---:|
| pytorch_materialized | 512 | contiguous_tail | 0.2330 | 1.14 |
| kernel_gather_dequant_dot | 512 | contiguous_tail | 0.0484 | 5.50 |
| pytorch_materialized | 512 | evidence_sorted_segments | 0.2242 | 1.19 |
| kernel_gather_dequant_dot | 512 | evidence_sorted_segments | 0.0485 | 5.48 |
| pytorch_materialized | 512 | decoy_rank16_interleaved | 0.2255 | 1.18 |
| kernel_gather_dequant_dot | 512 | decoy_rank16_interleaved | 0.0483 | 5.52 |
| pytorch_materialized | 512 | random_global | 0.2241 | 1.19 |
| kernel_gather_dequant_dot | 512 | random_global | 0.0475 | 5.61 |
| kernel_pages_dequant_dot | 512 | 16_evidence_pages | 0.1311 | 2.03 |
| pytorch_materialized | 2048 | contiguous_tail | 0.2245 | 4.74 |
| kernel_gather_dequant_dot | 2048 | contiguous_tail | 0.0464 | 22.95 |
| pytorch_materialized | 2048 | evidence_sorted_segments | 0.2255 | 4.72 |
| kernel_gather_dequant_dot | 2048 | evidence_sorted_segments | 0.0467 | 22.79 |
| pytorch_materialized | 2048 | decoy_rank16_interleaved | 0.2257 | 4.72 |
| kernel_gather_dequant_dot | 2048 | decoy_rank16_interleaved | 0.0464 | 22.95 |
| pytorch_materialized | 2048 | random_global | 0.2232 | 4.77 |
| kernel_gather_dequant_dot | 2048 | random_global | 0.0471 | 22.61 |
| kernel_pages_dequant_dot | 2048 | 16_evidence_pages | 0.1303 | 8.17 |
| pytorch_materialized | 8192 | contiguous_tail | 0.2209 | 19.28 |
| kernel_gather_dequant_dot | 8192 | contiguous_tail | 0.0693 | 61.49 |
| pytorch_materialized | 8192 | evidence_sorted_segments | 0.2272 | 18.75 |
| kernel_gather_dequant_dot | 8192 | evidence_sorted_segments | 0.0689 | 61.83 |
| pytorch_materialized | 8192 | decoy_rank16_interleaved | 0.2269 | 18.77 |
| kernel_gather_dequant_dot | 8192 | decoy_rank16_interleaved | 0.0689 | 61.86 |
| pytorch_materialized | 8192 | random_global | 0.2248 | 18.95 |
| kernel_gather_dequant_dot | 8192 | random_global | 0.0691 | 61.63 |
| kernel_pages_dequant_dot | 8192 | 16_evidence_pages | 0.1327 | 32.09 |
| pytorch_materialized | 32768 | contiguous_tail | 0.2055 | 82.91 |
| kernel_gather_dequant_dot | 32768 | contiguous_tail | 0.1613 | 105.63 |
| pytorch_materialized | 32768 | evidence_sorted_segments | 0.2064 | 82.57 |
| kernel_gather_dequant_dot | 32768 | evidence_sorted_segments | 0.1610 | 105.86 |
| pytorch_materialized | 32768 | decoy_rank16_interleaved | 0.2148 | 79.31 |
| kernel_gather_dequant_dot | 32768 | decoy_rank16_interleaved | 0.1619 | 105.25 |
| pytorch_materialized | 32768 | random_global | 0.2182 | 78.08 |
| kernel_gather_dequant_dot | 32768 | random_global | 0.1611 | 105.76 |
| kernel_pages_dequant_dot | 32768 | 16_evidence_pages | 0.2639 | 64.57 |

## Readout

- v1 removes PyTorch materialization overhead for selected uint8 KV rows.
- `kernel_pages_dequant_dot` is the Evidence-Paged path: page table instead of arbitrary per-token gather.
- Next step: replace atomic scalar dot with tiled attention-like output, then test as a vLLM-side prefill/decode hook.
