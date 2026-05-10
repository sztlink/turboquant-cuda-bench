# Qwen-class REFRACT KLD smoke

Date: 2026-05-09

Status: local CUDA setup smoke, not a benchmark claim.

## Goal

Exercise the patched `llama-perplexity` KLD path on the actual Qwen-class large-vocab model above the old int32 overflow threshold.

This follows the small Llama 3.1 8B KLD repair smoke in:

```text
bench/thetom-stack-smoke/refract-kldfix-2026-05-09/
```

## Host / setup

```text
host: 4090
machine: DESKTOP-CTAHC6D
GPU: NVIDIA GeForce RTX 4090
NVIDIA driver: 595.79
model: C:\models\q36_35b.gguf
model family: Qwen3.6-35B-A3B Q4_K_M
reported n_vocab: 248320
backend: llama.cpp / REFRACT runner KLD helpers
llama.cpp repo: C:\turbo-build\llama-cpp-turboquant
llama.cpp commit: 69d8e4be4
llama.cpp bin dir: C:\turbo-build\llama-cpp-turboquant\build\bin
llama-perplexity SHA256: C3E190FCBE78EA5950151D9EB73589CA782961CA26810AD95963F161F8C011DE
corpus: C:\Users\Aya Render 1\.cache\refract\wikitext-2-raw\wiki.test.raw
ctx: 14336
chunks: 1
ngl: 99
```

Overflow-sensitive allocation check:

```text
nv = 2 * ((248320 + 1) // 2) + 4 = 248324
ctx * nv = 14336 * 248324 = 3,559,972,864
INT32_MAX = 2,147,483,647
```

So this run exercises the `n_ctx * nv` path above int32 range.

## Method

This used REFRACT's `run_perplexity_kld_base` and `run_perplexity_kld` helpers directly, not the full `refract.cli score` command. Reason: build the q8/q8 base once, then score two candidates against the same base.

Reference base:

```text
ctk=q8_0,ctv=q8_0
```

Candidates:

```text
ctk=q8_0,ctv=q8_0
ctk=q8_0,ctv=turbo4
```

No trajectory axis was run here. This is KLD-only setup validation.

## Results

| Candidate | Status | Mean KLD | KLD score | Candidate elapsed |
|---|---|---:|---:|---:|
| `ctk=q8_0,ctv=q8_0` | ok | 0.000000 | 100.00 | 22.077 s |
| `ctk=q8_0,ctv=turbo4` | ok | 0.008476 | 99.16 | 20.948 s |

Base build:

```text
status: ok
elapsed: 22.397 s
base size: 3,559,533,580 bytes
deleted after run: true
```

The q8/turbo4 stdout tail also reports:

```text
Mean KLD: 0.008476
RMS Δp: 2.863 ± 0.077 %
Same top p: 96.400 ± 0.220 %
```

## Interpretation

The patched `llama-perplexity` KLD path works on the Qwen3.6-35B-A3B large-vocab model at `ctx=14336`, where `ctx * nv` exceeds int32 range.

Safe claim:

```text
On the 4090, the PR #138 style `size_t` cast is sufficient for a Qwen3.6-35B-A3B KLD smoke at ctx 14336 to complete for q8/q8 and q8/turbo4.
```

Do not claim:

```text
All Qwen3.6 long-context KLD runs are fixed.
```

Do not claim:

```text
turbo4 is globally safe because KLD is 99.16 here.
```

This is a harness repair and smoke validation. It does not include REFRACT trajectory, R-NIAH, PLAD, KVFidelity, or repeated noise-floor controls.

## Artifacts

```text
summary.json
qwen-kld-smoke-task.log
run_qwen_kld_smoke.py
run_qwen_kld_smoke.ps1
```

## Next

1. If needed, repeat with `refract.cli score --skip-gtm` for a canonical CLI receipt.
2. If quality matters, run a paired trajectory + KLD smoke at shorter generation length.
3. Keep full long-context claims blocked until repeated at larger ctx/chunks or with the exact TheTom upstream build after PR #138 lands.
