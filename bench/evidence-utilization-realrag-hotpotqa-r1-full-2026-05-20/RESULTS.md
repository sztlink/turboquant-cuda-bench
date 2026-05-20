# RealRAG HotpotQA R1 — evidence placement and answer closure

Status: **done**
Started: 2026-05-20T02:54:25.523Z
Finished: 2026-05-20T04:42:55.705Z

## Boundary

- Public HotpotQA distractor benchmark, not a synthetic in-house fixture.
- Measures answer closure over gold answers (EM/contains/F1), not proof of model evidence use.
- No EPKV runtime hook, no vLLM patch/restart/deploy, no attention claim.

## Conditions

- `oracle_first`: gold supporting paragraphs first, then distractors.
- `oracle_last`: distractors first, gold supporting paragraphs last.
- `bm25_retrieved`: lexical BM25 order over HotpotQA candidate paragraphs.
- `distractor_first`: top BM25 distractors first, then gold support.
- `no_support`: gold supporting paragraphs removed.

## Aggregate

| condition | n | closure | EM | contains | F1 | support present | error rate |
|---|---:|---:|---:|---:|---:|---:|---:|
| oracle_first | 7384 | 51.1% | 42.4% | 47.5% | 53.7% | 100.0% | 0.0% |
| oracle_last | 7384 | 42.7% | 35.3% | 39.7% | 45.4% | 100.0% | 0.0% |
| distractor_first | 7384 | 38.5% | 31.6% | 35.7% | 41.2% | 100.0% | 0.0% |
| bm25_retrieved | 7384 | 46.2% | 38.4% | 43.1% | 49.0% | 100.0% | 0.0% |
| no_support | 7384 | 6.8% | 5.4% | 6.2% | 7.8% | 0.0% | 0.0% |

## Paired closure deltas

- oracle_first_minus_oracle_last: 8.4 pp
- oracle_first_minus_no_support: 44.4 pp
- oracle_first_minus_bm25_retrieved: 4.9 pp

## Rank buckets

| condition | support rank bucket | n | closure | F1 |
|---|---:|---:|---:|---:|
| bm25_retrieved | >8 | 17 | 29.4% | 33.3% |
| bm25_retrieved | 1 | 6005 | 49.2% | 52.2% |
| bm25_retrieved | 2-3 | 1105 | 34.2% | 36.0% |
| bm25_retrieved | 4-8 | 257 | 29.2% | 31.5% |
| distractor_first | 2-3 | 16 | 50.0% | 46.2% |
| distractor_first | 4-8 | 7368 | 38.5% | 41.2% |
| no_support | none | 7384 | 6.8% | 7.8% |
| oracle_first | 1 | 7384 | 51.1% | 53.7% |
| oracle_last | >8 | 7345 | 42.6% | 45.3% |
| oracle_last | 2-3 | 16 | 50.0% | 46.2% |
| oracle_last | 4-8 | 23 | 60.9% | 62.2% |

## Files

- `records.jsonl` — per question/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
