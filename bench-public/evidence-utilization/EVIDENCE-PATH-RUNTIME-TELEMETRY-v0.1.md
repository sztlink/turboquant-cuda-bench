# Evidence-Path Runtime Telemetry v0.1 — default-off sidecar emitter

Status: Phase 1 telemetry gate complete
Primary artifact: `bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/`

## One-line result

A default-off runtime sidecar emitted valid `epkv.runtime.telemetry.v1` events during local synthetic requests without patching vLLM, enabling EPKV, changing outputs, or storing prompt/completion text.

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

This is not a serving benchmark, speedup claim, answer-quality claim, attention attribution, or proof of internal evidence use.

## Validation

```txt
events: 8
validator: 07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs
schema: epkv.runtime.telemetry.v1
valid: true
errors: 0
mode: dry-run
reason_code: dry_run_telemetry_only
```

Runtime sidecar smoke:

```txt
synthetic cases: 8
closure count: 7/8
mean request wall: 326.5 ms
served model ids checked before run: yes
output-changing path: false for all events
```

The closure count is smoke telemetry only. The run is too small and synthetic to support model-quality claims.

## Event shape

Each event includes:

```txt
schema/mode/reason_code
runtime-validator process geometry fields
zeroed hook timing fields, because no hook ran
coverage bucket/index/cap
privacy declaration
hashed endpoint/model/case identifiers
response hash and response length, not response text
estimated block/page geometry
closed_metric for synthetic smoke triage
```

It deliberately excludes:

```txt
prompt text
raw token ids
completion text
expected value text
user data
attention weights
live hook timings
```

## Relation to v0

v0 was replay-only:

```txt
RealRAG record -> evidence/path geometry -> epkv.runtime.telemetry.v1 -> validator pass
```

v0.1 adds runtime sidecar emission:

```txt
synthetic local request -> sidecar geometry event -> epkv.runtime.telemetry.v1 -> validator pass
```

Neither v0 nor v0.1 changes model outputs.

## Decision

```txt
Phase 1 can continue as default-off runtime telemetry.
The sidecar emitter path is schema-valid and privacy-preserving in this smoke gate.
Live EPKV hook-on and output-changing intervention remain out of scope.
```

## Next gate

```txt
Telemetry v0.2: fail-closed + privacy-regression tests for the sidecar emitter.
```

Required before any broader telemetry claim:

```txt
explicit kill-switch/default-off config
fail-closed event path
privacy regression fixtures
schema validator in the run loop
synthetic replay coverage
no output-changing code path
```

## Source artifacts

```txt
bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/RESULTS.md
bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/validation-report.json
bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/events.jsonl
```
