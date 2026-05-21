# Evidence-Path Runtime Telemetry v0.3 — guarded sidecar run loop

Status: passed
Date: 2026-05-21

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

This gate integrates the v0.2 security tests into the sidecar run loop. It is not a serving benchmark, speedup claim, answer-quality claim, attention attribution, or proof of evidence use.

## Artifacts

```txt
07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v03-guarded-sidecar.mjs
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/guard-report.json
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/preflight-security/
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/sidecar/
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/postflight-validation-report.json
bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/privacy-scan-report.json
```

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

The script blocks by default unless `--enable-sidecar` is supplied:

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

The privacy scan checks emitted events and sidecar reports for prompt/completion/token/value leakage patterns.

## Decision

```txt
Telemetry v0.3 passes: the sidecar runtime path now has explicit default-off gating, preflight security fixtures, served-model guard, postflight schema validation, and postflight privacy scan.
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
