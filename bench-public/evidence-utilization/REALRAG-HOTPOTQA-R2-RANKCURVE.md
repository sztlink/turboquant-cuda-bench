# RealRAG HotpotQA R2 — forced support-rank curve

Status: offline benchmark complete  
Dataset: HotpotQA dev distractor  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/`

## One-line result

On public HotpotQA distractor questions, answer closure shows a strong position effect, but not a simple monotonic rank curve.

Observed closure order:

```txt
rank_1 > rank_last > rank_3 > rank_8 ≈ rank_5 >> no_support
```

This strengthens the evidence-placement claim from R1 while falsifying the stronger/simple claim that closure always decreases monotonically as evidence rank increases.

## Boundary

This benchmark measures answer-side closure over HotpotQA gold answers. It does not prove model attention, internal evidence use, production RAG value, or runtime readiness.

No EPKV hook, vLLM patch, service restart, or serving mutation was used.

## Conditions

| condition | meaning |
|---|---|
| `rank_1` | gold supporting paragraphs inserted at rank 1 |
| `rank_3` | gold supporting paragraphs inserted after 2 BM25 distractors |
| `rank_5` | gold supporting paragraphs inserted after 4 BM25 distractors |
| `rank_8` | gold supporting paragraphs inserted after 7 BM25 distractors |
| `rank_last` | gold supporting paragraphs placed last |
| `no_support` | gold supporting paragraphs removed |

## Full result

```txt
selected_questions: 7384
records: 44304
errors: 0
```

| condition | closure | EM | F1 | support present |
|---|---:|---:|---:|---:|
| `rank_1` | 51.4% | 42.3% | 54.0% | 100.0% |
| `rank_last` | 42.4% | 34.7% | 45.0% | 100.0% |
| `rank_3` | 40.4% | 33.1% | 42.7% | 100.0% |
| `rank_8` | 38.7% | 32.1% | 41.4% | 100.0% |
| `rank_5` | 38.6% | 31.7% | 41.2% | 100.0% |
| `no_support` | 6.9% | 5.5% | 7.9% | 0.0% |

## Paired deltas

| comparison | closure delta | 95% bootstrap CI |
|---|---:|---:|
| `rank_1 - rank_3` | +11.0 pp | +10.0 to +12.0 pp |
| `rank_1 - rank_5` | +12.8 pp | +11.8 to +13.9 pp |
| `rank_1 - rank_8` | +12.7 pp | +11.6 to +13.7 pp |
| `rank_1 - rank_last` | +9.0 pp | +8.0 to +10.1 pp |
| `rank_1 - no_support` | +44.5 pp | +43.4 to +45.7 pp |
| `rank_last - rank_5` | +3.8 pp | +3.0 to +4.6 pp |
| `rank_last - rank_8` | +3.7 pp | +2.9 to +4.4 pp |

## Interpretation

R2 supports a position-sensitive, not purely rank-monotonic, reading:

1. Gold evidence at the beginning is best.
2. Gold evidence buried after a few distractors is much worse.
3. Gold evidence at the end partially recovers, consistent with a recency effect.
4. Removing gold support collapses closure to a low baseline.

The practical diagnostic is therefore not just “lower rank is worse.” It is closer to:

> Answer closure depends on where supporting evidence sits in the context field: beginning helps, middle burial hurts, and end placement partially recovers.

## Relation to R1

R1 showed that changing evidence placement changes closure:

```txt
oracle_first:     51.1%
oracle_last:      42.7%
distractor_first: 38.5%
no_support:        6.8%
```

R2 explains why the R1 `oracle_last` condition was not as bad as `distractor_first`: last-position evidence benefits from recency, while mid-context burial is worse.

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/PAIRWISE.md
bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/pairwise-closure-deltas.json
bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/records.jsonl
```
