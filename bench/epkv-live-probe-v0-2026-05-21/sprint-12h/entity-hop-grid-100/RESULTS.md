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
| 0 | 8 | 0 | 0 | 4 | 3 | 80 | 0.708 | 0.460 | 0.780 | 0.460 | 14.8 | 8.9 |
| 2 | 8 | 2 | 0 | 4 | 3 | 80 | 0.708 | 0.460 | 0.780 | 0.460 | 14.9 | 8.9 |
| 1 | 8 | 0 | 0 | 4 | 6 | 80 | 0.671 | 0.410 | 0.770 | 0.410 | 15.9 | 10.3 |
| 3 | 8 | 2 | 0 | 4 | 6 | 80 | 0.671 | 0.410 | 0.770 | 0.410 | 15.9 | 10.3 |
| 4 | 12 | 0 | 0 | 4 | 3 | 80 | 0.560 | 0.260 | 0.650 | 0.260 | 22.3 | 13.4 |
| 6 | 12 | 2 | 0 | 4 | 3 | 80 | 0.560 | 0.260 | 0.650 | 0.260 | 22.3 | 13.4 |
| 5 | 12 | 0 | 0 | 4 | 6 | 80 | 0.527 | 0.250 | 0.610 | 0.250 | 23.8 | 15.7 |
| 7 | 12 | 2 | 0 | 4 | 6 | 80 | 0.527 | 0.250 | 0.610 | 0.250 | 23.8 | 15.7 |
| 8 | 20 | 0 | 0 | 4 | 3 | 80 | 0.383 | 0.070 | 0.420 | 0.070 | 36.8 | 21.9 |
| 10 | 20 | 2 | 0 | 4 | 3 | 80 | 0.383 | 0.070 | 0.420 | 0.070 | 36.8 | 21.9 |
| 9 | 20 | 0 | 0 | 4 | 6 | 80 | 0.359 | 0.060 | 0.390 | 0.060 | 39.4 | 25.8 |
| 11 | 20 | 2 | 0 | 4 | 6 | 80 | 0.359 | 0.060 | 0.390 | 0.060 | 39.4 | 25.8 |

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
    "support_title_recall": 0.7083333333333333,
    "full_support_recall": 0.46,
    "answer_string_present_rate": 0.78,
    "avg_pool_size": 14.84,
    "avg_edge_count": 8.9,
    "full_support_and_answer": 0.46
  }
}
```
