# Evidence-Path Runtime Telemetry — Phase 1 index

Status: Phase 1 telemetry membrane established
Updated: 2026-05-21

## Boundary freeze

Phase 1 is telemetry-only.

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

This line exists to build the measurement membrane between Phase 0 answer-closure records and any future runtime intervention.

## Gate ladder

| Gate | Role | Result | Public doc |
|---|---|---|---|
| v0 | Replay bridge from RealRAG R3L to runtime telemetry schema | 7,964 events, validator pass | [v0](EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md) |
| v0.1 | Synthetic runtime sidecar emitter | 8 events, validator pass | [v0.1](EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md) |
| v0.2 | Fail-closed and privacy regression tests | valid fixtures pass, invalid fixtures fail as expected | [v0.2](EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md) |
| v0.3 | Guarded sidecar run loop | default-off + preflight + served-model + postflight + privacy pass | [v0.3](EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md) |
| v0.4 | Config-driven CI-style command | guarded run pass | [v0.4](EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md) |
| v0.5 | Read-only/no-endpoint verifier | committed artifacts pass | [v0.5](EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.5.md) |

## What is now established

```txt
RealRAG answer-closure records can become schema-valid telemetry replay events.
A default-off runtime sidecar can emit the same schema on synthetic local requests.
Privacy and fail-closed regressions are executable fixtures.
The sidecar can be run behind preflight/postflight guards.
The guarded sidecar can be invoked as a config-driven command.
Committed artifacts can be checked without an endpoint.
```

## What remains deliberately unbuilt

```txt
live EPKV hook-on
KV mutation
attention bias
runtime evidence protection
output-changing router
production serving integration
```

## Promotion rule

Do not promote from telemetry to intervention until all are true:

```txt
human/independent adjudication exists for answer-side claims
telemetry sidecar has stable no-endpoint and endpoint-mode checks
privacy/fail-closed fixtures remain green
there is a specific intervention hypothesis with a falsifiable target
rollback/default-off behavior is explicit
```

## Next possible line

If continuing within telemetry:

```txt
Telemetry v0.6+ can add packaging/readme polish or CI wiring.
```

If moving toward intervention later, first candidate is still:

```txt
Evidence Protection Layer
```

But that should begin as placement/packing/protection of evidence spans, not attention bias or KV mutation.

## Canonical commands

Endpoint/lab mode:

```bash
node 07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v04-ci.mjs \
  --config bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/config.json
```

Read-only/no-endpoint mode:

```bash
node 07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v05-readonly-ci.mjs
```
