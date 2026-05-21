# Evidence-Path Runtime Telemetry v0.2 — fail-closed and privacy regression tests

Status: Phase 1 telemetry security gate complete
Primary artifact: `bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/`

## One-line result

The runtime telemetry validator accepts fail-closed sidecar events and rejects privacy leaks or fail-open failure modes.

## Boundary

```txt
source: telemetry contract fixtures
mode: security regression tests
serving mutation: no
model inference: no
real-prompt hook-on: no
output-changing path: no
prompt text: not included
raw token ids: not included
completion text: not included
```

This is not a serving benchmark, speedup claim, answer-quality claim, attention attribution, or proof of evidence use.

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
cuda_error in dry-run mode
privacy_guard in compact-fallback mode
privacy declaration violation
```

Observed invalid error codes:

```txt
privacy.forbidden_key
fail_closed.violation
mode_reason.mismatch
privacy.prompt_text
```

## Relation to v0/v0.1

```txt
v0:   RealRAG replay -> telemetry schema -> validator pass
v0.1: synthetic local request -> sidecar telemetry -> validator pass
v0.2: sidecar/security fixtures -> fail-closed + privacy regression pass
```

## Decision

```txt
Phase 1 telemetry can continue: the contract now has replay coverage, runtime sidecar smoke coverage, and security regression coverage.
```

## Next gate

```txt
Telemetry v0.3: integrate preflight/postflight guards into the sidecar run loop.
```

Required v0.3 properties:

```txt
explicit default-off config
served-model guard
validator preflight on fail-closed fixtures
validator postflight on emitted events
privacy regression check in CI-style script
no output-changing path
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
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/RESULTS.md
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/valid-events.jsonl
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/invalid-events.jsonl
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/valid-report.json
bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/invalid-report.json
```
