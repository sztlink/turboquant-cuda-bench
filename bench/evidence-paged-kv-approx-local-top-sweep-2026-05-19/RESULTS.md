# Evidence-Paged KV Phase 2c.2 — approximate local-top sweep — 2026-05-19

> Offline approximate candidate sweep. LOCAL_TOP < GLOBAL_K is approximate, measured by recall@32 and output error vs exact topK reference.

## Boundary

```txt
global_k: 32
local_top: 4, 8, 16, 32
chunk_rows: 512
layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
serving: no
```

## Sweep results

| M rows | pattern | local top | candidates/head | candidate p50 ms | full p50 ms | recall@32 mean | recall@32 min | heads full recall | max abs err | mean abs err | temp ratio |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 8192 | contiguous_pages | 4 | 64 | 0.0879 | 0.1461 | 0.971 | 0.906 | 11/28 | 0.192190 | 0.018947 | 0.016 |
| 8192 | contiguous_pages | 8 | 128 | 0.0972 | 0.1606 | 1.000 | 1.000 | 28/28 | 0.000144 | 0.000029 | 0.031 |
| 8192 | contiguous_pages | 16 | 256 | 0.0635 | 0.1676 | 1.000 | 1.000 | 28/28 | 0.000144 | 0.000029 | 0.062 |
| 8192 | contiguous_pages | 32 | 512 | 0.1853 | 0.2007 | 1.000 | 1.000 | 28/28 | 0.000144 | 0.000029 | 0.125 |
| 8192 | sparse_pages | 4 | 64 | 0.0858 | 0.1935 | 0.977 | 0.906 | 14/28 | 0.171697 | 0.015664 | 0.016 |
| 8192 | sparse_pages | 8 | 128 | 0.0942 | 0.1649 | 1.000 | 1.000 | 28/28 | 0.000164 | 0.000029 | 0.031 |
| 8192 | sparse_pages | 16 | 256 | 0.1165 | 0.1364 | 1.000 | 1.000 | 28/28 | 0.000164 | 0.000029 | 0.062 |
| 8192 | sparse_pages | 32 | 512 | 0.1997 | 0.1987 | 1.000 | 1.000 | 28/28 | 0.000164 | 0.000029 | 0.125 |
| 32768 | contiguous_pages | 4 | 256 | 0.1792 | 0.1627 | 1.000 | 1.000 | 28/28 | 0.000198 | 0.000029 | 0.016 |
| 32768 | contiguous_pages | 8 | 512 | 0.1864 | 0.2024 | 1.000 | 1.000 | 28/28 | 0.000198 | 0.000029 | 0.031 |
| 32768 | contiguous_pages | 16 | 1024 | 0.2620 | 0.2844 | 1.000 | 1.000 | 28/28 | 0.000198 | 0.000029 | 0.062 |
| 32768 | contiguous_pages | 32 | 2048 | 0.5233 | 0.5325 | 1.000 | 1.000 | 28/28 | 0.000198 | 0.000029 | 0.125 |
| 32768 | sparse_pages | 4 | 256 | 0.1525 | 0.1645 | 1.000 | 1.000 | 28/28 | 0.000142 | 0.000030 | 0.016 |
| 32768 | sparse_pages | 8 | 512 | 0.1874 | 0.1761 | 1.000 | 1.000 | 28/28 | 0.000142 | 0.000030 | 0.031 |
| 32768 | sparse_pages | 16 | 1024 | 0.2662 | 0.2836 | 1.000 | 1.000 | 28/28 | 0.000142 | 0.000030 | 0.062 |
| 32768 | sparse_pages | 32 | 2048 | 0.5161 | 0.5345 | 1.000 | 1.000 | 28/28 | 0.000142 | 0.000030 | 0.125 |
| 65536 | contiguous_pages | 4 | 512 | 0.2314 | 0.4734 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.016 |
| 65536 | contiguous_pages | 8 | 1024 | 0.7127 | 0.9543 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.031 |
| 65536 | contiguous_pages | 16 | 2048 | 2.4412 | 3.1651 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.062 |
| 65536 | contiguous_pages | 32 | 4096 | 5.4518 | 6.7492 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.125 |
| 65536 | sparse_pages | 4 | 512 | 0.1833 | 0.2519 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.016 |
| 65536 | sparse_pages | 8 | 1024 | 0.3092 | 0.3287 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.031 |
| 65536 | sparse_pages | 16 | 2048 | 0.4625 | 0.4833 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.062 |
| 65536 | sparse_pages | 32 | 4096 | 0.9544 | 0.9633 | 1.000 | 1.000 | 28/28 | 0.000140 | 0.000029 | 0.125 |

## Automatic readout

- M=8192 pattern=contiguous_pages: fastest recall>=0.95 local_top=4 full_p50=0.1461 ms recall=0.971; fastest overall local_top=4 recall=0.971.
- M=8192 pattern=sparse_pages: fastest recall>=0.95 local_top=16 full_p50=0.1364 ms recall=1.000; fastest overall local_top=16 recall=1.000.
- M=32768 pattern=contiguous_pages: fastest recall>=0.95 local_top=4 full_p50=0.1627 ms recall=1.000; fastest overall local_top=4 recall=1.000.
- M=32768 pattern=sparse_pages: fastest recall>=0.95 local_top=4 full_p50=0.1645 ms recall=1.000; fastest overall local_top=4 recall=1.000.
- M=65536 pattern=contiguous_pages: fastest recall>=0.95 local_top=4 full_p50=0.4734 ms recall=1.000; fastest overall local_top=4 recall=1.000.
- M=65536 pattern=sparse_pages: fastest recall>=0.95 local_top=4 full_p50=0.2519 ms recall=1.000; fastest overall local_top=4 recall=1.000.

## Readout

The local-top hypothesis produced a strong offline kernel receipt on these random synthetic tensors:

```txt
local_top=4 temp ratio: 1.56% of full-score temp
local_top=8 temp ratio: 3.12% of full-score temp
local_top=32 temp ratio: 12.5% of full-score temp
```

`local_top=4` was exact for all 32768/65536-row cases and approximate-but-high-recall for 8192 rows:

```txt
8192 contiguous: recall@32 mean 0.971, max abs err 0.192
8192 sparse:     recall@32 mean 0.977, max abs err 0.172
```

`local_top=8` recovered exact topK in all tested rows/patterns except no degradation was observed in this run:

```txt
recall@32 mean: 1.000 across all tested shapes
max abs error: ~1e-4 class, same as exact/reference path
```

Latency readout:

```txt
best exact-or-observed-exact 65K sparse: local_top=4 full p50 0.2519 ms
best exact-or-observed-exact 65K contiguous: local_top=4 full p50 0.4734 ms
exact local_top=32 65K sparse: full p50 0.9633 ms
exact local_top=32 65K contiguous: full p50 6.7492 ms in this run
```

Interpretation: reducing local candidates is the right next direction for this synthetic kernel path. But `LOCAL_TOP < GLOBAL_K` is approximate by construction; exact recovery here depends on score distribution in the synthetic random fixture. It needs adversarial/top-heavy fixtures before any runtime decision.

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
- LOCAL_TOP < GLOBAL_K is approximate candidate selection, not exact topK.
