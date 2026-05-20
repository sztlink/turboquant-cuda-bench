# RealRAG HotpotQA R3F — AI-assisted adjudication draft

Status: **done**
Started: 2026-05-20T17:34:44.483Z
Finished: 2026-05-20T17:35:28.343Z

## Boundary

- AI-assisted adjudication draft, not human ground truth.
- adjudicator prompt hides local judge and metric labels but uses same local endpoint family.
- use only to prioritize human/independent review.
- do not treat as final semantic labels.

## Metric vs AI adjudication

| metric/AI | n |
|---|---:|
| metric_closed:ai_positive | 41 |
| metric_open:ai_negative | 69 |
| metric_open:ai_positive | 34 |

## By category

| category | n | metric closure | AI positive | metric agreement | labels |
|---|---:|---:|---:|---:|---|
| bge_wrong_support_present | 20 | 0.0% | 5.0% | 95.0% | wrong:19; partial:1 |
| bm25_wrong_support_present | 20 | 0.0% | 15.0% | 85.0% | wrong:17; correct:1; partial:2 |
| metric_closed_judge_negative | 4 | 100.0% | 100.0% | 100.0% | prior_knowledge_or_leakage:2; partial:2 |
| metric_closed_judge_positive_control | 20 | 100.0% | 100.0% | 100.0% | correct:19; partial:1 |
| metric_open_judge_negative_control | 20 | 0.0% | 25.0% | 75.0% | prior_knowledge_or_leakage:5; wrong:15 |
| metric_open_judge_positive | 20 | 0.0% | 95.0% | 5.0% | partial:6; correct:13; wrong:1 |
| no_support_prior_or_leakage | 20 | 85.0% | 100.0% | 85.0% | prior_knowledge_or_leakage:20 |
| oracle_wrong_support_first | 20 | 0.0% | 15.0% | 85.0% | wrong:17; partial:2; correct:1 |

## By condition

| condition | n | metric closure | AI positive | labels |
|---|---:|---:|---:|---|
| bge_rerank_top10 | 33 | 18.2% | 42.4% | partial:5; correct:9; wrong:19 |
| bm25_top10 | 32 | 18.8% | 46.9% | partial:5; correct:10; wrong:17 |
| no_support | 42 | 45.2% | 64.3% | prior_knowledge_or_leakage:27; wrong:15 |
| oracle_first | 37 | 27.0% | 51.4% | partial:4; correct:15; wrong:18 |
