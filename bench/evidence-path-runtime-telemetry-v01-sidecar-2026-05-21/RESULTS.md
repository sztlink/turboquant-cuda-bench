# Evidence-Path Runtime Telemetry v0.1 — default-off sidecar emitter

Status: validated
Date: 2026-05-21

## Boundary

```txt
source: synthetic/local prompts
mode: default-off sidecar runtime emitter
serving mutation: no
vLLM patch: no
EPKV hook-on: no
output-changing path: no
prompt text: not stored
raw token ids: not stored
completion text: not stored
expected values: not stored
selected/page positions: estimated geometry, not attention
```

This is a Phase 1 telemetry artifact. It emits `epkv.runtime.telemetry.v1` sidecar events during real local requests to the already-running default 7B endpoint, without changing the request/output path.

It is not a serving benchmark and not evidence of model attention or evidence use.

## Artifacts

```txt
07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v01.mjs
bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/events.jsonl
bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/validation-report.json
```

## Validation

```txt
validator: 07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs
events: 8
valid: true
errors: 0
mode: dry-run
reason_code: dry_run_telemetry_only
```

## Runtime sidecar coverage

```txt
synthetic cases: 8
closure count: 7/8
mean request wall: 326.5 ms
served model ids checked before run: yes
output-changing path: false for all events
```

The one open synthetic case is the long-noise/canonical-late case. This is a smoke signal only; the run is too small and synthetic to support quality claims.

## What each event contains

```txt
schema/mode/reason_code
process geometry fields required by the runtime validator
zeroed hook timing fields, because no hook ran
coverage bucket/index/cap
privacy declaration
hashed endpoint/model/case identifiers
response hash and response length, not response text
estimated block/page geometry
closed_metric for synthetic smoke triage
```

## What it excludes

```txt
prompt text
raw token ids
completion text
expected value text
user data
attention weights
live hook timings
```

## Decision

```txt
Telemetry v0.1 passes: a default-off runtime sidecar can emit schema-valid telemetry during local synthetic requests without mutating serving or outputs.
```

## Next gate

```txt
Telemetry v0.2: add a fail-closed event path and privacy regression tests around the sidecar emitter.
```

Do not move to output-changing intervention until the telemetry sidecar has explicit kill-switch, fail-closed, privacy-regression, and synthetic replay coverage.
