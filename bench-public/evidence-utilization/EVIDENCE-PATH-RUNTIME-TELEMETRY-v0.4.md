# Evidence-Path Runtime Telemetry v0.4 — CI-style guarded command

Status: Phase 1 telemetry packaging gate complete
Primary artifact: `bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/`

## One-line result

The guarded telemetry sidecar can now run as a single config-driven command with CI-style checks, while preserving the default-off/no-output-changing contract.

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

This is not a serving benchmark, speedup claim, answer-quality claim, attention attribution, or proof of evidence use.

## Command

```bash
node 07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v04-ci.mjs \
  --config bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/config.json
```

## Config contract

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

## Relation to earlier telemetry gates

```txt
v0:   RealRAG replay -> telemetry schema -> validator pass
v0.1: synthetic local request -> sidecar telemetry -> validator pass
v0.2: sidecar/security fixtures -> fail-closed + privacy regression pass
v0.3: guarded sidecar run loop -> preflight + served-model guard + postflight pass
v0.4: config-driven CI-style command -> guarded run pass
```

## Decision

```txt
Phase 1 telemetry can now be invoked as a reusable guarded command.
Live EPKV hook-on and output-changing intervention remain out of scope.
```

## Next gate

```txt
Telemetry v0.5: no-endpoint/read-only docs validation mode plus endpoint mode for local lab validation.
```

## Source artifacts

```txt
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/RESULTS.md
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/config.json
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/ci-report.json
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/guarded-run/
```
