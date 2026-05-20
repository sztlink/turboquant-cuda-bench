# RealRAG HotpotQA R3C — metric/supporting-facts audit pack

Status: offline audit pack complete  
Source run: R3B natural retrieval + BGE reranker  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/`

## One-line result

R3C validates prompt-side supporting-fact sentence presence for the R3B conditions and produces a stratified audit pack for metric review. It does **not** add LLM-as-judge yet.

The main finding is that R3B's support-present conditions really did include HotpotQA supporting-fact sentences in the prompt, while remaining failures often look like generation, alias, ambiguity, or metric issues rather than retrieval absence.

## Boundary

This is an offline audit pack, not an adjudicated judge result.

- `audit_label` is intentionally `unreviewed`.
- Supporting-fact sentence presence validates prompt inclusion, not internal model use.
- Closure remains answer-side EM/contains/F1-derived.
- No runtime hook, no vLLM mutation, no production-RAG claim.

## Aggregate sentence-support audit

| condition | closure | EM | F1 | supporting-fact sentence recall | SF sentence rank mean | closure-risk breakdown |
|---|---:|---:|---:|---:|---:|---|
| `bm25_top10` | 45.8% | 38.0% | 48.8% | 100.0% | 3.17 | exact 757; contains 97; F1 57 |
| `bge_rerank_top10` | 50.1% | 41.2% | 52.6% | 100.0% | 1.77 | exact 821; contains 109; F1 68 |
| `oracle_first` | 51.2% | 43.2% | 54.2% | 100.0% | 1.54 | exact 860; contains 90; F1 69 |
| `no_support` | 6.8% | 5.5% | 7.6% | 0.0% | n/a | no-support closure 136 |

Why sentence rank differs from paragraph rank: HotpotQA supporting facts are title + sentence index. R3C computes global sentence position in the prompt, not only paragraph position.

## Stratified audit buckets

| bucket | count | sample count |
|---|---:|---:|
| `bm25_fail_bge_success` | 198 | 30 |
| `bm25_success_bge_fail` | 111 | 30 |
| `bm25_fail_bge_fail_oracle_success` | 86 | 30 |
| `all_support_conditions_fail` | 796 | 30 |
| `oracle_success_bge_fail` | 145 | 30 |
| `bge_success_oracle_fail` | 124 | 30 |
| `no_support_success_leakage` | 136 | 30 |

Each sample row includes:

```txt
question
gold answer
supporting-fact title/sentence pairs
BM25 prediction + metrics + context titles + SF sentence rank
BGE prediction + metrics + context titles + SF sentence rank
oracle prediction + metrics + context titles + SF sentence rank
no-support prediction + metrics
metric-risk heuristic
audit_label: unreviewed
```

## What R3C reveals

### 1. R3B was not support-absence-driven

For `bm25_top10`, `bge_rerank_top10`, and `oracle_first`, supporting-fact sentence recall is 100% on the selected R3B slice.

So the remaining gap after BGE is not because the supporting facts were missing from the prompt. It is answer closure under different ordering/presentation.

### 2. BGE improves sentence placement, not just paragraph placement

```txt
BM25 SF sentence rank mean: 3.17
BGE SF sentence rank mean:  1.77
Oracle SF sentence mean:    1.54
```

This supports the R3B interpretation: BGE helps by moving gold support closer to the start, and that accounts for much of the closure gain.

### 3. Metric audit is now necessary

The sample preview shows likely metric-sensitive cases:

- alias / entity equivalence: `George Orwell` vs `Eric Arthur Blair`.
- partial answer variants: `Edward II` vs `King Edward II` / `Edward II of England`.
- answer granularity issues: `museum` vs `Atatürk Museum Mansion`.
- no-support closure/leakage cases that may reflect prior knowledge, dataset leakage, or metric false positives.

This means R3C strengthens the need for adjudication before further broad claims.

## Updated verdict after R3C

R3C does not overturn R3B. It sharpens it:

```txt
supporting facts are present in the prompt for BM25/BGE/oracle;
BGE improves support sentence placement and closure;
remaining errors need judge/manual audit before being interpreted as evidence-use failures.
```

Safe statement:

> R3C turns the next question from “was the evidence present?” into “when present, was the answer semantically correct, partially correct, ambiguous, or a metric artifact?”

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/samples.json
bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/samples.jsonl
```
