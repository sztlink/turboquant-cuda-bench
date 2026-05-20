# RealRAG 2Wiki R3J — non-gold sentence-compression gate

Status: offline benchmark complete  
Source: 2WikiMultiHopQA dev, same 400-question stratified sample as R3I  
Primary artifact: `bench/evidence-utilization-realrag-2wiki-r3j-sentence-compression-2026-05-20/`

## One-line result

Simple lexical sentence compression over BGE-ranked paragraphs does **not** recover the R3I support-sentence/triple gains. It hurts global closure despite selecting many gold support sentences. The useful compression must be relation/schema-aware, not merely shorter.

## Boundary

This is an answer-side closure diagnostic. It does not prove internal evidence use, production RAG value, or runtime readiness. Gold support sentences and gold triples are upper-bound/schema probes only.

No vLLM patch, restart, deploy, EPKV hook, or serving mutation was used.

## Setup

```txt
selected_questions: 400
sampling: same stratified R3I sample, 100 per 2Wiki type
records: 2800
errors: 0
model: local-vllm
endpoint: existing vLLM OpenAI-compatible server
```

Variants:

```txt
context_bge_direct
sentence_bge_top6_direct
sentence_bge_top6_typeaware
sentence_bge_top10_typeaware
support_sentences_gold_typeaware
evidence_triples_gold_direct
no_support_typeaware
```

Non-gold sentence variants select top lexical sentences from BGE-ranked paragraph candidates.

## Aggregate closure

| variant | closure | EM | F1 | sentence recall | readout |
|---|---:|---:|---:|---:|---|
| `context_bge_direct` | 31.0% | 25.3% | 30.0% | n/a | paragraph baseline |
| `sentence_bge_top6_direct` | 23.0% | 20.0% | 24.4% | 52.1% | non-gold compression hurts |
| `sentence_bge_top6_typeaware` | 18.3% | 17.8% | 18.3% | 52.1% | type-aware sentence prompt hurts more |
| `sentence_bge_top10_typeaware` | 20.8% | 18.8% | 20.3% | 64.8% | more recall, still worse |
| `support_sentences_gold_typeaware` | 39.3% | 34.5% | 37.4% | 100.0% | gold support-sentence upper bound under this prompt |
| `evidence_triples_gold_direct` | 74.5% | 74.0% | 74.1% | n/a | gold structured upper bound |
| `no_support_typeaware` | 4.3% | 3.8% | 4.4% | n/a | leakage floor |

## Key pairwise deltas

| comparison | delta | 95% bootstrap CI |
|---|---:|---:|
| `sentence_bge_top6_direct - context_bge_direct` | -8.0 pp | -13.0 to -3.3 pp |
| `sentence_bge_top6_typeaware - context_bge_direct` | -12.8 pp | -18.0 to -7.5 pp |
| `sentence_bge_top10_typeaware - context_bge_direct` | -10.3 pp | -15.5 to -5.3 pp |
| `support_sentences_gold_typeaware - context_bge_direct` | +8.3 pp | +3.0 to +13.5 pp |
| `evidence_triples_gold_direct - context_bge_direct` | +43.5 pp | +38.0 to +48.5 pp |
| `support_sentences_gold_typeaware - sentence_bge_top6_typeaware` | +21.0 pp | +16.5 to +25.5 pp |
| `evidence_triples_gold_direct - support_sentences_gold_typeaware` | +35.3 pp | +29.3 to +40.8 pp |

## By question type

| type | paragraph BGE | sentence top6 direct | sentence top6 type-aware | sentence top10 type-aware | gold support sentences | gold triples | no support |
|---|---:|---:|---:|---:|---:|---:|---:|
| `bridge_comparison` | 22.0% | 27.0% | 8.0% | 13.0% | 11.0% | 58.0% | 0.0% |
| `comparison` | 53.0% | 52.0% | 62.0% | 62.0% | 80.0% | 72.0% | 17.0% |
| `compositional` | 35.0% | 4.0% | 3.0% | 8.0% | 63.0% | 96.0% | 0.0% |
| `inference` | 14.0% | 9.0% | 0.0% | 0.0% | 3.0% | 72.0% | 0.0% |

## Interpretation

R3J refines R3I:

1. **Naive compression is not enough.** Top lexical sentence selection captures some support but removes context/relations needed by 2Wiki.
2. **More sentence recall does not guarantee closure.** Top10 type-aware has higher sentence recall than top6, but remains below paragraph baseline.
3. **Comparison is the exception.** For comparison questions, sentence compression helps or matches paragraph context.
4. **Structured triples remain the strongest signal.** Gold triples are a schema upper bound, not a retrieval result.

So the actionable result is not “compress evidence into sentences.” It is:

> Compress evidence into the **right relational schema**. For 2Wiki, relation-aware extraction/triple construction is the next gate; lexical sentence shortening alone is harmful globally.

## Updated public claim

> HotpotQA shows rank/placement sensitivity and BGE mitigation. 2Wiki confirms support-present contexts beat no-support, but the HotpotQA reranker/oracle ladder does not generalize under paragraph prompts. 2Wiki needs schema-aware evidence compression; naive sentence compression over retrieved paragraphs is insufficient and can hurt closure.

## Source artifacts

```txt
bench/evidence-utilization-realrag-2wiki-r3j-sentence-compression-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-2wiki-r3j-sentence-compression-2026-05-20/ANALYSIS.md
bench/evidence-utilization-realrag-2wiki-r3j-sentence-compression-2026-05-20/summary.json
bench/evidence-utilization-realrag-2wiki-r3j-sentence-compression-2026-05-20/analysis.json
bench/evidence-utilization-realrag-2wiki-r3j-sentence-compression-2026-05-20/records.jsonl
```
