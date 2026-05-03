# PPL — Qwen3.6-35B-A3B Q4_K_M

**Date:** 2026-04-24  
**Build:** TheTom `821f843ed` (build-nosparse, rebuilt 2026-04-24)  
**Model:** Qwen3.6-35B-A3B Q4_K_M (bartowski, 19.91 GiB)  
**Hardware:** RTX 4090 SM89  
**Flags:** `-fa 1 -ngl 99 -c 512 --chunks 100`  
**Dataset:** wikitext-2-raw test set

## Results

| KV config | PPL | Δ vs q8_0 |
|-----------|-----|-----------|
| q8_0 / q8_0 (baseline) | **6.8383** | — |
| **q8_0 / turbo4** (asymmetric) | **6.8711** | **+0.48%** ✅ |
| turbo4 / turbo4 | 6.8834 | +0.66% |
| turbo3 / turbo3 | 6.9207 | +1.20% |

## Finding

All configs near-lossless on 35B-A3B. Contrast with Qwen3-30B-A3B (dense-attention): turbo4/turbo4 +5.4%, turbo3/turbo3 +22.1%.

The difference is architectural: 35B-A3B is a MoE hybrid with only 10 full-attention layers (GQA, 2 KV heads) vs 40 GDN/Mamba recurrent. The KV cache is tiny relative to model state — quantization overhead is nearly free.

**Sweet spot:** q8_0-K + turbo4-V at +0.48% PPL. Asymmetric config preserves K precision where it matters.

## Reproduction

```bat
llama-perplexity.exe -m Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf ^
  -ngl 99 -fa 1 -ctk q8_0 -ctv turbo4 ^
  -f wikitext-2-raw/wiki.test.raw -c 512 --chunks 100
```
