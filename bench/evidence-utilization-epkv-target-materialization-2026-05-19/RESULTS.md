# EPKV target materialization v1.0 — 2026-05-19

> Converts v0.9 bridge target skeletons into concrete synthetic span/page records and schema-valid hook-off telemetry events.

## Boundary

```txt
synthetic layout: yes
hook-off: yes
serving: no
runtime hook: no
model call: no
model attention: no
evidence-use proof: no
```

## Artifacts

```txt
bench/evidence-utilization-epkv-target-materialization-2026-05-19/materialized-records.jsonl
bench/evidence-utilization-epkv-target-materialization-2026-05-19/events.jsonl
bench/evidence-utilization-epkv-target-materialization-2026-05-19/summary.json
```

## Result

```txt
records: 16
events: 16
by_dominant_region: {"decoy":16}
by_audit_projection: {"red_decoy_geometry_risk":16}
by_distractor: {"stale_record":4,"conflicting_correction":2,"near_duplicate":2,"phase_decoy":6,"generic_competitor":2}
```

## Validator

```txt
events.jsonl: PASS
validator errors: 0
```

## Decision

```txt
The v0.9 target queue now has materialized synthetic hook-off events.
These events are ready for schema validation and downstream audit-join tooling.
They remain synthetic planning/bridge artifacts, not runtime behavior.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
