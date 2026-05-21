# RealRAG R3K — adjudication light

Status: **done**
Started: 2026-05-21T00:38:32.969Z
Finished: 2026-05-21T00:39:32.386Z

## Boundary

- local LLM adjudication triage only.
- not independent human ground truth.
- samples stratified high-risk/diagnostic buckets, not representative benchmark distribution.
- used to identify metric false-positive/false-negative risks and bucket quality.

## Aggregate

| bucket | n | metric closed | judge correct | partial | wrong | false positive | false negative | prior/leak |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2wiki_all_support_conditions_fail | 40 | 0 | 0 | 5 | 35 | 0 | 35 | 0 |
| 2wiki_bge_only_success | 34 | 34 | 29 | 4 | 0 | 2 | 2 | 0 |
| 2wiki_bm25_only_success | 34 | 34 | 31 | 3 | 0 | 3 | 0 | 0 |
| 2wiki_natural_success_oracle_fail | 40 | 40 | 35 | 2 | 1 | 0 | 3 | 0 |
| 2wiki_no_support_success_leakage | 29 | 29 | 12 | 2 | 15 | 2 | 17 | 0 |
| hotpot_metric_closed_judge_negative | 4 | 4 | 0 | 1 | 3 | 0 | 4 | 0 |
| hotpot_metric_open_judge_positive | 19 | 0 | 9 | 8 | 2 | 0 | 10 | 0 |

## By metric state

| metric state | n | judge correct | partial | wrong | false positive | false negative |
|---|---:|---:|---:|---:|---:|---:|
| metric_closed | 141 | 107 | 12 | 19 | 7 | 26 |
| metric_open | 59 | 9 | 13 | 37 | 0 | 45 |

## Label counts

```json
{
  "correct": 116,
  "partial": 25,
  "wrong": 56,
  "parse_error": 3
}
```

## Metric-error counts

```json
{
  "none": 119,
  "false_negative": 71,
  "false_positive": 7,
  "unclear": 3
}
```
