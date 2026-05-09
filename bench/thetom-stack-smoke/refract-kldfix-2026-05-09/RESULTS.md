# REFRACT KLD fix smoke

Date: 2026-05-09

Status: local CUDA smoke, not a benchmark claim.

## Goal

After Defilan's Waffle House report and PR #138, apply the one-line `size_t` cast locally to `llama-perplexity`, rebuild it on the 4090, and check whether REFRACT Axis B KLD can run again on the small Llama 3.1 8B cell.

## Host / setup

```text
host: 4090
machine: DESKTOP-CTAHC6D
GPU: NVIDIA GeForce RTX 4090
NVIDIA driver: 595.79
REFRACT: v0.3.2.3
backend: llamacpp
llama.cpp repo: C:\turbo-build\llama-cpp-turboquant
llama.cpp commit in report: 69d8e4be4
llama.cpp bin dir: C:\turbo-build\llama-cpp-turboquant\build\bin
llama-perplexity SHA256: C3E190FCBE78EA5950151D9EB73589CA782961CA26810AD95963F161F8C011DE
model: C:\models\Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf
ctx: 512
n_predict: 16
axis: trajectory + KLD
```

Local source patch:

```diff
-        log_probs.resize(n_ctx * nv);
+        log_probs.resize(size_t(n_ctx) * nv);
```

Full diff: [source-patch.diff](source-patch.diff)

## Runs

| Config | Chunks x ctx | Composite | Band | Trajectory | KLD score | Mean KLD | Full match | Median divergence |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| q8/q8 self-check | 2 x 512 | 100.00 | EXCELLENT | 100.00 | 100.00 | 0.000001 | 100.0% | all matched |
| q8/turbo4 | 32 x 512 | 89.50 | PASS | 81.46 | 99.30 | 0.006976 | 63.3% | token 8 |

Artifacts:

```text
llama8b-q8q8-default-kld-smoke-clean.json
llama8b-q8q8-default-kld-smoke-clean.log
llama8b-q8turbo4-default-kld-chunks32-clean.json
llama8b-q8turbo4-default-kld-chunks32-clean.log
kldfix-build-20260509-clean.log
source-patch.diff
SHA256SUMS.txt
```

## Interpretation

The previous q8/turbo4 default REFRACT run failed during KLD with a CUDA `SET_ROWS` backend error. After rebuilding `llama-perplexity` with the local PR #138 style cast, the same small default KLD cell completed with 32 chunks.

Do not over-read the cause. The applied source change addresses an integer overflow path in KLD base-file allocation for large-vocab, long-context models. The earlier local failure surfaced as `SET_ROWS`, not as the int overflow. The safe claim is narrower:

```text
The local REFRACT KLD path is alive again on the 4090 for the small Llama 3.1 8B q8/turbo4 smoke cell after rebuilding llama-perplexity with the PR #138 cast.
```

This does not prove KLD is fixed for Qwen3.6 35B at 16K+ context. That still needs a separate Qwen-class run.

## Operational notes

- The 4090 source tree now has a local modification in `tools/perplexity/perplexity.cpp` matching the PR #138 one-line cast.
- Existing unrelated local dirty files on the 4090 tree were not touched.
- `PYTHONIOENCODING=utf-8` is needed on Windows PowerShell when capturing REFRACT text output, otherwise the report printer can fail on Unicode characters even after scoring succeeds.

## Next

1. If KLD matters for Qwen3.6, run a Qwen-class KLD smoke with the patched `llama-perplexity` at the smallest context that exercises the large-vocab path.
2. Keep this as setup evidence only until repeated on the actual model/context family.
3. If we publish these artifacts later, frame them as harness repair, not as a TurboQuant quality result.
