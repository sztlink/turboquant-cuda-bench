# RealRAG Phase 0 closure — public evidence-placement gates

Status: Phase 0 closed
Date: 2026-05-21

## Closure statement

Phase 0 is closed as a public-dataset answer-closure package.

It establishes a bounded, falsifiable result:

> Answer closure is sensitive to support placement, rank, and dataset/schema fit. Reranking and larger local model scale help, but neither makes placement irrelevant across the measured gates.

This is still an answer-side diagnostic. It is not proof of internal evidence use, attention attribution, production RAG value, serving speedup, or runtime readiness.

## What Phase 0 now contains

| Gate | Role | Status |
|---|---|---|
| R1 HotpotQA placement | public-dataset evidence placement | done |
| R2 HotpotQA rank curve | support-rank / recency curve | done |
| R3A prompt variants | citation/reasoning prompt ablation | done |
| R3B HotpotQA natural retrieval | BM25 vs BGE vs oracle/no-support | done |
| R3C metric audit | supporting-fact sentence presence/rank audit | done |
| R3D local judge | local semantic-judge triage | done, non-authoritative |
| R3E human packet | unreviewed adjudication packet | prepared, labels blank |
| R3F AI adjudication draft | AI-assisted triage over R3E | done, non-authoritative |
| R3G 2Wiki natural retrieval | second-dataset generalization | done |
| R3H 2Wiki diagnostic | type/schema/support-rank diagnosis | done |
| R3I 2Wiki prompt/schema | support-sentence and gold-triple probes | done |
| R3J 2Wiki sentence compression | non-gold lexical compression gate | done |
| R3K adjudication-light | 200-item high-risk local-LLM triage | done, non-authoritative |
| R3L HotpotQA 32B scale | local 32B scale check | done |

## HotpotQA result shape

### Controlled placement

R1/R2/R3A show the controlled HotpotQA effect:

```txt
rank_1 / oracle_first > middle burial
no_support remains low
simple citation/reasoning prompts do not remove the rank-position gap
```

Representative closure:

```txt
R1 oracle_first: 51.1%
R1 oracle_last:  42.7%
R1 no_support:    6.8%

R2 rank_1:       51.4%
R2 rank_5:       38.6%
R2 rank_last:    42.4%
R2 no_support:    6.9%
```

### Natural retrieval and reranking

R3B shows that strong reranking is a practical mitigation on HotpotQA:

```txt
bm25_top10:        45.8%
bge_rerank_top10: 50.1%
oracle_first:      51.2%
no_support:         6.8%
```

Pairwise:

```txt
BGE - BM25:    +4.4 pp, CI +2.7 to +6.1
Oracle - BGE:  +1.1 pp, CI -0.6 to +2.7
```

Safe readout: for this HotpotQA/Qwen2.5-7B gate, BGE moves natural retrieval near the oracle-first ceiling.

### 32B scale

R3L shows that local 32B scale raises support-present closure sharply while preserving the ladder:

```txt
bm25_top10:        62.4%
bge_rerank_top10: 64.6%
oracle_first:      66.2%
no_support:         6.1%
```

Pairwise:

```txt
BGE - BM25:    +2.3 pp, CI +0.9 to +3.7
Oracle - BGE:  +1.6 pp, CI +0.3 to +2.9
```

Safe readout: bigger model helps, but does not erase support-rank/placement sensitivity.

Operational boundary: R3L is not a serving benchmark. It used guarded server records plus offline `vLLM.generate()` completion after server instability.

## 2Wiki result shape

R3G does not reproduce the HotpotQA reranker/oracle ladder under the same paragraph prompt:

```txt
bm25_top10:        33.3%
bge_rerank_top10: 33.8%
oracle_first:      31.9%
no_support:         3.9%
```

R3H/R3I/R3J explain the non-generalization:

```txt
support-present paragraph contexts had 100% supporting-fact sentence recall
BGE improved support sentence rank but did not materially improve global closure
support-sentence and gold-triple schemas improved closure strongly
naive non-gold sentence compression hurt globally
```

Safe readout: generalization is dataset-, answer-style-, prompt-, and schema-sensitive. For 2Wiki, relation-aware evidence construction matters more than simply moving retrieved paragraphs upward once support is present.

## Metric and adjudication state

Phase 0 does not treat local or AI judges as ground truth.

Current adjudication state:

```txt
R3C: support/sentence presence audited, labels unreviewed
R3D: local semantic-judge triage only
R3E: 144 human-review items prepared, human fields blank
R3F: AI-assisted draft only
R3K: 200 high-risk local-LLM triage items only
```

Remaining broad-claim gate:

```txt
independent/human adjudication is still required before treating metric disagreement as evidence-use failure
```

## Phase 0 claims

### Supported

- Public HotpotQA answer closure changes when supporting evidence is placed/ranked differently.
- Simple citation/reasoning prompts did not remove the HotpotQA rank-position gap.
- BGE reranking is an actionable HotpotQA mitigation.
- 32B scale raises HotpotQA support-present closure but preserves a measured placement ladder.
- 2Wiki demonstrates dataset/schema sensitivity rather than a universal HotpotQA-style ladder.
- Metric/judge disagreement is real enough to require independent/human adjudication.

### Not supported

- Proof that the model internally used or ignored evidence.
- Attention attribution.
- A claim that retrieved-not-used is the dominant production RAG bottleneck.
- Production RAG improvement.
- Serving speedup.
- Evidence-Paged KV quality improvement.
- Runtime hook readiness.

## Phase 1 handoff

Phase 1 has started as telemetry, not intervention:

```txt
Evidence-Path Runtime Telemetry v0
```

First artifact:

```txt
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md
```

Allowed/current form:

```txt
default-off
offline/replay-first
schema validation before hook-on serving
no production quality/speed claims
```

Potential Phase 2 intervention, after telemetry and adjudication:

```txt
Evidence Protection Layer
```

That intervention should begin with placement/packing/protection of evidence spans, not attention bias or live KV mutation.

## Canonical public entry points

- [R1 HotpotQA placement](REALRAG-HOTPOTQA-R1.md)
- [R2 rank curve](REALRAG-HOTPOTQA-R2-RANKCURVE.md)
- [R3A prompt variants](REALRAG-HOTPOTQA-R3A-PROMPTVARIANTS.md)
- [R3B natural retrieval](REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md)
- [R3L 32B natural retrieval](REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md)
- [R3K adjudication light](REALRAG-R3K-ADJUDICATION-LIGHT.md)
- [2Wiki R3G](REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md)
- [2Wiki R3I prompt/schema](REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md)
- [2Wiki R3J sentence compression](REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md)
