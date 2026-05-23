# RealRAG 2Wiki R6 — relation-aware evidence construction

Status: **done**
Started: 2026-05-21T19:51:18.905Z
Finished: 2026-05-21T19:52:09.027Z

## Boundary

- non-gold relation-aware evidence construction.
- answer-side closure only.
- gold support/triples are upper bounds only.
- human evaluation not on the critical path.
- no vLLM mutation, no EPKV hook.

## Aggregate by variant

| variant | n | closure | EM | F1 | sentence recall | support-title recall | error rate |
|---|---:|---:|---:|---:|---:|---:|---:|
| context_bge_typeaware | 80 | 21.3% | 20.0% | 20.0% | n/a | 100.0% | 0.0% |
| evidence_triples_gold_direct | 80 | 82.5% | 81.3% | 81.3% | n/a | 0.0% | 0.0% |
| no_support_typeaware | 80 | 2.5% | 1.3% | 1.7% | n/a | 0.0% | 0.0% |
| relation_bridge_packet_typeaware | 80 | 16.3% | 12.5% | 14.5% | 66.3% | 100.0% | 0.0% |
| relation_entity_packet_typeaware | 80 | 16.3% | 12.5% | 14.5% | 69.4% | 100.0% | 0.0% |
| sentence_bge_top10_typeaware | 80 | 15.0% | 12.5% | 14.3% | 59.4% | 100.0% | 0.0% |
| support_sentences_gold_typeaware | 80 | 40.0% | 32.5% | 37.0% | 100.0% | 100.0% | 0.0% |

## Pairwise closure deltas

| A - B | n | delta | A only | B only | both | neither |
|---|---:|---:|---:|---:|---:|---:|
| relation_entity_packet_typeaware - context_bge_typeaware | 80 | -5.0 pp | 2 | 6 | 11 | 61 |
| relation_bridge_packet_typeaware - context_bge_typeaware | 80 | -5.0 pp | 2 | 6 | 11 | 61 |
| relation_entity_packet_typeaware - sentence_bge_top10_typeaware | 80 | 1.3 pp | 3 | 2 | 10 | 65 |
| relation_bridge_packet_typeaware - sentence_bge_top10_typeaware | 80 | 1.3 pp | 3 | 2 | 10 | 65 |
| support_sentences_gold_typeaware - relation_bridge_packet_typeaware | 80 | 23.8 pp | 20 | 1 | 12 | 47 |
| evidence_triples_gold_direct - relation_bridge_packet_typeaware | 80 | 66.3 pp | 58 | 5 | 8 | 9 |
| relation_bridge_packet_typeaware - no_support_typeaware | 80 | 13.8 pp | 11 | 0 | 2 | 67 |

## By question type / variant

| type:variant | n | closure | support-title recall |
|---|---:|---:|---:|
| bridge_comparison:context_bge_typeaware | 19 | 21.1% | 100.0% |
| bridge_comparison:evidence_triples_gold_direct | 19 | 73.7% | 0.0% |
| bridge_comparison:no_support_typeaware | 19 | 0.0% | 0.0% |
| bridge_comparison:relation_bridge_packet_typeaware | 19 | 15.8% | 100.0% |
| bridge_comparison:relation_entity_packet_typeaware | 19 | 15.8% | 100.0% |
| bridge_comparison:sentence_bge_top10_typeaware | 19 | 10.5% | 100.0% |
| bridge_comparison:support_sentences_gold_typeaware | 19 | 26.3% | 100.0% |
| comparison:context_bge_typeaware | 15 | 60.0% | 100.0% |
| comparison:evidence_triples_gold_direct | 15 | 80.0% | 0.0% |
| comparison:no_support_typeaware | 15 | 13.3% | 0.0% |
| comparison:relation_bridge_packet_typeaware | 15 | 46.7% | 100.0% |
| comparison:relation_entity_packet_typeaware | 15 | 46.7% | 100.0% |
| comparison:sentence_bge_top10_typeaware | 15 | 60.0% | 100.0% |
| comparison:support_sentences_gold_typeaware | 15 | 66.7% | 100.0% |
| compositional:context_bge_typeaware | 25 | 16.0% | 100.0% |
| compositional:evidence_triples_gold_direct | 25 | 92.0% | 0.0% |
| compositional:no_support_typeaware | 25 | 0.0% | 0.0% |
| compositional:relation_bridge_packet_typeaware | 25 | 12.0% | 100.0% |
| compositional:relation_entity_packet_typeaware | 25 | 12.0% | 100.0% |
| compositional:sentence_bge_top10_typeaware | 25 | 4.0% | 100.0% |
| compositional:support_sentences_gold_typeaware | 25 | 68.0% | 100.0% |
| inference:context_bge_typeaware | 21 | 0.0% | 100.0% |
| inference:evidence_triples_gold_direct | 21 | 81.0% | 0.0% |
| inference:no_support_typeaware | 21 | 0.0% | 0.0% |
| inference:relation_bridge_packet_typeaware | 21 | 0.0% | 100.0% |
| inference:relation_entity_packet_typeaware | 21 | 0.0% | 100.0% |
| inference:sentence_bge_top10_typeaware | 21 | 0.0% | 100.0% |
| inference:support_sentences_gold_typeaware | 21 | 0.0% | 100.0% |
