# RealRAG 2Wiki R3I — prompt/schema ablation

Status: offline benchmark complete  
Source: 2WikiMultiHopQA dev  
Primary artifact: `bench/evidence-utilization-realrag-2wiki-r3i-prompt-schema-ablation-2026-05-20/`

## One-line result

R3I confirms the R3G/R3H diagnosis: 2Wiki failures are not mainly missing support. Type-aware paragraph prompts barely move closure, while support-only sentences and gold evidence triples produce large gains. The bottleneck is prompt/schema/compression fit, not just reranker rank.

## Boundary

This is an answer-side closure diagnostic over a stratified 2Wiki sample. It does not prove internal evidence use, production RAG value, or runtime readiness. Evidence-triple variants use gold structured dataset fields and are an upper-bound/schema probe, not a retrieval result.

No vLLM patch, restart, deploy, EPKV hook, or serving mutation was used.

## Setup

```txt
selected_questions: 400
sampling: stratified, 100 per 2Wiki type
records: 2800
errors: 0
model: local-vllm
endpoint: existing vLLM OpenAI-compatible server
```

Question types:

```txt
bridge_comparison: 100
comparison: 100
compositional: 100
inference: 100
```

Variants:

```txt
context_bge_direct
context_bge_typeaware
context_oracle_typeaware
support_sentences_typeaware
evidence_triples_direct
evidence_triples_typeaware
no_support_typeaware
```

## Aggregate closure

| variant | closure | EM | F1 | readout |
|---|---:|---:|---:|---|
| `context_bge_direct` | 31.8% | 26.3% | 30.9% | paragraph-context baseline |
| `context_bge_typeaware` | 31.8% | 27.8% | 31.4% | type hint does not help globally |
| `context_oracle_typeaware` | 33.0% | 29.8% | 32.3% | oracle/type-aware close to baseline |
| `support_sentences_typeaware` | 55.0% | 48.0% | 53.5% | strong support-compression gain |
| `evidence_triples_direct` | 75.5% | 75.0% | 75.1% | gold structured upper bound |
| `evidence_triples_typeaware` | 63.0% | 62.7% | 63.1% | gold structured, but prompt-sensitive |
| `no_support_typeaware` | 5.5% | 4.8% | 5.9% | leakage floor |

## Key pairwise deltas

| comparison | delta | 95% bootstrap CI |
|---|---:|---:|
| `context_bge_typeaware - context_bge_direct` | +0.0 pp | -4.5 to +4.5 pp |
| `context_oracle_typeaware - context_bge_direct` | +1.3 pp | -3.8 to +6.3 pp |
| `support_sentences_typeaware - context_bge_direct` | +23.3 pp | +17.5 to +29.0 pp |
| `evidence_triples_direct - context_bge_direct` | +43.8 pp | +38.5 to +49.0 pp |
| `evidence_triples_typeaware - context_bge_direct` | +31.3 pp | +25.3 to +37.5 pp |
| `support_sentences_typeaware - no_support_typeaware` | +49.5 pp | +44.5 to +54.3 pp |
| `evidence_triples_direct - no_support_typeaware` | +70.0 pp | +65.3 to +74.8 pp |

## By question type

| type | context BGE direct | context BGE type-aware | oracle type-aware | support sentences | evidence triples direct | evidence triples type-aware | no support |
|---|---:|---:|---:|---:|---:|---:|---:|
| `bridge_comparison` | 26.0% | 25.0% | 27.0% | 48.0% | 60.0% | 47.0% | 2.0% |
| `comparison` | 51.0% | 67.0% | 68.0% | 81.0% | 75.0% | 86.0% | 19.0% |
| `compositional` | 35.0% | 30.0% | 34.0% | 57.0% | 93.0% | 94.0% | 0.0% |
| `inference` | 15.0% | 5.0% | 3.0% | 34.0% | 74.0% | 25.0% | 1.0% |

Readout:

- `comparison` is prompt-improvable: type-aware paragraph context moves **51.0% → 67.0%**.
- `bridge_comparison` and `compositional` need schema/compression, not just a type hint.
- `inference` is especially schema-sensitive: paragraph type-aware hurts, triples direct helps.

## Yes/no diagnosis

The R3H yes/no near-zero finding was prompt-specific, not inherent impossibility.

| answer class | context direct | context type-aware | oracle type-aware | support sentences | triples direct | triples type-aware | no support |
|---|---:|---:|---:|---:|---:|---:|---:|
| `yes_no` | 0.0% | 35.6% | 37.8% | 62.2% | 11.1% | 80.0% | 6.7% |

Type-aware prompting fixes many yes/no cases, especially with structured triples.

## Interpretation

R3I separates three effects:

1. **Retrieval/rank alone is insufficient on 2Wiki.** `context_bge_typeaware` and `context_oracle_typeaware` remain near `context_bge_direct`.
2. **Evidence compression helps.** Moving from full paragraphs to supporting sentences adds **+23.3 pp** closure.
3. **Gold structured schema is a high upper bound.** Evidence triples reach **75.5%**, but this uses dataset-provided gold structure and is not a retrieval claim.

So the safe conclusion is:

> 2Wiki does not falsify the broader placement/sensitivity thesis, but it shows that rank/placement is only one variable. For 2Wiki, schema fit and evidence compression dominate paragraph rank once support is already present.

## Updated public claim

> HotpotQA shows rank/placement sensitivity and BGE mitigation. 2Wiki confirms support-present contexts beat no-support, but the HotpotQA reranker/oracle ladder does not generalize under paragraph prompts. 2Wiki needs type/schema-aware evidence compression; gold triples and support sentences produce large answer-closure gains.

## Source artifacts

```txt
bench/evidence-utilization-realrag-2wiki-r3i-prompt-schema-ablation-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-2wiki-r3i-prompt-schema-ablation-2026-05-20/ANALYSIS.md
bench/evidence-utilization-realrag-2wiki-r3i-prompt-schema-ablation-2026-05-20/summary.json
bench/evidence-utilization-realrag-2wiki-r3i-prompt-schema-ablation-2026-05-20/analysis.json
bench/evidence-utilization-realrag-2wiki-r3i-prompt-schema-ablation-2026-05-20/records.jsonl
```
