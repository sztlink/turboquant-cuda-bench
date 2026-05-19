# Evidence-utilization EPKV answer audit bridge v0.7 — 2026-05-19

> Joins evidence-utilization fixtures with selected-position geometry and emits audit labels. Offline only; labels are compatibility states, not proof of evidence use.

## Boundary

```txt
source records: offline KV replay v0.3
source telemetry: hook-off runtime schema bridge v0.4
serving: no
model attention: no
evidence-use proof: no
```

## Artifacts

```txt
bench/evidence-utilization-epkv-answer-audit-bridge-2026-05-19/audit-records.jsonl
bench/evidence-utilization-epkv-answer-audit-bridge-2026-05-19/summary.json
```

## Result

```txt
records: 16
severities: {"yellow":6,"red":6,"green":4}
labels: {"yellow_neither_geometry_inconclusive":6,"red_decoy_geometry_compatible_with_wrong_proxy":6,"green_canonical_geometry_compatible":4}
answer proxy classes: {"canonical":8,"decoy":8}
dominant geometry regions: {"neither":6,"decoy":6,"canonical":4}
```

## Label semantics

| severity | meaning |
|---|---|
| green | answer proxy and selected-position geometry are canonical-compatible |
| yellow | geometry/proxy relationship is mixed or inconclusive |
| red | selected-position geometry is decoy-compatible or decoy-risk |
| gray | insufficient geometry |

## Decision

```txt
The bridge can now emit an evidence-utilization audit layer over existing offline artifacts.
This is the first complete retrieval-span -> geometry -> audit-label scaffold.
It remains synthetic/offline and does not prove model evidence use.
```

## Non-claims

- Not production attention.
- Not serving.
- Not answer-quality evidence.
- Not evidence-utilization improvement evidence.
- Audit labels are compatibility states, not proof of model use.
