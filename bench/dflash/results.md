# DFlash speculative decoding — Qwen3.6-27B dense

**Date:** 2026-05-03  
**Build:** spiritbuun/buun-llama-cpp `2cc97a81c` (build 8909)  
**Target:** Qwen3.6-27B dense Q4_K_M (bartowski, 16.32 GiB, 64 layers)  
**Drafter:** dflash-draft-3.6-q4_k_m.gguf (985 MB, 5 layers, arch=dflash-draft)  
**Hardware:** RTX 4090 SM89  

## Baseline — 27B dense, q8_0/q8_0, no spec decoding

| test | t/s |
|------|----:|
| pp512 @ d0 | 2828.59 ± 366.83 |
| tg128 @ d0 | **44.07 ± 0.23** |
| pp512 @ d4096 | 2830.75 ± 120.59 |
| tg128 @ d4096 | 42.97 ± 0.36 |
| pp512 @ d16384 | 2524.14 ± 78.19 |
| tg128 @ d16384 | 40.22 ± 0.13 |
| pp512 @ d32768 | 2179.50 ± 58.99 |
| tg128 @ d32768 | **36.91 ± 0.08** |

TG degrades with ctx depth: 44.07 → 36.91 t/s (−16% from 0 to 32K). Contrast with Qwen3.6-35B-A3B MoE: flat ~180 t/s across all depths.

## DFlash — blocked (build 8909 bug)

**Blocker:** `main: draft model special tokens must match target model to use speculation`

Drafter has `dflash.mask_token_id = 248070` registered as a special token. This ID is not present in the target model's special tokens cache. The spiritbuun special-token equality check in build 8909 fails on this mismatch even though both models share the same vocabulary (qwen35, 248320 tokens, identical EOS/BOS).

**Drafter architecture confirmed compatible:**
- `dflash.target_layer_ids = [1, 16, 31, 46, 61]` — all within 27B's 64 layers ✓
- `embedding_length = 5120` — matches 27B embedding dim ✓
- `tokenizer.ggml.pre = qwen35` — same tokenizer family ✓

**Resolution:** rebuild spiritbuun from latest `master` (bug likely patched post-8909) or patch the special-token check to exclude DFlash-specific metadata tokens.

## Next step

Rebuild buun-llama-cpp from HEAD and re-run:

```bat
set TEMP=C:\turbo-build\tmp
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64
cd C:\turbo-build\buun
git pull origin master
cmake C:\turbo-build\buun -B C:\turbo-build\buun-build2 -G "NMake Makefiles" ^
  -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=89 ^
  -DGGML_CUDA_FA_ALL_QUANTS=ON -DCMAKE_BUILD_TYPE=Release
cmake --build C:\turbo-build\buun-build2 --config Release -j 8
```

Then re-run with:
```bat
C:\turbo-build\buun-build2\bin\llama-speculative.exe ^
  -m C:\models\q36_27b_new.gguf ^
  -md C:\models\dflash-draft-3.6-q4_k_m.gguf ^
  -ngl 99 -ngld 99 -fa 1 -ctk q8_0 -ctv q8_0 ^
  -n 256 -f C:\turbo-build\bench_prompt.txt ^
  --spec-type dflash --draft 16 --perf
```
