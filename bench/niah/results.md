# NIAH retrieval — asymmetric TurboQuant

**Date:** 2026-04-14  
**Build:** TheTom `8590cbf`  
**Model:** Qwen3-30B-A3B MoE Q4_K_M  
**Config:** q8_0-K + turbo3-V  
**Hardware:** RTX 4090 SM89  
**Server:** llama-server, 65K ctx, flash-attn on  
**Needle:** "DIAMOND-7749-RUBY" inserted at 5 depths × 5 context lengths

## Results

| Context | 0% | 25% | 50% | 75% | 100% | Score |
|--------:|:--:|:---:|:---:|:---:|:----:|:-----:|
| 4K | ✓ | ✓ | ✓ | ✓ | ✓ | 5/5 |
| 8K | ✓ | ✓ | ✓ | ✓ | ✓ | 5/5 |
| 16K | ✓ | ✓ | ✓ | ✓ | ✓ | 5/5 |
| 32K | ✓ | ✓ | ✓ | ✓ | ✓ | 5/5 |
| 65K | ✓ | ✓ | ✓ | ✓ | ✓ | 5/5 |

**25/25 — perfect retrieval at all depths and context lengths.**

## Finding

q8_0-K + turbo3-V shows no retrieval degradation vs f16/f16 on Qwen3-30B-A3B at contexts up to 65K. Asymmetric config preserves retrieval quality while reducing KV memory.
