# Evidence Protection Layer v0.1 — structural packing invariance

Status: passed
Date: 2026-05-21

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

This gate verifies that deterministic packing transforms preserve structural evidence provenance from EPL v0.

It is not an answer-quality claim, attention claim, evidence-use proof, or runtime intervention.

## Artifacts

```txt
07-scripts/evidence-utilization/build-evidence-protection-layer-v01-packing-invariance.mjs
bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/packing-invariance.jsonl
bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/summary.json
```

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

## Decision

```txt
EPL v0.1 passes: protected packing transforms can reorder context while preserving paragraph multiset, support span hashes, and no-support emptiness.
```

## Next gate

```txt
EPL v0.2: synthetic answer-equivalence harness — compare original vs protected rewrite on synthetic prompts and require same output or fail closed.
```

Still out of scope:

```txt
runtime hook
kernel/page-selection path
production output-changing intervention
attention/evidence-use proof
serving speedup
answer-quality claims
```
