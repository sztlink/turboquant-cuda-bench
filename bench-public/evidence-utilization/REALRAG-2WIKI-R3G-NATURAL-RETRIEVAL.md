# RealRAG 2Wiki R3G — natural retrieval + BGE reranker

Status: offline benchmark complete  
Dataset: 2WikiMultiHopQA dev  
Primary artifact: `bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/`

## One-line result

2Wiki does **not** reproduce the HotpotQA R3B pattern.

BGE reranking improves support rank almost to oracle-first, but answer closure does not materially improve over BM25, and oracle-first is slightly lower than both natural retrieval conditions. This suggests dataset/prompt/schema sensitivity and weakens broad generalization from HotpotQA.

## Boundary

This run reuses the R3B natural-retrieval harness on 2WikiMultiHopQA. It measures answer-side closure and support rank/recall. It does not prove internal evidence use, production RAG value, or a dominant bottleneck.

No vLLM patch, restart, EPKV hook, or serving mutation was used.

## Dataset

Source: official 2WikiMultiHopQA `data.zip` from the Alab-NII repository README.

```txt
dev.json records: 12,576
data.zip sha256: e8e57c0aafc4a26d41131e320ebb5afb6f2aca86b8a6e6611b08f52033cb7d04
dev.json sha256: 48b9bdc69654dc580fda5f935a48b88cb89f11887587310af60d406c8d0111a6
```

## Matrix

```txt
selected_questions: 2000
records: 8000
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
scored_pairs: 20000
device: cuda
elapsed_s: 105.86
```

## Aggregate closure

| condition | closure | EM | F1 | support present | support rank mean |
|---|---:|---:|---:|---:|---:|
| `bm25_top10` | 33.3% | 26.9% | 31.8% | 100.0% | 1.25 |
| `bge_rerank_top10` | 33.8% | 27.2% | 32.0% | 100.0% | 1.01 |
| `oracle_first` | 31.9% | 26.4% | 30.6% | 100.0% | 1.00 |
| `no_support` | 3.9% | 2.9% | 4.4% | 0.0% | n/a |

## Pairwise closure deltas

| comparison | delta | 95% bootstrap CI |
|---|---:|---:|
| `bge_rerank_top10 - bm25_top10` | +0.4 pp | -1.4 to +2.3 pp |
| `oracle_first - bge_rerank_top10` | -1.8 pp | -3.6 to +0.1 pp |
| `oracle_first - bm25_top10` | -1.4 pp | -3.3 to +0.5 pp |
| `bm25_top10 - no_support` | +29.4 pp | +27.4 to +31.6 pp |
| `bge_rerank_top10 - no_support` | +29.8 pp | +27.8 to +31.9 pp |
| `oracle_first - no_support` | +28.1 pp | +26.0 to +30.1 pp |

## Support-rank movement

BGE strongly improves support rank:

| condition | support rank 1 count | support rank mean | closure |
|---|---:|---:|---:|
| `bm25_top10` | 1,697 / 2,000 | 1.25 | 33.3% |
| `bge_rerank_top10` | 1,987 / 2,000 | 1.01 | 33.8% |
| `oracle_first` | 2,000 / 2,000 | 1.00 | 31.9% |

But that rank improvement does not translate into a clear closure improvement.

## Interpretation

HotpotQA R3B showed:

```txt
BM25 < BGE ≈ oracle >> no_support
```

2Wiki R3G shows instead:

```txt
BM25 ≈ BGE ≈ oracle >> no_support
```

More precisely, BGE and oracle both place support at the front, but closure stays around 32–34%.

This weakens any broad statement that the HotpotQA result generalizes directly across multi-hop datasets. It also suggests the current prompt/answer-closure setup may interact differently with 2Wiki's answer style, evidence structure, or dataset construction.

## Updated safe statement

> HotpotQA shows a measurable rank/placement effect that BGE reranking largely mitigates. 2Wiki confirms that support-present conditions beat no-support, but it does not reproduce a clear BM25→BGE→oracle closure ladder. Generalization remains dataset-sensitive.

## Source artifacts

```txt
bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/ANALYSIS.md
bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/summary.json
bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/analysis.json
bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/bge-rerank-scores.json
bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/records.jsonl
```
