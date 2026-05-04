# RotorQuant (planar3/iso3) vs TurboQuant (turbo3) — Llama 3.1 8B Instruct Q4_K_M

**Date:** 2026-05-04  
**Build:** johndpope/llama-cpp-turboquant `fc3d1b6` (branch: feature/planarquant-kv-cache)  
**Model:** Meta-Llama-3.1-8B-Instruct Q4_K_M (bartowski, 4.58 GiB, 32 layers, n_embd_head_k=128, n_kv_heads=8)  
**Hardware:** RTX 4090 SM89 (24 GB VRAM)  
**Companion bench:** [Qwen3.6-27B results](results.md) (head_dim=256)

## Perplexity — wikitext2, 2048 ctx, flash_attn=on

| cache type | PPL | Δ vs q8_0 | KV (2048 ctx, 32 KV layers) | pp t/s |
|---|---|---|---|---|
| q8_0 (baseline) | **6.5980 ± 0.039** | — | K 68 + V 68 = 136 MiB | 9559 |
| turbo3 | 6.9824 ± 0.041 | +5.83% | K 25 + V 25 = 50 MiB | 9209 |
| planar3 | 6.9475 ± 0.041 | +5.30% | K 128 + V 25 = 153 MiB | 2530 |
| iso3 | **6.8216 ± 0.040** | +3.39% | K 128 + V 25 = 153 MiB | 1734 |

## Key findings

### 1. PPL claim confirmed — iso3 beats turbo3 on Llama 3.1 8B

iso3 (6.82) < planar3 (6.95) < turbo3 (6.98). RotorQuant's published result holds on this
model: block-diagonal rotation preserves more signal than WHT at 3-bit on 128-dim heads.

### 2. K cache is larger than q8_0 — even on the target model

turbo3: K = 25 MiB (63% reduction vs q8_0 ✓)  
planar3/iso3: K = 128 MiB — **88% larger than q8_0's 68 MiB K** (✗)

Total KV for planar3/iso3 = 153 MiB vs 136 MiB for q8_0. The 3-bit quantization
scheme uses more memory than 8-bit. This indicates the K cache is not being stored
in the quantized format during inference — likely stored at higher precision for
the deferred rotation step, negating the compression benefit.

### 3. Throughput: -74% (planar3), -82% (iso3) vs q8_0

| type | pp t/s | vs q8_0 | vs turbo3 |
|---|---|---|---|
| q8_0 | 9559 | — | — |
| turbo3 | 9209 | −3.7% | — |
| planar3 | 2530 | **−73.5%** | **−72.5%** |
| iso3 | 1734 | **−81.9%** | **−81.2%** |

RotorQuant's README claims 28% decode speedup. Our measurement shows the opposite:
73–82% throughput loss on RTX 4090.

### 4. Cross-model comparison: head_dim=128 vs head_dim=256

| model | head_dim | planar3 PPL Δ | planar3 KV K | planar3 pp t/s |
|---|---|---|---|---|
| Llama 3.1 8B | 128 | +5.30% | 128 MiB (vs 68 q8_0) | 2530 |
| Qwen3.6-27B | 256 | +4.16% | 64 MiB (vs 34 q8_0) | 1729 |

The K cache anomaly is present on both models. K is consistently 2× the q8_0 K size
regardless of head dimension. This is a systematic implementation issue, not a
head-dim alignment problem — the K buffer is stored at a higher precision internally.

## Hypothesis: deferred rotation requires full-precision K buffer

The planar/iso rotation is applied at attention time ("deferred"), not at write time.
The K cache must be stored in a format compatible with the rotation kernel — likely
fp16 or a wider format — then quantized on-the-fly during the attention computation.
This would explain both the 2× K memory and the throughput loss (rotation overhead
per attention step).

If correct, the PPL gain is real but the implementation does not yet achieve the
memory and speed benefits that a fused quantize-at-write approach would provide.

## Comparison with RotorQuant README claims

| metric | README claim | Our measurement |
|---|---|---|
| PPL iso3 vs turbo3 | iso3 better ✓ | confirmed (6.82 vs 6.98) |
| 28% decode speedup | iso3 faster ✓ | **−82%** throughput (✗) |
| KV compression | implied smaller | **larger than q8_0** (✗) |

Full data: https://github.com/sztlink/turboquant-cuda-bench/tree/main/bench/rotorquant
