# RealRAG HotpotQA R3A — prompt/citation ablation

Status: offline benchmark complete  
Dataset: HotpotQA dev distractor  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r3a-promptvariants-2026-05-20/`

## One-line result

Citation and reasoning prompts did **not** eliminate the evidence-position effect.

Across all prompt variants, `rank_1` remained much better than `rank_5`, and `rank_last` partially recovered. Reasoning improved some support-present conditions but also increased no-support closure. Citation prompting reduced overall closure and citation-hit rates fell as support moved away from rank 1.

## Boundary

This benchmark measures answer-side closure over HotpotQA gold answers. It does not prove model attention, internal evidence use, production RAG value, or runtime readiness.

`citation_hit` is a title-string overlap between the model's cited evidence line and HotpotQA support titles. It is a surface citation check, not proof that the model internally used the cited span.

No EPKV hook, vLLM patch, service restart, or serving mutation was used.

## Matrix

```txt
selected_questions: 1991
records: 23892
errors: 0
```

Conditions:

```txt
rank_1
rank_5
rank_last
no_support
```

Prompt variants:

```txt
direct_short_answer
cite_then_answer
reason_then_answer
```

## Aggregate closure

| variant | rank_1 | rank_5 | rank_last | no_support |
|---|---:|---:|---:|---:|
| `direct_short_answer` | 51.5% | 38.4% | 42.7% | 6.5% |
| `cite_then_answer` | 48.0% | 37.2% | 37.0% | 6.7% |
| `reason_then_answer` | 52.3% | 39.3% | 43.8% | 8.6% |

## Pairwise position deltas

| variant | `rank_1 - rank_5` | 95% CI | `rank_1 - rank_last` | 95% CI | `rank_1 - no_support` | 95% CI |
|---|---:|---:|---:|---:|---:|---:|
| `direct_short_answer` | +13.1 pp | +11.0 to +15.1 | +8.7 pp | +6.8 to +10.7 | +45.0 pp | +42.7 to +47.3 |
| `cite_then_answer` | +10.8 pp | +8.5 to +13.1 | +11.0 pp | +8.8 to +13.3 | +41.3 pp | +39.0 to +43.5 |
| `reason_then_answer` | +13.1 pp | +10.8 to +15.3 | +8.5 pp | +6.3 to +10.7 | +43.7 pp | +41.4 to +46.0 |

## Citation surface behavior

For `cite_then_answer`, citation-hit rates were:

| condition | citation hit |
|---|---:|
| `rank_1` | 43.9% |
| `rank_5` | 32.9% |
| `rank_last` | 28.2% |
| `no_support` | 0.0% |

This suggests that forcing a citation line does not solve the placement problem. Surface citation quality also drops as the supporting evidence moves away from the start.

## Interpretation

R3A strengthens the R2 result:

```txt
position effect survives prompt/citation ablation
```

The best short statement is:

> Simple citation or reasoning prompts do not remove HotpotQA evidence-position sensitivity for this local Qwen2.5-7B vLLM setup.

More specifically:

1. `rank_1` remains best or tied-best across variants.
2. `rank_5` remains substantially worse across variants.
3. `rank_last` partially recovers under direct and reasoning prompts, consistent with the R2 recency observation.
4. `cite_then_answer` lowers overall closure and weakens the recency recovery.
5. `reason_then_answer` improves some support-present closure but also increases no-support closure, suggesting more guessing/leakage risk.

## Relation to R1/R2

R1 showed that public HotpotQA answer closure changes under evidence placement.

R2 showed the rank curve is position-sensitive, not monotonic:

```txt
rank_1 > rank_last > rank_3 > rank_8 ≈ rank_5 >> no_support
```

R3A adds:

```txt
citation/reasoning prompts do not erase this position effect
```

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r3a-promptvariants-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r3a-promptvariants-2026-05-20/PAIRWISE.md
bench/evidence-utilization-realrag-hotpotqa-r3a-promptvariants-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r3a-promptvariants-2026-05-20/pairwise-closure-deltas.json
bench/evidence-utilization-realrag-hotpotqa-r3a-promptvariants-2026-05-20/records.jsonl
```
