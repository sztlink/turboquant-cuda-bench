# Evidence-Path Runtime Telemetry v0.2 — fail-closed and privacy regression tests

Status: passed
Date: 2026-05-21

## Boundary

```txt
source: telemetry contract fixtures
mode: security regression tests
serving mutation: no
model inference: no
real-prompt hook-on: no
prompt text: not included
raw token ids: not included
completion text: not included
```

This gate tests the telemetry validator and sidecar contract around fail-closed behavior and privacy regressions. It does not run vLLM, does not change outputs, and does not test answer quality.

## Artifacts

```txt
07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v02-security-tests.mjs
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/valid-events.jsonl
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/invalid-events.jsonl
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/valid-report.json
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/invalid-report.json
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/summary.json
```

## Validation result

```txt
valid fixtures:   5 events, PASS, 0 errors, exit 0
invalid fixtures: 6 events, FAIL as expected, 7 errors, exit 1
status: passed
```

## Valid fixture coverage

The valid set covers:

```txt
dry-run sidecar event
fail-closed privacy_guard -> degraded-fallback
fail-closed cuda_error -> degraded-fallback
manual kill switch -> degraded-fallback
seq guard -> exact-only
```

## Invalid fixture coverage

The invalid set confirms rejection of:

```txt
prompt_text key leak
raw_token_ids key leak
completion_text key leak
cuda_error in dry-run mode (fail-open)
privacy_guard in compact-fallback mode (fail-open / reason mismatch)
privacy declaration violation
```

Observed invalid error codes:

```txt
privacy.forbidden_key
fail_closed.violation
mode_reason.mismatch
privacy.prompt_text
```

## Decision

```txt
Telemetry v0.2 passes: the validator rejects privacy leaks and fail-open failure modes while accepting degraded-fallback fail-closed events.
```

## Next gate

```txt
Telemetry v0.3: integrate the security checks into the v0.1 sidecar run loop as a preflight/postflight guard.
```

Still out of scope:

```txt
live EPKV hook-on
output-changing intervention
attention attribution
serving speedup
answer-quality claims
```
