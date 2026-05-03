# sparse-V dequant skip — CUDA benchmark

**Date:** 2026-04-24  
**Build:** TheTom `65a2c690f` (nosparse)  
**Model:** Qwen3-30B-A3B Q4_K_M  
**Flags:** `-fa 1 -ctv q8_0`  
**Test:** `GGML_TURBO_SPARSE_V_DISABLE=1` (OFF) as baseline vs default ON

## RTX 4090 · SM89 (Ada Lovelace)

| ctx | sparse-ON (t/s) | sparse-OFF (t/s) | Δ |
|----:|----------------:|-----------------:|--:|
| 512 | 59.05 | 59.51 | −0.8% |
| 4096 | 13.39 | 13.77 | **−2.8%** |
| 8192 | 7.73 | 7.77 | −0.5% |
| 16384 | 3.95 | 3.97 | −0.5% |
| 32768† | 104.57 | 104.96 | −0.4% |

†32K = PP+TG combined (PP dominant).

## RTX 3090 · SM86 (Ampere)

| ctx | sparse-ON (t/s) | sparse-OFF (t/s) | Δ |
|----:|----------------:|-----------------:|--:|
| 512 | 32.49 | 32.19 | −0.9% |
| 4096 | 6.40 | 6.38 | −0.3% |
| 8192 | 2.56 | 2.54 | −0.8% |
| 16384 | 1.26 | ~1.25 | ~−0.5% |
| 32768 | — | — | OOM |

## Finding

sparse-V adds CUDA dispatch overhead at every context depth tested (−0.3% to −2.8%). Peak at ctx=4096 (−2.8%), flattens at longer contexts. Pattern consistent across SM86 and SM89.

Contrast with Metal (M5 Max): sparse-V gains +4.0% → +12.9% → +22.8% at 4K/16K/32K. CUDA is bandwidth-bound differently — dispatch overhead exceeds dequant skip gain.

**Consequence:** TheTom disabled sparse-V in PR #105 (warp divergence). This data was the primary evidence.

## Reproduction

```bat
set GGML_TURBO_SPARSE_V_DISABLE=1
llama-bench.exe -m Qwen3-30B-A3B-Q4_K_M.gguf -ngl 99 -fa 1 ^
  -ctk q8_0 -ctv q8_0 -p 512 -n 128 -d 512,4096,8192,16384,32768 -r 2 -o md

set GGML_TURBO_SPARSE_V_DISABLE=0
llama-bench.exe -m Qwen3-30B-A3B-Q4_K_M.gguf -ngl 99 -fa 1 ^
  -ctk q8_0 -ctv q8_0 -p 512 -n 128 -d 512,4096,8192,16384,32768 -r 2 -o md
```
