# RealRAG 2Wiki R7 — generated triple-like constructor

Status: **done**
Started: 2026-05-21T20:05:08.804Z
Finished: 2026-05-21T20:06:59.018Z

## Boundary

- non-gold LLM-generated triple-like evidence constructor.
- answer-side closure only.
- generator uses only retrieved evidence and question, not gold answer.
- gold triples are upper bound only.
- human evaluation not on critical path.
- no serving mutation, no EPKV hook.

## Aggregate by variant

| variant | n | closure | EM | F1 | generated triples | sentence recall | support-title recall |
|---|---:|---:|---:|---:|---:|---:|---:|
| context_bge_typeaware | 80 | 25.0% | 23.8% | 23.8% | n/a | n/a | 100.0% |
| evidence_triples_gold_direct | 80 | 75.0% | 73.8% | 73.8% | 2.5 | n/a | 0.0% |
| generated_triples_bge_direct | 80 | 8.8% | 6.3% | 8.0% | 1.0 | n/a | 0.0% |
| generated_triples_bge_typeaware | 80 | 7.5% | 6.3% | 6.9% | 1.1 | n/a | 0.0% |
| generated_triples_relation_packet_typeaware | 80 | 16.3% | 15.0% | 16.9% | 2.4 | n/a | 0.0% |
| no_support_typeaware | 80 | 3.8% | 2.5% | 3.4% | n/a | n/a | 0.0% |

## Pairwise closure deltas

| A - B | n | delta | A only | B only | both | neither |
|---|---:|---:|---:|---:|---:|---:|
| generated_triples_bge_direct - context_bge_typeaware | 80 | -16.3 pp | 4 | 17 | 3 | 56 |
| generated_triples_bge_typeaware - context_bge_typeaware | 80 | -17.5 pp | 2 | 16 | 4 | 58 |
| generated_triples_relation_packet_typeaware - context_bge_typeaware | 80 | -8.8 pp | 3 | 10 | 10 | 57 |
| generated_triples_bge_typeaware - generated_triples_relation_packet_typeaware | 80 | -8.8 pp | 4 | 11 | 2 | 63 |
| evidence_triples_gold_direct - generated_triples_bge_typeaware | 80 | 67.5 pp | 55 | 1 | 5 | 19 |
| generated_triples_bge_typeaware - no_support_typeaware | 80 | 3.8 pp | 6 | 3 | 0 | 71 |

## By question type / variant

| type:variant | n | closure |
|---|---:|---:|
| bridge_comparison:context_bge_typeaware | 19 | 21.1% |
| bridge_comparison:evidence_triples_gold_direct | 19 | 63.2% |
| bridge_comparison:generated_triples_bge_direct | 19 | 0.0% |
| bridge_comparison:generated_triples_bge_typeaware | 19 | 5.3% |
| bridge_comparison:generated_triples_relation_packet_typeaware | 19 | 10.5% |
| bridge_comparison:no_support_typeaware | 19 | 5.3% |
| comparison:context_bge_typeaware | 15 | 66.7% |
| comparison:evidence_triples_gold_direct | 15 | 66.7% |
| comparison:generated_triples_bge_direct | 15 | 26.7% |
| comparison:generated_triples_bge_typeaware | 15 | 20.0% |
| comparison:generated_triples_relation_packet_typeaware | 15 | 60.0% |
| comparison:no_support_typeaware | 15 | 13.3% |
| compositional:context_bge_typeaware | 25 | 24.0% |
| compositional:evidence_triples_gold_direct | 25 | 88.0% |
| compositional:generated_triples_bge_direct | 25 | 8.0% |
| compositional:generated_triples_bge_typeaware | 25 | 8.0% |
| compositional:generated_triples_relation_packet_typeaware | 25 | 0.0% |
| compositional:no_support_typeaware | 25 | 0.0% |
| inference:context_bge_typeaware | 21 | 0.0% |
| inference:evidence_triples_gold_direct | 21 | 76.2% |
| inference:generated_triples_bge_direct | 21 | 4.8% |
| inference:generated_triples_bge_typeaware | 21 | 0.0% |
| inference:generated_triples_relation_packet_typeaware | 21 | 9.5% |
| inference:no_support_typeaware | 21 | 0.0% |
