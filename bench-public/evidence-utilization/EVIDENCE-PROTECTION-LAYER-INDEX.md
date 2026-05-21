# Evidence Protection Layer — PROTECT index

Status: PROTECT membrane established
Updated: 2026-05-21

## Boundary freeze

PROTECT is still non-intervention.

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

The purpose of PROTECT is to test whether evidence spans can survive packing, serialization, and rewrite policies before any runtime mutation exists.

## Gate ladder

| Gate | Role | Result | Public doc |
|---|---|---|---|
| EPL v0 | Span provenance | 7,964 records, 0 failures | [v0](EVIDENCE-PROTECTION-LAYER-v0-SPAN-PROVENANCE.md) |
| EPL v0.1 | Structural packing invariance | 7,964 records, 0 failures across stable/support-first/support-last transforms | [v0.1](EVIDENCE-PROTECTION-LAYER-v0.1-PACKING-INVARIANCE.md) |
| EPL v0.2 | Synthetic answer-equivalence | 5/6 equivalent, 1 blocked, 6/6 fail-closed | [v0.2](EVIDENCE-PROTECTION-LAYER-v0.2-ANSWER-EQUIVALENCE.md) |
| EPL v0.3 | Real-record replay compatibility | stable path allowed, reorders blocked pending equivalence/adjudication | [v0.3](EVIDENCE-PROTECTION-LAYER-v0.3-REPLAY-COMPATIBILITY.md) |

## What is established

```txt
support spans can be represented as hashed protected provenance
packing transforms can preserve structural invariants
protected rewrites can be evaluated by equivalence-or-fail-closed policy
real-record replay can conservatively allow stable packs and block unproven reorders
```

## What is deliberately not established

```txt
that protected rewrites improve answers
that support-first reorder should be used on real records
that the model internally uses protected evidence
that runtime hooks are safe
that kernels should be changed
```

## Promotion rule

Do not promote PROTECT to INTERVENE until all are true:

```txt
real-record equivalence/adjudication exists for rewrite policies
privacy/fail-closed checks remain green
telemetry sidecar remains stable
rollback/default-off behavior is explicit
there is a falsifiable intervention target
```

## Next possible gates

If staying in PROTECT:

```txt
EPL v0.5: no-endpoint verifier over PROTECT artifacts
EPL v0.6: public PROTECT card / docs polish
```

If moving to INTERVENE later:

```txt
dry-run runtime contact with original output preserved
```

Kernel remains last:

```txt
kernel = substrate, not storyline
```
