# Evidence Protection Layer v0.1 — structural packing invariance

Status: PROTECT gate complete
Primary artifact: `bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/`

## One-line result

Deterministic protected-packing transforms preserve paragraph multisets, support span hashes, and no-support emptiness across all 7,964 RealRAG R3L-derived provenance records.

## Boundary

```txt
regime: PROTECT
mode: hook-off/offline structural packing invariance
serving mutation: no
model inference: no
vLLM patch: no
EPKV hook-on: no
output-changing runtime path: no
text fields: none
```

This is not an answer-quality claim, attention claim, evidence-use proof, serving benchmark, or runtime intervention.

## Result

```txt
records: 7964
transforms: stable, support_first_stable, support_last_stable
failures: 0
status: passed
```

Checks:

```txt
paragraph multiset preserved: true
support span hashes preserved: true
no-support emptiness preserved: true
ranges valid: true
no text fields: true
```

## Coverage by condition

| condition | records | pass rate | support present | protected spans | support-first rank mean | support-last rank mean |
|---|---:|---:|---:|---:|---:|---:|
| `bm25_top10` | 1991 | 100.0% | 100.0% | 3982 | 1.00 | 8.97 |
| `bge_rerank_top10` | 1991 | 100.0% | 100.0% | 3982 | 1.00 | 8.97 |
| `oracle_first` | 1991 | 100.0% | 100.0% | 3982 | 1.00 | 8.97 |
| `no_support` | 1991 | 100.0% | 0.0% | 0 | n/a | n/a |

## Why this matters

EPL v0 proved that support spans can be marked and tracked as hashed provenance.

EPL v0.1 adds that deterministic packing transforms can move support spans while preserving:

```txt
same paragraph multiset
same support span hashes
same no-support empty state
valid estimated ranges
no text leakage
```

This is the minimum structural condition before any synthetic answer-equivalence test.

## Decision

```txt
EPL v0.1 passes: PROTECT can proceed from span provenance to structural packing transforms without touching runtime internals.
```

## Next gate

```txt
EPL v0.2: synthetic answer-equivalence harness.
```

Required v0.2 properties:

```txt
original synthetic prompt vs protected rewrite
same local model endpoint
same output required or fail closed
no production mutation
no answer-quality claim beyond equivalence smoke
privacy report with no prompt/completion text in artifacts
```

## Source artifacts

```txt
bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/RESULTS.md
bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/summary.json
bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/packing-invariance.jsonl
```
