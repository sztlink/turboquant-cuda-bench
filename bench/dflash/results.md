# DFlash speculative decoding — Qwen3.6-27B dense

**Date:** 2026-05-04  
**Build:** spiritbuun/buun-llama-cpp `aecbbd5da` (build 9304)  
**Target:** Qwen3.6-27B dense Q4_K_M (bartowski, 16.32 GiB, 64 layers, 65/65 GPU)  
**Drafter:** dflash-draft-3.6-q4_k_m.gguf (975 MiB, 5 layers, arch=dflash-draft, 6/6 GPU)  
**Hardware:** RTX 4090 SM89 (24 GB VRAM)

## Baseline — 27B dense, q8_0/q8_0 (build 9304)

| test | t/s |
|------|----:|
| pp512 @ d0 | 3012.54 ± 129.41 |
| tg128 @ d0 | **45.00 ± 0.03** |
| pp512 @ d4096 | 2913.21 ± 63.28 |
| tg128 @ d4096 | 43.92 ± 0.08 |
| pp512 @ d16384 | 2598.35 ± 25.57 |
| tg128 @ d16384 | 40.83 ± 0.09 |
| pp512 @ d32768 | 2256.48 ± 51.30 |
| tg128 @ d32768 | **37.38 ± 0.07** |

TG degrades 45 → 37 t/s (−17%) from d0 to d32K.

## DFlash — depth comparison (build 9304)

**Build 8909 blocker resolved** — `dflash.mask_token_id=248070` special token check
patched in upstream master. Build 9304 loads drafter without error.

| depth | prompt tokens | accept rate | eff. t/s | baseline t/s |
|------:|-------------:|------------:|---------:|-------------:|
| ~27 | 27 | **60.0%** | 25.7 | 45.0 |
| ~1500 | 1501 | **36.8%** | 16.9 | ~44.0 |

Config d0: `-c 8192 -b 2048 -ub 512 --draft 16`  
Config d1500: `-c 12000 -b 8192 -ub 2048 --draft 16`

## Key finding — encoder constraint limits depth bench

The DFlash drafter is non-causal (`causal_attn = false`) and operates as an
encoder. The implementation requires `n_ubatch ≥ n_prompt_tokens`. Depths beyond
~2K tokens require n_ubatch > 2048, whose compute buffer exceeds VRAM on a 24 GB
GPU. **Multi-depth DFlash bench beyond d~2K is not feasible on RTX 4090 with
current build.**

On 80 GB A100/H100: n_ubatch=16384+ would fit, enabling proper d4096+ comparison.

## Accept rate degradation at depth

Accept rate dropped from **60% → 37%** between d27 and d1500 with the same
repetitive prompt. Two candidate causes:

1. **Prompt content sensitivity** — repetitive prompt (same sentence ×75) may
   create a degenerate drafting scenario where the drafter's output diverges from
   the target's predictions
2. **KV cache bandwidth** — target verification throughput stays high (target
   pp: 526–1000 t/s), but more draft rounds per accepted token inflate wall time

The drafter itself runs at constant **~47 t/s** across both depths — the SWA
window (2048 tokens) means the drafter does not degrade with context length.

## Architecture notes

- Drafter: 5 layers, full 27B embedding width (5120), FF dim 17408 — each layer
  costs as much as a target layer. At d0 where target is fast (45 t/s), the
  drafter doesn't amortize overhead.
- `dflash.target_layer_ids = [1, 16, 31, 46, 61]` — all within 27B's 64 layers ✓
- `tokenizer.ggml.pre = qwen35` — same tokenizer ✓
- drafter `n_swa = 2048` — sliding window, no depth degradation on drafter side

## Next steps

1. Bench on hardware with ≥80 GB VRAM — enables proper d4096/d16384/d32768 comparison
2. Test with diverse prompt (not repetitive) to isolate content sensitivity vs depth
3. DFlash on 35B-A3B MoE — target runs slower (~50 t/s tg), drafter overhead
   relatively cheaper, may show positive speedup
4. Try `--draft 8` vs `--draft 16` — shorter drafts may maintain higher accept rate
