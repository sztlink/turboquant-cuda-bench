# vLLM TurboQuant first-light smoke, 4090 WSL2

Date: 2026-05-11.

Purpose: first end-to-end run of TheTom's `vllm-turboquant @ feature/turboquant_plus` (CUDA branch) on a single RTX 4090 inside WSL2 Ubuntu, with `kv_cache_dtype=turboquant_k8v4`. Covers install + basic generation at 8K (Qwen 0.5B) and 16K (Qwen 7B). Sets a baseline for cross-stack comparison vs the existing llama-cpp-turboquant longctx work in this repo.

## Setup

- Host: RTX 4090, 24 GB, i9-13900K, 64 GB DDR5, Windows 11 Pro
- WSL2 distro: Ubuntu 24.04.4 LTS (Linux kernel via WSL2)
- WSL2 visible RAM: 31 GiB
- Driver Windows: NVIDIA 595.79 (CUDA driver version 13.x reported)
- vLLM commit: `36fc04825` ("fix(triattention): resolve rope_theta from rope_parameters dict (Llama 4)")
- vLLM version reported: `0.1.dev1+g36fc04825`
- Python 3.12.3 in `~/vllm-lab/venv`
- CUDA toolchain via pip (no system CUDA Toolkit needed):
  - nvidia-cuda-nvcc 13.0.88
  - nvidia-cuda-runtime 13.0.96
  - nvidia-cuda-cccl 13.0.85
  - nvidia-cuda-crt 13.0.88
  - nvidia-nvvm 13.0.88
- torch 2.11.0+cu130 (precompiled wheels from `pytorch.org/whl/cu130`)
- Build flags: `MAX_JOBS=4`, `TORCH_CUDA_ARCH_LIST=8.9`, `--no-build-isolation`
- Build wall time: 58 min 09 s
- Backend selected: `TURBOQUANT` (auto from `kv_cache_dtype=turboquant_k8v4`)
- TriAttention V3 binding active (`TriAttention V3 Tier 2: tokenizer bound`)
- FlashAttention version: 2 (forced — fork warns FA3 incompatible with TurboQuant)

## Naming map (vLLM fork ↔ this repo's llama-cpp configs)

Per `vllm/v1/attention/triattention/integration.py:44-45` in this fork:

> `kv_cache_dtype="turboquant_k8v4"` (FP8 K + 4-bit V), which mirrors the K=q8_0 + V=turbo3 config the V3 paper validated

Other documented presets in `vllm/v1/attention/backends/turboquant_attn.py:179-189`:
- `turboquant_k8v3`, `turboquant_4bit_nc`, `turboquant_k4v3_nc`, `turboquant_k3v4_nc`, `turboquant_3bit_nc`
- and `_rv` rotation variants

Note for cross-link with `bench/longctx-proxy-hard-2026-05-10` and the longctx field-test in this repo: the llama-cpp config `q8_0/turbo4` and the vLLM preset `turboquant_k8v4` use the same surface naming but the integration.py docstring explicitly equates `k8v4` with the K=q8_0/V=turbo3 config. Equivalence still to be confirmed empirically.

## Smoke results

### Run 1 — Qwen 2.5-0.5B / 8K / 2 prompts

| metric | value |
|---|---|
| model | `Qwen/Qwen2.5-0.5B-Instruct` |
| max_model_len | 8192 |
| gpu_memory_utilization | 0.50 |
| weights load | 0.93 GiB / 1.4 s |
| total load_time (incl. flashinfer JIT first compile) | 53.35 s |
| generate_time | 3.16 s for 2 prompts |
| GPU KV cache available tokens | **1,558,896** |
| max concurrency @ 8K req | 190.29x |
| EXITCODE | 0 |

Generation sanity (deterministic, temp=0, seed=42, max_tokens=64):

- "Write one sentence describing the color blue." → `"Blue is a deep shade of skyless sky..."` (text generated; semantic quality is a 0.5B-model artifact, not stack-relevant)
- "What is 17 * 23? Answer with just the number." → `"441."` (wrong arithmetic for 0.5B; stack OK)

### Run 2 — Qwen 2.5-7B / 16K / 3 prompts

| metric | value |
|---|---|
| model | `Qwen/Qwen2.5-7B-Instruct` |
| max_model_len | 16384 |
| gpu_memory_utilization | 0.85 |
| weights load | 14.25 GiB / 8.95 s (weights file load 7.36 s) |
| total load_time | 22.49 s (flashinfer JIT cached from run 1) |
| generate_time | 4.59 s for 3 prompts, 372 output tokens total |
| **decode throughput** | **80.98 tok/s** |
| GPU KV cache available tokens | **197,104** |
| max concurrency @ 16K req | 12.03x |
| EXITCODE | 0 |

Generation sanity (deterministic, temp=0, seed=42, max_tokens=200):

- "Compute 17 * 23 step by step. Show your work in 2 lines, then give the final answer." → `"Step 1: 17 * 23 = (10*23) + (7*23). Step 2: 10*23=230, 7*23=161, so 230+161=391. Final Answer: 391."` ✓
- "Three sentences describing blue from physicist / painter / poet" → distinct, substantive sentences across the three perspectives ("450-495 nanometers", "cool calming indigo", "melancholic whisper of the sky")
- "Explain in one short paragraph what KV cache compression means" → coherent technical paragraph; correct framing of memory footprint vs accuracy trade-off

## Readout

- TheTom's `vllm-turboquant @ feature/turboquant_plus` builds and runs end-to-end on a stock 4090 + WSL2 with no system CUDA Toolkit. Driver alone (Windows 595.79) plus pip-distributed CUDA toolchain (cu13) is enough.
- TURBOQUANT backend is auto-selected when `kv_cache_dtype` matches a turbo* preset; the older `q8_0`/`fp8` paths are not implicated.
- TriAttention V3 binds at first scheduled request (Tier 2 path: tokenizer-aware), so on this stack TurboQuant + TriAttention V3 are active simultaneously by default. This is a difference from the llama-cpp main configs used in `bench/longctx-*` in this repo — those exercise TurboQuant without TriAttention V3.
- KV-cache headroom is dramatic on small models: 1.5M tokens for 0.5B at 8K request size, 197K tokens for 7B at 16K — both far in excess of single-request needs. Useful for batch / longctx headroom rather than headline single-stream throughput.
- 80.98 tok/s decode for 7B / 16K with `enforce_eager=True` (no CUDA graphs) is in the expected range for FA2 + TurboQuant on a single 4090. A full-throughput run would also enable graphs.

## Limitations / next steps

- N=2 and N=3 prompts respectively. Throughput numbers are smoke-level, not benchmark-level.
- `enforce_eager=True` was used to fail-fast on the first run; without graphs the decode throughput is conservative.
- Only `turboquant_k8v4` tested. The other presets (`k8v3`, `k3v4_nc`, etc.) are documented in the source but not exercised here.
- No long-context test yet. The natural next step is a needle / decoy run at 32K-128K-192K on the same model family used in `bench/longctx-proxy-hard-2026-05-10` (Qwen 27B), to allow direct cross-stack comparison vLLM ↔ llama-cpp on the same task shape. That requires either Qwen 2.5-32B Q4 GPTQ/AWQ (fits 24 GB) or splitting across both 4090s once the second host is back.
- HF cache lives at `/home/felipe/hf-cache` on this WSL2. Future plan (per `network-topology.md`): centralize HF cache on Unraid and mount via 2.5GbE br1/br2/br3/br4 so multiple hosts share the same model files.

## Install pain log

For replication. Build needs all of:

1. CUDA toolchain via pip pkgs, all pinned to 13.0 (mismatch — e.g. nvcc 13.2 with runtime 13.0 — fails cmake config with "FindCUDA says CUDA version is 13.2, but CUDA headers say 13.0")
2. torch + torchvision + torchaudio cu130 wheels via `--index-url https://download.pytorch.org/whl/cu130`
3. Pre-build deps (since `--no-build-isolation`): `cmake>=3.26.1`, `ninja`, `packaging>=24.2`, `setuptools>=77.0.3,<81.0.0`, `setuptools-scm>=8.0`, `wheel`, `jinja2`, `numpy`
4. Env vars set globally for the build:
   - `CUDA_HOME=$VENV/lib/python3.12/site-packages/nvidia/cu13`
   - `PATH=$CUDA_HOME/bin:$PATH`
   - `LD_LIBRARY_PATH=$CUDA_HOME/lib:/usr/lib/wsl/lib:$LD_LIBRARY_PATH`
   - `LIBRARY_PATH=$CUDA_HOME/lib:/usr/lib/wsl/lib:$LIBRARY_PATH`
   - `CMAKE_LIBRARY_PATH=/usr/lib/wsl/lib`
5. Symlinks created in `nvidia/cu13/` (otherwise linker fails with `cannot find -lcudart` / `cannot find -lcuda`):
   - `lib64 -> lib` (flashinfer expects `lib64`)
   - generic `libfoo.so -> libfoo.so.NN` for each versioned shared lib (cmake `find_library` looks for unversioned)
   - `lib/libcuda.so -> /usr/lib/wsl/lib/libcuda.so.1` (driver lib, in WSL only via /usr/lib/wsl/lib)
   - `lib/stubs/libcuda.so -> /usr/lib/wsl/lib/libcuda.so.1`
6. `MAX_JOBS=4` and `TORCH_CUDA_ARCH_LIST=8.9` — default `-j=32` OOMs WSL2 with 31 GiB visible. Even with `8.9` only, vLLM still compiles the `sm80_*` MoE marlin kernels (file-name driven), so don't expect total skip.
7. `if __name__ == "__main__":` guard in any caller script — vLLM's V1 engine spawns workers via `multiprocessing.spawn` on WSL (NVML is fork-incompatible on WSL).
8. `nvidia-cuda-cccl` is a separate pip package from `nvidia-cuda-runtime`. Without it, the build fails with `fatal error: nv/target: No such file or directory`.
9. flashinfer JIT-compiles its own kernels at first sampler call. Same env / symlinks fix; cleared cache once after symlink fix.

## Artifacts

- `smoke-0.5B-2026-05-11.log` — full vLLM stdout for the 0.5B / 8K run
- `smoke-7B-2026-05-11.log` — full vLLM stdout for the 7B / 16K run
- `smoke-0.5B.py`, `smoke-7B.py` — exact Python entry-points used

## Cross-link

- `bench/longctx-proxy-hard-2026-05-10/` — llama-cpp + longctx-svc + decoy/ranking gap (5/8 final answer at top_k=16)
- `bench/longctx-decoy-resolution-2026-05-10/` — gap closed (16/16) via reranker or external splice
- `bench/vllm-migration-scout-2026-05-10/` — pre-WSL2 readiness scout (now superseded — WSL2 + virtualization both enabled the same day)
- This bench: same TheTom stack family on the CUDA path of vLLM, with TriAttention V3 active. First step toward a vLLM ↔ llama-cpp cross-stack longctx comparison.
