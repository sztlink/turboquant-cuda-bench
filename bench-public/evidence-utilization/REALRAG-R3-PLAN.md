# RealRAG R3 plan — executed gates and remaining validation

Status: executed / Phase 0 closed
Updated: 2026-05-21

This file began as the R3 plan for baselines, judging, and generalization. It is now the execution ledger for the completed Phase 0 gates.

For the closed readout, start with:

```txt
REALRAG-PHASE0-CLOSURE.md
```

## Original R3 research question

> Does the evidence-placement / middle-burial effect persist after modern reranking, reasoning prompts, independent judging, more datasets, and more model scale?

## Answer after Phase 0

Bounded answer:

```txt
HotpotQA: yes, support placement/rank remains measurable and actionable.
Reranking: helps substantially and can approach oracle-first on 7B HotpotQA.
32B scale: raises support-present closure sharply but does not erase the ladder.
2Wiki: HotpotQA's reranker/oracle ladder does not generalize cleanly under paragraph prompts.
Judging: deterministic metrics are useful but require independent/human adjudication for broad claims.
```

## Non-claims preserved

R3 still does not claim:

- proof of internal evidence use;
- model attention attribution;
- production RAG bottleneck dominance;
- production answer-quality improvement;
- Evidence-Paged KV quality improvement;
- serving speedup;
- runtime readiness.

## Executed gates

| Gate | Question | Result | Artifact |
|---|---|---|---|
| R3A | Do citation/reasoning prompts erase the HotpotQA position effect? | No. Rank-position gaps remain. | `REALRAG-HOTPOTQA-R3A-PROMPTVARIANTS.md` |
| R3B | Does BGE reranking mitigate BM25→oracle gap on HotpotQA? | Yes. BGE nearly reaches oracle-first on 7B. | `REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md` |
| R3C | Are supporting-fact sentences actually present? | Yes for support-present R3B conditions. | `REALRAG-HOTPOTQA-R3C-METRIC-AUDIT.md` |
| R3D | How do local semantic labels compare to metric closure? | Mostly aligned, with false-negative/positive buckets for review. | `REALRAG-HOTPOTQA-R3D-LOCAL-JUDGE.md` |
| R3E | Can we prepare human adjudication? | Yes. 144 unreviewed items prepared. | `REALRAG-HOTPOTQA-R3E-HUMAN-ADJUDICATION-PACK.md` |
| R3F | Can AI triage prioritize R3E? | Yes, non-authoritative draft only. | `REALRAG-HOTPOTQA-R3F-AI-ADJUDICATION.md` |
| R3G | Does the HotpotQA natural retrieval ladder generalize to 2Wiki? | Not cleanly. Support-present beats no-support, but BM25/BGE/oracle are close. | `REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md` |
| R3H | Why does 2Wiki differ? | Schema/type/answer-style effects dominate paragraph rank. | `REALRAG-2WIKI-R3H-DIAGNOSTIC.md` |
| R3I | Do support sentences or triples help 2Wiki? | Yes. Gold support sentences/triples improve closure sharply. | `REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md` |
| R3J | Does non-gold sentence compression help 2Wiki? | No globally. Naive lexical compression hurts. | `REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md` |
| R3K | Can we triage high-risk metric cases? | Yes. 200-item local-LLM triage, not ground truth. | `REALRAG-R3K-ADJUDICATION-LIGHT.md` |
| R3L | Does 32B scale erase HotpotQA rank/placement sensitivity? | No. Closure rises, but BM25 < BGE < oracle-first remains. | `REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md` |

## Gate outcomes

### Gate A — effect survives stronger prompting

Status: passed for HotpotQA.

R3A showed direct/citation/reasoning variants keep large `rank_1 - rank_5` gaps:

```txt
direct: +13.1 pp
cite:   +10.8 pp
reason: +13.1 pp
```

### Gate B — reranking comparison

Status: mitigated, not erased.

R3B HotpotQA 7B:

```txt
bm25_top10:        45.8%
bge_rerank_top10: 50.1%
oracle_first:      51.2%
no_support:         6.8%
```

BGE closes most of the BM25-to-oracle gap on this slice.

### Gate C — generalization beyond HotpotQA

Status: dataset-sensitive.

2Wiki support-present contexts beat no-support, but the HotpotQA ladder does not reproduce cleanly:

```txt
bm25_top10:        33.3%
bge_rerank_top10: 33.8%
oracle_first:      31.9%
no_support:         3.9%
```

R3H/R3I/R3J show type/prompt/schema fit and relation-aware evidence construction matter.

### Gate D — judge agreement

Status: not closed by Phase 0.

R3D/R3F/R3K are triage only. R3E prepared human-review items but human labels remain blank.

Remaining requirement:

```txt
independent/human adjudication before broader evidence-use-failure claims
```

### Gate E — model scale

Status: passed as scale check; not a serving benchmark.

R3L 32B:

```txt
bm25_top10:        62.4%
bge_rerank_top10: 64.6%
oracle_first:      66.2%
no_support:         6.1%
```

Scale improves closure but does not erase rank/placement sensitivity.

## Remaining optional work

These are not Phase 0 blockers:

| Item | Why |
|---|---|
| Human/independent adjudication over R3E/R3K | Required before stronger semantic correctness claims. |
| MuSiQue generalization | Additional harder compositional dataset. |
| Non-Qwen local family check | Model-family generalization. |
| Relation-aware 2Wiki evidence construction | Tests schema-aware mitigation beyond paragraph rank. |
| Phase 1 telemetry bridge | Runtime observability, default-off/offline first. |

## Operational envelope after Phase 0

Allowed without new broad approval:

- documentation updates;
- offline analysis of existing records;
- human-adjudication packet formatting;
- local, offline/default-off telemetry schema tests;
- public-safe GitHub docs derived from existing artifacts.

Requires explicit confirmation:

- paid/API frontier model runs;
- public posting outside committed GitHub docs/discussions;
- vLLM restart/kill/deploy/patch for live services;
- EPKV hook-on serving;
- credentialed services beyond already configured tools.

## Phase 1 handoff

The runtime line is named:

```txt
Evidence-Path Runtime Telemetry
```

It began with v0 replay telemetry, v0.1 runtime sidecar telemetry, v0.2 security fixtures, v0.3 guarded sidecar run loop, v0.4 CI-style command, and v0.5 read-only/no-endpoint verifier. The consolidated index is:

```txt
EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md
```

Gate docs:

```txt
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.5.md
```

Required envelope remains:

```txt
default-off
offline/replay-first
schema-validation first
no serving-speed or answer-quality claim
```

Intervention comes later, if justified:

```txt
Evidence Protection Layer
```

Do not jump directly to live attention bias or KV mutation.
