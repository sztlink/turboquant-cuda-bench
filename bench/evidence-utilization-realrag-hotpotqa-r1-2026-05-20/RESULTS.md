# RealRAG HotpotQA R1 — evidence placement and answer closure

Status: **done**
Started: 2026-05-20T02:23:06.285Z
Finished: 2026-05-20T02:52:11.396Z

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
| oracle_first | 1991 | 50.9% | 42.8% | 47.5% | 54.0% | 100.0% | 0.0% |
| oracle_last | 1991 | 42.7% | 35.2% | 39.9% | 45.6% | 100.0% | 0.0% |
| bm25_retrieved | 1991 | 45.5% | 38.1% | 42.7% | 48.8% | 100.0% | 0.0% |
| distractor_first | 1991 | 38.0% | 31.8% | 35.9% | 41.0% | 100.0% | 0.0% |
| no_support | 1991 | 6.5% | 5.2% | 6.1% | 7.4% | 0.0% | 0.0% |

## Paired closure deltas

- oracle_first_minus_oracle_last: 8.1 pp
- oracle_first_minus_no_support: 44.3 pp
- oracle_first_minus_bm25_retrieved: 5.4 pp

## Rank buckets

| condition | support rank bucket | n | closure | F1 |
|---|---:|---:|---:|---:|
| bm25_retrieved | >8 | 3 | 0.0% | 0.0% |
| bm25_retrieved | 1 | 1635 | 48.0% | 51.7% |
| bm25_retrieved | 2-3 | 278 | 37.1% | 38.8% |
| bm25_retrieved | 4-8 | 75 | 24.0% | 24.8% |
| distractor_first | 2-3 | 6 | 50.0% | 36.1% |
| distractor_first | 4-8 | 1985 | 38.0% | 41.1% |
| no_support | none | 1991 | 6.5% | 7.4% |
| oracle_first | 1 | 1991 | 50.9% | 54.0% |
| oracle_last | >8 | 1977 | 42.6% | 45.5% |
| oracle_last | 2-3 | 6 | 66.7% | 52.8% |
| oracle_last | 4-8 | 8 | 50.0% | 53.8% |

## Files

- `records.jsonl` — per question/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
