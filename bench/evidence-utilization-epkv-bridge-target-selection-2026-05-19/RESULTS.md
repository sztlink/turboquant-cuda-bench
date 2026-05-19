# EPKV bridge target selection v0.9 — 2026-05-19

> Selects high-risk aggregate evidence-utilization families for the next hook-off geometry bridge pass.

## Boundary

```txt
planning only: yes
serving: no
runtime hook: no
model call: no
evidence-use proof: no
```

## Artifacts

```txt
bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/bridge-target-queue.json
bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/bridge-fixture-skeletons.jsonl
bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/summary.json
```

## Result

```txt
source audit records: 178
candidate records: 71
selected targets: 16
by_risk: {"decoy_capture_risk":13,"evidence_nonclosure_risk":3}
by_distractor: {"stale_record":4,"conflicting_correction":2,"near_duplicate":2,"phase_decoy":6,"generic_competitor":2}
```

## Top targets

| target | risk | distractor | rank | decoys_before | hit_rate | wrong_rate | priority |
|---|---|---|---:|---:|---:|---:|---:|
| bridge-target-01 | decoy_capture_risk | stale_record | 16 | 15 | 0.028 | 0.938 | 243.156 |
| bridge-target-02 | decoy_capture_risk | conflicting_correction | 16 | 15 | 0.028 | 0.778 | 230.378 |
| bridge-target-03 | decoy_capture_risk | stale_record | 8 | 7 | 0.215 | 0.764 | 221.767 |
| bridge-target-04 | decoy_capture_risk | stale_record | 4 | 3 | 0.236 | 0.708 | 216.489 |
| bridge-target-05 | decoy_capture_risk | near_duplicate | 16 | 15 | 0.007 | 0.389 | 200.1 |
| bridge-target-06 | decoy_capture_risk | phase_decoy | 8 | 7 | 0.375 | 0.625 | 199.041 |
| bridge-target-07 | decoy_capture_risk | stale_record | any | unknown | 0.361 | 0.602 | 195.833 |
| bridge-target-08 | decoy_capture_risk | phase_decoy | 4 | 3 | 0.375 | 0.583 | 194.708 |
| bridge-target-09 | decoy_capture_risk | generic_competitor | 16 | 15 | 0.232 | 0.429 | 187.914 |
| bridge-target-10 | decoy_capture_risk | conflicting_correction | 8 | 7 | 0.500 | 0.438 | 184.267 |
| bridge-target-11 | decoy_capture_risk | phase_decoy | 16 | 15 | 0.225 | 0.350 | 183.816 |
| bridge-target-12 | evidence_nonclosure_risk | near_duplicate | 8 | 7 | 0.368 | 0.278 | 176.767 |

## Decision

```txt
The next bridge work should start with stale_record/conflicting_correction/near_duplicate rank-16 and rank-8 families.
These are the strongest answer-side risk cases and should receive synthetic span/page/selected-geometry coverage before any live prompt work.
```

## Non-claims

- Not runtime telemetry.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
