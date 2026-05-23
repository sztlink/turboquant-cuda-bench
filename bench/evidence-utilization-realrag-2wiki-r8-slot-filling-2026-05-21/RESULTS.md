# RealRAG 2Wiki R8 — structured decomposition + slot filling

Status: **done**
Started: 2026-05-21T20:29:39.367Z
Finished: 2026-05-21T20:34:50.771Z

## Boundary

- non-gold structured decomposition and slot filling.
- answer-side closure only.
- constructor uses retrieved evidence + question, not gold answer.
- gold triples are upper bound only.
- human evaluation not on critical path.
- no serving mutation, no EPKV hook.

## Aggregate by variant

| variant | n | closure | EM | F1 | slots | sentence recall | support-title recall |
|---|---:|---:|---:|---:|---:|---:|---:|
| context_bge_typeaware | 80 | 21.3% | 18.8% | 19.4% | n/a | n/a | 100.0% |
| evidence_triples_gold_direct | 80 | 71.3% | 70.0% | 70.0% | n/a | n/a | 0.0% |
| no_support_typeaware | 80 | 1.3% | 1.3% | 1.3% | n/a | n/a | 0.0% |
| slot_packet_bge_typeaware | 80 | 30.0% | 25.0% | 27.2% | 1.7 | n/a | 0.0% |
| slot_packet_relation_typeaware | 80 | 17.5% | 16.3% | 16.7% | 1.7 | n/a | 0.0% |

## Pairwise closure deltas

| A - B | n | delta | A only | B only | both | neither |
|---|---:|---:|---:|---:|---:|---:|
| slot_packet_bge_typeaware - context_bge_typeaware | 80 | 8.8 pp | 10 | 3 | 14 | 53 |
| slot_packet_relation_typeaware - context_bge_typeaware | 80 | -3.8 pp | 7 | 10 | 7 | 56 |
| slot_packet_bge_typeaware - slot_packet_relation_typeaware | 80 | 12.5 pp | 12 | 2 | 12 | 54 |
| evidence_triples_gold_direct - slot_packet_bge_typeaware | 80 | 41.3 pp | 40 | 7 | 17 | 16 |
| slot_packet_bge_typeaware - no_support_typeaware | 80 | 28.7 pp | 23 | 0 | 1 | 56 |

## By question type / variant

| type:variant | n | closure |
|---|---:|---:|
| bridge_comparison:context_bge_typeaware | 19 | 0.0% |
| bridge_comparison:evidence_triples_gold_direct | 19 | 57.9% |
| bridge_comparison:no_support_typeaware | 19 | 0.0% |
| bridge_comparison:slot_packet_bge_typeaware | 19 | 10.5% |
| bridge_comparison:slot_packet_relation_typeaware | 19 | 15.8% |
| comparison:context_bge_typeaware | 15 | 46.7% |
| comparison:evidence_triples_gold_direct | 15 | 60.0% |
| comparison:no_support_typeaware | 15 | 6.7% |
| comparison:slot_packet_bge_typeaware | 15 | 73.3% |
| comparison:slot_packet_relation_typeaware | 15 | 53.3% |
| compositional:context_bge_typeaware | 25 | 40.0% |
| compositional:evidence_triples_gold_direct | 25 | 88.0% |
| compositional:no_support_typeaware | 25 | 0.0% |
| compositional:slot_packet_bge_typeaware | 25 | 44.0% |
| compositional:slot_packet_relation_typeaware | 25 | 12.0% |
| inference:context_bge_typeaware | 21 | 0.0% |
| inference:evidence_triples_gold_direct | 21 | 71.4% |
| inference:no_support_typeaware | 21 | 0.0% |
| inference:slot_packet_bge_typeaware | 21 | 0.0% |
| inference:slot_packet_relation_typeaware | 21 | 0.0% |
