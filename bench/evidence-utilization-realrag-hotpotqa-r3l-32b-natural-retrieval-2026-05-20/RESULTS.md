# RealRAG HotpotQA R3L — 32B natural retrieval scale check

Status: **done**
Started: 2026-05-21T09:06:52.028Z
Finished: 2026-05-21T10:14:38.000Z

## Boundary

- 32B scale check over the same HotpotQA natural-retrieval gate as R3B.
- Measures answer-side closure and support rank/recall; does not prove internal evidence use.
- Mixed generation transport: OpenAI-compatible server for 5,511 records, offline `vLLM.generate` for 2,453 records after server instability.
- No EPKV hook, no serving-speed claim, no production-RAG claim.

## Aggregate

| condition | n | closure | EM | contains | F1 | support present | support recall | support rank mean | error rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| bm25_top10 | 1991 | 62.4% | 51.4% | 58.5% | 64.4% | 100.0% | 100.0% | 1.34 | 0.0% |
| bge_rerank_top10 | 1991 | 64.6% | 53.6% | 60.8% | 66.7% | 100.0% | 100.0% | 1.05 | 0.0% |
| oracle_first | 1991 | 66.2% | 55.2% | 62.2% | 68.4% | 100.0% | 100.0% | 1.00 | 0.0% |
| no_support | 1991 | 6.1% | 5.3% | 5.8% | 6.7% | 0.0% | 0.0% | n/a | 0.0% |

## Pairwise closure deltas

| comparison | delta | 95% bootstrap CI |
|---|---:|---:|
| bge_rerank_top10 - bm25_top10 | +2.3 pp | +0.9 pp to +3.7 pp |
| oracle_first - bge_rerank_top10 | +1.6 pp | +0.3 pp to +2.9 pp |
| oracle_first - bm25_top10 | +3.9 pp | +2.3 pp to +5.4 pp |
| bm25_top10 - no_support | +56.3 pp | +54.0 pp to +58.4 pp |
| bge_rerank_top10 - no_support | +58.5 pp | +56.3 pp to +60.6 pp |
| oracle_first - no_support | +60.1 pp | +58.0 pp to +62.3 pp |

## Files

- `records.jsonl` — per question/condition records.
- `summary.json` — machine-readable aggregate.
- `analysis.json` — pairwise deltas and rank movement.
- Offline completion outputs were merged into `records.jsonl`; staging prompt/output packs are intentionally not promoted.
