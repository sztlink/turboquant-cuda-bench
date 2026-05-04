# DFlash speculative decoding — Qwen3.6-27B dense

**Date:** 2026-05-03  
**Build:** spiritbuun/buun-llama-cpp `aecbbd5da` (build 9304)  
**Target:** Qwen3.6-27B dense Q4_K_M (bartowski, 16.32 GiB, 64 layers, 65/65 GPU)  
**Drafter:** dflash-draft-3.6-q4_k_m.gguf (975 MiB, 5 layers, arch=dflash-draft, 6/6 GPU)  
**Hardware:** RTX 4090 SM89  

## Baseline — 27B dense, q8_0/q8_0, no spec decoding (build 9304)

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

TG degrades with ctx depth: 45.00 → 37.38 t/s (−17% from d0 to d32K).

## DFlash — build 9304 (special token bug fixed)

**Build 8909 blocker resolved:** `dflash.mask_token_id=248070` special token check
patched in upstream master. Build 9304 loads drafter without error.

**Run config:** `-c 8192 -b 2048 -ub 512 --draft 16 -n 256 -ctk q8_0 -ctv q8_0 -fa 1`

| metric | value |
|--------|------:|
| prompt tokens | 27 |
| generated tokens | 266 |
| n_drafted | 400 |
| n_accept | 240 |
| **accept rate** | **60.0%** |
| drafter decode | 25.75 t/s (wall clock) |
| target batch verify | 498 t/s (452 tok batch) |
| target eval | 46.46 t/s (376 runs) |

**Effective wall-clock: 25.7 t/s vs 45.0 t/s baseline at d0.**

### Finding

DFlash accept rate of 60% with draft=16 is strong. However, effective decode speed
(25.7 t/s) is lower than the 45 t/s baseline at d0. Root cause: the dflash-draft
model uses the full 27B embedding width (5120) and feedforward dimension (17408) —
each of its 5 layers costs as much per-token as a full 27B layer. At d0 where the
dense target is fast (45 t/s), the drafter doesn't recover that overhead.

The interesting operating point is high-context depth (d32K: baseline 37 t/s) or
the 35B-A3B MoE target — which runs at ~180 t/s prefill but slower decode, making
the DFlash overhead relatively cheaper.

**Drafter architecture confirmed compatible with 27B:**
- `dflash.target_layer_ids = [1, 16, 31, 46, 61]` — all within 27B's 64 layers ✓
- `embedding_length = 5120` — matches 27B embedding dim ✓
- `tokenizer.ggml.pre = qwen35` — same tokenizer family ✓

## Next steps

1. Bench DFlash at d4096, d16384, d32768 — compare at depths where baseline degrades
2. Bench DFlash on 35B-A3B MoE target (requires checking layer ID compatibility)
3. Try `--draft 8` vs `--draft 16` vs `--draft 24` — acceptance curve vs latency
4. Try `--p-min` threshold (new in b9304: `cab1fb5` — adaptive draft length)
