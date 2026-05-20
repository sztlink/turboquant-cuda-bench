# RealRAG HotpotQA R1 — evidence placement and answer closure

Status: **done**
Started: 2026-05-20T02:21:39.702Z
Finished: 2026-05-20T02:21:50.925Z

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
| oracle_first | 8 | 50.0% | 50.0% | 50.0% | 50.0% | 100.0% | 0.0% |
| oracle_last | 8 | 37.5% | 37.5% | 37.5% | 37.5% | 100.0% | 0.0% |
| bm25_retrieved | 8 | 12.5% | 12.5% | 12.5% | 18.8% | 100.0% | 0.0% |
| distractor_first | 8 | 25.0% | 25.0% | 25.0% | 33.3% | 100.0% | 0.0% |
| no_support | 8 | 12.5% | 12.5% | 12.5% | 17.5% | 0.0% | 0.0% |

## Paired closure deltas

- oracle_first_minus_oracle_last: 12.5 pp
- oracle_first_minus_no_support: 37.5 pp
- oracle_first_minus_bm25_retrieved: 37.5 pp

## Rank buckets

| condition | support rank bucket | n | closure | F1 |
|---|---:|---:|---:|---:|
| bm25_retrieved | 1 | 6 | 16.7% | 25.0% |
| bm25_retrieved | 2-3 | 1 | 0.0% | 0.0% |
| bm25_retrieved | 4-8 | 1 | 0.0% | 0.0% |
| distractor_first | 4-8 | 8 | 25.0% | 33.3% |
| no_support | none | 8 | 12.5% | 17.5% |
| oracle_first | 1 | 8 | 50.0% | 50.0% |
| oracle_last | >8 | 8 | 37.5% | 37.5% |

## Files

- `records.jsonl` — per question/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
