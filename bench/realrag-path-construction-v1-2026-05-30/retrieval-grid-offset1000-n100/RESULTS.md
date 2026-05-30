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
| 0 | 8 | 0 | 0 | 4 | 3 | 80 | 0.672 | 0.380 | 0.700 | 0.380 | 15.2 | 8.6 |
| 2 | 8 | 2 | 0 | 4 | 3 | 80 | 0.672 | 0.380 | 0.690 | 0.380 | 15.3 | 8.6 |
| 1 | 8 | 0 | 0 | 4 | 6 | 80 | 0.627 | 0.340 | 0.680 | 0.340 | 16.4 | 10.2 |
| 3 | 8 | 2 | 0 | 4 | 6 | 80 | 0.627 | 0.340 | 0.670 | 0.340 | 16.6 | 10.2 |
| 4 | 12 | 0 | 0 | 4 | 3 | 80 | 0.581 | 0.280 | 0.650 | 0.280 | 22.9 | 13.2 |
| 6 | 12 | 2 | 0 | 4 | 3 | 80 | 0.581 | 0.280 | 0.650 | 0.280 | 23.0 | 13.2 |
| 5 | 12 | 0 | 0 | 4 | 6 | 80 | 0.542 | 0.240 | 0.600 | 0.240 | 24.9 | 16.0 |
| 7 | 12 | 2 | 0 | 4 | 6 | 80 | 0.542 | 0.240 | 0.600 | 0.240 | 25.0 | 16.0 |
| 8 | 20 | 0 | 0 | 4 | 3 | 80 | 0.453 | 0.140 | 0.470 | 0.140 | 37.7 | 21.7 |
| 10 | 20 | 2 | 0 | 4 | 3 | 80 | 0.453 | 0.140 | 0.470 | 0.140 | 37.8 | 21.7 |
| 9 | 20 | 0 | 0 | 4 | 6 | 80 | 0.434 | 0.110 | 0.420 | 0.110 | 40.8 | 26.2 |
| 11 | 20 | 2 | 0 | 4 | 6 | 80 | 0.434 | 0.110 | 0.420 | 0.110 | 40.8 | 26.2 |

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
    "support_title_recall": 0.6725,
    "full_support_recall": 0.38,
    "answer_string_present_rate": 0.7,
    "avg_pool_size": 15.15,
    "avg_edge_count": 8.62,
    "full_support_and_answer": 0.38
  }
}
```
