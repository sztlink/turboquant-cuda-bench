# RealRAG HotpotQA R1 — public evidence-placement gate

Status: offline benchmark complete  
Dataset: HotpotQA dev distractor  
Model endpoint: local OpenAI-compatible vLLM endpoint, Qwen2.5-7B-Instruct root  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r1-full-2026-05-20/`

## One-line result

On public HotpotQA distractor questions, answer closure changed when gold supporting evidence was present but ordered differently.

This strengthens the operational `retrieved ≠ used` framing, but it does **not** prove model attention, internal evidence use, production RAG value, or runtime readiness.

## Why this run exists

A hostile external review correctly identified a weak point in the earlier evidence-utilization work: the strongest receipts were synthetic fixtures and offline replay packs. R1 crosses that boundary by using a public multi-hop QA dataset with gold supporting paragraphs.

The question tested here is narrower than “does the model use evidence?”:

> When the same HotpotQA question has gold supporting paragraphs present in context, does answer closure change when those paragraphs are moved relative to distractors?

## Conditions

Each question was run under five context-order conditions:

| condition | meaning |
|---|---|
| `oracle_first` | gold supporting paragraphs first, then distractors |
| `oracle_last` | distractors first, gold supporting paragraphs last |
| `bm25_retrieved` | lexical BM25 order over HotpotQA candidate paragraphs |
| `distractor_first` | top BM25 distractors first, then gold support |
| `no_support` | gold supporting paragraphs removed |

Closure is derived from normalized exact match, answer containment, or high F1 against the HotpotQA gold answer. It is an answer-side compatibility label, not evidence-use proof.

## Full-dev result

Full run:

```txt
selected_questions: 7384
records: 36920
errors: 0
```

Aggregate answer closure:

| condition | closure | EM | F1 | support present |
|---|---:|---:|---:|---:|
| `oracle_first` | 51.1% | 42.4% | 53.7% | 100.0% |
| `bm25_retrieved` | 46.2% | 38.4% | 49.0% | 100.0% |
| `oracle_last` | 42.7% | 35.3% | 45.4% | 100.0% |
| `distractor_first` | 38.5% | 31.6% | 41.2% | 100.0% |
| `no_support` | 6.8% | 5.4% | 7.8% | 0.0% |

Paired deltas, same question IDs:

| comparison | closure delta | 95% bootstrap CI |
|---|---:|---:|
| `oracle_first - oracle_last` | +8.4 pp | +7.4 to +9.4 pp |
| `oracle_first - bm25_retrieved` | +4.9 pp | +4.0 to +5.8 pp |
| `oracle_first - distractor_first` | +12.6 pp | +11.6 to +13.6 pp |
| `oracle_first - no_support` | +44.4 pp | +43.2 to +45.5 pp |
| `bm25_retrieved - distractor_first` | +7.7 pp | +6.7 to +8.7 pp |

## Replication of the sample run

The full run confirmed the earlier N=1,991 sample:

| comparison | N=1,991 | full dev |
|---|---:|---:|
| `oracle_first - oracle_last` | +8.1 pp | +8.4 pp |
| `oracle_first - distractor_first` | +12.9 pp | +12.6 pp |
| `no_support` closure | 6.5% | 6.8% |

## Interpretation

The result supports this operational claim:

> In HotpotQA distractor, answer closure is sensitive to evidence placement even when gold supporting evidence is present in the context.

It does not support these stronger claims:

- that selected positions are model attention;
- that the model “used” or “ignored” a span internally;
- that this is a production RAG bottleneck measurement;
- that Evidence-Paged KV improves answer quality;
- that a runtime hook is ready or beneficial.

## Why BM25 is close to oracle-first

BM25 placed supporting evidence at rank 1 for most questions:

```txt
bm25_retrieved support rank 1: 6005 / 7384
```

So the `oracle_first - bm25_retrieved` gap is smaller than the deliberately adversarial `oracle_first - distractor_first` gap. This motivates the next gate: a controlled support-rank curve.

## Follow-on artifacts

R2 forced the gold supporting evidence to fixed rank bands and found a position-sensitive but non-monotonic curve:

```txt
rank_1 > rank_last > rank_3 > rank_8 ≈ rank_5 >> no_support
```

See: [`REALRAG-HOTPOTQA-R2-RANKCURVE.md`](REALRAG-HOTPOTQA-R2-RANKCURVE.md)

Audit samples and next-gate plan:

- [`REALRAG-HOTPOTQA-SAMPLES-v1.md`](REALRAG-HOTPOTQA-SAMPLES-v1.md)
- [`REALRAG-R3-PLAN.md`](REALRAG-R3-PLAN.md)

## Source artifacts

Full run:

```txt
bench/evidence-utilization-realrag-hotpotqa-r1-full-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r1-full-2026-05-20/PAIRWISE.md
bench/evidence-utilization-realrag-hotpotqa-r1-full-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r1-full-2026-05-20/pairwise-closure-deltas.json
bench/evidence-utilization-realrag-hotpotqa-r1-full-2026-05-20/records.jsonl
```

Sample run:

```txt
bench/evidence-utilization-realrag-hotpotqa-r1-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r1-2026-05-20/PAIRWISE.md
```
