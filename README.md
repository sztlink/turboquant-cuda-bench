# turboquant-cuda-bench

Independent TurboQuant KV cache benchmark data from CUDA production hardware.

## Hardware

| Machine | GPU | VRAM | SM | OS |
|---------|-----|------|----|----|
| aya2 | RTX 4090 | 24 GB | SM89 (Ada Lovelace) | Windows 11 |
| felipe-pc | RTX 3090 | 24 GB | SM86 (Ampere) | Windows 11 |

## Primary model

**Qwen3.6-35B-A3B** Q4_K_M (bartowski, 19.91 GiB)  
MoE hybrid: 10 full-attention (GQA, 2 KV heads) + 40 GDN/Mamba recurrent.  
Production server: `llama-server` TheTom fork, 65K ctx, flash-attn on.

## Builds

| Build | Commit | Notes |
|-------|--------|-------|
| TheTom HEAD | `11a241d0d` | sparse-V CUDA disabled (PR#105) |
| TheTom nosparse | `65a2c690f` | current production server |
| spiritbuun TCQ | `2cc97a81c` | requires `-DGGML_CUDA_FA_ALL_QUANTS=ON` |

## Benchmarks

| Date | Benchmark | What |
|------|-----------|------|
| 2026-04-13 | [throughput-30b-moe](bench/throughput-30b-moe/) | Qwen3-30B-A3B MoE throughput + PPL |
| 2026-04-14 | [niah](bench/niah/) | NIAH retrieval q8_0-K+turbo3-V, 65K ctx |
| 2026-04-24 | [sparse-v](bench/sparse-v/) | sparse-V dequant skip — SM89 + SM86 |
| 2026-04-24 | [ppl-35b-a3b](bench/ppl-35b-a3b/) | PPL wikitext-2, Qwen3.6-35B-A3B |
| 2026-04-24 | [tg-context](bench/tg-context/) | TG vs ctx depth, turbo3 + turbo4 |
| 2026-04-27 | [iq4nl-repro](bench/iq4nl-repro/) | IQ4_NL vs Q4_K_M repro — @lkaupp case |
| 2026-05-03 | [dflash](bench/dflash/) | DFlash speculative decoding, 27B dense |

## Key findings

- **q8_0-K + turbo4-V**: +0.48% PPL, ~178 t/s TG — production sweet spot for 35B-A3B
- **sparse-V CUDA**: −0.3% to −2.8% overhead across all contexts on SM89. Positive only on Metal (M5 Max: up to +22.8% at 32K).
- **IQ4_NL vs Q4_K_M**: same degradation curve under q8/turbo4 — weight quant is not the source of the ctx-depth penalty.
- **SM89 vs SM86**: −54% TG at 131K (SM89) vs −71% (SM86, @lkaupp) — dispatch penalty scales with SM generation, not model quant.

## Methodology

All benchmarks use `llama-bench` unless noted:

```bat
llama-bench.exe -m <model> -ngl 99 -fa 1 -p 512 -n 128 -r 2 -o md
```

Context depths and KV configs specified per test. Full reproduction commands in each benchmark folder.

## Discussion

[ggml-org/llama.cpp #20969](https://github.com/ggml-org/llama.cpp/discussions/20969) — TurboQuant Extreme KV Cache Quantization
