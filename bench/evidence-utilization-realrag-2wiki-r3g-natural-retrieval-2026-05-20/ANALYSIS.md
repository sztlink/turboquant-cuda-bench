# R3G analysis — 2Wiki natural retrieval + BGE reranker

## Pairwise closure deltas

| comparison | n | delta | 95% bootstrap CI | A only | B only | both | neither |
|---|---:|---:|---:|---:|---:|---:|---:|
| bge_rerank_top10 - bm25_top10 | 2000 | 0.4 pp | -1.4 to 2.3 pp | 190 | 181 | 485 | 1144 |
| oracle_first - bge_rerank_top10 | 2000 | -1.8 pp | -3.6 to 0.1 pp | 166 | 202 | 473 | 1159 |
| oracle_first - bm25_top10 | 2000 | -1.4 pp | -3.3 to 0.5 pp | 174 | 201 | 465 | 1160 |
| bm25_top10 - no_support | 2000 | 29.4 pp | 27.4 to 31.6 pp | 609 | 21 | 57 | 1313 |
| bge_rerank_top10 - no_support | 2000 | 29.8 pp | 27.8 to 31.9 pp | 618 | 21 | 57 | 1304 |
| oracle_first - no_support | 2000 | 28.1 pp | 26.0 to 30.1 pp | 584 | 23 | 55 | 1338 |

## Support rank closure

### bm25_top10

| support rank min | n | closure |
|---:|---:|---:|
| 1 | 1697 | 34.6% |
| 2 | 198 | 26.8% |
| 3 | 62 | 22.6% |
| 4 | 21 | 33.3% |
| 5 | 13 | 23.1% |
| 6 | 3 | 33.3% |
| 7 | 3 | 0.0% |
| 8 | 1 | 0.0% |
| 9 | 2 | 0.0% |

### bge_rerank_top10

| support rank min | n | closure |
|---:|---:|---:|
| 1 | 1987 | 33.9% |
| 2 | 12 | 16.7% |
| 3 | 1 | 0.0% |

## Interpretation

2Wiki does not reproduce the HotpotQA R3B pattern. BGE improves support rank but does not materially improve closure over BM25, and oracle-first is slightly lower than both natural retrieval conditions. This suggests dataset/prompt/schema sensitivity and weakens broad generalization from HotpotQA.
