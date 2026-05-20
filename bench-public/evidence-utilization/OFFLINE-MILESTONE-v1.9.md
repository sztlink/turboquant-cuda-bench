# EPKV / retrieved ≠ used — offline milestone v1.9

> Cristalização local do marco offline.  
> **Cristaliza o marco, não a hipótese.**

## Status

```txt
state: offline milestone sealed
ledger: v1.9-evidence-path-ledger
serving: no
live runtime hook: no
model call: no
model attention claim: no
evidence-use proof claim: no
external publication/posting: no
```

This milestone closes the current offline evidence-path layer:

```txt
aggregate answer-side risk
-> bridge target selection
-> synthetic span/page materialization
-> target action table
-> compact replay pack
-> replay-pack validator
-> fixture refinement
-> refined replay pack
-> provenance validation
-> evidence-path ledger v1.9
-> validator-first local view
```

## Canonical artifacts

```txt
bench/evidence-utilization-epkv-evidence-path-ledger-v19-2026-05-19/RESULTS.md
bench/evidence-utilization-epkv-evidence-path-ledger-v19-2026-05-19/evidence-path-ledger-v19.json
bench/evidence-utilization-epkv-evidence-path-ledger-v19-2026-05-19/summary.json
bench/evidence-utilization-epkv-bridge-replay-pack-provenance-2026-05-19/RESULTS.md
bench-public/evidence-utilization/EVIDENCE-PATH-LEDGER-VIEW.html
bench-public/evidence-utilization/EVIDENCE-PATH-LEDGER.md
bench-public/evidence-utilization/EPKV-BRIDGE-READOUT.md
```

## What is proven

```txt
1. The offline chain is reproducible and indexed.
2. Receipts and primary artifacts exist for every stage.
3. The v1.2 replay pack has provenance closure.
4. The validator-first local view can show the process as behavior, not just receipt inventory.
5. Boundary invariants remain closed: non-serving, no live runtime hook, no model call.
```

Concrete ledger coverage:

```txt
aggregate_records: 178
selected_targets: 16
materialized_events_v10: 16
bridge_ready_targets: 13
needs_fixture_detail_targets: 3
replay_records_v12: 13
refined_events_v15: 9
refined_replay_records_v16: 9
total_replay_records: 22
```

Ledger invariants:

```txt
all_receipts_present: true
all_primary_artifacts_present: true
all_boundaries_non_serving: true
no_stage_claims_model_attention: true
no_stage_claims_evidence_use_proof: true
combined_replay_coverage_is_22: true
provenance_validation_passed: true
```

## What is not proven

```txt
selected positions are not model attention
compatibility labels are not evidence-use proof
synthetic replay is not live runtime behavior
hook-off telemetry is not serving readiness
this does not claim speedup
this does not claim answer-quality improvement
this does not claim EPKV fixes retrieved ≠ used
```

## Durable language

Use:

```txt
evidence-path compatibility
selected-position geometry
hook-off replay pack
provenance closure
validator-first view
offline audit layer
compatibility states, not evidence-use proof
```

Do not use:

```txt
attention
proof of use
quality improvement
serving speedup
production-ready
EPKV solved RAG
```

## What crystallizes

```txt
boundary / non-claims
validator-first UI
ledger v1.9
22 replay records
provenance closure
compatibility-state language
```

## What remains liquid

```txt
live-prompt hook-on
serving integration
compact fallback serving
attention interpretation
answer-quality interpretation
public narrative
```

## Only two next gates

### Gate A — external review packet

A local packet may be prepared for external review, but circulation requires explicit decision.

Allowed offline preparation:

```txt
sanitize artifacts
write reviewer brief
package local tarball
run phrase audit
```

Still gated:

```txt
public posting beyond the repository
sending to external reviewers
claims beyond compatibility states
```

### Gate B — live-runtime contact

Any live prompt or runtime hook contact remains explicitly gated.

Gated actions:

```txt
real-prompt hook-on
live vLLM patch/restart/deploy
compact fallback serving install
claims about serving behavior
```

## Casey / Bauman synthesis

Casey: the correct form is a validator-first interface, not another text inventory.  
Bauman: crystallize the milestone, not the hypothesis. Keep the runtime/public narrative liquid until the world can sustain it.

## Decision

```txt
Offline milestone v1.9 is sealed.
Do not keep expanding receipts without crossing a real gate.
Next work is either external-review preparation or live-runtime contact, both explicitly gated.
```
