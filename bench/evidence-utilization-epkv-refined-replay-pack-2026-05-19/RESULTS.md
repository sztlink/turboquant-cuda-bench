# EPKV refined replay pack v1.6 — 2026-05-19

> Compacts the v1.5 canonical/decoy/neither refined fixtures into a replay pack.

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
bench/evidence-utilization-epkv-refined-replay-pack-2026-05-19/refined-replay-pack.jsonl
bench/evidence-utilization-epkv-refined-replay-pack-2026-05-19/summary.json
```

## Result

```txt
records: 9
checks: {"records":9,"validator_pack_passed":true,"all_schema_v1":true,"all_hook_off":true,"all_dry_run":true,"all_privacy_safe":true,"all_without_raw_samples":true,"all_variants_match_dominant_region":true,"each_target_has_three_variants":true}
by_variant: {"canonical":3,"decoy":3,"neither":3}
by_audit_projection: {"green_canonical_geometry_compatible":3,"red_decoy_geometry_risk":3,"yellow_neither_geometry_inconclusive":3}
```

## Decision

```txt
The three formerly ambiguous targets now have validated contrastive replay coverage.
Together with v1.2, the offline bridge now covers 22 replay records: 13 decoy-risk + 9 contrastive refinement records.
Next autonomous packet: update ledger to v1.7 including refined fixtures/replay pack.
```

## Non-claims

- Not runtime telemetry from a live request.
- Not EPKV behavior.
- Not model attention.
- Not evidence-use proof.
- Not serving readiness.
