# q4 hybrid REFRACT benchmark

Status: **completed on 2026-05-06**  
Target issue: <https://github.com/ggml-org/llama.cpp/issues/21385>

## Results

- Summary: [`results.md`](results.md)
- CSV: [`results.csv`](results.csv)
- Chart: [`charts/q4-hybrid-refract.svg`](charts/q4-hybrid-refract.svg)
- Raw JSON: [`data/json/`](data/json/)
- Logs: [`logs/`](logs/)

Key finding: `q4_0/q4_0` remains KLD-close but is DEGRADED under REFRACT Trajectory on Qwen3.6-35B-A3B / RTX 3090. Full run: composite 78.93, path score 65.70, KLD 98.81.

## Question

`llama.cpp#21385` reports `q4_0/q4_0` KV cache as effectively lossless on hybrid models under BLEU/token-match style checks.

This benchmark asks a narrower follow-up question:

> Does `q4_0/q4_0` on a hybrid model preserve REFRACT trajectory/KLD, not only BLEU/token-match?

This is not framed as a contradiction of the original claim. It is a metric-family check using [TheTom's REFRACT](https://github.com/TheTom/turboquant_plus/tree/main/refract) as the behavioral-fidelity lens.

## Attribution

- REFRACT: Tom Turney / TheTom's methodology and tool.
- `sztlink/turboquant-cuda-bench`: independent CUDA validation and public synthesis.

## Target model

Primary target, if available on `felipe-pc`:

```txt
Qwen3.6-35B-A3B Q4_K_M
```

Reason:

- hybrid/MoE model, closest to the `#21385` claim family;
- already part of the TurboQuant production benchmark context;
- fits the strategic question better than dense controls.

Fallbacks:

1. another available Qwen3.5/Qwen3.6 hybrid GGUF;
2. smaller hybrid model to validate harness;
3. dense control only after hybrid result exists.

Do **not** use the 32B dense model as first target; the claim is specifically about hybrid tolerance.

## Reference choice

Use practical CUDA 24GB reference:

```txt
ctk=q8_0,ctv=q8_0
```

Do not block on:

```txt
ctk=f16,ctv=f16
```

Reason: the 35B-A3B Q4_K_M weights leave limited VRAM headroom on 24GB GPUs. `f16/f16` KV may OOM at nontrivial context. If a short f16/f16 smoke test fits, it can be recorded as optional, but the publishable matrix should use `q8_0/q8_0` as the practical reference and state that clearly.

## Minimal matrix

Run all configs with REFRACT `--backend llamacpp` and `--axis-a trajectory`.

| Role | KV config | Why |
|---|---|---|
| Practical reference | `ctk=q8_0,ctv=q8_0` | stable CUDA baseline from prior REFRACT work |
| Claim candidate | `ctk=q4_0,ctv=q4_0` | direct `#21385` q4 KV check |
| V isolation | `ctk=q8_0,ctv=q4_0` | tests V-cache contribution; prior attn-fix showed V is suspicious axis |
| K isolation | `ctk=q4_0,ctv=q8_0` | tests K-cache contribution/control |
| Optional only | `ctk=f16,ctv=f16` | if it fits; do not block on it |

## Metrics

Required:

- REFRACT Axis A: `trajectory`;
- KLD@D;
- preserve raw JSON reports.

Optional:

- GTM axis run, only if cheap, to compare with the older token/string-style framing;
- light R-NIAH only if Trajectory/KLD are clean and the run budget permits.

## Run phases

Split execution to reduce risk:

**Phase 1 — smoke** (confirm harness, first signal):
- configs: `q8_0/q8_0` self-check + `q4_0/q4_0` candidate;
- use reduced sample count (`--n-predict 64` or similar);
- goal: verify REFRACT/llama.cpp pipeline is alive and get a first trajectory reading.

**Phase 2 — full matrix** (only after smoke passes):
- add `q8_0/q4_0` (V isolation) and `q4_0/q8_0` (K isolation);
- use standard sample count.

## Command template

Each candidate is compared against the `q8_0/q8_0` reference. Windows / `felipe-pc` style template:

```bat
set LLAMA_CPP_BIN_DIR=C:\turbo-build\llama-cpp-turboquant\build\bin
set MODEL=<PATH_TO_QWEN3_6_35B_A3B_Q4_K_M_GGUF>
set OUTDIR=C:\turbo-build\q4-hybrid-refract
mkdir %OUTDIR%

python -m refract.cli score ^
  --backend llamacpp ^
  --model "%MODEL%" ^
  --reference "ctk=q8_0,ctv=q8_0" ^
  --candidate "ctk=q4_0,ctv=q4_0" ^
  --axis-a trajectory ^
  --json-out "%OUTDIR%\q4hybrid-traj-q4q4.json"
```

Repeat for:

```txt
ctk=q8_0,ctv=q8_0
ctk=q4_0,ctv=q4_0
ctk=q8_0,ctv=q4_0
ctk=q4_0,ctv=q8_0
```

For the reference self-check, candidate can equal reference:

```txt
--reference "ctk=q8_0,ctv=q8_0" --candidate "ctk=q8_0,ctv=q8_0"
```

## Pre-run checklist

Before launching any long GPU run:

1. Confirm model path on `felipe-pc`.
2. Confirm the REFRACT Python environment and TheTom `llama.cpp` build path.
3. Confirm build-may1 (spiritbuun, commit `69d8e4be4`) is the active `llama-completion.exe` — same build used in attn-fix runs — and still emits `REFRACT_TRAJECTORY` JSONL.
4. Run one tiny smoke test with `--n-predict 8` if possible.
5. Register `aya-watch` watcher for the scheduled task/log.
6. Preserve stdout/stderr log and JSON outputs.

## Publication framing

If result confirms claim:

```txt
Under REFRACT trajectory/KLD, q4_0/q4_0 also preserves behavior on this hybrid CUDA target.
```

If result diverges from BLEU/token-match:

```txt
Under REFRACT trajectory/KLD — a complementary path-preservation lens distinct from BLEU/token-match — q4_0/q4_0 shows drift on this CUDA hybrid target.
```

Avoid:

```txt
The claim is wrong.
```

Use the taxonomy note as framing:

```txt
Reconstruction/token-match, distribution, trajectory, and task fidelity are different metric families.
```

## Expected artifact layout

After the run:

```txt
bench/q4-hybrid-refract/
  README.md
  results.md
  results.csv
  charts/
  data/json/
  scripts/
```

This file is the benchmark brief. It should be replaced or supplemented by `results.md` once the run is complete.
