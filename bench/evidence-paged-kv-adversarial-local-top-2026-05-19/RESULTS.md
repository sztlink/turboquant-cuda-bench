# Evidence-Paged KV Phase 2c.3 — adversarial local-top fixtures — 2026-05-19

> Offline adversarial candidate recall test. LOCAL_TOP < GLOBAL_K is approximate and expected to fail when true topK concentrate inside too few chunks.

## Boundary

```txt
global_k: 32
local_top: 4, 8, 16, 32
chunk_rows: 512
scenarios: one_chunk_32, two_chunks_16_16, spread_32_chunks
layout: turboquant_k8v4, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
serving: no
```

## Results

| scenario | M rows | local top | candidates/head | full p50 ms | recall@32 mean | recall@32 min | heads full recall | max abs err | mean abs err | temp ratio |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| one_chunk_32 | 8192 | 4 | 64 | 0.1774 | 0.125 | 0.125 | 0/28 | 0.788455 | 0.194803 | 0.016 |
| one_chunk_32 | 8192 | 8 | 128 | 0.1618 | 0.250 | 0.250 | 0/28 | 0.696355 | 0.175006 | 0.031 |
| one_chunk_32 | 8192 | 16 | 256 | 0.1372 | 0.500 | 0.500 | 0/28 | 0.582811 | 0.131941 | 0.062 |
| one_chunk_32 | 8192 | 32 | 512 | 0.1997 | 1.000 | 1.000 | 28/28 | 0.000115 | 0.000027 | 0.125 |
| one_chunk_32 | 65536 | 4 | 512 | 0.2249 | 0.125 | 0.125 | 0/28 | 0.825808 | 0.187756 | 0.016 |
| one_chunk_32 | 65536 | 8 | 1024 | 0.3308 | 0.250 | 0.250 | 0/28 | 0.728432 | 0.166117 | 0.031 |
| one_chunk_32 | 65536 | 16 | 2048 | 0.4932 | 0.500 | 0.500 | 0/28 | 0.532132 | 0.135131 | 0.062 |
| one_chunk_32 | 65536 | 32 | 4096 | 0.9626 | 1.000 | 1.000 | 28/28 | 0.000115 | 0.000027 | 0.125 |
| two_chunks_16_16 | 8192 | 4 | 64 | 0.1700 | 0.250 | 0.250 | 0/28 | 0.729428 | 0.160067 | 0.016 |
| two_chunks_16_16 | 8192 | 8 | 128 | 0.1681 | 0.500 | 0.500 | 0/28 | 0.677821 | 0.133872 | 0.031 |
| two_chunks_16_16 | 8192 | 16 | 256 | 0.1403 | 1.000 | 1.000 | 28/28 | 0.000129 | 0.000026 | 0.062 |
| two_chunks_16_16 | 8192 | 32 | 512 | 0.2099 | 1.000 | 1.000 | 28/28 | 0.000129 | 0.000026 | 0.125 |
| two_chunks_16_16 | 65536 | 4 | 512 | 0.2550 | 0.250 | 0.250 | 0/28 | 0.670034 | 0.165903 | 0.016 |
| two_chunks_16_16 | 65536 | 8 | 1024 | 0.3328 | 0.500 | 0.500 | 0/28 | 0.503577 | 0.132728 | 0.031 |
| two_chunks_16_16 | 65536 | 16 | 2048 | 0.4884 | 1.000 | 1.000 | 28/28 | 0.000129 | 0.000026 | 0.062 |
| two_chunks_16_16 | 65536 | 32 | 4096 | 0.9718 | 1.000 | 1.000 | 28/28 | 0.000129 | 0.000026 | 0.125 |
| spread_32_chunks | 8192 | 4 | 64 | 0.1835 | 0.984 | 0.938 | 21/28 | 0.175245 | 0.011239 | 0.016 |
| spread_32_chunks | 8192 | 8 | 128 | 0.1671 | 1.000 | 1.000 | 28/28 | 0.000116 | 0.000027 | 0.031 |
| spread_32_chunks | 8192 | 16 | 256 | 0.1441 | 1.000 | 1.000 | 28/28 | 0.000116 | 0.000027 | 0.062 |
| spread_32_chunks | 8192 | 32 | 512 | 0.2014 | 1.000 | 1.000 | 28/28 | 0.000116 | 0.000027 | 0.125 |
| spread_32_chunks | 65536 | 4 | 512 | 0.2621 | 1.000 | 1.000 | 28/28 | 0.000107 | 0.000028 | 0.016 |
| spread_32_chunks | 65536 | 8 | 1024 | 0.3340 | 1.000 | 1.000 | 28/28 | 0.000107 | 0.000028 | 0.031 |
| spread_32_chunks | 65536 | 16 | 2048 | 0.4977 | 1.000 | 1.000 | 28/28 | 0.000107 | 0.000028 | 0.062 |
| spread_32_chunks | 65536 | 32 | 4096 | 0.9605 | 1.000 | 1.000 | 28/28 | 0.000107 | 0.000028 | 0.125 |

## Automatic readout

- scenario=one_chunk_32 M=8192: smallest exact local_top=32; fastest exact local_top=32 full_p50=0.1997 ms.
- scenario=one_chunk_32 M=65536: smallest exact local_top=32; fastest exact local_top=32 full_p50=0.9626 ms.
- scenario=two_chunks_16_16 M=8192: smallest exact local_top=16; fastest exact local_top=16 full_p50=0.1403 ms.
- scenario=two_chunks_16_16 M=65536: smallest exact local_top=16; fastest exact local_top=16 full_p50=0.4884 ms.
- scenario=spread_32_chunks M=8192: smallest exact local_top=8; fastest exact local_top=16 full_p50=0.1441 ms.
- scenario=spread_32_chunks M=65536: smallest exact local_top=4; fastest exact local_top=4 full_p50=0.2621 ms.

## Readout

The adversarial fixtures falsify any blanket claim that `LOCAL_TOP=8` is safe:

```txt
one_chunk_32:     local_top=8 recall@32 = 0.25; local_top=32 required
one_chunk_32:     local_top=16 recall@32 = 0.50; local_top=32 required
two_chunks_16_16: local_top=8 recall@32 = 0.50; local_top=16 required
spread_32_chunks: local_top=8 exact in both M cases; local_top=4 exact only at 65K
```

Interpretation:

```txt
Required LOCAL_TOP is approximately max true-topK concentration per chunk.
Approximate local-top only works when selected high-score positions are spread across enough chunks.
```

Decision:

```txt
Do not use fixed LOCAL_TOP=8 as a correctness-preserving runtime path.
If this line continues, the next design needs adaptive/local-overflow detection or a fallback to exact local_top=K when score mass is concentrated.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
- LOCAL_TOP < GLOBAL_K is approximate candidate selection, not exact topK.
