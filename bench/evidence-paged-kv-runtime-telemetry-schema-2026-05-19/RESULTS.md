# Evidence-Paged KV runtime telemetry schema validator — 2026-05-19

> L1 executable contract for `RUNTIME-INTEGRATION-DESIGN.md`. No serving mutation, no hook-on run, no real prompts.

## Boundary

```txt
mode: offline schema/privacy/process validator
serving mutation: no
real-prompt hook-on: no
compact fallback serving install: no
```

## Artifacts

```txt
07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs
bench/evidence-paged-kv-runtime-telemetry-schema-2026-05-19/fixtures/valid-events.jsonl
bench/evidence-paged-kv-runtime-telemetry-schema-2026-05-19/fixtures/invalid-events.jsonl
bench/evidence-paged-kv-runtime-telemetry-schema-2026-05-19/valid-report.json
bench/evidence-paged-kv-runtime-telemetry-schema-2026-05-19/invalid-report.json
```

## What the validator checks

- explicit `mode` per event;
- known `reason_code`;
- mode/reason consistency;
- fail-closed behavior for failure reason codes;
- required process geometry fields;
- separated timing fields:
  - `probe_candidates`
  - `detector`
  - `compact_merge`
  - `global_select`
  - `value`
  - `exact_fallback`
  - `total_hook_wall`
  - `total_hook_cuda`
- coverage fields and cap visibility;
- privacy contract:
  - `privacy.prompt_text === false`
  - `privacy.raw_token_ids === false`
  - `privacy.selected_positions_only === true`
- recursive forbidden-key scan for prompt text, raw token ids, answer text, completion text, and user data.

## Fixture result

```txt
valid-events.jsonl:   PASS — 4 events, 0 errors
invalid-events.jsonl: FAIL — 4 events, 15 errors, exit code 1
```

Valid fixture modes:

```txt
dry-run
compact-fallback
exact-only
degraded-fallback
```

Invalid fixture cases:

```txt
prompt leak / privacy declaration violation
missing reason_code
aggregate-only timing instead of separated timings
fail-open compact-fallback on cuda_error
```

## Decision

```txt
L1 executable schema contract exists.
Runtime integration remains design-only.
No compact fallback serving install.
Real-prompt hook-on remains paused.
```

## Next useful step

```txt
Hook-off bridge: map evidence spans / selected-position geometry into this telemetry schema without serving mutation.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
