# RealRAG HotpotQA R3A — prompt/citation ablation

Status: **done**
Started: 2026-05-20T13:39:07.746Z
Finished: 2026-05-20T15:20:42.104Z

## Boundary

- public HotpotQA prompt/citation ablation.
- closure is answer-side EM/contains/F1, not proof of evidence use.
- citation_hit is title-string overlap, not proof of internal use.
- no runtime hook, no serving mutation, no attention claim.

## Aggregate

| variant | condition | n | closure | EM | contains | F1 | citation hit | error rate |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| cite_then_answer | no_support | 1991 | 6.7% | 4.8% | 6.4% | 7.2% | 0.0% | 0.0% |
| cite_then_answer | rank_1 | 1991 | 48.0% | 35.0% | 44.7% | 48.0% | 43.9% | 0.0% |
| cite_then_answer | rank_5 | 1991 | 37.2% | 28.0% | 34.7% | 37.9% | 32.9% | 0.0% |
| cite_then_answer | rank_last | 1991 | 37.0% | 27.0% | 34.6% | 37.0% | 28.2% | 0.0% |
| direct_short_answer | no_support | 1991 | 6.5% | 5.2% | 6.1% | 7.3% | n/a | 0.0% |
| direct_short_answer | rank_1 | 1991 | 51.5% | 43.0% | 48.1% | 54.2% | n/a | 0.0% |
| direct_short_answer | rank_5 | 1991 | 38.4% | 32.6% | 36.5% | 41.4% | n/a | 0.0% |
| direct_short_answer | rank_last | 1991 | 42.7% | 35.8% | 39.8% | 45.5% | n/a | 0.0% |
| reason_then_answer | no_support | 1991 | 8.6% | 6.4% | 8.3% | 8.6% | n/a | 0.0% |
| reason_then_answer | rank_1 | 1991 | 52.3% | 39.0% | 49.7% | 51.8% | n/a | 0.0% |
| reason_then_answer | rank_5 | 1991 | 39.3% | 28.2% | 37.4% | 38.5% | n/a | 0.0% |
| reason_then_answer | rank_last | 1991 | 43.8% | 31.9% | 41.1% | 43.1% | n/a | 0.0% |

## Files

- `records.jsonl` — per question/variant/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
