# Building vllm-turboquant on a single consumer 4090 + WSL2 Ubuntu

Tested working configuration as of 2026-05-11 against commit `36fc04825` of `feature/turboquant_plus`.

This recipe is for the case where you do **not** have a system CUDA toolkit installed and you want to build the fork against pip-distributed CUDA components only. WSL2 Ubuntu 24.04 on a Windows 11 host, 4090 (SM89), Python 3.12.

## TL;DR

```bash
# 1. base toolchain
curl -LsSf https://astral.sh/uv/install.sh | sh
sudo apt-get install -y cmake ninja-build python3-dev tmux
~/.local/bin/uv venv ~/vllm-lab/venv --python 3.12
git clone --depth 1 --branch feature/turboquant_plus \
  https://github.com/TheTom/vllm-turboquant ~/vllm-lab/vllm-turboquant

# 2. pip CUDA 13.0 (pin to 13.0.x — mismatch with 13.2 fails cmake)
~/.local/bin/uv pip install --python ~/vllm-lab/venv/bin/python \
  "nvidia-cuda-nvcc==13.0.88" \
  "nvidia-cuda-crt==13.0.88" \
  "nvidia-cuda-runtime==13.0.96" \
  "nvidia-nvvm==13.0.88" \
  "nvidia-cuda-cccl<13.1"

# 3. precompiled torch cu130 wheels
~/.local/bin/uv pip install --python ~/vllm-lab/venv/bin/python \
  --index-url https://download.pytorch.org/whl/cu130 \
  torch torchvision torchaudio

# 4. build deps for --no-build-isolation
~/.local/bin/uv pip install --python ~/vllm-lab/venv/bin/python \
  "cmake>=3.26.1" ninja "packaging>=24.2" "setuptools>=77.0.3,<81.0.0" \
  "setuptools-scm>=8.0" wheel jinja2 numpy

# 5. symlinks: pip CUDA layout differs from cmake's expectations
CU=~/vllm-lab/venv/lib/python3.12/site-packages/nvidia/cu13
(
  cd "$CU/lib"
  for f in lib*.so.*; do
    base=$(echo "$f" | sed -E 's/\.so\.[0-9].*$/.so/')
    [ ! -e "$base" ] && ln -s "$f" "$base"
  done
  ln -sf /usr/lib/wsl/lib/libcuda.so.1 libcuda.so
  mkdir -p stubs
  ln -sf /usr/lib/wsl/lib/libcuda.so.1 stubs/libcuda.so
)
[ ! -e "$CU/lib64" ] && ln -s lib "$CU/lib64"

# 6. build env + invocation
export CUDA_HOME=$CU
export CUDA_PATH=$CUDA_HOME
export PATH=$CUDA_HOME/bin:$PATH
export LD_LIBRARY_PATH=$CUDA_HOME/lib:/usr/lib/wsl/lib:$LD_LIBRARY_PATH
export LIBRARY_PATH=$CUDA_HOME/lib:/usr/lib/wsl/lib:$LIBRARY_PATH
export CMAKE_LIBRARY_PATH=/usr/lib/wsl/lib
export MAX_JOBS=4                # default -j=32 OOMs 31 GiB WSL2
export TORCH_CUDA_ARCH_LIST=8.9  # SM89; sm80 marlin still compiles by filename
export NVCC_THREADS=1

~/.local/bin/uv pip install --python ~/vllm-lab/venv/bin/python \
  --no-build-isolation -e ~/vllm-lab/vllm-turboquant
```

Reported build wall time on i9-13900K (24C/32T): **58 min 09 s**.

## Why each piece is required

| step | why |
|---|---|
| `nvidia-cuda-cccl` | provides `<nv/target>` and the rest of libcudacxx; otherwise `cuda_fp16.h` fails at `fatal error: nv/target: No such file or directory` |
| All `nvidia-cuda-*` pinned to **13.0** | `nvcc 13.2 + cuda_runtime 13.0` fails cmake's `cuda.cmake:127` with "FindCUDA says CUDA version is 13.2, but CUDA headers say the version is 13.0" |
| `libcudart.so` symlink | `nvidia-cuda-runtime` ships only `libcudart.so.13`; cmake's `find_library` looks for the unversioned `.so`; without the symlink: `cannot find -lcudart` at link time |
| `lib64 -> lib` symlink | flashinfer's JIT link command writes `-L<CUDA_HOME>/lib64`; pip CUDA puts libs in `lib/` |
| `libcuda.so -> /usr/lib/wsl/lib/libcuda.so.1` | the driver lib is supplied by WSL at a non-standard path; without the symlink: `cannot find -lcuda` |
| `MAX_JOBS=4` | default `-j=32` runs 32 nvcc workers in parallel; each can use 2–4 GiB. 31 GiB WSL2 RAM caps it; OOM kill returns exit 137 around build target 33/350 |
| `TORCH_CUDA_ARCH_LIST=8.9` | restrict to SM89 (4090); the `sm80_*` MoE marlin kernels still compile by filename rule but most other kernels skip non-target arches |
| `--no-build-isolation` | the build backend depends on torch being importable to detect `CUDA_VERSION`; build isolation would recreate a fresh env without torch |

## Pitfalls

- **`nvidia-cuda-nvcc-cu13`** is the **deprecated** name. The current package is `nvidia-cuda-nvcc` (no `-cu13` suffix). Install errors are silent — `uv pip install` will skip and leave the package missing.
- **vLLM forks Python multiprocessing under WSL** with the `spawn` start method (NVML is fork-incompatible on WSL). Any script that imports `vllm.LLM` at module top level will reentrantly spawn workers forever. Wrap the entry point:
  ```python
  if __name__ == "__main__":
      main()
  ```
- **flashinfer JIT-compiles** sampling kernels on first request. Same symlinks (`lib64`, `libcuda.so`) needed. Clear `~/.cache/flashinfer` if you change symlinks mid-build.
- **`FlashAttention >= 3` is incompatible** with the TurboQuant backend in this fork. vLLM logs:
  `TurboQuant is not yet compatible with FlashAttention >= 3. Overriding flash_attn_version to 2.`
  Don't pre-install FA3 thinking you need it.
- **GPU memory allocator startup check**: vLLM measures free VRAM at startup and refuses to allocate above `gpu_memory_utilization * free_memory`. On a Windows host that runs a desktop compositor (`dwm.exe`, `LogonUI.exe`) plus any GPU-resident services (`ollama.exe`, idle `llama-server.exe`), ~2 GiB is gone before vLLM starts. Kill those before launching 32B-scale models on a 24 GiB card, or drop `gpu_memory_utilization` to leave headroom.

## Sanity smoke

```python
# vllm-smoke.py
import os, time
os.environ.setdefault("HF_HOME", os.path.expanduser("~/hf-cache"))

def main():
    from vllm import LLM, SamplingParams
    llm = LLM(
        model="Qwen/Qwen2.5-0.5B-Instruct",
        kv_cache_dtype="turboquant_k8v4",
        max_model_len=8192,
        gpu_memory_utilization=0.50,
        enforce_eager=True,
    )
    sp = SamplingParams(temperature=0.0, max_tokens=64, seed=42)
    out = llm.generate(["Write one sentence describing the color blue."], sp)
    print(out[0].outputs[0].text)

if __name__ == "__main__":
    main()
```

```bash
export CUDA_HOME=~/vllm-lab/venv/lib/python3.12/site-packages/nvidia/cu13
export LD_LIBRARY_PATH=$CUDA_HOME/lib:/usr/lib/wsl/lib:$LD_LIBRARY_PATH
~/vllm-lab/venv/bin/python vllm-smoke.py
```

Expected first-light logs:

```
Using TURBOQUANT attention backend out of potential backends: ['TURBOQUANT'].
TriAttention V3 Tier 2: tokenizer bound from Qwen/Qwen2.5-0.5B-Instruct ...
```

(Tier 2 binding is just tokenizer + session-id prep — it does **not** mean TriAttention V3 eviction is active. The actual eviction loop is gated by `VLLM_TRIATT_ENABLED=1`. Default is off.)

## Optional: enabling TriAttention V3 eviction

```bash
export VLLM_TRIATT_ENABLED=1
export VLLM_TRIATT_BUDGET=2048      # default; max live cells per sequence
export VLLM_TRIATT_HYBRID=2         # 0=V1, 1=V2, 2=V3 (default)
export VLLM_TRIATT_PREFIX=128       # protected prefix length, V3 only
export VLLM_TRIATT_WINDOW=128       # protected recent window length
export VLLM_TRIATT_SEGMENTS=8       # per-segment quota bucket count
```

When V3 fires, you should see a log line like:
`TriAttention V3 enabled. budget=2048 hybrid=2 prefix=128 window=128 ...`

## Optional: longctx-svc Tier 3 hooks

```bash
export LONGCTX_ENDPOINT=http://127.0.0.1:8080   # your longctx-svc base URL
```

Without `LONGCTX_ENDPOINT`, Tier 3 evict-to-vector / rehydrate hooks no-op. Tier 2 tokenizer binding always fires for diagnostic purposes regardless of either env var.

## What this recipe was tested against

- Driver: NVIDIA Windows 595.79 (reports CUDA driver 13.x)
- Host: i9-13900K, 64 GiB DDR5, RTX 4090 (24 GiB)
- WSL2: Ubuntu 24.04.4 LTS, 31 GiB RAM visible
- Models exercised: Qwen 2.5-0.5B-Instruct (8K), 7B-Instruct (16K, YaRN to 128K/160K/192K), 32B-Instruct-AWQ (16K)
- Reported numbers and full pain log in [`bench/vllm-smoke-2026-05-10/RESULTS.md`](RESULTS.md) and [`bench/vllm-needle-2026-05-11/RESULTS.md`](../vllm-needle-2026-05-11/RESULTS.md) of the originating repo.
