# RealRAG HotpotQA R3D — local semantic judge audit

Status: **done**
Started: 2026-05-20T16:59:45.322Z
Finished: 2026-05-20T17:03:10.168Z

## Boundary

- local Qwen judge triage, not ground-truth adjudication.
- judge model overlaps the evaluated setup and may share biases.
- use for metric debugging and manual review prioritization.
- no vLLM mutation, no serving claim, no internal evidence-use proof.

## Metric vs judge confusion

| metric/judge | n |
|---|---:|
| metric_closed:judge_negative | 4 |
| metric_closed:judge_positive | 267 |
| metric_open:judge_negative | 354 |
| metric_open:judge_positive | 59 |

## By condition

| condition | n | metric closure | judge-positive | labels |
|---|---:|---:|---:|---|
| bge_rerank_top10 | 171 | 47.4% | 59.1% | wrong:70; correct:81; partial:20 |
| bm25_top10 | 171 | 40.4% | 50.3% | wrong:85; partial:21; correct:65 |
| no_support | 171 | 17.5% | 19.9% | wrong:137; prior_knowledge_or_leakage:34 |
| oracle_first | 171 | 53.2% | 61.4% | wrong:66; correct:88; partial:17 |

## By bucket

| bucket | n | metric closure | judge-positive | labels |
|---|---:|---:|---:|---|
| all_support_conditions_fail | 120 | 0.8% | 19.2% | wrong:97; partial:16; correct:5; prior_knowledge_or_leakage:2 |
| bge_success_oracle_fail | 120 | 33.3% | 38.3% | wrong:74; correct:35; partial:10; prior_knowledge_or_leakage:1 |
| bm25_fail_bge_fail_oracle_success | 120 | 25.0% | 33.3% | wrong:80; partial:11; correct:28; prior_knowledge_or_leakage:1 |
| bm25_fail_bge_success | 120 | 43.3% | 50.8% | wrong:59; correct:46; partial:12; prior_knowledge_or_leakage:3 |
| bm25_success_bge_fail | 120 | 33.3% | 44.2% | correct:39; wrong:67; partial:13; prior_knowledge_or_leakage:1 |
| no_support_success_leakage | 120 | 97.5% | 95.8% | wrong:5; prior_knowledge_or_leakage:28; correct:87 |
| oracle_success_bge_fail | 120 | 30.8% | 36.7% | wrong:76; partial:11; correct:32; prior_knowledge_or_leakage:1 |
