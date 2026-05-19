# Evidence-Paged KV Phase 2c.1 — fused candidate latency breakdown — 2026-05-19

> Offline component timing for Phase 2c. No serving mutation, no model inference.

## Boundary

```txt
components: candidate_only, global_select_only, value_only, candidate_plus_global_select, full_path
layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
serving: no
```

## Component timings

| component | M rows | K | chunk rows | pattern | p50 ms | p90 ms | candidates/head | temp ratio |
|---|---:|---:|---:|---|---:|---:|---:|---:|
| candidate_only | 8192 | 32 | 512 | contiguous_pages | 0.1586 | 0.2218 | 512 | 0.125 |
| global_select_only | 8192 | 32 | 512 | contiguous_pages | 0.0314 | 0.0920 | 512 | 0.125 |
| value_only | 8192 | 32 | 512 | contiguous_pages | 0.0379 | 0.0429 | 512 | 0.125 |
| candidate_plus_global_select | 8192 | 32 | 512 | contiguous_pages | 0.1680 | 0.1764 | 512 | 0.125 |
| full_path | 8192 | 32 | 512 | contiguous_pages | 0.1728 | 0.1883 | 512 | 0.125 |
| candidate_only | 8192 | 32 | 1024 | contiguous_pages | 0.1782 | 0.2181 | 256 | 0.062 |
| global_select_only | 8192 | 32 | 1024 | contiguous_pages | 0.0319 | 0.0418 | 256 | 0.062 |
| value_only | 8192 | 32 | 1024 | contiguous_pages | 0.0295 | 0.0443 | 256 | 0.062 |
| candidate_plus_global_select | 8192 | 32 | 1024 | contiguous_pages | 0.1884 | 0.2076 | 256 | 0.062 |
| full_path | 8192 | 32 | 1024 | contiguous_pages | 0.1903 | 0.1996 | 256 | 0.062 |
| candidate_only | 8192 | 32 | 512 | sparse_pages | 0.1566 | 0.1683 | 512 | 0.125 |
| global_select_only | 8192 | 32 | 512 | sparse_pages | 0.0287 | 0.0454 | 512 | 0.125 |
| value_only | 8192 | 32 | 512 | sparse_pages | 0.0339 | 0.0461 | 512 | 0.125 |
| candidate_plus_global_select | 8192 | 32 | 512 | sparse_pages | 0.1679 | 0.1717 | 512 | 0.125 |
| full_path | 8192 | 32 | 512 | sparse_pages | 0.1710 | 0.1745 | 512 | 0.125 |
| candidate_only | 8192 | 32 | 1024 | sparse_pages | 0.1741 | 0.1894 | 256 | 0.062 |
| global_select_only | 8192 | 32 | 1024 | sparse_pages | 0.0307 | 0.0385 | 256 | 0.062 |
| value_only | 8192 | 32 | 1024 | sparse_pages | 0.0338 | 0.0452 | 256 | 0.062 |
| candidate_plus_global_select | 8192 | 32 | 1024 | sparse_pages | 0.1845 | 0.2025 | 256 | 0.062 |
| full_path | 8192 | 32 | 1024 | sparse_pages | 0.1915 | 0.1961 | 256 | 0.062 |
| candidate_only | 32768 | 32 | 512 | contiguous_pages | 0.4905 | 0.4989 | 2048 | 0.125 |
| global_select_only | 32768 | 32 | 512 | contiguous_pages | 0.0338 | 0.0461 | 2048 | 0.125 |
| value_only | 32768 | 32 | 512 | contiguous_pages | 0.0348 | 0.0387 | 2048 | 0.125 |
| candidate_plus_global_select | 32768 | 32 | 512 | contiguous_pages | 0.5108 | 0.5632 | 2048 | 0.125 |
| full_path | 32768 | 32 | 512 | contiguous_pages | 0.5180 | 0.5509 | 2048 | 0.125 |
| candidate_only | 32768 | 32 | 1024 | contiguous_pages | 0.5700 | 0.5820 | 1024 | 0.062 |
| global_select_only | 32768 | 32 | 1024 | contiguous_pages | 0.0317 | 0.0435 | 1024 | 0.062 |
| value_only | 32768 | 32 | 1024 | contiguous_pages | 0.0338 | 0.0360 | 1024 | 0.062 |
| candidate_plus_global_select | 32768 | 32 | 1024 | contiguous_pages | 0.5837 | 0.5980 | 1024 | 0.062 |
| full_path | 32768 | 32 | 1024 | contiguous_pages | 0.5905 | 0.5949 | 1024 | 0.062 |
| candidate_only | 32768 | 32 | 512 | sparse_pages | 0.5110 | 0.5437 | 2048 | 0.125 |
| global_select_only | 32768 | 32 | 512 | sparse_pages | 0.0338 | 0.0520 | 2048 | 0.125 |
| value_only | 32768 | 32 | 512 | sparse_pages | 0.0348 | 0.0390 | 2048 | 0.125 |
| candidate_plus_global_select | 32768 | 32 | 512 | sparse_pages | 0.5028 | 0.5118 | 2048 | 0.125 |
| full_path | 32768 | 32 | 512 | sparse_pages | 0.5069 | 0.5294 | 2048 | 0.125 |
| candidate_only | 32768 | 32 | 1024 | sparse_pages | 0.5734 | 0.5765 | 1024 | 0.062 |
| global_select_only | 32768 | 32 | 1024 | sparse_pages | 0.0307 | 0.0338 | 1024 | 0.062 |
| value_only | 32768 | 32 | 1024 | sparse_pages | 0.0347 | 0.0396 | 1024 | 0.062 |
| candidate_plus_global_select | 32768 | 32 | 1024 | sparse_pages | 0.5867 | 0.5908 | 1024 | 0.062 |
| full_path | 32768 | 32 | 1024 | sparse_pages | 0.5937 | 0.6172 | 1024 | 0.062 |
| candidate_only | 65536 | 32 | 512 | contiguous_pages | 0.8653 | 0.8776 | 4096 | 0.125 |
| global_select_only | 65536 | 32 | 512 | contiguous_pages | 0.0399 | 0.0410 | 4096 | 0.125 |
| value_only | 65536 | 32 | 512 | contiguous_pages | 0.0287 | 0.0404 | 4096 | 0.125 |
| candidate_plus_global_select | 65536 | 32 | 512 | contiguous_pages | 0.8806 | 0.8867 | 4096 | 0.125 |
| full_path | 65536 | 32 | 512 | contiguous_pages | 0.9009 | 0.9079 | 4096 | 0.125 |
| candidate_only | 65536 | 32 | 1024 | contiguous_pages | 1.0404 | 1.1168 | 2048 | 0.062 |
| global_select_only | 65536 | 32 | 1024 | contiguous_pages | 0.0164 | 0.0312 | 2048 | 0.062 |
| value_only | 65536 | 32 | 1024 | contiguous_pages | 0.0358 | 0.1075 | 2048 | 0.062 |
| candidate_plus_global_select | 65536 | 32 | 1024 | contiguous_pages | 1.0476 | 1.0525 | 2048 | 0.062 |
| full_path | 65536 | 32 | 1024 | contiguous_pages | 1.0525 | 1.1049 | 2048 | 0.062 |
| candidate_only | 65536 | 32 | 512 | sparse_pages | 0.8776 | 0.8950 | 4096 | 0.125 |
| global_select_only | 65536 | 32 | 512 | sparse_pages | 0.0365 | 0.0427 | 4096 | 0.125 |
| value_only | 65536 | 32 | 512 | sparse_pages | 0.0348 | 0.0578 | 4096 | 0.125 |
| candidate_plus_global_select | 65536 | 32 | 512 | sparse_pages | 0.8806 | 1.1192 | 4096 | 0.125 |
| full_path | 65536 | 32 | 512 | sparse_pages | 0.8991 | 0.9257 | 4096 | 0.125 |
| candidate_only | 65536 | 32 | 1024 | sparse_pages | 1.0332 | 1.0383 | 2048 | 0.062 |
| global_select_only | 65536 | 32 | 1024 | sparse_pages | 0.0344 | 0.1126 | 2048 | 0.062 |
| value_only | 65536 | 32 | 1024 | sparse_pages | 0.0536 | 0.0973 | 2048 | 0.062 |
| candidate_plus_global_select | 65536 | 32 | 1024 | sparse_pages | 1.0474 | 1.0580 | 2048 | 0.062 |
| full_path | 65536 | 32 | 1024 | sparse_pages | 1.0523 | 1.1026 | 2048 | 0.062 |

## Breakdown readout

The bottleneck is **not** the Triton global selector and not the value kernel. Across tested shapes:

```txt
global_select_only p50: ~0.016–0.040 ms
value_only p50: ~0.029–0.054 ms
candidate_only p50: ~0.157–1.040 ms
```

The full path closely follows candidate generation cost:

```txt
8192 rows full_path p50: ~0.171–0.191 ms
32768 rows full_path p50: ~0.507–0.594 ms
65536 rows full_path p50: ~0.899–1.053 ms
```

Implication:

```txt
Phase 2c removed the Torch topk/softmax boundary successfully.
The next bottleneck is chunk-local candidate generation over packed FP8-K slots.
Do not spend the next iteration on global merge/softmax.
```

`chunk_rows=512` is consistently better than `1024` in this run, despite producing more candidates. That points to local candidate-kernel occupancy/reduction behavior rather than candidate-buffer size as the limiting factor.

This run also did not reproduce the large 32768/65536-contiguous outliers from the first Phase 2c full benchmark, suggesting some warmup/autotune/measurement instability in the earlier aggregate run. Treat the breakdown as the better attribution receipt, not as a serving claim.

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
- Not a PagedAttention/FlashAttention comparison.
