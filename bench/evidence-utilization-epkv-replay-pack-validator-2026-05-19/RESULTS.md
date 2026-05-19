# EPKV replay-pack validator v1.3 — 2026-05-19

> Validates v1.2 bridge replay-pack invariants. Boundary validator only; not model behavior.

## Boundary

```txt
replay pack only: yes
serving: no
runtime hook: no
model call: no
model attention: no
evidence-use proof: no
```

## Artifacts

```txt
07-scripts/evidence-utilization/validate-epkv-bridge-replay-pack-v13.mjs
bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/validation-report.json
```

## Validated pack

```txt
bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/bridge-replay-pack.jsonl
```

## Result

```txt
records: 13
valid: true
errors: 0
```

## Invariants

```txt
replay_schema == epkv.bridge_replay_pack.v1.2
action_state == bridge-ready
telemetry_event.schema == epkv.runtime.telemetry.v1
telemetry_event.mode == dry-run
telemetry_event.reason_code == hook_disabled
privacy declaration is safe
raw selected-position samples absent
serving/runtime_hook/model_call/model_attention/evidence_use_proof boundaries are false
all replay_checks are true
```

## Decision

```txt
The replay pack is valid and can be used as the next offline bridge input.
Next autonomous packet: build an end-to-end offline evidence-path ledger that indexes v0.8 -> v0.9 -> v1.0 -> v1.1 -> v1.2 -> v1.3.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
