# TheTom public-stack integration

Date: 2026-05-09

Status: local integration smoke, not a public claim.

## Why this exists

TheTom has already published three useful surfaces around TurboQuant and long-context evaluation:

- `tqkit`: KV-cache math, backend detection, integration recipes, and canonical bench shape.
- `longctx`: retrieval sidecar / proxy and MRCR-oriented long-context evaluation.
- `turboquant_plus/REFRACT`: reference-anchored quality reports for compressed KV/runtime configs.

This repo can use those surfaces as adapters around KVFidelity instead of trying to invent a separate proof layer from scratch.

## Stack shape

```text
tqkit KV math
  -> REFRACT quality audit
  -> KVFidelity action-trace comparison
  -> proof receipt / repo note
```

For long-context experiments:

```text
longctx retrieval / selector
  -> tqkit context and KV-cost math
  -> optional REFRACT or KVFidelity downstream checks
```

## What was smoked locally

Receipt: [bench/thetom-stack-smoke/latest/RESULTS.md](../bench/thetom-stack-smoke/latest/RESULTS.md)

The smoke adapter lives at:

```bash
node scripts/thetom-stack-smoke.mjs \
  --longctx-deps-dir /home/aya/implante/tmp/python-deps/longctx-svc-smoke
```

It currently checks:

1. `tqkit backends`
2. `tqkit report` for Qwen2.5-14B-Instruct-1M at 32K with `tq+asym`
3. `tqkit compare-strategies` for compression vs retrieval vs combined at 128K
4. `tqkit table` for the two CUDA bench models already in this repo:
   - Qwen3.6-35B-A3B
   - Qwen3.6-27B
5. `REFRACT compare` over the sample JSON reports shipped in `turboquant_plus`
6. `longctx-svc version`, dependency probe, and local `/healthz` boot

## Incorporation points

### 1. tqkit metadata in every new bench note

For each future CUDA bench note, include a small `tqkit` block:

```bash
python3 -m tqkit.cli report \
  --model <model-id> \
  --ctx <context> \
  --layout <layout>
```

Use it as metadata, not as a measured runtime result.

Recommended fields:

- model key
- context length
- layout name
- per-token KV estimate
- total KV estimate
- savings vs FP16
- caveat when the model is hybrid or when a backend rejects a layout

### 2. REFRACT before KVFidelity when possible

REFRACT is the upstream quality gate. KVFidelity is the downstream action-trace gate.

If REFRACT fails badly on a config, a large KVFidelity run should be treated as diagnostic only. If REFRACT passes but KVFidelity drifts, that is the interesting slice: token/path quality may preserve while action traces diverge.

### 3. longctx-svc as local context sidecar

`longctx-svc` can be tested without changing inference engines by running it as a proxy:

```bash
llama-server -m model.gguf --port 8080
longctx-svc serve --upstream http://localhost:8080
export OPENAI_BASE_URL=http://localhost:8765/v1
```

Current local status:

- service boots with dependencies supplied via `PYTHONPATH`
- `/healthz` and `/longctx/status` pass
- real retrieval smoke passed with `sentence-transformers/all-MiniLM-L6-v2`
- retrieval smoke artifact: [bench/thetom-stack-smoke/longctx-retrieval-2026-05-09/RESULTS.md](../bench/thetom-stack-smoke/longctx-retrieval-2026-05-09/RESULTS.md)

Do not put `longctx` into the normal Pi path until a retrieval smoke has passed on a small repo and we can observe whether it improves or muddies actual work.

## Caveats

- The local `tqkit` and `longctx` clones are external research context, not vendored dependencies.
- No claims about SubQ, MRCR, or messy MRCR should be made from this smoke.
- `tqkit` numbers are theoretical KV math unless paired with measured runtime metadata.
- REFRACT sample reports only prove the CLI can parse reports here. They do not score our hardware until we run real model/backend jobs.
- `longctx-svc` boot is not a retrieval-quality claim.

## CUDA REFRACT quick smoke

Artifact: [bench/thetom-stack-smoke/refract-quick-cuda-2026-05-09/RESULTS.md](../bench/thetom-stack-smoke/refract-quick-cuda-2026-05-09/RESULTS.md)

A trajectory-only REFRACT smoke ran on the RTX 4090 using `Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf`:

| Config | Axis | Composite | Band | Full match | Median divergence |
|---|---|---:|---|---:|---:|
| q8/q8 self-check | Trajectory only | 100.00 | EXCELLENT | 100.0% | all matched |
| q8/turbo4 | Trajectory only | 81.46 | PASS | 63.3% | token 8 |

A first default q8/turbo4 run that included KLD failed inside `llama-perplexity --kl-divergence` with a CUDA `SET_ROWS` backend error.

## CUDA REFRACT KLD repair smoke

Artifact: [bench/thetom-stack-smoke/refract-kldfix-2026-05-09/RESULTS.md](../bench/thetom-stack-smoke/refract-kldfix-2026-05-09/RESULTS.md)

After Defilan's Waffle House PR #138 report, the 4090 `llama-perplexity` binary was rebuilt with the local one-line cast:

```diff
-        log_probs.resize(n_ctx * nv);
+        log_probs.resize(size_t(n_ctx) * nv);
```

The small Llama 3.1 8B default REFRACT cell then completed Axis A + Axis B:

| Config | Chunks x ctx | Composite | Band | Trajectory | KLD score | Mean KLD | Full match | Median divergence |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| q8/q8 self-check | 2 x 512 | 100.00 | EXCELLENT | 100.00 | 100.00 | 0.000001 | 100.0% | all matched |
| q8/turbo4 | 32 x 512 | 89.50 | PASS | 81.46 | 99.30 | 0.006976 | 63.3% | token 8 |

Safe reading: the local REFRACT KLD path is alive again for this small CUDA smoke cell.

## Qwen-class KLD smoke

Artifact: [bench/thetom-stack-smoke/qwen-kld-smoke-2026-05-09/RESULTS.md](../bench/thetom-stack-smoke/qwen-kld-smoke-2026-05-09/RESULTS.md)

The patched `llama-perplexity` KLD path also completed on the actual Qwen3.6-35B-A3B large-vocab model at `ctx=14336`:

```text
reported n_vocab: 248320
nv: 248324
ctx * nv: 3,559,972,864
INT32_MAX: 2,147,483,647
```

KLD-only results using one q8/q8 base:

| Candidate | Status | Mean KLD | KLD score |
|---|---|---:|---:|
| q8/q8 | ok | 0.000000 | 100.00 |
| q8/turbo4 | ok | 0.008476 | 99.16 |

Safe reading: the PR #138 style `size_t` cast is sufficient for this Qwen3.6-35B-A3B KLD smoke above the int32 range. This is still harness repair evidence, not a full quality claim.

Canonical CLI receipt: [bench/thetom-stack-smoke/qwen-kld-cli-2026-05-09/RESULTS.md](../bench/thetom-stack-smoke/qwen-kld-cli-2026-05-09/RESULTS.md)

The same Qwen KLD cell also completed through:

```text
python -m refract.cli score --skip-gtm
```

| Candidate | REFRACT composite | Band | KLD score | Mean KLD |
|---|---:|---|---:|---:|
| q8/q8 | 100.00 | EXCELLENT | 100.00 | 0.000000 |
| q8/turbo4 | 99.16 | EXCELLENT | 99.16 | 0.008476 |

## Next local tests

1. Test `longctx-svc` proxy mode in front of an OpenAI-compatible local server.
2. Add exact `q8/turbo3` and `q8/turbo2` KV-layout accounting once `tqkit` exposes those aliases or we add a local compatibility shim.
3. Consider a private proof-pack example for TheTom, but keep it private until TheTom validates fit.
