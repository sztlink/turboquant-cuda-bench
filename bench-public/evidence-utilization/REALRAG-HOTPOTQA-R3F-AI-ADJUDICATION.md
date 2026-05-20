# RealRAG HotpotQA R3F — AI-assisted adjudication draft

Status: AI adjudication draft complete  
Source: R3E human/independent adjudication packet  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r3f-ai-adjudication-2026-05-20/`

## One-line result

R3F provides an AI-assisted adjudication draft over the 144 R3E review items. It is **not** human ground truth. It is a prioritization layer for review.

The stricter adjudicator prompt hid local-judge labels and metric labels, but still used the same local endpoint family. Treat this as a second-pass triage, not independent evidence.

## Boundary

- Not human adjudication.
- Not independent ground truth.
- Same local model family/endpoint as prior runs.
- Prompt hides local judge and metric labels, but shared model bias remains possible.
- Use only to prioritize human/independent review.

## Scale

```txt
review_items: 144
completed: 144
errors: 0
```

## Metric vs AI adjudication

| metric / AI adjudication | n |
|---|---:|
| metric closed / AI positive | 41 |
| metric open / AI negative | 69 |
| metric open / AI positive | 34 |
| metric closed / AI negative | 0 |

On this selected packet, the AI adjudicator did not flag metric-closed cases as semantically negative. It did flag many metric-open cases as acceptable/partial/prior-leakage.

## By category

| category | n | metric closure | AI positive | labels |
|---|---:|---:|---:|---|
| `metric_closed_judge_negative` | 4 | 100.0% | 100.0% | prior/leakage 2; partial 2 |
| `metric_open_judge_positive` | 20 | 0.0% | 95.0% | correct 13; partial 6; wrong 1 |
| `no_support_prior_or_leakage` | 20 | 85.0% | 100.0% | prior/leakage 20 |
| `bge_wrong_support_present` | 20 | 0.0% | 5.0% | wrong 19; partial 1 |
| `oracle_wrong_support_first` | 20 | 0.0% | 15.0% | wrong 17; partial 2; correct 1 |
| `bm25_wrong_support_present` | 20 | 0.0% | 15.0% | wrong 17; correct 1; partial 2 |
| `metric_closed_judge_positive_control` | 20 | 100.0% | 100.0% | correct 19; partial 1 |
| `metric_open_judge_negative_control` | 20 | 0.0% | 25.0% | wrong 15; prior/leakage 5 |

## By condition

| condition | n | metric closure | AI positive | labels |
|---|---:|---:|---:|---|
| `bm25_top10` | 32 | 18.8% | 46.9% | correct 10; partial 5; wrong 17 |
| `bge_rerank_top10` | 33 | 18.2% | 42.4% | correct 9; partial 5; wrong 19 |
| `oracle_first` | 37 | 27.0% | 51.4% | correct 15; partial 4; wrong 18 |
| `no_support` | 42 | 45.2% | 64.3% | prior/leakage 27; wrong 15 |

These rates are over the selected adjudication packet, not the full benchmark population.

## What R3F changes

R3F does not replace R3E. It helps order the manual review queue:

1. `metric_open_judge_positive` is high-value: AI agrees most are acceptable/partial.
2. `no_support_prior_or_leakage` is high-value: AI marks all selected cases as prior/leakage.
3. Support-present wrong categories mostly remain wrong under the stricter prompt.
4. The four `metric_closed_judge_negative` cases need human review because R3D and R3F disagree.

## Updated safe statement

> R3F suggests the biggest metric risk in the selected packet is false negatives / partial-answer handling and no-support prior leakage, not metric-closed false positives. Human or independent adjudication is still required.

## Recommended next step

Do not run another local judge as if it were evidence. The next useful step is one of:

```txt
1. Human-review the 144 R3E/R3F items.
2. Send the review packet to external reviewers.
3. If using another model, use it explicitly as independent-judge-v1 and keep it separate from human labels.
```

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r3f-ai-adjudication-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r3f-ai-adjudication-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r3f-ai-adjudication-2026-05-20/ai-adjudication-records.jsonl
```
