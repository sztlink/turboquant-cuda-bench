# RealRAG HotpotQA R3A — prompt/citation ablation

Status: **done**
Started: 2026-05-20T13:37:50.551Z
Finished: 2026-05-20T13:38:34.547Z

## Boundary

- public HotpotQA prompt/citation ablation.
- closure is answer-side EM/contains/F1, not proof of evidence use.
- citation_hit is title-string overlap, not proof of internal use.
- no runtime hook, no serving mutation, no attention claim.

## Aggregate

| variant | condition | n | closure | EM | contains | F1 | citation hit | error rate |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| cite_then_answer | no_support | 8 | 0.0% | 0.0% | 0.0% | 5.0% | 0.0% | 0.0% |
| cite_then_answer | rank_1 | 8 | 37.5% | 37.5% | 37.5% | 37.5% | 50.0% | 0.0% |
| cite_then_answer | rank_5 | 8 | 12.5% | 12.5% | 12.5% | 20.8% | 50.0% | 0.0% |
| cite_then_answer | rank_last | 8 | 37.5% | 37.5% | 37.5% | 45.8% | 50.0% | 0.0% |
| direct_short_answer | no_support | 8 | 12.5% | 12.5% | 12.5% | 17.5% | n/a | 0.0% |
| direct_short_answer | rank_1 | 8 | 37.5% | 37.5% | 37.5% | 45.8% | n/a | 0.0% |
| direct_short_answer | rank_5 | 8 | 50.0% | 50.0% | 50.0% | 58.3% | n/a | 0.0% |
| direct_short_answer | rank_last | 8 | 37.5% | 37.5% | 37.5% | 37.5% | n/a | 0.0% |
| reason_then_answer | no_support | 8 | 12.5% | 0.0% | 12.5% | 11.3% | n/a | 0.0% |
| reason_then_answer | rank_1 | 8 | 50.0% | 37.5% | 50.0% | 47.5% | n/a | 0.0% |
| reason_then_answer | rank_5 | 8 | 37.5% | 25.0% | 37.5% | 42.7% | n/a | 0.0% |
| reason_then_answer | rank_last | 8 | 25.0% | 0.0% | 25.0% | 25.8% | n/a | 0.0% |

## Files

- `records.jsonl` — per question/variant/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
