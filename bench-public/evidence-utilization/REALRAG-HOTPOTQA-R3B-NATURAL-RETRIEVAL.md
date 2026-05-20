# RealRAG HotpotQA R3B — natural retrieval + BGE reranker

Status: offline benchmark complete  
Dataset: HotpotQA dev distractor  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/`

## One-line result

A strong local reranker removes most of the BM25-to-oracle gap in this natural-retrieval HotpotQA gate.

The controlled position effect from R1/R2/R3A remains real, but R3B changes the practical verdict: for this dataset/model, better ranking can move natural retrieval close to the oracle-first ceiling.

## Boundary

This is a diagnostic benchmark over HotpotQA distractor paragraphs. It measures answer-side closure and support rank/recall. It does not prove model attention, internal evidence use, production RAG value, or dominant production bottlenecks.

No EPKV hook, vLLM patch, service restart, or serving mutation was used.

## Matrix

```txt
selected_questions: 1991
records: 7964
errors: 0
candidate_k: 10
```

Conditions:

```txt
bm25_top10
bge_rerank_top10
oracle_first
no_support
```

Reranker:

```txt
BAAI/bge-reranker-v2-m3
scored_pairs: 19849
device: cuda
elapsed_s: 108.52
```

## Aggregate closure

| condition | closure | EM | F1 | support present | support rank mean |
|---|---:|---:|---:|---:|---:|
| `bm25_top10` | 45.8% | 38.0% | 48.8% | 100.0% | 1.34 |
| `bge_rerank_top10` | 50.1% | 41.2% | 52.6% | 100.0% | 1.05 |
| `oracle_first` | 51.2% | 43.2% | 54.2% | 100.0% | 1.00 |
| `no_support` | 6.8% | 5.5% | 7.6% | 0.0% | n/a |

## Pairwise closure deltas

| comparison | delta | 95% bootstrap CI |
|---|---:|---:|
| `bge_rerank_top10 - bm25_top10` | +4.4 pp | +2.7 to +6.1 pp |
| `oracle_first - bge_rerank_top10` | +1.1 pp | -0.6 to +2.7 pp |
| `oracle_first - bm25_top10` | +5.4 pp | +3.7 to +7.1 pp |
| `bm25_top10 - no_support` | +38.9 pp | +36.7 to +41.1 pp |
| `bge_rerank_top10 - no_support` | +43.3 pp | +41.0 to +45.5 pp |

## Support-rank movement

BM25 already found all support titles in top 10 for this selected HotpotQA slice, but rank still mattered:

| condition | support rank 1 count | support rank mean | closure |
|---|---:|---:|---:|
| `bm25_top10` | 1,635 / 1,991 | 1.34 | 45.8% |
| `bge_rerank_top10` | 1,924 / 1,991 | 1.05 | 50.1% |
| `oracle_first` | 1,991 / 1,991 | 1.00 | 51.2% |

BGE rank movement:

```txt
rank improved: 339 questions
rank unchanged: 1611
rank worsened: 41
mean support-rank improvement: 0.29 positions
closure delta when rank improved: +10.6 pp
closure delta when rank unchanged: +3.2 pp
closure delta when rank worsened: -2.4 pp
```

## Interpretation

R3B does not falsify the position-sensitivity result. It explains a practical mitigation path.

The important distinction is:

```txt
controlled placement: position effect is strong
natural retrieval + strong reranking: much of the gap can be closed
```

For this HotpotQA/Qwen2.5-7B local setup:

1. BM25 top-10 already contains support for all selected questions, but not always at the top.
2. BGE reranking moves support closer to rank 1.
3. Answer closure rises from 45.8% to 50.1%.
4. Oracle-first is 51.2%, so BGE reaches near-ceiling within the measured uncertainty.
5. No-support remains low at 6.8%.

Updated safe statement:

> The repo shows position/rank/recency sensitivity under controlled evidence placement, and R3B shows that a strong reranker can mitigate most of the natural BM25-to-oracle gap on this HotpotQA setup.

This weakens any broad claim that `retrieved != used` is an unsolved dominant production bottleneck. It strengthens the narrower diagnostic claim: support rank and placement are measurable, actionable variables.

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/ANALYSIS.md
bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/analysis.json
bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/bge-rerank-scores.json
bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/records.jsonl
```
