# RealRAG R3K — adjudication light

Status: local LLM triage complete  
Primary artifact: `bench/evidence-utilization-realrag-r3k-adjudication-light-2026-05-20/`

## One-line result

R3K gives a fast, non-authoritative audit of 200 high-risk/diagnostic cases. It confirms that automatic closure is useful but imperfect: no-support closure and metric-open partial/correct cases remain the main metric-risk zones.

## Boundary

This is **local LLM triage**, not independent human adjudication. The sample is intentionally stratified over risky buckets and is not representative of the full benchmark distribution.

Labels should guide the next human/adjudication pass; they are not ground truth.

## Sample

```txt
review_items: 200
completed_records: 200
model: local-vllm
errors: 0 request-level errors
```

Buckets:

| bucket | n | purpose |
|---|---:|---|
| `2wiki_all_support_conditions_fail` | 40 | support present but all main conditions fail |
| `2wiki_bge_only_success` | 34 | BGE closes where BM25 fails |
| `2wiki_bm25_only_success` | 34 | BM25 closes where BGE fails |
| `2wiki_natural_success_oracle_fail` | 40 | natural order closes where oracle-first fails |
| `2wiki_no_support_success_leakage` | 29 | no-support closure risk |
| `hotpot_metric_closed_judge_negative` | 4 | Hotpot metric-closed/local-negative edge cases |
| `hotpot_metric_open_judge_positive` | 19 | Hotpot metric-open/local-positive edge cases |

## Aggregate local-triage labels

```json
{
  "correct": 116,
  "partial": 25,
  "wrong": 56,
  "parse_error": 3
}
```

Metric-error flags emitted by the local adjudicator:

```json
{
  "none": 119,
  "false_negative": 71,
  "false_positive": 7,
  "unclear": 3
}
```

## By bucket

| bucket | n | metric closed | judge correct | partial | wrong | false positive | false negative |
|---|---:|---:|---:|---:|---:|---:|---:|
| `2wiki_all_support_conditions_fail` | 40 | 0 | 0 | 5 | 35 | 0 | 35 |
| `2wiki_bge_only_success` | 34 | 34 | 29 | 4 | 0 | 2 | 2 |
| `2wiki_bm25_only_success` | 34 | 34 | 31 | 3 | 0 | 3 | 0 |
| `2wiki_natural_success_oracle_fail` | 40 | 40 | 35 | 2 | 1 | 0 | 3 |
| `2wiki_no_support_success_leakage` | 29 | 29 | 12 | 2 | 15 | 2 | 17 |
| `hotpot_metric_closed_judge_negative` | 4 | 4 | 0 | 1 | 3 | 0 | 4 |
| `hotpot_metric_open_judge_positive` | 19 | 0 | 9 | 8 | 2 | 0 | 10 |

## Readout

- `bge_only_success`, `bm25_only_success`, and `natural_success_oracle_fail` are mostly real closure cases under local triage.
- `no_support_success_leakage` is mixed: some answers are judged correct, but many are wrong/metric-risk and should remain a leakage/prior-knowledge warning bucket.
- `metric_open_judge_positive` contains many correct/partial cases; automatic closure undercounts some semantically acceptable outputs.
- `all_support_conditions_fail` is mostly genuinely wrong, despite support being present.

## Safe conclusion

> Automatic closure is adequate for coarse benchmark trends, but not for final correctness claims. It especially needs adjudication around no-support closure, partial answers, and metric-open semantically acceptable responses.

## Source artifacts

```txt
bench/evidence-utilization-realrag-r3k-adjudication-light-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-r3k-adjudication-light-2026-05-20/summary.json
bench/evidence-utilization-realrag-r3k-adjudication-light-2026-05-20/review-items.jsonl
bench/evidence-utilization-realrag-r3k-adjudication-light-2026-05-20/adjudication-records.jsonl
```
