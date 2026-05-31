# turboquant-cuda-bench

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/sztlink/turboquant-cuda-bench)](https://github.com/sztlink/turboquant-cuda-bench/commits/main)

Research archive for local-GPU inference experiments around KV-cache quantization, trajectory/action-trace fidelity, long-context behavior, vLLM runtime probes, and Evidence-Paged KV kernel receipts.

This repository is not a leaderboard, not a production serving claim, and not a single RealRAG result. Its technical core has three axes:

```txt
Axis I   : KV-cache quantization fidelity   (llama.cpp / PPL / KLD / REFRACT)
Axis II  : action-trace fidelity             (KVFidelity / CASK bridge)
Axis III : runtime and kernel engineering    (vLLM cross-stack / EPKV kernels v1-v7)
```

Start with [`TECHNICAL-FINDINGS.md`](TECHNICAL-FINDINGS.md) for the technical map, then use [`STATE.md`](STATE.md) for the current claim boundaries.

## Current governance

The current canonical state is in **[`STATE.md`](STATE.md)**.

The N=500 machine-only RealRAG check is a promoted falsification inside this archive:

```txt
Evidence placement, retrieval, and path construction affect answer closure.

The repo does not show that EPKV, sampler-side control, hand-written verifier gates,
or gated answer reranking improve natural RealRAG quality.

At N=500, gated verifier/rerank control did not beat direct entity-hop path prompting:
path_prompt EM 0.216 / F1 0.324
gated_v1   EM 0.216 / F1 0.323
wins/losses/ties = 2 / 2 / 496
```

This no-delta result freezes one RealRAG/verifier direction. The later path-construction sprint reproduced retrieval coverage but failed prompt guards. Explicit path candidates improved strongly as a no-LLM object; the first answer-from-chain smoke failed the refusal gate, and Answer Interface v0 fixed that specific failure locally by not asking the LLM to regenerate a complete path answer. The next object is still the path/answer interface, not another verifier, prompt rule, or megakernel. It does not erase the KV-cache, REFRACT, KVFidelity, vLLM, or kernel-engineering receipts.

## Entry points

| path | purpose |
|---|---|
| [`TECHNICAL-FINDINGS.md`](TECHNICAL-FINDINGS.md) | three-axis technical findings map |
| [`STATE.md`](STATE.md) | current truth, non-claims, latest falsifications |
| [`TURBOQUANT-ATLAS.md`](TURBOQUANT-ATLAS.md) | reading architecture for what survived, failed, froze, or remains lab-only |
| [`bench-public/WHAT-SURVIVED.md`](bench-public/WHAT-SURVIVED.md) | public field guide to surviving value after the N=500 no-delta |
| [`bench/MANIFEST.md`](bench/MANIFEST.md) | status map for major bench directories |
| [`bench-public/`](bench-public/) | public-safe promoted result packages |
| [`REPO-AUDIT-2026-05-23.md`](REPO-AUDIT-2026-05-23.md) | hostile-but-fair audit of repo shape |
| [`KERNEL-MAP.md`](KERNEL-MAP.md) | CUDA kernel entry map for llama.cpp TurboQuant validation/profiling |
| [`MEGAKERNELS.md`](MEGAKERNELS.md) | megakernel stance: no full transformer megakernel now, prepare EPKV dispatcher boundary |
| [`VLLM-RUNTIME-LINEAGE-4090.md`](VLLM-RUNTIME-LINEAGE-4090.md) | separates TheTom upstream, local build, sztlink overlay, and live 4090 service |
| [`THETOM-CLEAN-BASELINE-PLAN.md`](THETOM-CLEAN-BASELINE-PLAN.md) | plan for a clean upstream validation lane before bug report or PR |
| [`KEY-FINDINGS.md`](KEY-FINDINGS.md) | legacy public findings index, read with `STATE.md` caveats |
| [`CANON.md`](CANON.md) | canonical stance and claim boundaries |
| [`GLOSSARY.md`](GLOSSARY.md) | terminology |
| [`docs/REPO-GOVERNANCE.md`](docs/REPO-GOVERNANCE.md) | retention and promotion policy |
| [`docs/README-legacy-2026-05-23.md`](docs/README-legacy-2026-05-23.md) | previous long README preserved for archaeology |

## What the repo currently supports

```txt
Axis I: KV-cache quantization fidelity
1. KLD and token-match can pass while generation trajectory diverges.
2. RotorQuant planar3/iso3 PPL advantage is real in the tested 128-dim-head case,
   but did not generalize to the tested 256-dim-head case.
3. The fragile cache axis depends on architecture, quantization scheme, and metric family.
4. CUDA sparse-V and long-context turbo4 behavior are hardware/kernel-specific.

Axis II: action-trace fidelity
5. KVFidelity is a useful paired action-trace lens for runtime KV/cache changes.
6. CASK x KVFidelity shows fidelity decomposes into action, target, rank, and exact trace identity.

Axis III: runtime and kernel engineering
7. vLLM and llama.cpp cross-stack replays reproduced meaningful long-context and decoy/ranking behavior.
8. Evidence-Paged KV kernels are real architectural receipts, not production attention.

RealRAG answer-closure line
9. Evidence placement, retrieval, rank, path construction, and schema shape affect answer closure.
10. N=500 falsified the scaled positive claim for hand-written gated verifier control.
11. Prompt guards failed by over-refusal; explicit path candidates are now the upstream object to inspect.
```

## What not to claim

```txt
- Do not claim EPKV/sampler/verifier control improves natural RealRAG quality.
- Do not claim runtime readiness or serving speedup from EPKV probes.
- Do not claim a single KV-cache scheme is best outside the tested regimes.
- Do not claim REFRACT Trajectory bands directly equal downstream task accuracy.
- Do not claim KV compression globally breaks agents.
- Do not treat LLM verifier confidence as calibrated truth.
- Do not treat small-slice gains as scaled results.
```

## Relationship to Boring Receipts

Runtime and reproducibility cards that are meant to stand alone publicly live in the sibling repo:

```txt
https://github.com/sztlink/boring-receipts
```

This repo remains the broader research archive. Boring Receipts is the conservative public receipt layer.

## Hardware context

| Machine | GPU | VRAM | Notes |
|---|---:|---:|---|
| AYA-4090 | RTX 4090 | 24 GB | vLLM/TurboQuant runtime lab |
| felipe-pc | RTX 3090 | 24 GB | llama.cpp / receipt validation node |

## Contributing and reproducing

Start with [`TECHNICAL-FINDINGS.md`](TECHNICAL-FINDINGS.md), then choose a canonical or supporting artifact from [`bench/MANIFEST.md`](bench/MANIFEST.md). New runs should follow [`docs/REPO-GOVERNANCE.md`](docs/REPO-GOVERNANCE.md): track compact summaries and commands, not raw per-case dumps by default.
