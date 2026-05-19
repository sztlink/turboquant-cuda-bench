# EPKV bridge replay provenance validator v1.8 — 2026-05-19

> Review-driven provenance and referential-closure validator for the v1.2 bridge replay pack.

## Boundary

```txt
offline artifact validation: yes
serving: no
runtime hook: no
model call: no
model attention: no
evidence-use proof: no
```

## Artifacts

```txt
07-scripts/evidence-utilization/validate-epkv-bridge-replay-provenance-v18.mjs
bench/evidence-utilization-epkv-bridge-replay-pack-provenance-2026-05-19/provenance-validation-report.json
```

## Result

```txt
valid: true
errors: 0
records: 13
bridge_ready_actions: 13
RESULTS.md replay rows: 13
source_sha256_pinned: true
target_closure: true
results_table_complete: true
```

## Fixes from Claude review

```txt
R1 fixed: v1.1/v1.2 markdown tables now include all 13 bridge-ready/replay rows.
R2 fixed: columns use source_hit_rate/source_wrong_rate.
R3 fixed: rank_any note added.
R5 fixed: replay-id mapping rule documented.
R8 fixed: manifest now pins upstream action/materialized/event sources with sha256.
```

## Decision

```txt
The v1.2 replay pack now has provenance closure, referential closure, complete generated docs, and upstream sha256 pinning.
This closes the review-gated consolidation packet without touching live runtime.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
