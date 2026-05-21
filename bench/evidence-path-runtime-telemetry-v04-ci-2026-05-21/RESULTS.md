# Evidence-Path Runtime Telemetry v0.4 — CI-style guarded command

Status: passed
Date: 2026-05-21

## Boundary

```txt
source: config-driven orchestration around v0.3 guarded sidecar
mode: CI-style single command
serving mutation: no
vLLM patch: no
EPKV hook-on: no
output-changing path: no
prompt text: not stored
raw token ids: not stored
completion text: not stored
```

This gate packages the guarded telemetry sidecar as a reusable command with a config file. It remains default-off and non-interventionist.

## Command

```bash
node 07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v04-ci.mjs \
  --config bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/config.json
```

## Artifacts

```txt
07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v04-ci.mjs
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/config.json
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/ci-report.json
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/guarded-run/
```

## Config contract

Required config properties:

```txt
enableSidecar: true
allowOutputChangingPath: false
endpoint: OpenAI chat completions URL
model: required
requireModelId: required
```

## Checks

```txt
config.enableSidecar: ok
config.allowOutputChangingPath: ok
config.endpoint: ok
config.model: ok
config.requireModelId: ok
v03.exit: ok
v03.guard_report: ok
output_changing_path: ok
```

Nested v0.3 gates:

```txt
default_off: ok
preflight_security_v02: ok
served_model_guard: ok
sidecar_emit_v01: ok
postflight_schema_validation: ok
privacy_scan: ok
```

## Runtime smoke

```txt
events: 8
closure smoke: 7/8
mean request wall: 158.4 ms
preflight invalid fixture errors: 7 as expected
```

Closure smoke is not a quality claim.

## Decision

```txt
Telemetry v0.4 passes: the guarded sidecar can be run as a single config-driven command with CI-style checks.
```

## Next gate

```txt
Telemetry v0.5: add a minimal CI contract file that can be run in read-only/no-endpoint mode for docs validation, plus endpoint mode for local lab validation.
```

Still out of scope:

```txt
live EPKV hook-on
output-changing intervention
attention attribution
serving speedup
answer-quality claims
```
