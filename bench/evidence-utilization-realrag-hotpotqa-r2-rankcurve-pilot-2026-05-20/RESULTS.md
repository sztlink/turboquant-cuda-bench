# RealRAG HotpotQA R2 — evidence placement and answer closure

Status: **done**
Started: 2026-05-20T11:05:25.147Z
Finished: 2026-05-20T11:05:35.880Z

## Boundary

- Public HotpotQA distractor benchmark, not a synthetic in-house fixture.
- Measures answer closure over gold answers (EM/contains/F1), not proof of model evidence use.
- No EPKV runtime hook, no vLLM patch/restart/deploy, no attention claim.

## Conditions

- `rank_1`: gold supporting paragraphs inserted at rank 1.
- `rank_3`: gold supporting paragraphs inserted after 2 BM25 distractors.
- `rank_5`: gold supporting paragraphs inserted after 4 BM25 distractors.
- `rank_8`: gold supporting paragraphs inserted after 7 BM25 distractors.
- `rank_last`: gold supporting paragraphs placed last.
- `no_support`: gold supporting paragraphs removed.

## Aggregate

| condition | n | closure | EM | contains | F1 | support present | error rate |
|---|---:|---:|---:|---:|---:|---:|---:|
| rank_1 | 8 | 37.5% | 37.5% | 37.5% | 45.8% | 100.0% | 0.0% |
| rank_3 | 8 | 25.0% | 25.0% | 25.0% | 33.3% | 100.0% | 0.0% |
| rank_5 | 8 | 50.0% | 50.0% | 50.0% | 58.3% | 100.0% | 0.0% |
| rank_8 | 8 | 37.5% | 37.5% | 37.5% | 45.8% | 100.0% | 0.0% |
| rank_last | 8 | 37.5% | 37.5% | 37.5% | 37.5% | 100.0% | 0.0% |
| no_support | 8 | 12.5% | 12.5% | 12.5% | 17.5% | 0.0% | 0.0% |

## Paired closure deltas

- rank_1_minus_rank_3: 12.5 pp
- rank_1_minus_rank_5: -12.5 pp
- rank_1_minus_rank_8: 0.0 pp
- rank_1_minus_rank_last: 0.0 pp
- rank_1_minus_no_support: 25.0 pp

## Rank buckets

| condition | support rank bucket | n | closure | F1 |
|---|---:|---:|---:|---:|
| no_support | none | 8 | 12.5% | 17.5% |
| rank_1 | 1 | 8 | 37.5% | 45.8% |
| rank_3 | 2-3 | 8 | 25.0% | 33.3% |
| rank_5 | 4-8 | 8 | 50.0% | 58.3% |
| rank_8 | 4-8 | 8 | 37.5% | 45.8% |
| rank_last | >8 | 8 | 37.5% | 37.5% |

## Files

- `records.jsonl` — per question/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
