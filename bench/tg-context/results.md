# TG vs context depth — Qwen3.6-35B-A3B

**Date:** 2026-04-24  
**Build:** TheTom `67559e580` HEAD  
**Model:** Qwen3.6-35B-A3B Q4_K_M  
**Hardware:** RTX 4090 SM89  
**Flags:** `-fa 1 -ngl 99 -n 64 -r 2`

## TG128 by context depth (t/s)

| config | 4K | 8K | 16K | 32K |
|--------|---:|---:|----:|----:|
| q8_0 / q8_0 | 177.11 | 177.61 | 181.23 | 181.18 |
| q8_0 / turbo4-V | 173.75 (−1.9%) | 174.39 (−1.8%) | 178.67 (−1.4%) | 177.67 (−1.9%) |
| turbo3 / turbo3 | 172.09 (−2.8%) | 173.50 (−2.3%) | 178.49 (−1.5%) | 172.25 (−4.9%) |
| turbo4 / turbo4 | 172.55 (−2.6%) | 173.26 (−2.5%) | 174.29 (−3.8%) | 173.41 (−4.3%) |

## Finding

TG is flat from 512 to 32K for all configs. The 35B-A3B KV cache at 32K ≈ 166 MB vs ~20 GB of model weights — decode remains bandwidth-bound on weights, not KV. Overhead is architecture-driven and fixed, not context-dependent.

This contrasts with dense models where TG degrades with depth as KV bandwidth grows relative to weight bandwidth.

## Reproduction

```bat
llama-bench.exe -m Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf ^
  -ngl 99 -fa 1 ^
  -ctk q8_0 -ctv turbo4 ^
  -ctk q8_0 -ctv q8_0 ^
  -ctk turbo3 -ctv turbo3 ^
  -ctk turbo4 -ctv turbo4 ^
  -p 512 -n 64 -d 4096,8192,16384,32768 -r 2 -o md
```
