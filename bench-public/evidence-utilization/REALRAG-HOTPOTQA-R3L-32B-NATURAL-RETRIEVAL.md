# RealRAG HotpotQA R3L — 32B natural retrieval scale check

Status: offline benchmark complete
Dataset: HotpotQA dev distractor
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/`

## One-line result

Scaling the same HotpotQA natural-retrieval gate from local Qwen2.5-7B to Qwen2.5-32B-AWQ raises answer closure substantially, but it does not remove the measured rank/placement ladder.

In this 32B run, support-present contexts are far above no-support, BGE reranking still improves BM25, and oracle-first remains above BGE.

## Boundary

This is a diagnostic benchmark over HotpotQA distractor paragraphs. It measures answer-side closure and support rank/recall. It does not prove model attention, internal evidence use, production RAG value, or dominant production bottlenecks.

No EPKV hook, vLLM patch, serving-speed claim, or production intervention is involved.

Operational note: the first 5,511 records were generated through the OpenAI-compatible vLLM server guarded with `--require-model-id qwen2.5-32b-awq` and `--fail-fast-errors`. After server instability, the remaining 2,453 records were completed with offline `vLLM.generate()` using the same Qwen2.5-32B-Instruct-AWQ model configuration. Treat this as a scale-check gate, not a serving benchmark.

## Matrix

```txt
selected_questions: 1991
records: 7964
errors: 0
candidate_k: 10
model: Qwen/Qwen2.5-32B-Instruct-AWQ
server records: 5511
offline vLLM.generate records: 2453
```

Conditions:

```txt
bm25_top10
bge_rerank_top10
oracle_first
no_support
```

## Aggregate closure

| condition | closure | EM | F1 | support present | support rank mean |
|---|---:|---:|---:|---:|---:|
| `bm25_top10` | 62.4% | 51.4% | 64.4% | 100.0% | 1.34 |
| `bge_rerank_top10` | 64.6% | 53.6% | 66.7% | 100.0% | 1.05 |
| `oracle_first` | 66.2% | 55.2% | 68.4% | 100.0% | 1.00 |
| `no_support` | 6.1% | 5.3% | 6.7% | 0.0% | n/a |

## Pairwise closure deltas

| comparison | delta | 95% bootstrap CI |
|---|---:|---:|
| `bge_rerank_top10 - bm25_top10` | +2.3 pp | +0.9 to +3.7 pp |
| `oracle_first - bge_rerank_top10` | +1.6 pp | +0.3 to +2.9 pp |
| `oracle_first - bm25_top10` | +3.9 pp | +2.3 to +5.4 pp |
| `bm25_top10 - no_support` | +56.3 pp | +54.0 to +58.4 pp |
| `bge_rerank_top10 - no_support` | +58.5 pp | +56.3 to +60.6 pp |

## Support-rank movement

The retrieval geometry is the same as R3B because R3L reuses the same HotpotQA slice and BGE rerank scores:

| condition | support rank 1 count | support rank mean | closure |
|---|---:|---:|---:|
| `bm25_top10` | 1,635 / 1,991 | 1.34 | 62.4% |
| `bge_rerank_top10` | 1,924 / 1,991 | 1.05 | 64.6% |
| `oracle_first` | 1,991 / 1,991 | 1.00 | 66.2% |

BGE rank movement:

```txt
rank improved: 339 questions
rank unchanged: 1611
rank worsened: 41
mean support-rank improvement: 0.29 positions
closure delta when rank improved: +6.8 pp
closure delta when rank unchanged: +1.4 pp
closure delta when rank worsened: +0.0 pp
```

## Relation to R3B 7B

R3B, with local Qwen2.5-7B, found:

```txt
bm25_top10:        45.8%
bge_rerank_top10: 50.1%
oracle_first:      51.2%
no_support:         6.8%
```

R3L, with Qwen2.5-32B-AWQ, finds:

```txt
bm25_top10:        62.4%
bge_rerank_top10: 64.6%
oracle_first:      66.2%
no_support:         6.1%
```

Scale improves closure sharply in support-present settings, while no-support stays near the same floor. The 32B run narrows but does not erase the natural retrieval ladder:

```txt
BM25 < BGE < oracle_first >> no_support
```

## Interpretation

R3L strengthens the safe, narrow claim:

> Support rank and placement remain measurable, actionable variables even at larger local model scale.

It weakens a different overclaim:

> Bigger model alone does not make evidence placement irrelevant.

This remains an answer-closure result, not evidence-use proof.

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/analysis.json
bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/records.jsonl
```
