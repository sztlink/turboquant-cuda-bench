# R3B analysis — natural retrieval + BGE reranker

## Pairwise closure deltas

| comparison | n | delta | 95% bootstrap CI | A only | B only | both | neither |
|---|---:|---:|---:|---:|---:|---:|---:|
| bge_rerank_top10 - bm25_top10 | 1991 | 4.4 pp | 2.7 to 6.1 pp | 198 | 111 | 800 | 882 |
| oracle_first - bge_rerank_top10 | 1991 | 1.1 pp | -0.6 to 2.7 pp | 145 | 124 | 874 | 848 |
| oracle_first - bm25_top10 | 1991 | 5.4 pp | 3.7 to 7.1 pp | 211 | 103 | 808 | 869 |
| bm25_top10 - no_support | 1991 | 38.9 pp | 36.7 to 41.1 pp | 786 | 11 | 125 | 1069 |
| bge_rerank_top10 - no_support | 1991 | 43.3 pp | 41.0 to 45.5 pp | 878 | 16 | 120 | 977 |
| oracle_first - no_support | 1991 | 44.3 pp | 42.1 to 46.6 pp | 892 | 9 | 127 | 963 |

## Support rank distribution

### bm25_top10

| support rank min | n | closure |
|---:|---:|---:|
| 1 | 1635 | 48.5% |
| 2 | 194 | 39.2% |
| 3 | 84 | 29.8% |
| 4 | 35 | 31.4% |
| 5 | 23 | 21.7% |
| 6 | 8 | 0.0% |
| 7 | 6 | 0.0% |
| 8 | 3 | 33.3% |
| 9 | 3 | 0.0% |

### bge_rerank_top10

| support rank min | n | closure |
|---:|---:|---:|
| 1 | 1924 | 50.8% |
| 2 | 48 | 33.3% |
| 3 | 12 | 16.7% |
| 4 | 3 | 0.0% |
| 5 | 2 | 50.0% |
| 6 | 1 | 100.0% |
| 7 | 1 | 0.0% |

## Rerank rank movement

```json
{
  "better": 339,
  "same": 1611,
  "worse": 41,
  "mean_rank_delta": 0.2913108990457057,
  "closure_delta_when_rank_better": 0.10619469026548672,
  "closure_delta_when_rank_same": 0.03227808814400993,
  "closure_delta_when_rank_worse": -0.024390243902439025
}
```

## Interpretation

BGE reranking improves over BM25 by moving support closer to the first position and nearly reaches the oracle-first ceiling on this HotpotQA setup. This changes the verdict: the controlled position effect remains real, but a strong reranker removes most of the BM25-to-oracle gap in natural retrieval for this dataset/model.
