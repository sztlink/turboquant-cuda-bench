# Evidence-Path Runtime Telemetry v0.5 — read-only CI verifier

Status: passed
Date: 2026-05-21

## Boundary

```txt
source: committed telemetry artifacts and public docs
mode: read-only/no-endpoint CI verifier
endpoint required: no
serving mutation: no
model inference: no
vLLM patch: no
EPKV hook-on: no
output-changing path: no
```

This gate verifies committed Phase 1 telemetry artifacts without touching the 4090 endpoint.

## Command

```bash
node 07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v05-readonly-ci.mjs
```

## Artifacts

```txt
07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v05-readonly-ci.mjs
bench/evidence-path-runtime-telemetry-v05-readonly-ci-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v05-readonly-ci-2026-05-21/readonly-ci-report.json
```

## Checks

```txt
public docs checked: 5
machine reports checked: 6
event files schema-validated: 4
failed checks: 0
status: passed
```

Docs checked:

```txt
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md
```

Event files validated:

```txt
v0 replay events
v0.1 sidecar events
v0.3 guarded sidecar events
v0.4 nested guarded sidecar events
```

## Decision

```txt
Telemetry v0.5 passes: Phase 1 telemetry now has a no-endpoint/read-only verification path suitable for public artifact validation.
```

## Next gate

```txt
Telemetry v0.6: consolidate v0–v0.5 into a single public Phase 1 telemetry index and freeze the current non-intervention boundary.
```

Still out of scope:

```txt
live EPKV hook-on
output-changing intervention
attention attribution
serving speedup
answer-quality claims
```
