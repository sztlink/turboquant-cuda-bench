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
| 0 | 8 | 0 | 0 | 4 | 3 | 80 | 0.713 | 0.390 | 0.760 | 0.390 | 15.0 | 8.7 |
| 2 | 8 | 2 | 0 | 4 | 3 | 80 | 0.713 | 0.390 | 0.760 | 0.390 | 15.1 | 8.7 |
| 1 | 8 | 0 | 0 | 4 | 6 | 80 | 0.685 | 0.360 | 0.770 | 0.360 | 16.4 | 10.5 |
| 3 | 8 | 2 | 0 | 4 | 6 | 80 | 0.685 | 0.360 | 0.770 | 0.360 | 16.5 | 10.5 |
| 4 | 12 | 0 | 0 | 4 | 3 | 80 | 0.599 | 0.270 | 0.690 | 0.270 | 22.3 | 13.1 |
| 6 | 12 | 2 | 0 | 4 | 3 | 80 | 0.599 | 0.270 | 0.690 | 0.270 | 22.3 | 13.1 |
| 5 | 12 | 0 | 0 | 4 | 6 | 80 | 0.570 | 0.250 | 0.690 | 0.250 | 24.4 | 16.0 |
| 7 | 12 | 2 | 0 | 4 | 6 | 80 | 0.570 | 0.250 | 0.690 | 0.250 | 24.4 | 16.0 |
| 8 | 20 | 0 | 0 | 4 | 3 | 80 | 0.434 | 0.110 | 0.510 | 0.110 | 36.8 | 21.6 |
| 10 | 20 | 2 | 0 | 4 | 3 | 80 | 0.434 | 0.110 | 0.510 | 0.110 | 36.8 | 21.6 |
| 9 | 20 | 0 | 0 | 4 | 6 | 80 | 0.425 | 0.110 | 0.500 | 0.110 | 40.1 | 26.5 |
| 11 | 20 | 2 | 0 | 4 | 6 | 80 | 0.425 | 0.110 | 0.500 | 0.110 | 40.2 | 26.5 |

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
    "support_title_recall": 0.7125,
    "full_support_recall": 0.39,
    "answer_string_present_rate": 0.76,
    "avg_pool_size": 14.97,
    "avg_edge_count": 8.69,
    "full_support_and_answer": 0.39
  }
}
```
