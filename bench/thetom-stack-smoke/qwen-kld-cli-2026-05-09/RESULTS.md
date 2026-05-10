# Qwen-class REFRACT KLD CLI receipt

Date: 2026-05-09

Status: canonical CLI smoke, not a quality benchmark.

## Goal

Repeat the Qwen3.6-35B-A3B KLD smoke through the public REFRACT CLI shape:

```text
python -m refract.cli score --skip-gtm
```

This follows the helper-based smoke in:

```text
bench/thetom-stack-smoke/qwen-kld-smoke-2026-05-09/
```

## Host / setup

```text
host: 4090
machine: DESKTOP-CTAHC6D
GPU: NVIDIA GeForce RTX 4090
NVIDIA driver: 595.79
model: C:\models\q36_35b.gguf
model family: Qwen3.6-35B-A3B Q4_K_M
backend: llamacpp
REFRACT: v0.3.2.3
report schema: refract.report.v0.3.1
llama.cpp repo: C:\turbo-build\llama-cpp-turboquant
llama.cpp commit in report: 69d8e4be4
llama.cpp bin dir: C:\turbo-build\llama-cpp-turboquant\build\bin
llama-perplexity SHA256: C3E190FCBE78EA5950151D9EB73589CA782961CA26810AD95963F161F8C011DE
ctx: 14336
chunks: 1
axis: KLD only, GTM/Trajectory skipped
```

The Qwen smoke is above the old int32-sensitive allocation range:

```text
reported n_vocab: 248320
nv: 248324
ctx * nv: 3,559,972,864
INT32_MAX: 2,147,483,647
```

## Commands

Self-check:

```powershell
python -m refract.cli score `
  --model 'C:\models\q36_35b.gguf' `
  --reference 'ctk=q8_0,ctv=q8_0' `
  --candidate 'ctk=q8_0,ctv=q8_0' `
  --ctx 14336 `
  --chunks 1 `
  --skip-gtm `
  --backend llamacpp `
  --json-out 'C:\turbo-build\qwen-kld-cli-20260509\qwen35b-q8q8-kld-cli.json' `
  --no-progress
```

Candidate:

```powershell
python -m refract.cli score `
  --model 'C:\models\q36_35b.gguf' `
  --reference 'ctk=q8_0,ctv=q8_0' `
  --candidate 'ctk=q8_0,ctv=turbo4' `
  --ctx 14336 `
  --chunks 1 `
  --skip-gtm `
  --backend llamacpp `
  --json-out 'C:\turbo-build\qwen-kld-cli-20260509\qwen35b-q8turbo4-kld-cli.json' `
  --no-progress
```

## Results

| Candidate | REFRACT composite | Band | KLD score | Mean KLD | Chunks x ctx | Axis A |
|---|---:|---|---:|---:|---:|---|
| `ctk=q8_0,ctv=q8_0` | 100.00 | EXCELLENT | 100.00 | 0.000000 | 1 x 14336 | skipped |
| `ctk=q8_0,ctv=turbo4` | 99.16 | EXCELLENT | 99.16 | 0.008476 | 1 x 14336 | skipped |

Artifacts:

```text
qwen35b-q8q8-kld-cli.json
qwen35b-q8q8-kld-cli.log
qwen35b-q8turbo4-kld-cli.json
qwen35b-q8turbo4-kld-cli.log
DONE.txt
SHA256SUMS.txt
```

## Interpretation

This canonical CLI receipt confirms the helper-based result:

```text
With the PR #138 style size_t cast in llama-perplexity, REFRACT CLI KLD completes on Qwen3.6-35B-A3B at ctx 14336 for q8/q8 and q8/turbo4.
```

Safe claim:

```text
The local KLD harness path is repaired for this Qwen-class overflow-sensitive smoke cell.
```

Do not claim:

```text
turbo4 is globally validated for Qwen3.6-35B-A3B.
```

Do not claim:

```text
long-context quality is proven.
```

Axis A was skipped. No R-NIAH, PLAD, KVFidelity, repeats, or larger contexts were run.

## Caveats

- This is a KLD-only smoke.
- The REFRACT JSON `repro_command` field is empty in this CLI invocation, so the command is recorded explicitly above.
- Logs contain Windows/PowerShell console mojibake for some Unicode symbols, but the JSON metrics are clean.
- The 4090 llama.cpp source tree remains locally dirty with the `tools/perplexity/perplexity.cpp` patch and unrelated prior local changes.
