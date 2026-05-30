# Entity-Hop Retrieval Grid

total_cases: 100
corpus_docs: 56687

Baseline BGE reality-check 100:

```txt
support_title_recall: 0.512
full_support_recall:  0.140
answer_present_rate:  0.400
EM/F1:                0.090 / 0.185
```

## Grid

| id | bm25_first | seed_top | second | seed_exp | mentions | pool | support | full | answer | full+answer | avg pool | avg edges |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 8 | 0 | 0 | 4 | 3 | 80 | 0.690 | 0.420 | 0.730 | 0.420 | 15.1 | 9.1 |
| 2 | 8 | 2 | 0 | 4 | 3 | 80 | 0.690 | 0.420 | 0.730 | 0.420 | 15.1 | 9.1 |
| 1 | 8 | 0 | 0 | 4 | 6 | 80 | 0.610 | 0.340 | 0.660 | 0.340 | 16.6 | 11.1 |
| 3 | 8 | 2 | 0 | 4 | 6 | 80 | 0.610 | 0.340 | 0.660 | 0.340 | 16.6 | 11.1 |
| 4 | 12 | 0 | 0 | 4 | 3 | 80 | 0.549 | 0.260 | 0.620 | 0.260 | 22.6 | 13.7 |
| 6 | 12 | 2 | 0 | 4 | 3 | 80 | 0.549 | 0.260 | 0.620 | 0.260 | 22.6 | 13.7 |
| 5 | 12 | 0 | 0 | 4 | 6 | 80 | 0.497 | 0.220 | 0.550 | 0.220 | 24.8 | 16.8 |
| 7 | 12 | 2 | 0 | 4 | 6 | 80 | 0.497 | 0.220 | 0.550 | 0.220 | 24.8 | 16.8 |
| 8 | 20 | 0 | 0 | 4 | 3 | 80 | 0.381 | 0.070 | 0.410 | 0.070 | 37.1 | 22.4 |
| 10 | 20 | 2 | 0 | 4 | 3 | 80 | 0.381 | 0.070 | 0.410 | 0.070 | 37.1 | 22.4 |
| 9 | 20 | 0 | 0 | 4 | 6 | 80 | 0.352 | 0.060 | 0.380 | 0.060 | 40.4 | 27.4 |
| 11 | 20 | 2 | 0 | 4 | 6 | 80 | 0.352 | 0.060 | 0.380 | 0.060 | 40.4 | 27.4 |

## Best by full_support_and_answer

```json
{
  "config_id": 0,
  "config": {
    "bm25_first": 8,
    "seed_top": 0,
    "second_per_mention": 0,
    "max_seed_expansions": 4,
    "max_doc_mentions": 3,
    "pool_limit": 80
  },
  "metrics": {
    "support_title_recall": 0.69,
    "full_support_recall": 0.42,
    "answer_string_present_rate": 0.73,
    "avg_pool_size": 15.06,
    "avg_edge_count": 9.08,
    "full_support_and_answer": 0.42
  }
}
```
