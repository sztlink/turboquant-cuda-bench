# REFRACT CUDA quick smoke

Date: 2026-05-09

Status: CUDA smoke, not a full benchmark.

## Goal

Run a small REFRACT CUDA score using TheTom's public REFRACT code and the existing 4090 llama.cpp TurboQuant build, then pull the JSON reports into this repo.

## Host / setup

```text
host: 4090
machine: DESKTOP-CTAHC6D
GPU: NVIDIA GeForce RTX 4090
NVIDIA driver: 595.79
REFRACT: v0.3.2.3
backend: llamacpp
llama.cpp bin dir: C:\turbo-build\llama-cpp-turboquant\build\bin
llama.cpp commit in report: 69d8e4be4
model: C:\models\Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf
ctx: 512
n_predict: 16
seed: 42
axis: trajectory only
KLD: skipped in the successful smoke
```

## Successful runs

### q8/q8 self-check

```text
reference: ctk=q8_0,ctv=q8_0
candidate: ctk=q8_0,ctv=q8_0
composite: 100.00
band: EXCELLENT
full match rate: 100.0%
median first divergence: all matched
mean prefix agreement: 16.0 tokens
```

Artifact:

```text
llama8b-q8q8-trajectory-self-quick.json
q8q8-trajectory-self-run.log
```

### q8/turbo4 candidate

```text
reference: ctk=q8_0,ctv=q8_0
candidate: ctk=q8_0,ctv=turbo4
composite: 81.46
band: PASS
full match rate: 63.3%
median first divergence: token 8
mean prefix agreement: 13.0 tokens
```

Artifact:

```text
llama8b-q8turbo4-trajectory-quick.json
q8turbo4-trajectory-run.log
```

## Failed/default attempt

A default q8/turbo4 run attempted Axis A + KLD. Axis A completed with the same trajectory score, but KLD failed inside `llama-perplexity --kl-divergence`:

```text
RuntimeError: llama-perplexity --kl-divergence exited 3221226505
...
ggml-backend.cpp:898: pre-allocated tensor (cache_v_l0 (reshaped) (view))
in a buffer (CUDA0) that cannot run the operation (SET_ROWS)
```

This is useful setup evidence: the trajectory path is alive on CUDA; KLD for this candidate/build needs a separate fix or different flags before it can be treated as a complete quick score.

Artifact:

```text
q8turbo4-kld-failed-run.log
```

## Interpretation

The REFRACT adapter is now operational on the 4090 for trajectory-only CUDA checks. The q8/q8 self-check gives a clean control. The q8/turbo4 candidate shows measurable trajectory drift even in a tiny 16-token smoke, while still landing in REFRACT's PASS band for this reduced axis.

Do not use this as a public benchmark. It is a harness/proof-path smoke for the larger stack:

```text
tqkit KV math -> REFRACT trajectory quality -> KVFidelity action trace
```

## Next

- Fix or isolate the CUDA KLD `SET_ROWS` failure before treating default REFRACT quick scores as complete.
- Repeat on the actual KVFidelity model family if needed, but only after deciding a runtime budget.
- Add these JSON reports to a future proof-pack example as private evidence only.
