# Public benchmark packages

This directory is the public-safe receipt layer inside `turboquant-cuda-bench`.

**Read first:** [`../STATE.md`](../STATE.md). The current post-N=500 stance narrows the public claim:

```txt
Evidence placement, retrieval, and path construction affect answer closure.
Gated verifier/rerank control did not beat direct entity-hop path prompting at N=500.
EPKV/sampler/runtime work is lab/observability, not natural RealRAG quality proof.
```

This directory is an index of promoted summaries, **not a roadmap** and not a production benchmark leaderboard.

For a curated public guide to the value that survived later falsification, start with [`WHAT-SURVIVED.md`](WHAT-SURVIVED.md).

## Current falsification above the fold

N=500 machine-only RealRAG check:

```txt
path_prompt EM 0.216 / F1 0.324
gated_v1   EM 0.216 / F1 0.323
wins/losses/ties = 2 / 2 / 496
```

Canonical artifact:

```txt
../bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md
```

## Choose a question

| If you want to know... | Start here |
|---|---|
| What the repo currently claims and does not claim | [`../STATE.md`](../STATE.md) |
| What survived the N=500 no-delta and where to start reading | [`WHAT-SURVIVED.md`](WHAT-SURVIVED.md) |
| Which bench dirs are canonical/superseded/negative | [`../bench/MANIFEST.md`](../bench/MANIFEST.md) |
| What HotpotQA shows about answer closure and rank | [`evidence-utilization/REALRAG-HOTPOTQA-R1.md`](evidence-utilization/REALRAG-HOTPOTQA-R1.md), [`R2`](evidence-utilization/REALRAG-HOTPOTQA-R2-RANKCURVE.md), [`R3B`](evidence-utilization/REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md), [`R3L`](evidence-utilization/REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md) |
| What 2Wiki shows about schema/path sensitivity | [`evidence-utilization/REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md`](evidence-utilization/REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md), [`R3I`](evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md), [`R3J`](evidence-utilization/REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md) |
| Whether earlier deltas were statistically stable | [`evidence-utilization/REALRAG-R5-STATISTICAL-ROBUSTNESS.md`](evidence-utilization/REALRAG-R5-STATISTICAL-ROBUSTNESS.md) |
| How KV/cache changes can preserve action while losing target identity | [`cask-kvfidelity-bridge/`](cask-kvfidelity-bridge/) |
| What the Evidence-Paged KV CUDA receipts do and do not claim | [`evidence-paged-kv/`](evidence-paged-kv/) |
| Whether the same decoy failures reproduce across stacks | [`vllm-cross-stack/`](vllm-cross-stack/) |

## Packages

| Package | What it shows | Start here |
|---|---|---|
| `evidence-utilization/` | Public-dataset answer-closure diagnostics and default-off telemetry/protection archive. | [`README.md`](evidence-utilization/README.md) |
| `vllm-cross-stack/` | vLLM vs llama.cpp cross-stack replay: 192K needles pass, decoy failures replicate, policy splice recovers. | [`decoy-replay-results.md`](vllm-cross-stack/decoy-replay-results.md) |
| `cask-kvfidelity-bridge/` | Action/target/source-rank split under FullKV, CASK, and TriAttention. | [`RESULTS.md`](cask-kvfidelity-bridge/RESULTS.md) |
| `kvfidelity/` | Paired action-trace evaluation for KV/cache changes, including v2 comparator, hold-out, and order-sensitivity notes. | [`kvfidelity-2026-05-07-summary.md`](kvfidelity/kvfidelity-2026-05-07-summary.md) |
| `evidence-paged-kv/` | CUDA kernel receipts v1→v7 for evidence-aware KV page access. Not a natural RealRAG quality proof. | [`RESULTS.md`](evidence-paged-kv/RESULTS.md) |
| `dashboard.html` | Static visual dashboard; legacy/compact public overview. | [`dashboard.html`](dashboard.html) |

## Boundary

This directory is not a leaderboard and not proof of internal evidence use. Use these files to understand result shape, then follow `STATE.md` and `bench/MANIFEST.md` for current status and caveats.
