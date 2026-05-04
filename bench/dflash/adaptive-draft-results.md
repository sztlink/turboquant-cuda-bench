# DFlash adaptive draft — spiritbuun build-may1 vs fixed draft

**Date:** 2026-05-04  
**Build:** spiritbuun/buun-llama-cpp HEAD (post-2026-05-01 commits, build-may1)  
**Target:** Qwen3.6-27B dense Q4_K_M (16.32 GiB, 65/65 GPU)  
**Drafter:** dflash-draft-3.6-q4_k_m.gguf (975 MiB, 6/6 GPU)  
**Hardware:** RTX 4090 SM89 (24 GB VRAM)  
**Config:** `-c 8192 -b 2048 -ub 512 -n 256 -ctk q8_0 -ctv q8_0 -fa 1 -f prompt_27tok.txt`

## Results — effective wall-clock decode speed

| config | flags | accept % | n_drafted | n_accept | t/s eff. |
|--------|-------|--------:|--------:|--------:|--------:|
| fixed draft=16 (build 9304 ref) | `--draft 16` | 62.5% | 384 | 240 | 6.24 |
| fixed draft=16 | `--draft-max 16 --draft-min 16` | 65.2% | 368 | 240 | 5.96 |
| fixed draft=8 | `--draft-max 8 --draft-min 8` | 70.0% | 320 | 224 | 6.92 |
| adaptive p-min=0.75 (default) | `--draft-max 16 --draft-min 4 --draft-p-min 0.75` | 46.9% | 512 | 240 | 4.86 |
| **adaptive p-min=0.9** | `--draft-max 16 --draft-min 4 --draft-p-min 0.9` | **71.4%** | 336 | 240 | **7.03** |

No regression between build 9304 and build-may1 (both ~6.0-6.2 t/s on fixed draft=16).

## Key findings

### 1. Default p-min=0.75 is the worst config

With `--draft-min 4 --draft-p-min 0.75`, the drafter generates 512 tokens (16 tokens × 32 rounds) but only 240 are accepted (46.9%). The confidence threshold at 0.75 is too permissive — the drafter keeps producing tokens the target rejects, burning time.

Result: 4.86 t/s — worse than fixed draft=16 (5.96 t/s).

### 2. p-min=0.9 is the optimal config

At 0.9, the drafter cuts off earlier each round when confidence drops. Fewer total drafts (336 vs 512), same accepted tokens (240), higher accept rate (71.4%), highest throughput (7.03 t/s).

### 3. Fixed draft=8 is a simple, robust alternative

70.0% accept, 6.92 t/s — nearly identical to adaptive p-min=0.9 with no tuning required.

### 4. Effective output vs baseline

Baseline tg128 (no spec decoding) at d0: ~45 t/s.  
Best DFlash config: 7.03 t/s effective wall-clock.

Note: the 25.7 t/s figure in earlier DFlash results was the drafter's standalone decode speed, not the system's effective output rate. Corrected figure: ~6-7 t/s.

At d0 where the target model is fast (45 t/s), DFlash overhead is not amortized. DFlash is expected to be more beneficial at high context depths (d32K: baseline ~37 t/s) where per-token bandwidth cost increases — but this remains untested on single-GPU (encoder constraint limits depth bench to ~2K ctx on 24GB VRAM).

## Recommendation

Use `--draft-max 16 --draft-min 4 --draft-p-min 0.9` for DFlash on RTX 4090 with Qwen3.6-27B.  
Avoid default p-min=0.75 — it is counterproductive on this model/hardware pair.