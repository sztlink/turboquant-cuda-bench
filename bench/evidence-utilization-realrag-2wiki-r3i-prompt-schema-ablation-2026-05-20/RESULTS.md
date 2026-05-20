# RealRAG 2Wiki R3I — prompt/schema ablation

Status: **done**
Started: 2026-05-20T20:10:13.738Z
Finished: 2026-05-20T20:14:24.962Z

## Boundary

- 2Wiki prompt/schema ablation.
- answer-side closure only.
- not internal evidence-use proof.
- no vLLM mutation, no EPKV hook.

## Aggregate by variant

| variant | n | closure | EM | F1 | contains | error rate |
|---|---:|---:|---:|---:|---:|---:|
| context_bge_direct | 400 | 31.8% | 26.3% | 30.9% | 31.0% | 0.0% |
| context_bge_typeaware | 400 | 31.8% | 27.8% | 31.4% | 31.5% | 0.0% |
| context_oracle_typeaware | 400 | 33.0% | 29.8% | 32.3% | 33.0% | 0.0% |
| evidence_triples_direct | 400 | 75.5% | 75.0% | 75.1% | 75.5% | 0.0% |
| evidence_triples_typeaware | 400 | 63.0% | 62.7% | 63.1% | 63.0% | 0.0% |
| no_support_typeaware | 400 | 5.5% | 4.8% | 5.9% | 5.3% | 0.0% |
| support_sentences_typeaware | 400 | 55.0% | 48.0% | 53.5% | 54.0% | 0.0% |

## By question type / variant

| type:variant | n | closure |
|---|---:|---:|
| bridge_comparison:context_bge_direct | 100 | 26.0% |
| bridge_comparison:context_bge_typeaware | 100 | 25.0% |
| bridge_comparison:context_oracle_typeaware | 100 | 27.0% |
| bridge_comparison:evidence_triples_direct | 100 | 60.0% |
| bridge_comparison:evidence_triples_typeaware | 100 | 47.0% |
| bridge_comparison:no_support_typeaware | 100 | 2.0% |
| bridge_comparison:support_sentences_typeaware | 100 | 48.0% |
| comparison:context_bge_direct | 100 | 51.0% |
| comparison:context_bge_typeaware | 100 | 67.0% |
| comparison:context_oracle_typeaware | 100 | 68.0% |
| comparison:evidence_triples_direct | 100 | 75.0% |
| comparison:evidence_triples_typeaware | 100 | 86.0% |
| comparison:no_support_typeaware | 100 | 19.0% |
| comparison:support_sentences_typeaware | 100 | 81.0% |
| compositional:context_bge_direct | 100 | 35.0% |
| compositional:context_bge_typeaware | 100 | 30.0% |
| compositional:context_oracle_typeaware | 100 | 34.0% |
| compositional:evidence_triples_direct | 100 | 93.0% |
| compositional:evidence_triples_typeaware | 100 | 94.0% |
| compositional:no_support_typeaware | 100 | 0.0% |
| compositional:support_sentences_typeaware | 100 | 57.0% |
| inference:context_bge_direct | 100 | 15.0% |
| inference:context_bge_typeaware | 100 | 5.0% |
| inference:context_oracle_typeaware | 100 | 3.0% |
| inference:evidence_triples_direct | 100 | 74.0% |
| inference:evidence_triples_typeaware | 100 | 25.0% |
| inference:no_support_typeaware | 100 | 1.0% |
| inference:support_sentences_typeaware | 100 | 34.0% |

## By answer class / variant

| answer_class:variant | n | closure |
|---|---:|---:|
| long_answer:context_bge_direct | 96 | 36.5% |
| long_answer:context_bge_typeaware | 96 | 25.0% |
| long_answer:context_oracle_typeaware | 96 | 27.1% |
| long_answer:evidence_triples_direct | 96 | 83.3% |
| long_answer:evidence_triples_typeaware | 96 | 43.8% |
| long_answer:no_support_typeaware | 96 | 7.3% |
| long_answer:support_sentences_typeaware | 96 | 51.0% |
| mixed_numeric_text:context_bge_direct | 30 | 33.3% |
| mixed_numeric_text:context_bge_typeaware | 30 | 30.0% |
| mixed_numeric_text:context_oracle_typeaware | 30 | 13.3% |
| mixed_numeric_text:evidence_triples_direct | 30 | 83.3% |
| mixed_numeric_text:evidence_triples_typeaware | 30 | 53.3% |
| mixed_numeric_text:no_support_typeaware | 30 | 3.3% |
| mixed_numeric_text:support_sentences_typeaware | 30 | 60.0% |
| numeric_only:context_bge_direct | 3 | 0.0% |
| numeric_only:context_bge_typeaware | 3 | 0.0% |
| numeric_only:context_oracle_typeaware | 3 | 33.3% |
| numeric_only:evidence_triples_direct | 3 | 33.3% |
| numeric_only:evidence_triples_typeaware | 3 | 66.7% |
| numeric_only:no_support_typeaware | 3 | 0.0% |
| numeric_only:support_sentences_typeaware | 3 | 33.3% |
| short_entity:context_bge_direct | 160 | 38.1% |
| short_entity:context_bge_typeaware | 160 | 36.3% |
| short_entity:context_oracle_typeaware | 160 | 36.9% |
| short_entity:evidence_triples_direct | 160 | 80.6% |
| short_entity:evidence_triples_typeaware | 160 | 62.5% |
| short_entity:no_support_typeaware | 160 | 5.6% |
| short_entity:support_sentences_typeaware | 160 | 57.5% |
| single_token_entity:context_bge_direct | 66 | 31.8% |
| single_token_entity:context_bge_typeaware | 66 | 30.3% |
| single_token_entity:context_oracle_typeaware | 66 | 37.9% |
| single_token_entity:evidence_triples_direct | 66 | 93.9% |
| single_token_entity:evidence_triples_typeaware | 66 | 84.8% |
| single_token_entity:no_support_typeaware | 66 | 3.0% |
| single_token_entity:support_sentences_typeaware | 66 | 48.5% |
| yes_no:context_bge_direct | 45 | 0.0% |
| yes_no:context_bge_typeaware | 45 | 35.6% |
| yes_no:context_oracle_typeaware | 45 | 37.8% |
| yes_no:evidence_triples_direct | 45 | 11.1% |
| yes_no:evidence_triples_typeaware | 45 | 80.0% |
| yes_no:no_support_typeaware | 45 | 6.7% |
| yes_no:support_sentences_typeaware | 45 | 62.2% |

## Pairwise closure deltas

| A - B | n | delta | A only | B only | both | neither |
|---|---:|---:|---:|---:|---:|---:|
| context_bge_direct - context_bge_typeaware | 400 | 0.0 pp | 41 | 41 | 86 | 232 |
| context_bge_direct - context_oracle_typeaware | 400 | -1.3 pp | 49 | 54 | 78 | 219 |
| context_bge_direct - evidence_triples_direct | 400 | -43.8 pp | 8 | 183 | 119 | 90 |
| context_bge_direct - evidence_triples_typeaware | 400 | -31.3 pp | 36 | 161 | 91 | 112 |
| context_bge_direct - no_support_typeaware | 400 | 26.3 pp | 111 | 6 | 16 | 267 |
| context_bge_direct - support_sentences_typeaware | 400 | -23.3 pp | 30 | 123 | 97 | 150 |
| context_bge_typeaware - context_oracle_typeaware | 400 | -1.3 pp | 32 | 37 | 95 | 236 |
| context_bge_typeaware - evidence_triples_direct | 400 | -43.8 pp | 22 | 197 | 105 | 76 |
| context_bge_typeaware - evidence_triples_typeaware | 400 | -31.3 pp | 22 | 147 | 105 | 126 |
| context_bge_typeaware - no_support_typeaware | 400 | 26.3 pp | 107 | 2 | 20 | 271 |
| context_bge_typeaware - support_sentences_typeaware | 400 | -23.3 pp | 15 | 108 | 112 | 165 |
| context_oracle_typeaware - evidence_triples_direct | 400 | -42.5 pp | 28 | 198 | 104 | 70 |
| context_oracle_typeaware - evidence_triples_typeaware | 400 | -30.0 pp | 22 | 142 | 110 | 126 |
| context_oracle_typeaware - no_support_typeaware | 400 | 27.5 pp | 114 | 4 | 18 | 264 |
| context_oracle_typeaware - support_sentences_typeaware | 400 | -22.0 pp | 20 | 108 | 112 | 160 |
| evidence_triples_direct - evidence_triples_typeaware | 400 | 12.5 pp | 92 | 42 | 210 | 56 |
| evidence_triples_direct - no_support_typeaware | 400 | 70.0 pp | 284 | 4 | 18 | 94 |
| evidence_triples_direct - support_sentences_typeaware | 400 | 20.5 pp | 123 | 41 | 179 | 57 |
| evidence_triples_typeaware - no_support_typeaware | 400 | 57.5 pp | 232 | 2 | 20 | 146 |
| evidence_triples_typeaware - support_sentences_typeaware | 400 | 8.0 pp | 82 | 50 | 170 | 98 |
| no_support_typeaware - support_sentences_typeaware | 400 | -49.5 pp | 2 | 200 | 20 | 178 |
