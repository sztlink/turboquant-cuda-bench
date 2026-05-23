# RealRAG R4C — calibration readiness

Status: ready
Date: 2026-05-21

Boundary: readiness analysis only. No new human labels, no public claim, no serving mutation.

## Inputs

```txt
batch: bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/human-calibration-batch.jsonl
panel: bench/evidence-utilization-realrag-r4a-llm-judge-panel-2026-05-21/panel-records.jsonl
```

## Current calibration state

```txt
rows: 150
unique qid hashes: 150
labeled rows: 18
unlabeled rows: 132
```

Human label counts:

```json
{
  "correct": 10,
  "partial": 5,
  "unclear": 1,
  "wrong": 2
}
```

Panel agreement on labeled rows:

```json
{
  "exact": {
    "true": 11,
    "false": 7
  },
  "polarity": {
    "false": 4,
    "neutral": 1,
    "true": 13
  }
}
```

Metric relation on labeled rows:

```json
{
  "false": 5,
  "neutral": 1,
  "true": 12
}
```

## Prioritized remaining queue

Top 15 unlabeled rows by risk/readiness score:

```txt
01. r4b-v2-0017 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
02. r4b-v2-0018 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
03. r4b-v2-0019 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
04. r4b-v2-0020 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
05. r4b-v2-0021 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
06. r4b-v2-0022 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
07. r4b-v2-0023 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
08. r4b-v2-0024 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
09. r4b-v2-0025 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
10. r4b-v2-0026 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
11. r4b-v2-0027 score=51 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;panel_disagreement;support_absent]
12. r4b-v2-0028 score=38 bge_rerank_top10 2wiki_bge_only_success [metric_closed_panel_negative;panel_disagreement;panel_metric_error_metric_false_positive]
13. r4b-v2-0032 score=37 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;support_absent]
14. r4b-v2-0033 score=37 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;support_absent]
15. r4b-v2-0034 score=37 no_support 2wiki_no_support_success_leakage [no_support_condition;no_support_metric_closed;no_support_success_bucket;support_absent]
```

## Files

```txt
labeled-analysis.csv
labeled-analysis.jsonl
unlabeled-priority-queue.csv
unlabeled-priority-queue.jsonl
summary.json
RESULTS.md
```
