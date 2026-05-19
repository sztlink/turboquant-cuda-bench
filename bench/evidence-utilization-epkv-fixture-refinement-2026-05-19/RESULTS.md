# EPKV fixture refinement v1.5 — 2026-05-19

> Refines the 3 needs-fixture-detail targets into canonical/decoy/neither synthetic hook-off variants.

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
bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/refined-fixture-records.jsonl
bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/events.jsonl
bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/summary.json
```

## Result

```txt
source_targets: 3
records: 9
events: 9
by_variant: {"canonical":3,"decoy":3,"neither":3}
by_dominant_region: {"canonical":3,"decoy":3,"neither":3}
by_audit_projection: {"green_canonical_geometry_compatible":3,"red_decoy_geometry_risk":3,"yellow_neither_geometry_inconclusive":3}
```

## Validator

```txt
events.jsonl: PASS
validator errors: 0
```

## Decision

```txt
The 3 ambiguous targets now have contrastive canonical/decoy/neither synthetic layouts.
Next autonomous packet: validate these refined events and fold them into a second replay pack.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
