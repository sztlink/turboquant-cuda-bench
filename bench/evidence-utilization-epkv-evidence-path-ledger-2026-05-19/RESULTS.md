# EPKV evidence-path ledger v1.4 — 2026-05-19

> Single offline audit ledger for the evidence-utilization chain.

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
bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/evidence-path-ledger.json
bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/summary.json
```

## Chain

```txt
v0.8 -> v0.9 -> v1.0 -> v1.1 -> v1.2 -> v1.3
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

## Invariants

```txt
{
  "all_receipts_present": true,
  "all_primary_artifacts_present": true,
  "all_boundaries_non_serving": true,
  "no_stage_claims_model_attention": true,
  "no_stage_claims_evidence_use_proof": true
}
```

## Decision

```txt
The offline evidence-path chain is now auditable from aggregate risk through replay-pack validation.
Next autonomous packet: ask Claude/reviewer to audit the chain, then refine any flagged issue or generate a concise public-safe technical note.
Hard stops remain closed for live hooks, serving mutation, and external publication.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
