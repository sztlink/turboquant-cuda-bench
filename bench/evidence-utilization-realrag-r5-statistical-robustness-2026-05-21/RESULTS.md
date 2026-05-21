# RealRAG R5 — statistical robustness pack

Status: done
Date: 2026-05-21

## Boundary

```txt
offline statistical analysis only
no endpoint
no LLM judge
no human labels
not evidence-use proof
```

Bootstrap samples: 5000  
Seed: 20260521

## Closure confidence intervals

| run | condition | mean | 95% CI | n |
|---|---|---:|---:|---:|
| HotpotQA 7B R3B | `bm25_top10` | 45.8% | [43.6%, 48.1%] | 1991 |
| HotpotQA 7B R3B | `bge_rerank_top10` | 50.1% | [47.9%, 52.3%] | 1991 |
| HotpotQA 7B R3B | `oracle_first` | 51.2% | [49.0%, 53.3%] | 1991 |
| HotpotQA 7B R3B | `no_support` | 6.8% | [5.7%, 7.9%] | 1991 |
| HotpotQA 32B R3L | `bm25_top10` | 62.4% | [60.3%, 64.5%] | 1991 |
| HotpotQA 32B R3L | `bge_rerank_top10` | 64.6% | [62.5%, 66.8%] | 1991 |
| HotpotQA 32B R3L | `oracle_first` | 66.2% | [64.1%, 68.4%] | 1991 |
| HotpotQA 32B R3L | `no_support` | 6.1% | [5.2%, 7.2%] | 1991 |
| 2Wiki 7B R3G | `bm25_top10` | 33.3% | [31.3%, 35.4%] | 2000 |
| 2Wiki 7B R3G | `bge_rerank_top10` | 33.8% | [31.6%, 35.9%] | 2000 |
| 2Wiki 7B R3G | `oracle_first` | 31.9% | [29.8%, 34.0%] | 2000 |
| 2Wiki 7B R3G | `no_support` | 3.9% | [3.0%, 4.8%] | 2000 |

## Paired closure deltas

| run | delta | mean | 95% CI | sign + |
|---|---|---:|---:|---:|
| HotpotQA 7B R3B | `bge_rerank_top10 - bm25_top10` | 4.4 pp | [2.6 pp, 6.1 pp] | 100.0% |
| HotpotQA 7B R3B | `oracle_first - bge_rerank_top10` | 1.1 pp | [-0.6 pp, 2.7 pp] | 89.1% |
| HotpotQA 7B R3B | `oracle_first - no_support` | 44.3 pp | [42.1 pp, 46.6 pp] | 100.0% |
| HotpotQA 32B R3L | `bge_rerank_top10 - bm25_top10` | 2.3 pp | [0.9 pp, 3.7 pp] | 99.8% |
| HotpotQA 32B R3L | `oracle_first - bge_rerank_top10` | 1.6 pp | [0.3 pp, 3.0 pp] | 98.9% |
| HotpotQA 32B R3L | `oracle_first - no_support` | 60.1 pp | [57.9 pp, 62.3 pp] | 100.0% |
| 2Wiki 7B R3G | `bge_rerank_top10 - bm25_top10` | 0.4 pp | [-1.5 pp, 2.4 pp] | 65.8% |
| 2Wiki 7B R3G | `oracle_first - bge_rerank_top10` | -1.8 pp | [-3.7 pp, 0.1 pp] | 3.0% |
| 2Wiki 7B R3G | `oracle_first - no_support` | 28.1 pp | [25.9 pp, 30.1 pp] | 100.0% |

## HotpotQA 32B minus 7B closure deltas

| condition | 32B - 7B | 95% CI | sign + |
|---|---:|---:|---:|
| `bm25_top10` | 16.6 pp | [14.5 pp, 18.9 pp] | 100.0% |
| `bge_rerank_top10` | 14.5 pp | [12.4 pp, 16.6 pp] | 100.0% |
| `oracle_first` | 15.1 pp | [12.9 pp, 17.2 pp] | 100.0% |
| `no_support` | -0.7 pp | [-1.8 pp, 0.4 pp] | 9.8% |

## Interpretation

```txt
HotpotQA: BGE > BM25 is stable, oracle > BGE is small but positive, support-present >> no-support is very large.
HotpotQA 32B: scale raises closure in all support-present conditions but does not erase the placement/reranking ladder.
2Wiki: support-present >> no-support is stable, but BGE/BM25/oracle differences are small and dataset/schema-sensitive.
```

This strengthens answer-closure/placement claims only. It does not prove internal evidence use.
