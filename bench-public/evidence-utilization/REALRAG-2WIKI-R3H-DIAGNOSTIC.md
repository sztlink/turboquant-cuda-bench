# RealRAG 2Wiki R3H — diagnostic analysis

Status: offline diagnostic complete  
Source: 2Wiki R3G natural retrieval  
Primary artifact: `bench/evidence-utilization-realrag-2wiki-r3h-diagnostic-2026-05-20/`

## One-line result

R3H explains why 2Wiki did not reproduce the HotpotQA R3B reranker ladder: the failure is not support absence. It is type/prompt/schema sensitivity, especially comparison and bridge-comparison behavior where oracle-first can underperform natural ordering.

## Boundary

This is an offline diagnostic over R3G records. It uses answer-side closure and prompt-side supporting-fact sentence placement. It does not adjudicate semantic correctness or prove internal evidence use.

## Aggregate sentence placement

| condition | closure | SF sentence recall | SF sentence rank mean | support rank mean |
|---|---:|---:|---:|---:|
| `bm25_top10` | 33.3% | 100.0% | 2.67 | 1.25 |
| `bge_rerank_top10` | 33.8% | 100.0% | 1.65 | 1.01 |
| `oracle_first` | 31.9% | 100.0% | 1.93 | 1.00 |
| `no_support` | 3.9% | 0.0% | n/a | n/a |

BGE improves sentence placement strongly, but closure does not materially improve.

## Bucket counts

| bucket | count |
|---|---:|
| `all_support_conditions_fail` | 1,059 |
| `natural_success_oracle_fail` | 302 |
| `bge_only_success` | 190 |
| `bm25_only_success` | 181 |
| `oracle_only_success` | 85 |
| `no_support_success_leakage` | 78 |

The key bucket is `natural_success_oracle_fail`: natural context closes some answers that oracle-first fails. That is the direct reason the HotpotQA ladder fails on 2Wiki.

## By 2Wiki question type

| type | BM25 | BGE | oracle | no-support | readout |
|---|---:|---:|---:|---:|---|
| `comparison` | 41.7% | 50.5% | 47.6% | 8.4% | BGE helps; close to Hotpot-like. |
| `bridge_comparison` | 36.7% | 33.4% | 30.4% | 7.5% | Oracle-first hurts. |
| `compositional` | 33.8% | 31.8% | 30.3% | 0.5% | Natural ordering slightly better. |
| `inference` | 7.5% | 6.6% | 8.4% | 0.9% | Low closure across all conditions. |

2Wiki is not uniform. Comparison questions partially match the HotpotQA pattern; compositional/bridge-comparison do not.

## By answer class

| answer class | BM25 | BGE | oracle | no-support |
|---|---:|---:|---:|---:|
| `short_entity` | 42.3% | 45.4% | 41.7% | 5.7% |
| `long_answer` | 39.3% | 38.0% | 35.6% | 6.1% |
| `single_token_entity` | 29.8% | 29.6% | 29.3% | 1.3% |
| `mixed_numeric_text` | 33.1% | 28.8% | 30.9% | 2.9% |
| `numeric_only` | 12.5% | 16.7% | 12.5% | 0.0% |
| `yes_no` | 0.5% | 0.0% | 0.0% | 0.0% |

The yes/no result is especially diagnostic: the current prompt/closure setup is poorly calibrated for 2Wiki yes/no cases.

## Interpretation

R3H indicates that R3G's negative generalization is not because support was missing:

```txt
BM25/BGE/oracle SF sentence recall: 100%
```

Instead:

1. BGE improves sentence rank, but rank improvement alone does not close answers.
2. Oracle-first can remove useful comparison context or alter presentation in ways that hurt 2Wiki.
3. 2Wiki question types behave differently; only comparison questions show a BGE gain.
4. Yes/no and inference questions need a different prompt/evaluation treatment.

## Updated safe statement

> 2Wiki confirms that support-present contexts beat no-support, but it shows that HotpotQA's reranker/oracle ladder is not a dataset-general law. The effect is mediated by question type, answer style, and prompt/schema fit.

## Recommended next step

Do not claim cross-dataset generalization yet. The next non-human step should be a **2Wiki prompt/schema ablation**:

```txt
R3I:
- direct_short_answer baseline
- type-aware prompt for comparison / yes-no / compositional
- support-only vs support+natural-distractors
- optional evidence-triple prompt using 2Wiki evidences
```

## Source artifacts

```txt
bench/evidence-utilization-realrag-2wiki-r3h-diagnostic-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-2wiki-r3h-diagnostic-2026-05-20/summary.json
bench/evidence-utilization-realrag-2wiki-r3h-diagnostic-2026-05-20/bucket-samples.json
```
