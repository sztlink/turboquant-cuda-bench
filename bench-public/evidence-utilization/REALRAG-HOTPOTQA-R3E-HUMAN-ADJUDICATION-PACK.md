# RealRAG HotpotQA R3E — human/independent adjudication packet

Status: review packet generated; labels unreviewed  
Source: R3C metric audit + R3D local judge triage  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/`

## One-line result

R3E does not add benchmark evidence. It creates the packet needed for the next real gate: human or independent semantic adjudication.

The package selects 144 high-value review items from the R3C/R3D samples, with blank human-label fields and local-judge labels included only as triage hints.

## Boundary

- No human labels have been assigned yet.
- Local judge labels are hints, not ground truth.
- R3E should not be counted as additional evidence until reviewed.
- The purpose is to make the next adjudication step reproducible and auditable.

## Review label schema

Allowed labels:

```txt
correct
partial
wrong
ambiguous_dataset
metric_false_positive
metric_false_negative
prior_knowledge_or_leakage
```

Review fields are blank:

```txt
human_label
human_confidence
human_notes
review_status: unreviewed
```

## Packet composition

| category | selected | available |
|---|---:|---:|
| `metric_closed_judge_negative` | 4 | 4 |
| `metric_open_judge_positive` | 20 | 53 |
| `no_support_prior_or_leakage` | 20 | 34 |
| `bge_wrong_support_present` | 20 | 70 |
| `oracle_wrong_support_first` | 20 | 65 |
| `bm25_wrong_support_present` | 20 | 84 |
| `metric_closed_judge_positive_control` | 20 | 239 |
| `metric_open_judge_negative_control` | 20 | 135 |

Total review items:

```txt
144
```

The `no_support_metric_closed` category is empty after separating no-support answers judged as prior/leakage into `no_support_prior_or_leakage`.

## What each item contains

Each item includes:

```txt
review_id
review_status
human_label / human_confidence / human_notes
review_category
bucket memberships
qid / condition
question
gold answer
prediction
automatic metrics
local judge label/rationale
support and sentence-audit fields
context titles
supporting-fact title/sentence pairs
```

## Why this matters

R3D showed closure is directionally useful, but not enough:

```txt
metric closed / judge positive: 267
metric closed / judge negative: 4
metric open / judge negative: 354
metric open / judge positive: 59
```

The 59 metric-open/judge-positive cases and the no-support leakage cases are exactly where broad claims can go wrong.

R3E turns those cases into an auditable review queue.

## Recommended review protocol

1. Review the 144 items without treating the local judge as authoritative.
2. Assign one allowed label per item.
3. Use `human_notes` for alias, granularity, ambiguity, or leakage explanations.
4. Recompute metric-vs-human confusion.
5. Only then decide whether closure needs adjustment before 2Wiki/MuSiQue or second-model replication.

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/review-items.jsonl
bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/review-items.csv
bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/review-items.md
```
