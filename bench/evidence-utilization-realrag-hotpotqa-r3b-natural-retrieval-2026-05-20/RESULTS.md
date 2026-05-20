# RealRAG HotpotQA R3B — natural retrieval + reranker gate

Status: **done**
Started: 2026-05-20T16:08:36.900Z
Finished: 2026-05-20T16:32:29.022Z

## Boundary

- natural retrieval / reranker diagnostic gate.
- answer-side closure, not proof of internal evidence use.
- oracle_first remains ceiling; no_support remains floor.
- no vLLM mutation, no EPKV hook, no production-RAG claim.

## Aggregate

| condition | n | closure | EM | contains | F1 | support present | support recall | support rank mean | error rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bge_rerank_top10 | 1991 | 50.1% | 41.2% | 46.7% | 52.6% | 100.0% | 100.0% | 1.05 | 0.0% |
| bm25_top10 | 1991 | 45.8% | 38.0% | 42.9% | 48.8% | 100.0% | 100.0% | 1.34 | 0.0% |
| no_support | 1991 | 6.8% | 5.5% | 6.5% | 7.6% | 0.0% | 0.0% | n/a | 0.0% |
| oracle_first | 1991 | 51.2% | 43.2% | 47.7% | 54.2% | 100.0% | 100.0% | 1.00 | 0.0% |

## Files

- `records.jsonl` — per question/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
