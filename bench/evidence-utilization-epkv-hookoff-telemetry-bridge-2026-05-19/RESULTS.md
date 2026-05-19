# Evidence-utilization EPKV hook-off telemetry bridge v0.4 — 2026-05-19

> L2 hook-off bridge: offline KV replay records projected into the runtime telemetry schema and validated. No serving mutation.

## Boundary

```txt
source: offline KV replay v0.3 records
output: epkv.runtime.telemetry.v1 events
serving mutation: no
model inference: no
real prompt trace: no
selected positions are attention: no
```

## Artifacts

```txt
bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/events.jsonl
bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/summary.json
bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/validation-report.json
```

## Validation

```txt
events: 16
validator valid: true
validator errors: 0
validator exit code: 0
```

## Coverage

```txt
seq_len range: 817..1549
selected positions total: 14336
dominant regions: {"neither":6,"decoy":6,"canonical":4}
canonical page overlap events: 16/16
decoy page overlap events: 16/16
```

## Decision

```txt
L2 hook-off bridge is schema-valid.
The runtime telemetry contract can represent the existing evidence-span -> selected-position geometry artifacts.
This remains a bridge/plumbing receipt, not behavioral evidence.
Real-prompt hook-on remains paused.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not answer-quality evidence.
- Not evidence-utilization improvement evidence.
- Selected positions are geometry, not model attention.
