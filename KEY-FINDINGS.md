# Key findings

Read this with [TECHNICAL-FINDINGS.md](TECHNICAL-FINDINGS.md) and [STATE.md](STATE.md). This file is a legacy short public readout with a RealRAG emphasis; `TECHNICAL-FINDINGS.md` is the fuller three-axis technical map, and `STATE.md` is the canonical current stance.

## Current RealRAG top-line result

The latest large machine-only RealRAG check found **no quality delta** for gated verifier/rerank control over direct entity-hop path prompting.

Artifact:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md
```

N=500 result:

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BM25→BGE ref | 0.018 | 0.032 | 0.037 |
| entity-hop strong | 0.172 | 0.288 | 0.285 |
| entity-hop path prompt | **0.216** | **0.306** | **0.324** |
| raw answer rerank | 0.212 | 0.308 | 0.322 |
| gated rerank v1 | 0.216 | 0.304 | 0.323 |

Paired gated v1 vs path prompt:

```txt
wins/losses/ties: 2 / 2 / 496
EM delta:          0.000, 95% CI [-0.008, 0.008]
F1 delta:         -0.000, 95% CI [-0.007, 0.007]
p-value:           1.0
```

Interpretation:

```txt
Entity-hop/path prompting remains the best non-oracle natural RealRAG baseline in this line.
Hand-written verifier gates are frozen.
```

## What the repo currently supports

```txt
1. Evidence placement, rank, and path construction affect answer closure.
2. HotpotQA and 2Wiki behave differently; the HotpotQA reranker ladder does not generalize cleanly.
3. Strong retrieval/reranking can help on HotpotQA, but 2Wiki is more schema/path sensitive.
4. Oracle/compact evidence control is a useful upper bound, not natural retrieval proof.
5. KV/cache and vLLM runtime interventions are technically feasible as lab instrumentation.
6. N=500 falsified the scaled positive claim for gated answer control.
```

## What the repo does **not** support

```txt
- EPKV/sampler/verifier control improves natural RealRAG quality.
- “retrieved ≠ used” is a dominant production RAG bottleneck.
- Selected-position telemetry proves internal model evidence use.
- Runtime EPKV hooks are production-ready.
- LLM verifier confidence is calibrated.
- Small-slice gains generalize.
```

`retrieved ≠ used` is historical shorthand only: operational separation between evidence presence and answer closure. It is not a strong thesis claim.

## 1. Public HotpotQA: answer closure is position-sensitive

Promoted HotpotQA runs showed a stable position/rank effect.

R1 full evidence-placement gate:

```txt
7,384 questions / 36,920 records / 0 errors
oracle_first:     51.1%
bm25_retrieved:   46.2%
oracle_last:      42.7%
distractor_first: 38.5%
no_support:        6.8%
```

R2 forced support-rank curve:

```txt
rank_1:     51.4%
rank_last:  42.4%
rank_3:     40.4%
rank_8:     38.7%
rank_5:     38.6%
no_support:  6.9%
```

R3B natural retrieval + BGE reranker:

```txt
bm25_top10:       45.8%
bge_rerank_top10: 50.1%
oracle_first:     51.2%
no_support:        6.8%
BGE - BM25:       +4.4 pp, 95% CI [+2.7, +6.1]
```

R3L 32B scale check:

```txt
bm25_top10:       62.4%
bge_rerank_top10: 64.6%
oracle_first:     66.2%
no_support:        6.1%
```

Boundary: these are answer-side closure metrics, not proof of internal evidence use.

Public packages:

```txt
bench-public/evidence-utilization/REALRAG-HOTPOTQA-R1.md
bench-public/evidence-utilization/REALRAG-HOTPOTQA-R2-RANKCURVE.md
bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md
bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md
```

## 2. 2Wiki: schema/path sensitivity dominates paragraph rank

The same natural-retrieval story did not transfer cleanly to 2Wiki.

R3G natural retrieval:

```txt
2,000 questions / 8,000 records / 0 errors
bm25_top10:        33.3%
bge_rerank_top10: 33.8%
oracle_first:     31.9%
no_support:        3.9%
BGE - BM25:       +0.4 pp, 95% CI [-1.4, +2.3]
```

R3I prompt/schema ablation on 400-question sample:

```txt
context_bge_direct:          31.8%
support_sentences_typeaware: 55.0%
evidence_triples_direct:     75.5%   # gold structured upper bound
no_support_typeaware:         5.5%
```

R3J sentence compression:

```txt
context_bge_direct:        31.0%
sentence_bge_top6_direct:  23.0%
evidence_triples_gold:     74.5%
```

Interpretation:

```txt
For 2Wiki, relation/path/schema construction matters more than paragraph rerank alone.
Naive sentence compression and naive generated triples can hurt.
```

Public packages:

```txt
bench-public/evidence-utilization/REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md
bench-public/evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md
bench-public/evidence-utilization/REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md
```

## 3. Oracle/compact evidence control is an upper bound

Compact/oracle ECD quality proofs showed a large gain when evidence is already clean and targetable:

```txt
quality-proof-100 policy: EM ≈ 0.910 | F1 ≈ 0.931
quality-proof-300 policy: EM ≈ 0.907 | F1 ≈ 0.934
```

Boundary:

```txt
This is not natural RealRAG proof. It is an upper bound / control condition.
```

## 4. Runtime/vLLM interventions are lab instrumentation

The repo demonstrates that live vLLM intervention is technically feasible:

```txt
KV/page/token provenance
sampler policy hooks
dynamic policy file
logit policy experiments
runtime restore / health checks
```

But the natural RealRAG quality checks did not show a scaled positive quality delta for these controls.

## 5. KV/cache methodology remains useful

KVFidelity and CASK bridge probes show that final pass/fail can hide trace-level changes:

```txt
action can survive while target identity fails
rank/source fidelity can split from payload identity
same-config controls can be stable while cross-KV traces drift
```

This is methodology, not a global method ranking.

## Current operating decision

```txt
Freeze hand-written verifier gates.
Do not kernelize or expand sampler control until a natural quality delta exists.
Improve repo auditability and path construction before more interventions.
Track compact summaries; avoid raw per-case dumps by default.
```

See also:

```txt
STATE.md
bench/MANIFEST.md
REPO-AUDIT-2026-05-23.md
docs/REPO-GOVERNANCE.md
```
