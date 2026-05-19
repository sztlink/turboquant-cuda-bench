# EPKV audit-join v1.1 — 2026-05-19

> Joins target queue + materialized synthetic telemetry + validator report into a target-level action table.

## Boundary

```txt
planning only: yes
synthetic layout: yes
serving: no
runtime hook: no
model call: no
model attention: no
evidence-use proof: no
```

## Artifacts

```txt
bench/evidence-utilization-epkv-audit-join-2026-05-19/target-action-table.jsonl
bench/evidence-utilization-epkv-audit-join-2026-05-19/summary.json
```

## Result

```txt
targets: 16
by_state: {"bridge-ready":13,"needs-fixture-detail":3}
geometry_validator_passed: true
```

## Bridge-ready targets

| target | risk | distractor | rank | source_hit_rate | source_wrong_rate | dominant_region | state |
|---|---|---|---:|---:|---:|---|---|
| bridge-target-01 | decoy_capture_risk | stale_record | 16 | 0.028 | 0.938 | decoy | bridge-ready |
| bridge-target-02 | decoy_capture_risk | conflicting_correction | 16 | 0.028 | 0.778 | decoy | bridge-ready |
| bridge-target-03 | decoy_capture_risk | stale_record | 8 | 0.215 | 0.764 | decoy | bridge-ready |
| bridge-target-04 | decoy_capture_risk | stale_record | 4 | 0.236 | 0.708 | decoy | bridge-ready |
| bridge-target-05 | decoy_capture_risk | near_duplicate | 16 | 0.007 | 0.389 | decoy | bridge-ready |
| bridge-target-06 | decoy_capture_risk | phase_decoy | 8 | 0.375 | 0.625 | decoy | bridge-ready |
| bridge-target-07 | decoy_capture_risk | stale_record | rank_any | 0.361 | 0.602 | decoy | bridge-ready |
| bridge-target-08 | decoy_capture_risk | phase_decoy | 4 | 0.375 | 0.583 | decoy | bridge-ready |
| bridge-target-09 | decoy_capture_risk | generic_competitor | 16 | 0.232 | 0.429 | decoy | bridge-ready |
| bridge-target-10 | decoy_capture_risk | conflicting_correction | 8 | 0.500 | 0.438 | decoy | bridge-ready |
| bridge-target-11 | decoy_capture_risk | phase_decoy | 16 | 0.225 | 0.350 | decoy | bridge-ready |
| bridge-target-14 | decoy_capture_risk | phase_decoy | 2 | 0.438 | 0.375 | decoy | bridge-ready |
| bridge-target-16 | decoy_capture_risk | generic_competitor | rank_any | 0.520 | 0.347 | decoy | bridge-ready |

`rank_any` means the source aggregate had no canonical-rank key; it is not equivalent to a very large rank.

## Decision

```txt
The high-risk decoy target pack is bridge-ready as synthetic hook-off telemetry.
Next autonomous packet: build a bridge replay pack over the bridge-ready target families.
Keep all states as planning/audit states, not evidence-use claims.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
