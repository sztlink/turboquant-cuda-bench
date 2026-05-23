# turboquant-cuda-bench

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/sztlink/turboquant-cuda-bench)](https://github.com/sztlink/turboquant-cuda-bench/commits/main)

Research archive for answer-closure, path-construction, KV/cache fidelity, and vLLM runtime observability probes on local NVIDIA GPUs.

## Current state — read first

The current canonical state is in **[STATE.md](STATE.md)**.

Short version after the 500-case machine-only RealRAG check:

```txt
Evidence placement, retrieval, and path construction affect answer closure.

The repo does not show that EPKV, sampler-side control, hand-written verifier gates,
or gated answer reranking improve natural RealRAG quality.

At N=500, gated verifier/rerank control did not beat direct entity-hop path prompting:
path_prompt EM 0.216 / F1 0.324
gated_v1   EM 0.216 / F1 0.323
wins/losses/ties = 2 / 2 / 496
```

This repo is a research ledger and archive. It is not a production RAG claim, not a serving-speedup claim, and not proof of internal model evidence use.

## Entry points

| path | purpose |
|---|---|
| [STATE.md](STATE.md) | current truth, non-claims, latest falsifications |
| [REPO-AUDIT-2026-05-23.md](REPO-AUDIT-2026-05-23.md) | hostile-but-fair audit of repo shape |
| [bench/MANIFEST.md](bench/MANIFEST.md) | status map for major bench directories |
| [bench-public/](bench-public/) | public-safe promoted result packages |
| [KEY-FINDINGS.md](KEY-FINDINGS.md) | legacy public findings index; read with STATE.md caveats |
| [CANON.md](CANON.md) | canonical stance and claim boundaries |
| [GLOSSARY.md](GLOSSARY.md) | terminology |
| [docs/REPO-GOVERNANCE.md](docs/REPO-GOVERNANCE.md) | retention and promotion policy |
| [docs/README-legacy-2026-05-23.md](docs/README-legacy-2026-05-23.md) | previous long README preserved for archaeology |

## What remains strongest

```txt
1. Public answer-closure probes show evidence placement/rank/path effects.
2. Entity-hop/path prompting is the strongest non-oracle natural RealRAG baseline so far.
3. Oracle/compact evidence control is a useful upper bound, not natural RealRAG proof.
4. KV/cache and vLLM intervention work is technically real, but currently lab/observability.
5. N=500 falsified the scaled positive claim for hand-written gated verifier control.
```

## What not to claim

```txt
- Do not claim “retrieved ≠ used” as a dominant production RAG bottleneck.
- Do not claim EPKV/sampler/verifier control improves natural RealRAG quality.
- Do not claim runtime readiness or serving speedup from EPKV probes.
- Do not treat LLM verifier confidence as calibrated truth.
- Do not treat small-slice gains as scaled results.
```

## Relationship to Boring Receipts

Runtime and reproducibility cards that are meant to stand alone publicly live in the sibling repo:

```txt
https://github.com/sztlink/boring-receipts
```

This repo remains the broader research archive. Boring Receipts is the public receipt layer.

## Hardware context

| Machine | GPU | VRAM | Notes |
|---|---:|---:|---|
| AYA-4090 | RTX 4090 | 24 GB | vLLM/TurboQuant runtime lab |
| felipe-pc | RTX 3090 | 24 GB | llama.cpp / receipt validation node |

## Contributing / reproducing

Start with [STATE.md](STATE.md), then choose a canonical or supporting artifact from [bench/MANIFEST.md](bench/MANIFEST.md). New runs should follow [docs/REPO-GOVERNANCE.md](docs/REPO-GOVERNANCE.md): track compact summaries and commands, not raw per-case dumps by default.
