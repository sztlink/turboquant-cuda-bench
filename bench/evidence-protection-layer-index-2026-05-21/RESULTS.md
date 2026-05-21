# Evidence Protection Layer index — v0 to v0.3

Status: consolidated
Date: 2026-05-21

## Boundary freeze

```txt
serving mutation: no
vLLM patch: no
EPKV hook-on: no
kernel/page-selection path: no
production output-changing path: no
attention attribution: no
evidence-use proof: no
serving speedup claim: no
answer-quality claim: no
```

## Consolidated gates

| Gate | Role | Result |
|---|---|---|
| EPL v0 | Span provenance | 7,964 records, 0 failures |
| EPL v0.1 | Structural packing invariance | 7,964 records, 0 failures |
| EPL v0.2 | Synthetic answer-equivalence | 5/6 equivalent, 1 blocked, 6/6 fail-closed |
| EPL v0.3 | Real-record replay compatibility | stable path allowed, reorders blocked |

## Decision

```txt
PROTECT membrane is established through EPL v0.3.
The line remains hook-off, non-kernel, and non-interventionist.
```

## Public index

```txt
bench-public/evidence-utilization/EVIDENCE-PROTECTION-LAYER-INDEX.md
```
