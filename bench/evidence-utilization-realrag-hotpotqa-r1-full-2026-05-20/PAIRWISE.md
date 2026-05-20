# Pairwise closure deltas — RealRAG HotpotQA R1 FULL

Boundary: paired closure deltas over the same HotpotQA question IDs. Closure is EM/contains/F1-derived answer closure, not proof of evidence use.

| comparison | n | delta | 95% bootstrap CI | A only | B only | both correct | both wrong |
|---|---:|---:|---:|---:|---:|---:|---:|
| oracle_first - oracle_last | 7384 | 8.4 pp | 7.4 to 9.4 pp | 1090 | 469 | 2684 | 3141 |
| oracle_first - bm25_retrieved | 7384 | 4.9 pp | 4.0 to 5.8 pp | 795 | 434 | 2979 | 3176 |
| oracle_first - distractor_first | 7384 | 12.6 pp | 11.6 to 13.6 pp | 1296 | 366 | 2478 | 3244 |
| oracle_first - no_support | 7384 | 44.4 pp | 43.2 to 45.5 pp | 3319 | 44 | 455 | 3566 |
| bm25_retrieved - distractor_first | 7384 | 7.7 pp | 6.7 to 8.7 pp | 1020 | 451 | 2393 | 3520 |
| bm25_retrieved - no_support | 7384 | 39.5 pp | 38.3 to 40.6 pp | 2961 | 47 | 452 | 3924 |
| oracle_last - distractor_first | 7384 | 4.2 pp | 3.3 to 5.1 pp | 736 | 427 | 2417 | 3804 |

## Interpretation

The full HotpotQA distractor dev run confirms the N=1,991 sample: answer closure changes when gold supporting evidence is present but placed/ordered differently. It does not prove internal evidence use.

`oracle_first` beats `oracle_last` by ~8.4 pp and `distractor_first` by ~12.6 pp. `no_support` stays low at ~6.8% closure, suggesting the task is not mostly solved from memorization/leakage. BM25 places support at rank 1 in most cases, so the `oracle_first - bm25_retrieved` gap is smaller (~4.9 pp).
