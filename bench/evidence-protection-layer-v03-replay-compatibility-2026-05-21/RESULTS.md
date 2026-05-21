# Evidence Protection Layer v0.3 — real-record replay compatibility

Status: passed
Date: 2026-05-21

## Boundary

```txt
regime: PROTECT
mode: real-record replay compatibility
model inference: no
serving mutation: no
vLLM patch: no
EPKV hook-on: no
runtime output-changing path: no
text fields: none
```

This gate applies a conservative compatibility policy to RealRAG-derived protected packs. It does not run prompts. It decides which structural transforms are allowed or blocked before any real rewrite is promoted.

## Policy

```txt
stable protected packing: allow if structural invariance passed
support_first_stable: block pending equivalence/adjudication
support_last_stable: block pending equivalence/adjudication
```

## Result

```txt
records: 7964
allowed decisions: 7964
blocked decisions: 15928
status: passed
```

Checks:

```txt
all records have at least one allowed path: true
all reorder transforms blocked: true
all allowed paths structural-pass: true
no text fields: true
```

## Coverage by condition

| condition | records | pass rate | allowed decisions | blocked decisions |
|---|---:|---:|---:|---:|
| `bm25_top10` | 1991 | 100.0% | 1991 | 3982 |
| `bge_rerank_top10` | 1991 | 100.0% | 1991 | 3982 |
| `oracle_first` | 1991 | 100.0% | 1991 | 3982 |
| `no_support` | 1991 | 100.0% | 1991 | 3982 |

## Decision

```txt
EPL v0.3 passes: real-record protected packs have one safe stable path, while reordering transforms remain blocked until equivalence/adjudication exists.
```

## Next gate

```txt
EPL v0.4: PROTECT index / boundary freeze — consolidate v0 to v0.3 and stop before runtime intervention.
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
