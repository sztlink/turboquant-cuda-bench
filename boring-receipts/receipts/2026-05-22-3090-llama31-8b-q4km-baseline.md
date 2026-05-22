# Boring Receipt — `2026-05-22-3090-llama31-8b-q4km-baseline`

> Send branch + command shape. We return boring receipts.

| field | value |
|---|---|
| **status** | pass |
| **rung** | 1 — noob (see ladder in README) |
| **node** | AYA-3090 (Ampere) |
| **date** | 2026-05-22 |
| **requested by** | inaugural baseline (self) |

This is rung 1 of the ladder — the noob floor. Prebuilt binary, a downloaded
GGUF, one command. Anyone with a GPU can reproduce it in ~10 minutes. It proves
the node, the format and the honesty of the numbers before climbing toward the
Waffle House (source builds, serving, branch validation).

## Target

| field | value |
|---|---|
| project | llama.cpp (mainline) |
| repo | https://github.com/ggml-org/llama.cpp |
| branch | release |
| commit | 99d4026b1 |
| build | b9286 |
| build flags | official prebuilt release (`llama-b9286-bin-win-cuda-12.4-x64`) |

## Environment

| field | value |
|---|---|
| OS | Windows 11 Pro |
| driver | 566.14 |
| CUDA | 12.7 runtime (CUDA 12.4 build) |
| GPU | NVIDIA GeForce RTX 3090 (compute 8.6) |
| VRAM total | 24575 MiB |
| CPU | Intel Core i9-9900K @ 3.60GHz |
| RAM | 64 GB |

## Model

| field | value |
|---|---|
| name | Meta-Llama-3.1-8B-Instruct |
| quant | Q4_K_M |
| size | 4.58 GiB |
| params | 8.03 B |
| context | llama-bench default |
| source | huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF |

## Command

```
llama-bench.exe -m Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf -ngl 99 -p 512 -n 512 -r 3
```

## Results

| metric | value |
|---|---|
| pp512 (prompt) | **4447.79 ± 109.76 tok/s** |
| tg512 (generation) | **128.61 ± 0.42 tok/s** |
| tg128 (generation) | 131.55 ± 0.10 tok/s (separate `-n 128 -r 5` run) |
| TTFT (derived) | ~115 ms for a 512-token prompt (512 / 4448 tok/s) |
| VRAM peak | 6259 MiB (steady 6229) |
| power avg / peak | ~345 W / 346.74 W |
| temp peak | 68 °C |
| reps | 3 |

Idle baseline before load: 1202 MiB, ~43 W.

## Quality smoke

n/a for this baseline (throughput-only). Receipts that validate a community
branch will include a correctness smoke or a failure reproduction.

## Evidence

llama-bench markdown output (telemetry run):

```
| model                  |   size |  params | backend | ngl |  test |             t/s |
| ---------------------- | -----: | ------: | ------- | --: | ----: | --------------: |
| llama 8B Q4_K - Medium | 4.58 GiB | 8.03 B | CUDA   |  99 | pp512 | 4447.79 ± 109.76 |
| llama 8B Q4_K - Medium | 4.58 GiB | 8.03 B | CUDA   |  99 | tg512 |  128.61 ± 0.42  |
build: 99d4026b1 (9286)
```

GPU telemetry (memory.used MiB, power W, temp C, sampled ~1 Hz during run):

```
4399, 92.02, 53
5859, 141.45, 55
6259, 168.43, 60      <- VRAM peak
6229, 322.98, 66
6229, 344.78, 65
6229, 345.60, 66
6229, 345.89, 67
6229, 346.74, 67      <- power peak
6229, 345.11, 68      <- temp peak
```

## Caveats

- Prebuilt CUDA 12.4 release binary, **not** a source build — flags are whatever
  ggml-org ships, not tuned locally.
- Card is **power-limited** at ~350 W TDP, not thermally limited (68 °C peak).
- Shared workstation: ComfyUI is resident (~1.2 GB idle baseline); model loads on top.
- Power/VRAM sampled at ~1 Hz, so figures are steady-state, not microsecond peak.
- Default `n_ctx`; no long-context or batched-decode path exercised here.

## Next step

Climb one rung, not jump to the top. Rung 2 = same model across quants
(Q4_K_M / Q5_K_M / Q8_0) on this exact node, showing the speed↔quality
trade-off — still noob-reproducible. Serving (vLLM) and branch validation
(TriAttention/longctx/MTP) are higher rungs, reached in order.
