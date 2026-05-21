# Evidence-Path Runtime Telemetry index — v0 to v0.5

Status: consolidated
Date: 2026-05-21

## Boundary freeze

```txt
serving mutation: no
vLLM patch: no
EPKV hook-on: no
output-changing path: no
attention attribution: no
evidence-use proof: no
serving speedup claim: no
answer-quality claim: no
```

## Consolidated gates

| Gate | Role | Result |
|---|---|---|
| v0 | Replay bridge from RealRAG R3L to runtime telemetry schema | 7,964 events, validator pass |
| v0.1 | Synthetic runtime sidecar emitter | 8 events, validator pass |
| v0.2 | Fail-closed and privacy regression tests | valid fixtures pass, invalid fixtures fail as expected |
| v0.3 | Guarded sidecar run loop | default-off + preflight + served-model + postflight + privacy pass |
| v0.4 | Config-driven CI-style command | guarded run pass |
| v0.5 | Read-only/no-endpoint verifier | committed artifacts pass |

## Decision

```txt
Phase 1 telemetry membrane is established through v0.5.
The line remains telemetry-only and non-interventionist.
```

## Public index

```txt
bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md
```
