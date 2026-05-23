# RealRAG 2Wiki R7 — generated triple-like constructor

Status: completed local gate
Primary artifact: `bench/evidence-utilization-realrag-2wiki-r7-generated-triples-2026-05-21/`

## Boundary

```txt
non-gold LLM-generated triple-like evidence constructor
answer-side closure only
generator uses retrieved evidence + question, not gold answer
gold triples are upper bound only
human evaluation not on critical path
no runtime intervention
```

## Why R7 exists

R6 showed that entity/relation sentence packets increase support-sentence recall but do not beat paragraph BGE. R7 tests the more direct hypothesis:

```txt
Can a non-gold triple-like constructor recover part of the gold-triple gap?
```

The constructor asks the local model to extract compact triples from retrieved evidence before answering from those triples.

## Variants

```txt
context_bge_typeaware                         paragraph BGE baseline
generated_triples_bge_direct                  generated triples from BGE paragraphs
generated_triples_bge_typeaware               same triples, type-aware answer prompt
generated_triples_relation_packet_typeaware   generated triples from R6 relation packet
evidence_triples_gold_direct                  gold triple upper bound
no_support_typeaware                          no-support floor
```

Run shape:

```txt
questions: 80
answer records: 480
generated-triple records: 160
dataset: 2Wiki dev
sample: R3I selected IDs prefix
```

## Result

| variant | n | closure | generated triples |
|---|---:|---:|---:|
| context_bge_typeaware | 80 | 25.0% | n/a |
| generated_triples_bge_direct | 80 | 8.8% | 1.0 |
| generated_triples_bge_typeaware | 80 | 7.5% | 1.1 |
| generated_triples_relation_packet_typeaware | 80 | 16.3% | 2.4 |
| evidence_triples_gold_direct | 80 | 75.0% | 2.5 |
| no_support_typeaware | 80 | 3.8% | n/a |

Pairwise readout:

```txt
generated triples from BGE trail paragraph BGE by -16.3 to -17.5 pp
generated triples from relation packet trail paragraph BGE by -8.8 pp
gold triples beat generated BGE triples by +67.5 pp
generated BGE triples beat no-support by only +3.8 pp
```

## Interpretation

This falsifies the naive “ask the same model to extract triples from retrieved text” route.

```txt
The gold-triple schema is powerful.
But a weak non-gold triple generator does not inherit that power.
```

The main failure is not just output schema. The generated BGE triples are too sparse and/or miss the relational chain:

```txt
BGE generated triples:       ~1.0 triple/question
relation-packet triples:     ~2.4 triples/question
gold evidence triples:       ~2.5 triples/question
```

Even when triple count approaches gold count, the generated triples do not match gold-triple usefulness. R7 therefore redirects the next step away from generic triple extraction and toward **structured decomposition**:

```txt
question decomposition → required slots → retrieve/fill each slot → answer
```

## Source artifacts

```txt
bench/evidence-utilization-realrag-2wiki-r7-generated-triples-2026-05-21/records.jsonl
bench/evidence-utilization-realrag-2wiki-r7-generated-triples-2026-05-21/generated-triples.jsonl
bench/evidence-utilization-realrag-2wiki-r7-generated-triples-2026-05-21/summary.json
bench/evidence-utilization-realrag-2wiki-r7-generated-triples-2026-05-21/RESULTS.md
bench/evidence-utilization-realrag-2wiki-r7-generated-triples-2026-05-21/selected-ids.json
```
