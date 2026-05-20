# RealRAG 2Wiki R3J — sentence-compression gate

Status: **done**
Started: 2026-05-20T20:28:16.992Z
Finished: 2026-05-20T20:31:42.591Z

## Boundary

- non-gold lexical sentence compression over retrieved paragraphs.
- answer-side closure only.
- gold support/triples are upper bounds only.
- no vLLM mutation, no EPKV hook.

## Aggregate by variant

| variant | n | closure | EM | F1 | sentence recall | error rate |
|---|---:|---:|---:|---:|---:|---:|
| context_bge_direct | 400 | 31.0% | 25.3% | 30.0% | n/a | 0.0% |
| evidence_triples_gold_direct | 400 | 74.5% | 74.0% | 74.1% | n/a | 0.0% |
| no_support_typeaware | 400 | 4.3% | 3.8% | 4.4% | n/a | 0.0% |
| sentence_bge_top10_typeaware | 400 | 20.8% | 18.8% | 20.3% | 64.8% | 0.0% |
| sentence_bge_top6_direct | 400 | 23.0% | 20.0% | 24.4% | 52.1% | 0.0% |
| sentence_bge_top6_typeaware | 400 | 18.3% | 17.8% | 18.3% | 52.1% | 0.0% |
| support_sentences_gold_typeaware | 400 | 39.3% | 34.5% | 37.4% | 100.0% | 0.0% |

## By question type / variant

| type:variant | n | closure | sentence recall |
|---|---:|---:|---:|
| bridge_comparison:context_bge_direct | 100 | 22.0% | n/a |
| bridge_comparison:evidence_triples_gold_direct | 100 | 58.0% | n/a |
| bridge_comparison:no_support_typeaware | 100 | 0.0% | n/a |
| bridge_comparison:sentence_bge_top10_typeaware | 100 | 13.0% | 57.8% |
| bridge_comparison:sentence_bge_top6_direct | 100 | 27.0% | 43.3% |
| bridge_comparison:sentence_bge_top6_typeaware | 100 | 8.0% | 43.3% |
| bridge_comparison:support_sentences_gold_typeaware | 100 | 11.0% | 100.0% |
| comparison:context_bge_direct | 100 | 53.0% | n/a |
| comparison:evidence_triples_gold_direct | 100 | 72.0% | n/a |
| comparison:no_support_typeaware | 100 | 17.0% | n/a |
| comparison:sentence_bge_top10_typeaware | 100 | 62.0% | 92.5% |
| comparison:sentence_bge_top6_direct | 100 | 52.0% | 81.0% |
| comparison:sentence_bge_top6_typeaware | 100 | 62.0% | 81.0% |
| comparison:support_sentences_gold_typeaware | 100 | 80.0% | 100.0% |
| compositional:context_bge_direct | 100 | 35.0% | n/a |
| compositional:evidence_triples_gold_direct | 100 | 96.0% | n/a |
| compositional:no_support_typeaware | 100 | 0.0% | n/a |
| compositional:sentence_bge_top10_typeaware | 100 | 8.0% | 55.0% |
| compositional:sentence_bge_top6_direct | 100 | 4.0% | 44.5% |
| compositional:sentence_bge_top6_typeaware | 100 | 3.0% | 44.5% |
| compositional:support_sentences_gold_typeaware | 100 | 63.0% | 100.0% |
| inference:context_bge_direct | 100 | 14.0% | n/a |
| inference:evidence_triples_gold_direct | 100 | 72.0% | n/a |
| inference:no_support_typeaware | 100 | 0.0% | n/a |
| inference:sentence_bge_top10_typeaware | 100 | 0.0% | 54.0% |
| inference:sentence_bge_top6_direct | 100 | 9.0% | 39.5% |
| inference:sentence_bge_top6_typeaware | 100 | 0.0% | 39.5% |
| inference:support_sentences_gold_typeaware | 100 | 3.0% | 100.0% |

## Pairwise closure deltas

| A - B | n | delta | A only | B only | both | neither |
|---|---:|---:|---:|---:|---:|---:|
| sentence_bge_top6_direct - context_bge_direct | 400 | -8.0 pp | 34 | 66 | 58 | 242 |
| sentence_bge_top6_typeaware - context_bge_direct | 400 | -12.8 pp | 34 | 85 | 39 | 242 |
| sentence_bge_top10_typeaware - context_bge_direct | 400 | -10.3 pp | 39 | 80 | 44 | 237 |
| support_sentences_gold_typeaware - context_bge_direct | 400 | 8.3 pp | 74 | 41 | 83 | 202 |
| evidence_triples_gold_direct - context_bge_direct | 400 | 43.5 pp | 183 | 9 | 115 | 93 |
| sentence_bge_top6_typeaware - no_support_typeaware | 400 | 14.0 pp | 59 | 3 | 14 | 324 |
| support_sentences_gold_typeaware - sentence_bge_top6_typeaware | 400 | 21.0 pp | 94 | 10 | 63 | 233 |
| evidence_triples_gold_direct - support_sentences_gold_typeaware | 400 | 35.3 pp | 170 | 29 | 128 | 73 |
