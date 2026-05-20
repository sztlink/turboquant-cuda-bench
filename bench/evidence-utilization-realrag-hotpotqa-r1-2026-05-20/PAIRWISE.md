# Pairwise closure deltas — RealRAG HotpotQA R1

Boundary: paired closure deltas over the same HotpotQA question IDs. Closure is EM/contains/F1-derived answer closure, not proof of evidence use.

| comparison | n | delta | 95% bootstrap CI | A only | B only | both correct | both wrong |
|---|---:|---:|---:|---:|---:|---:|---:|
| oracle_first - oracle_last | 1991 | 8.1 pp | 6.2 to 10.1 pp | 293 | 131 | 720 | 847 |
| oracle_first - bm25_retrieved | 1991 | 5.4 pp | 3.6 to 7.2 pp | 225 | 118 | 788 | 860 |
| oracle_first - distractor_first | 1991 | 12.9 pp | 10.9 to 14.9 pp | 350 | 94 | 663 | 884 |
| oracle_first - no_support | 1991 | 44.3 pp | 42.1 to 46.6 pp | 893 | 10 | 120 | 968 |
| bm25_retrieved - distractor_first | 1991 | 7.5 pp | 5.6 to 9.4 pp | 275 | 126 | 631 | 959 |

## Interpretation

The N=1,991 public HotpotQA distractor run strengthens the claim that answer closure changes when gold evidence is present but placed differently. It does not prove internal evidence use.

Strongest observed effect: `oracle_first` beats `oracle_last` by ~8.1 pp and `distractor_first` by ~12.9 pp, while `no_support` remains low (~6.5% closure). BM25 already places support at rank 1 in most cases, so its gap to oracle-first is smaller (~5.4 pp).
