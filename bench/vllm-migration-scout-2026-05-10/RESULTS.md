# vLLM migration scout, 2026-05-10

Scope: assess whether Felipe's 4090/3090 machines can run TheTom's CUDA vLLM TurboQuant lane.

## Repos

Relevant CUDA repo:

- `https://github.com/TheTom/vllm-turboquant`
- default branch: `feature/turboquant_plus`
- observed commit: `36fc048255d0bbdab05811d667182a965fe05936`

Not our NVIDIA lane:

- `https://github.com/TheTom/vllm-swift`
- targets Apple Silicon / Metal / MLX.

## 4090 host

Host: `DESKTOP-CTAHC6D`

- GPU: RTX 4090, driver `595.79`, CUDA driver reports `13.2`.
- CUDA toolkit on Windows: `nvcc 12.8.93`.
- Python: 3.11.9 and 3.12.10.
- WSL: not installed.
- Docker: not available.
- Windows optional features:
  - `Microsoft-Windows-Subsystem-Linux`: disabled.
  - `VirtualMachinePlatform`: disabled.
- Firmware virtualization: reported disabled.

Conclusion: 4090 is the best target for TheTom's vLLM branch because the driver is new enough, but it cannot currently run WSL2/Docker until virtualization is enabled and WSL2 is installed.

## 3090 host

Host: `Sztutman` / `felipe-pc`

- GPU: RTX 3090, driver `566.14`, CUDA driver reports `12.7`.
- WSL2 Ubuntu exists and starts.
- Ubuntu: 24.04.3 LTS.
- WSL GPU visibility: `nvidia-smi` works.
- WSL root filesystem has ~954 GB free.
- Docker Desktop exists.
- WSL lacks pip/build toolchain initially.
- Driver is older than vLLM's current default CUDA wheel line (`cu129`/`cu130` in the checked branch docs/setup).

Conclusion: 3090 is a usable Linux sandbox, but it is not the best target for TheTom's current vLLM branch unless we update the NVIDIA driver or build a CUDA version compatible with the older driver. That is a bigger infra mutation and less aligned with the 4090-first protocol.

## Blocker

The practical blocker is not code yet. It is machine readiness:

- vLLM CUDA wants Linux/WSL2/Docker.
- 4090 has the right GPU/driver but no WSL2 and firmware virtualization is disabled.
- 3090 has WSL2 but driver line is likely too old for the current vLLM TurboQuant branch default wheels.

## Recommended next move

Physical/BIOS step on the 4090:

1. Enable Intel virtualization / VT-x in BIOS/UEFI.
2. Boot Windows.
3. Enable WSL + VirtualMachinePlatform and install Ubuntu.
4. Then create a `/home/user/vllm-lab` sandbox and install `vllm-turboquant@feature/turboquant_plus` with precompiled base libs if possible.

After WSL2 works on the 4090, first smoke should be small:

- Qwen 0.6B/4B/8B HF model.
- 8K/16K/32K.
- `--kv-cache-dtype turboquant_k8v4`.
- Fit, throughput, simple needle.

Do not begin with 27B/192K in vLLM. The current 27B GGUF from llama.cpp is not directly reusable as the vLLM starting point.
