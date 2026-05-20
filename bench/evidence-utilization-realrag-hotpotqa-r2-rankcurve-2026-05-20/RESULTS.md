# RealRAG HotpotQA R2 — evidence placement and answer closure

Status: **done**
Started: 2026-05-20T11:06:09.620Z
Finished: 2026-05-20T12:55:18.163Z

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
| rank_1 | 7384 | 51.4% | 42.3% | 47.7% | 54.0% | 100.0% | 0.0% |
| rank_3 | 7384 | 40.4% | 33.1% | 37.6% | 42.7% | 100.0% | 0.0% |
| rank_8 | 7384 | 38.7% | 32.1% | 35.9% | 41.4% | 100.0% | 0.0% |
| rank_5 | 7384 | 38.6% | 31.7% | 35.9% | 41.2% | 100.0% | 0.0% |
| rank_last | 7384 | 42.4% | 34.7% | 39.3% | 45.0% | 100.0% | 0.0% |
| no_support | 7384 | 6.9% | 5.5% | 6.4% | 7.9% | 0.0% | 0.0% |

## Paired closure deltas

- rank_1_minus_rank_3: 11.0 pp
- rank_1_minus_rank_5: 12.8 pp
- rank_1_minus_rank_8: 12.7 pp
- rank_1_minus_rank_last: 9.0 pp
- rank_1_minus_no_support: 44.5 pp

## Rank buckets

| condition | support rank bucket | n | closure | F1 |
|---|---:|---:|---:|---:|
| no_support | none | 7384 | 6.9% | 7.9% |
| rank_1 | 1 | 7384 | 51.4% | 54.0% |
| rank_3 | 2-3 | 7384 | 40.4% | 42.7% |
| rank_5 | 2-3 | 16 | 50.0% | 46.2% |
| rank_5 | 4-8 | 7368 | 38.5% | 41.2% |
| rank_8 | 2-3 | 16 | 50.0% | 46.2% |
| rank_8 | 4-8 | 7368 | 38.7% | 41.4% |
| rank_last | >8 | 7345 | 42.3% | 44.9% |
| rank_last | 2-3 | 16 | 50.0% | 46.2% |
| rank_last | 4-8 | 23 | 56.5% | 57.8% |

## Files

- `records.jsonl` — per question/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
