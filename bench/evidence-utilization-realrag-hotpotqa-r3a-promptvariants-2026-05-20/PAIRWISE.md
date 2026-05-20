# Pairwise closure deltas — RealRAG HotpotQA R3A prompt variants

Boundary: paired closure deltas over the same HotpotQA question IDs within each prompt variant. Closure is EM/contains/F1-derived answer closure, not proof of evidence use.

| variant | comparison | n | delta | 95% bootstrap CI | A only | B only | both correct | both wrong |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| direct_short_answer | rank_1 - rank_5 | 1991 | 13.1 pp | 11.0 to 15.1 pp | 355 | 94 | 670 | 872 |
| direct_short_answer | rank_1 - rank_last | 1991 | 8.7 pp | 6.8 to 10.7 pp | 301 | 127 | 724 | 839 |
| direct_short_answer | rank_1 - no_support | 1991 | 45.0 pp | 42.7 to 47.3 pp | 905 | 9 | 120 | 957 |
| direct_short_answer | rank_last - rank_5 | 1991 | 4.4 pp | 2.6 to 6.1 pp | 203 | 116 | 648 | 1024 |
| direct_short_answer | rank_5 - no_support | 1991 | 31.9 pp | 29.8 to 34.0 pp | 648 | 13 | 116 | 1214 |
| direct_short_answer | rank_last - no_support | 1991 | 36.3 pp | 34.2 to 38.5 pp | 732 | 10 | 119 | 1130 |
| cite_then_answer | rank_1 - rank_5 | 1991 | 10.8 pp | 8.5 to 13.1 pp | 387 | 172 | 569 | 863 |
| cite_then_answer | rank_1 - rank_last | 1991 | 11.0 pp | 8.8 to 13.3 pp | 381 | 162 | 575 | 873 |
| cite_then_answer | rank_1 - no_support | 1991 | 41.3 pp | 39.0 to 43.5 pp | 849 | 27 | 107 | 1008 |
| cite_then_answer | rank_last - rank_5 | 1991 | -0.2 pp | -2.1 to 1.8 pp | 193 | 197 | 544 | 1057 |
| cite_then_answer | rank_5 - no_support | 1991 | 30.5 pp | 28.4 to 32.6 pp | 636 | 29 | 105 | 1221 |
| cite_then_answer | rank_last - no_support | 1991 | 30.3 pp | 28.2 to 32.4 pp | 623 | 20 | 114 | 1234 |
| reason_then_answer | rank_1 - rank_5 | 1991 | 13.1 pp | 10.8 to 15.3 pp | 401 | 141 | 641 | 808 |
| reason_then_answer | rank_1 - rank_last | 1991 | 8.5 pp | 6.3 to 10.7 pp | 358 | 188 | 684 | 761 |
| reason_then_answer | rank_1 - no_support | 1991 | 43.7 pp | 41.4 to 46.0 pp | 896 | 26 | 146 | 923 |
| reason_then_answer | rank_last - rank_5 | 1991 | 4.5 pp | 2.6 to 6.5 pp | 249 | 159 | 623 | 960 |
| reason_then_answer | rank_5 - no_support | 1991 | 30.6 pp | 28.4 to 32.8 pp | 643 | 33 | 139 | 1176 |
| reason_then_answer | rank_last - no_support | 1991 | 35.2 pp | 32.8 to 37.4 pp | 734 | 34 | 138 | 1085 |

## Interpretation

Citation and reasoning prompts do not eliminate the position effect. `reason_then_answer` slightly improves `rank_1` and `rank_last`, but also increases `no_support` closure. `cite_then_answer` lowers overall closure and citation-hit rate falls as support moves away from rank 1.

Across all variants, `rank_1` remains much better than `rank_5`, while `rank_last` partially recovers. The R2 position pattern survives prompt/citation ablation.
