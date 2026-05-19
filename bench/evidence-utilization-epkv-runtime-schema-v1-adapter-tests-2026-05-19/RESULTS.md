# EPKV runtime schema-v1 adapter source-level tests — 2026-05-19

> Offline source-level test for default-off schema adapter. No serving mutation.

## Boundary

```txt
live vLLM service patch: no
serving mutation: no
real prompt: no
model inference: no
mode: synthetic packed KV dry-run
```

## Artifacts

```txt
07-scripts/evidence-utilization/test-epkv-runtime-schema-v1-adapter.py
bench/evidence-utilization-epkv-runtime-schema-v1-adapter-tests-2026-05-19/legacy-default-events.jsonl
bench/evidence-utilization-epkv-runtime-schema-v1-adapter-tests-2026-05-19/schema-v1-events.jsonl
bench/evidence-utilization-epkv-runtime-schema-v1-adapter-tests-2026-05-19/summary.json
bench/evidence-utilization-epkv-runtime-schema-v1-adapter-tests-2026-05-19/schema-validation-report.json
```

## Checks

```txt
legacy_has_no_schema_field: true
legacy_has_hook_field: true
legacy_mode_is_dry_run_legacy: true
legacy_has_selected_positions: true
schema_has_schema_v1: true
schema_mode_dry_run: true
schema_reason_dry_run: true
schema_has_selection_geometry: true
schema_privacy_contract: true
```

## Validator

```txt
schema-v1-events.jsonl: PASS
validator errors: 0
```

## Decision

```txt
Runtime schema-v1 adapter preserves legacy default behavior and emits valid schema-v1 telemetry only when VLLM_EPKV_RUNTIME_SCHEMA_V1=1.
The source adapter now has an executable regression test.
Still do not deploy into live vLLM.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not answer-quality evidence.
- Not evidence-utilization improvement evidence.
