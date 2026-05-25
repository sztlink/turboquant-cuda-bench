# TheTom clean baseline plan — vLLM TurboQuant

Date: 2026-05-25

Purpose: define a clean upstream validation lane for contributing to TheTom without confusing it with the existing `sztlink` EPKV/runtime overlay.

## Why this exists

The current AYA-4090 live vLLM service is valuable, but it is not a clean upstream baseline. It includes local build adaptations, service wrapper state, TriAttention environment policy, and EPKV/sampler/backend research edits.

The current contribution target is different:

> Validate and contribute to TheTom's vLLM TurboQuant stack without carrying the historical EPKV overlay as evidence.

## Track split

| Track | Status | Purpose | May support upstream claims? |
|---|---|---|---|
| `sztlink-overlay` | existing live service | RealRAG/EPKV/runtime lab | no, unless reproduced cleanly |
| `thetom-clean` | to be created | upstream validation/contribution baseline | yes, if clean and documented |
| `llama.cpp-cuda` | deferred | CUDA-C++ kernel profiling | later; needs separate infra approval |

## Clean baseline requirements

A `thetom-clean` baseline must be:

- checked out from `TheTom/vllm-turboquant`;
- pinned to an explicit commit, initially `36fc048255d0bbdab05811d667182a965fe05936` unless deliberately updated;
- separate from `/home/felipe/vllm-lab/vllm-turboquant-fresh-20260515`;
- separate venv from `/home/felipe/vllm-lab/venv-tq-fresh-20260515`;
- free of `sztlink` EPKV directories, sampler/logit-policy patches, and backup files;
- not installed as the default `VLLM-AutoStart` service;
- documented with exact build command, env, host, CUDA/PyTorch versions, and first smoke result.

Suggested names, if approved later:

```txt
/home/felipe/vllm-lab/vllm-turboquant-clean-20260525
/home/felipe/vllm-lab/venv-tq-clean-20260525
```

## What to do first, without infra mutation

1. Preserve the current lineage document:

```txt
VLLM-RUNTIME-LINEAGE-4090.md
```

2. Extract a minimal clean build recipe from the known successful build:

```txt
source: /home/aya/implante/tmp/fresh-tq-venv-tecnofagia-2026-05-15.sh
log:    /home/aya/implante/tmp/fresh-tq-venv-tecnofagia-2026-05-15.log
```

3. Prepare a `thetom-clean` build script locally, but do not run it on the 4090 until `[CONFIRMAR:INFRA]` is given.

4. Define the first receipt fields before running anything:

```txt
upstream_repo
upstream_commit
local_build_script_sha256
host
os/wsl
python
cuda_toolchain
pytorch
vllm_version
kernel_language_observed
kv_cache_dtype
model
max_model_len
smoke_prompt
service_changed: no
live_service_stopped: no
```

## First clean validation target

The first clean validation should be intentionally boring:

- import smoke;
- one local Python `LLM(...)` or short server smoke, not a long benchmark;
- model: small enough to avoid live-service conflict if possible;
- `kv_cache_dtype=turboquant_k8v4`;
- `max_model_len` small/medium, e.g. 8192 or 16384;
- deterministic arithmetic sanity prompt;
- record whether TurboQuant backend and Triton kernels are selected in logs.

No performance claim from this first smoke.

## Contribution candidates after clean baseline exists

### Good first contributions

- build recipe for RTX 4090 / WSL2 / cu130;
- documentation note for required CUDA symlinks and `MAX_JOBS=4`;
- runtime map: TurboQuant-specific vLLM path is Triton/Python, not CUDA-C++;
- validation receipt showing clean import/generate success;
- report of any build/doc mismatch found during clean setup.

### Not ready yet

- upstream bug report;
- kernel patch;
- speedup claim;
- quality claim;
- claim that `sztlink` overlays are part of TheTom upstream.

## Candidate Discord ask

After the clean baseline plan/receipt exists:

```txt
We built and operated your vLLM TurboQuant branch on a local RTX 4090/WSL2/cu130 setup. We are separating our local EPKV overlay from a clean upstream baseline before filing anything. Would a concise build-recipe PR / runtime-path map be useful, and is 36fc048 still the right commit/branch for validation?
```

Do not send without Felipe approval.

## Candidate GitHub direction

Open a GitHub issue/PR only for one of these:

1. a clean reproducible build-doc improvement;
2. a clean repro of a concrete bug;
3. a small documentation patch clarifying Triton kernel path / supported presets;
4. a validation receipt link if TheTom asks for it.

## Stop conditions

Stop and reassess if:

- clean build requires stopping/changing the live `VLLM-AutoStart` service;
- dependency installation wants global/system changes;
- any step risks overwriting the existing `sztlink` overlay;
- a smoke requires long-running inference or high VRAM contention;
- behavior only reproduces on the dirty live tree.

## Infra boundary

This plan is documentation only. Executing the clean baseline on the 4090 requires explicit `[CONFIRMAR:INFRA]` because it creates a new clone/venv and may consume GPU/VRAM.
