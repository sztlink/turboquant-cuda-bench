# Evidence-path ledger: retrieved ≠ used

> A public-safe technical note for the offline EPKV evidence-utilization chain.
>
> The point is auditability, not speed. The chain below does not claim attention, answer improvement, serving readiness, or proof of evidence use.

## Canonical milestone

The sealed offline milestone is:

```txt
bench-public/evidence-utilization/OFFLINE-MILESTONE-v1.9.md
```

## What exists now

The offline bridge now has a reproducible evidence-path ledger:

```txt
aggregate answer-side risk
-> bridge target selection
-> synthetic span/page materialization
-> target action table
-> compact replay pack
-> replay-pack validator
-> evidence-path ledger
```

The executable ledger is here:

```txt
bench/evidence-utilization-epkv-evidence-path-ledger-v19-2026-05-19/evidence-path-ledger-v19.json
```

A local validator-first view is here:

```txt
bench-public/evidence-utilization/EVIDENCE-PATH-LEDGER-VIEW.html
```

Receipt:

```txt
bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/RESULTS.md
```

## Why this layer exists

Retrieval hit-rate and final answer correctness leave a missing middle:

```txt
Was the evidence path compatible with the retrieved canonical evidence,
or did the instrumented path drift toward decoys / stale records / unrelated regions?
```

The current layer answers only that middle audit question. It does not answer why the model generated a particular answer.

## Chain receipts

| Stage | Receipt | Meaning |
|---|---|---|
| v0.8 aggregate audit taxonomy | `bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/RESULTS.md` | labels existing aggregate fixture groups as green/yellow/red answer-side risk |
| v0.9 bridge target selection | `bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/RESULTS.md` | selects 16 high-risk families for geometry bridge coverage |
| v1.0 target materialization | `bench/evidence-utilization-epkv-target-materialization-2026-05-19/RESULTS.md` | materializes 16 synthetic hook-off telemetry events |
| v1.1 audit join | `bench/evidence-utilization-epkv-audit-join-2026-05-19/RESULTS.md` | classifies 13 targets as bridge-ready and 3 as needing fixture detail |
| v1.2 replay pack | `bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/RESULTS.md` | compacts 13 bridge-ready targets into privacy-safe replay records |
| v1.3 replay validator | `bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/RESULTS.md` | validates replay-pack invariants: 13 records, 0 errors |
| v1.4 evidence-path ledger | `bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/RESULTS.md` | hashes and indexes the chain with boundary invariants |

## Current numerical state

```txt
v0.8 aggregate groups: 178
v0.8 red groups: 58
v0.9 selected targets: 16
v1.0 materialized hook-off events: 16
v1.1 bridge-ready targets: 13
v1.1 needs-fixture-detail targets: 3
v1.2 replay-pack records: 13
v1.3 replay-pack validator errors: 0
v1.4 chain invariants: all true
```

## Invariants

The v1.4 ledger checks:

```txt
all_receipts_present: true
all_primary_artifacts_present: true
all_boundaries_non_serving: true
no_stage_claims_model_attention: true
no_stage_claims_evidence_use_proof: true
```

## Safe interpretation

Safe:

```txt
The offline chain can track evidence-path compatibility states across synthetic bridge artifacts.
The replay pack is privacy-safe and hook-off.
The ledger makes the artifacts reproducible and auditable.
```

Unsafe:

```txt
The model attended to this evidence.
The model used the retrieved evidence.
EPKV improves answer quality.
EPKV speeds up serving.
This is deployment-ready.
```

## Boundary

```txt
serving: no
live runtime hook: no
model call: no
model attention: no
evidence-use proof: no
external publication: no
```

## Next offline work

Two safe next packets remain:

```txt
1. refine the 3 needs-fixture-detail targets into contrastive canonical/decoy/neither layouts
2. run reviewer/Claude audit over v1.1-v1.4 and patch any framing gaps
```

Neither requires live serving mutation.
