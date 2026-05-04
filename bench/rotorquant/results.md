# RotorQuant (planar3/iso3) vs TurboQuant (turbo3) — Qwen3.6-27B Q4_K_M

**Date:** 2026-05-04  
**Build:** johndpope/llama-cpp-turboquant `fc3d1b6` (branch: feature/planarquant-kv-cache)  
**Model:** Qwen3.6-27B dense Q4_K_M (bartowski, 16.32 GiB, 64 layers, n_embd_head_k=256)  
**Hardware:** RTX 4090 SM89 (24 GB VRAM)

## Context

RotorQuant (scrya-com/rotorquant) claims improved perplexity over TurboQuant by using
block-diagonal rotation (O(d) vs O(d log d) WHT) and separate planar/isotropic types.
Their published results were on **Llama 3.1 8B Instruct Q4_K_M** with head dim = 128,
on an **RTX 5090**. This bench tests the same fork on Qwen3.6-27B (head dim = 256) on
an RTX 4090.

## Perplexity — wikitext2, 2048 ctx, flash_attn=on

| cache type | PPL | Δ vs q8_0 | KV size (2048 ctx, 16 KV layers) | pp t/s |
|------------|----:|---------:|----------------------------------|-------:|
| q8_0 (baseline) | **6.1005 ± 0.039** | — | K 34 + V 34 = 68 MiB | 2789 |
| turbo3 | **6.1507 ± 0.039** | +0.82% | K 12.5 + V 12.5 = 25 MiB | 2748 |
| planar3 | 6.3541 ± 0.041 | +4.16% | K 64 + V 12.5 = 76.5 MiB | 1729 |
| iso3 | 6.3701 ± 0.042 | +4.42% | K 64 + V 12.5 = 76.5 MiB | 1391 |

## Key findings

### 1. planar3/iso3 K cache is larger than q8_0 on Qwen3.6-27B

turbo3 reduces KV to 25 MiB (−63% vs q8_0).  
planar3/iso3 have K = 64 MiB — **88% larger than q8_0's 34 MiB K**.  
Total KV (76.5 MiB) is **12% larger than q8_0 baseline**.

Root cause: Qwen3.6 has `n_embd_head_k = 256` (vs 128 for Llama 3.1 8B).
The planar quantization block size is likely hardcoded for 128-dim heads.
With 256-dim heads, the block-diagonal structure doesn't align to the quantization
grain, producing a larger effective layout.

### 2. Decode throughput degrades significantly

| type | pp t/s | vs q8_0 |
|------|-------:|--------:|
| q8_0 | 2789 | — |
| turbo3 | 2748 | −1.5% |
| planar3 | 1729 | **−38%** |
| iso3 | 1391 | **−50%** |

The overhead is consistent with the inflated K cache — more memory bandwidth,
not computational cost.

### 3. PPL quality: turbo3 wins by large margin

On this model/hardware, turbo3 is the Pareto-dominant choice:  
- Better PPL than planar3/iso3 (6.15 vs 6.35+)  
- 63% KV memory savings (vs 0% or negative for planar3/iso3)  
- No throughput regression (−1.5% vs q8_0)

### 4. Speed bench blocked by Windows Smart App Control

`llama-bench.exe` was blocked by Windows Device Guard on the test machine.  
`llama-perplexity.exe` ran without restriction — PP throughput above is from
perplexity chunked-batch runs, not `llama-bench`, and reflects relative performance.

## Hypothesis: head-dim sensitivity

RotorQuant's planar3/iso3 types appear tuned for 128-dim attention heads.
With Qwen3.6's 256-dim GQA heads (4 KV heads × 256 dims), the block-diagonal
rotation matrix does not capture the same proportion of variance per block,
increasing quantization error and — unexpectedly — the storage layout.

**This does not invalidate RotorQuant's results on Llama 3.1 8B**, but it does
indicate the approach is not architecture-agnostic. TurboQuant's Hadamard rotation
generalizes better across head dimensions in this test.

## Next steps

1. Test on Qwen3.6-35B-A3B MoE (GQA heads same dims, different layer count)
2. Test on a 128-dim head model (Llama 3.1 8B if downloadable) for direct comparison
3. Report head-dim sensitivity finding to johndpope/RotorQuant repo
