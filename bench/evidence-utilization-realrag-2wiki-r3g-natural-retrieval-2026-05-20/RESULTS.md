# RealRAG HotpotQA R3B — natural retrieval + reranker gate

Status: **done**
Started: 2026-05-20T19:14:31.680Z
Finished: 2026-05-20T19:33:20.133Z

## Boundary

- natural retrieval / reranker diagnostic gate.
- answer-side closure, not proof of internal evidence use.
- oracle_first remains ceiling; no_support remains floor.
- no vLLM mutation, no EPKV hook, no production-RAG claim.

## Aggregate

| condition | n | closure | EM | contains | F1 | support present | support recall | support rank mean | error rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bge_rerank_top10 | 2000 | 33.8% | 27.2% | 33.7% | 32.0% | 100.0% | 100.0% | 1.01 | 0.0% |
| bm25_top10 | 2000 | 33.3% | 26.9% | 33.1% | 31.8% | 100.0% | 100.0% | 1.25 | 0.0% |
| no_support | 2000 | 3.9% | 2.9% | 3.8% | 4.4% | 0.0% | 0.0% | n/a | 0.0% |
| oracle_first | 2000 | 31.9% | 26.4% | 31.8% | 30.6% | 100.0% | 100.0% | 1.00 | 0.0% |

## Files

- `records.jsonl` — per question/condition record.
- `summary.json` — machine-readable aggregate.
- `run.log` — run log.
