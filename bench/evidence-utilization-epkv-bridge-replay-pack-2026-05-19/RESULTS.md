# EPKV bridge replay pack v1.2 — 2026-05-19

> Builds a replay-ready hook-off pack for the 13 bridge-ready target families.

## Boundary

```txt
replay pack only: yes
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
bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/bridge-replay-pack.jsonl
bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/manifest.json
bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/summary.json
```

## Result

```txt
records: 13
checks: {"records_have_schema_v1":true,"records_are_hook_off":true,"records_are_dry_run":true,"records_privacy_safe":true,"records_decoy_risk_geometry":true,"no_raw_selected_position_samples":true}
by_distractor: {"stale_record":4,"conflicting_correction":2,"near_duplicate":1,"phase_decoy":4,"generic_competitor":2}
by_rank: {"2":1,"4":2,"8":3,"16":5,"rank_any":2}
```

## Replay records

| replay | target | distractor | rank | source_hit_rate | source_wrong_rate | dominant_region |
|---|---|---|---:|---:|---:|---|
| replay-01 | bridge-target-01 | stale_record | 16 | 0.028 | 0.938 | decoy |
| replay-02 | bridge-target-02 | conflicting_correction | 16 | 0.028 | 0.778 | decoy |
| replay-03 | bridge-target-03 | stale_record | 8 | 0.215 | 0.764 | decoy |
| replay-04 | bridge-target-04 | stale_record | 4 | 0.236 | 0.708 | decoy |
| replay-05 | bridge-target-05 | near_duplicate | 16 | 0.007 | 0.389 | decoy |
| replay-06 | bridge-target-06 | phase_decoy | 8 | 0.375 | 0.625 | decoy |
| replay-07 | bridge-target-07 | stale_record | rank_any | 0.361 | 0.602 | decoy |
| replay-08 | bridge-target-08 | phase_decoy | 4 | 0.375 | 0.583 | decoy |
| replay-09 | bridge-target-09 | generic_competitor | 16 | 0.232 | 0.429 | decoy |
| replay-10 | bridge-target-10 | conflicting_correction | 8 | 0.500 | 0.438 | decoy |
| replay-11 | bridge-target-11 | phase_decoy | 16 | 0.225 | 0.350 | decoy |
| replay-12 | bridge-target-14 | phase_decoy | 2 | 0.438 | 0.375 | decoy |
| replay-13 | bridge-target-16 | generic_competitor | rank_any | 0.520 | 0.347 | decoy |

`rank_any` means the source aggregate had no canonical-rank key; it is not equivalent to a very large rank.

Replay IDs are dense over the surviving bridge-ready target subset; gaps in target IDs are the targets routed to fixture refinement.

## Decision

```txt
The 13 bridge-ready decoy-risk targets now have a compact replay pack.
Next autonomous packet: build a replay-pack validator and action summary gate.
Still no live runtime or serving mutation.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
