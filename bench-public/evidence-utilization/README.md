# Evidence-placement / answer-closure diagnostics

Public answer-closure diagnostics for HotpotQA, 2Wiki, synthetic long-context probes, and default-off evidence-path telemetry/protection artifacts.

**Read first:** [`../../STATE.md`](../../STATE.md).

Current post-N=500 stance:

```txt
Evidence placement, retrieval, and path construction affect answer closure.
Gated verifier/rerank control did not beat direct entity-hop path prompting at N=500.
EPKV/sampler/runtime work is lab/observability, not natural RealRAG quality proof.
```

N=500 machine-only check:

```txt
path_prompt EM 0.216 / F1 0.324
gated_v1   EM 0.216 / F1 0.323
wins/losses/ties = 2 / 2 / 496
```

Canonical artifact:

```txt
../../bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md
```

## Current interpretation

Safe wording:

```txt
answer closure is sensitive to evidence placement, rank, and path construction
HotpotQA and 2Wiki differ materially
oracle/compact evidence control is an upper bound
manual verifier gates did not scale as a quality improvement
```

Avoid as thesis wording:

```txt
retrieved ≠ used as a dominant production RAG bottleneck
internal model evidence use
EPKV fixes RealRAG
human adjudication as the next critical-path gate
```

`retrieved ≠ used` is historical shorthand only: evidence presence and answer closure are operationally separable.

## Start here

| question | artifact |
|---|---|
| Current repo truth / non-claims | [`../../STATE.md`](../../STATE.md) |
| Bench status map | [`../../bench/MANIFEST.md`](../../bench/MANIFEST.md) |
| Phase 0 public-dataset closure | [`REALRAG-PHASE0-CLOSURE.md`](REALRAG-PHASE0-CLOSURE.md) |
| HotpotQA placement | [`REALRAG-HOTPOTQA-R1.md`](REALRAG-HOTPOTQA-R1.md) |
| HotpotQA rank curve | [`REALRAG-HOTPOTQA-R2-RANKCURVE.md`](REALRAG-HOTPOTQA-R2-RANKCURVE.md) |
| HotpotQA BGE rerank | [`REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md`](REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md) |
| HotpotQA 32B scale check | [`REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md`](REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md) |
| 2Wiki natural retrieval | [`REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md`](REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md) |
| 2Wiki schema ablation | [`REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md`](REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md) |
| 2Wiki sentence compression falsification | [`REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md`](REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md) |
| Statistical robustness | [`REALRAG-R5-STATISTICAL-ROBUSTNESS.md`](REALRAG-R5-STATISTICAL-ROBUSTNESS.md) |
| Observe/protect/intervene map | [`EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md`](EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md) |
| Runtime telemetry index | [`EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md`](EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md) |
| Protection layer index | [`EVIDENCE-PROTECTION-LAYER-INDEX.md`](EVIDENCE-PROTECTION-LAYER-INDEX.md) |

## Promoted public-dataset gates

### HotpotQA

```txt
R1   evidence placement
R2   forced support-rank curve
R3A  prompt variants
R3B  natural retrieval + BGE reranker
R3L  32B scale check
R3C/R3D/R3F/R3K  metric/judge triage, not ground truth
R5   statistical robustness
```

### 2Wiki

```txt
R3G  natural retrieval generalization check
R3H  diagnostics
R3I  prompt/schema ablation
R3J  non-gold sentence compression falsification
```

Note: local R6/R7/R8 artifacts existed in the lab history, but they are not part of the current public entry path unless promoted and indexed in `bench/MANIFEST.md`.

## Telemetry / protection artifacts

These are default-off / hook-off / non-intervention membranes:

```txt
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md ... v0.5.md
EVIDENCE-PROTECTION-LAYER-v0-SPAN-PROVENANCE.md ... v0.5.md
OFFLINE-MILESTONE-v1.9.md
```

They do not claim runtime quality improvement.

## Boundary

This folder measures answer-side closure and artifact integrity. It does not prove attention, internal evidence use, production RAG value, serving speedup, or runtime readiness.
