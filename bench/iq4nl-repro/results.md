# IQ4_NL vs Q4_K_M — @lkaupp case repro

**Date:** 2026-04-27  
**Build:** TheTom `11a241d0d` (sparse-V disabled, PR#105 merged)  
**Hardware:** RTX 4090 SM89  
**Flags:** `-fa 1 -ngl 99 -p 512 -n 128 -r 2`  
**Thread:** [ggml-org/llama.cpp #20969](https://github.com/ggml-org/llama.cpp/discussions/20969#discussioncomment-16733925)

**Context:** @lkaupp reported −71% TG drop at 130K ctx on RTX 3090 with Unsloth IQ4_NL + q8_0/turbo4 KV. @TheTom asked for repro. This is the SM89 confirmation.

## TG128 (t/s)

| ctx | IQ4_NL q8/turbo4 | IQ4_NL f16/f16 | Δ | Q4_K_M q8/turbo4 | Q4_K_M f16/f16 | Δ | IQ4 vs Q4_K_M |
|----:|-----------------:|---------------:|--:|-----------------:|---------------:|--:|--------------:|
| 0 | 169.4 | 173.2 | −2.2% | 178.4 | 184.0 | −3.1% | −5.0% |
| 4K | 158.7 | 172.1 | −7.7% | 166.5 | 182.7 | −8.9% | −4.7% |
| 16K | 130.9 | 159.6 | −18.0% | 135.5 | 168.0 | −19.4% | −3.4% |
| 32K | 106.9 | 151.7 | −29.6% | 110.0 | 159.9 | −31.2% | −2.9% |
| 65K | 77.0 | 131.4 | −41.4% | — | — | — | — |
| 131K | 48.9 | 106.6 | **−54.1%** | — | — | — | — |

## Finding

IQ4_NL and Q4_K_M show the same degradation curve under q8_0/turbo4 — gap between them is 3–5% and shrinks with ctx. The weight quant is not the source of the penalty.

The −54% at 131K on SM89 vs @lkaupp's −71% on SM86 (RTX 3090) is consistent with SM86 having a weaker warp dispatch path for the turbo4 dequant kernel. The degradation is architectural, not model-specific.

## Reproduction

```bat
llama-bench.exe ^
  -m Qwen3.6-35B-A3B-UD-IQ4_NL.gguf ^
  -m Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf ^
  -ngl 99 -fa 1 -ctk q8_0 -ctv turbo4 ^
  -p 512 -n 128 -d 0,4096,16384,32768 -r 2 -o md

llama-bench.exe ^
  -m Qwen3.6-35B-A3B-UD-IQ4_NL.gguf ^
  -m Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf ^
  -ngl 99 -fa 1 -ctk f16 -ctv f16 ^
  -p 512 -n 128 -d 0,4096,16384,32768 -r 2 -o md
```

Extended (65K + 131K, IQ4_NL only — Q4_K_M OOM above 32K on 24GB):

```bat
llama-bench.exe ^
  -m Qwen3.6-35B-A3B-UD-IQ4_NL.gguf ^
  -ngl 99 -fa 1 -ctk q8_0 -ctv turbo4 ^
  -p 512 -n 128 -d 65536,131072 -r 2 -o md
```
