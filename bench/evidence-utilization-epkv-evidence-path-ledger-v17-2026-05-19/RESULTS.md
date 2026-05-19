# EPKV evidence-path ledger v1.7 — 2026-05-19

> Extended offline audit ledger including fixture refinement and refined replay coverage.

## Boundary

```txt
ledger only: yes
serving: no
runtime hook live: no
model call: no
model attention: no
evidence-use proof: no
```

## Artifacts

```txt
bench/evidence-utilization-epkv-evidence-path-ledger-v17-2026-05-19/evidence-path-ledger-v17.json
bench/evidence-utilization-epkv-evidence-path-ledger-v17-2026-05-19/summary.json
```

## Chain

```txt
v0.8 -> v0.9 -> v1.0 -> v1.1 -> v1.2 -> v1.3 -> v1.4 -> v1.5 -> v1.6
```

## Coverage

```txt
{
  "aggregate_records": 178,
  "selected_targets": 16,
  "materialized_events_v10": 16,
  "bridge_ready_targets": 13,
  "needs_fixture_detail_targets": 3,
  "replay_records_v12": 13,
  "refined_events_v15": 9,
  "refined_replay_records_v16": 9,
  "total_replay_records": 22
}
```

## Stages

| stage | name | commit | primary artifact |
|---|---|---|---|
| v0.8 | aggregate audit taxonomy | 0c9d461 | `bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/aggregate-audit-records.jsonl` |
| v0.9 | bridge target selection | f1527a7 | `bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/bridge-target-queue.json` |
| v1.0 | target materialization | 4270e00 | `bench/evidence-utilization-epkv-target-materialization-2026-05-19/events.jsonl` |
| v1.1 | audit join action table | 61b11eb | `bench/evidence-utilization-epkv-audit-join-2026-05-19/target-action-table.jsonl` |
| v1.2 | bridge replay pack | 8a56615 | `bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/bridge-replay-pack.jsonl` |
| v1.3 | replay pack validator | f8dc52f | `bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/validation-report.json` |
| v1.4 | evidence path ledger | cd2350f | `bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/evidence-path-ledger.json` |
| v1.5 | fixture refinement | c891233 | `bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/events.jsonl` |
| v1.6 | refined replay pack | 936294e | `bench/evidence-utilization-epkv-refined-replay-pack-2026-05-19/refined-replay-pack.jsonl` |

## Invariants

```txt
{
  "all_receipts_present": true,
  "all_primary_artifacts_present": true,
  "all_boundaries_non_serving": true,
  "no_stage_claims_model_attention": true,
  "no_stage_claims_evidence_use_proof": true,
  "combined_replay_coverage_is_22": true
}
```

## Decision

```txt
The offline evidence-path layer now has 22 validated replay records: 13 decoy-risk + 9 contrastive refinement records.
This is the current autonomous milestone for the hook-off evidence-utilization layer.
Hard stops remain closed for live serving and external publication.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
