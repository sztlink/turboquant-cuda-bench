# Evidence-Path Runtime Telemetry v0.3 — guarded sidecar run loop

Status: Phase 1 telemetry guard gate complete
Primary artifact: `bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/`

## One-line result

The telemetry sidecar now has an explicit default-off run loop with preflight security fixtures, served-model guard, postflight schema validation, and postflight privacy scan.

## Boundary

```txt
source: guarded orchestration around v0.1 sidecar
mode: default-off telemetry sidecar with preflight/postflight guards
serving mutation: no
vLLM patch: no
EPKV hook-on: no
output-changing path: no
prompt text: not stored
raw token ids: not stored
completion text: not stored
selected/page positions: estimated geometry, not attention
```

This is not a serving benchmark, speedup claim, answer-quality claim, attention attribution, or proof of evidence use.

## Gates

| gate | result |
|---|---:|
| default-off flag supplied | pass |
| preflight v0.2 security fixtures | pass |
| served-model guard | pass |
| sidecar emit v0.1 | pass |
| postflight schema validation | pass |
| postflight privacy scan | pass |

## Default-off behavior

```txt
without --enable-sidecar: blocked_default_off, exit 2
with --enable-sidecar: guarded run may proceed
```

## Preflight security

```txt
valid fixtures:   5 events, PASS, 0 errors
invalid fixtures: 6 events, FAIL as expected, 7 errors
```

## Runtime sidecar

```txt
events: 8
closure smoke: 7/8
mean request wall: 167.6 ms
served models: local-vllm, qwen2.5-7b-tq
```

Closure smoke is not a quality claim.

## Postflight

```txt
schema validation: PASS, 8 events, 0 errors
privacy scan: PASS, 0 findings
```

## Relation to earlier telemetry gates

```txt
v0:   RealRAG replay -> telemetry schema -> validator pass
v0.1: synthetic local request -> sidecar telemetry -> validator pass
v0.2: sidecar/security fixtures -> fail-closed + privacy regression pass
v0.3: guarded sidecar run loop -> preflight + served-model guard + postflight pass
```

## Decision

```txt
Phase 1 telemetry can proceed as guarded sidecar infrastructure.
Live EPKV hook-on and output-changing intervention remain out of scope.
```

## Next gate

```txt
Telemetry v0.4: package the guarded sidecar as a reusable command with config file + CI-style single command.
```

Still out of scope:

```txt
live EPKV hook-on
output-changing intervention
attention attribution
serving speedup
answer-quality claims
```

## Source artifacts

```txt
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/RESULTS.md
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/guard-report.json
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/preflight-security/
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/sidecar/
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/postflight-validation-report.json
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/privacy-scan-report.json
```
