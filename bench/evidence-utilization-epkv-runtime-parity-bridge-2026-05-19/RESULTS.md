# Evidence-utilization EPKV runtime parity bridge v0.5 — 2026-05-19

> L2.1 offline parity bridge: drive the actual guarded `runtime_hook.maybe_decode` function on synthetic packed TurboQuant-shaped KV caches, then project its legacy runtime events into `epkv.runtime.telemetry.v1` and validate. No serving mutation.

## Boundary

```txt
source shapes: hook-off telemetry bridge v0.4 events
runtime function: vLLM evidence_paged_kv.runtime_hook.maybe_decode
cache: synthetic packed TurboQuant-shaped KV
mode: dry-run, returns original path / None
serving mutation: no
model inference: no
real request: no
component timings instrumented: no
```

## Artifacts

```txt
07-scripts/evidence-utilization/epkv-runtime-parity-bridge-v05.py
bench/evidence-utilization-epkv-runtime-parity-bridge-2026-05-19/legacy-runtime-events.jsonl
bench/evidence-utilization-epkv-runtime-parity-bridge-2026-05-19/events.jsonl
bench/evidence-utilization-epkv-runtime-parity-bridge-2026-05-19/summary.json
bench/evidence-utilization-epkv-runtime-parity-bridge-2026-05-19/validation-report.json
```

## Validation

```txt
events: 16
schema: epkv.runtime.telemetry.v1
validator: PASS
validator errors: 0
seq_len range: 817..1549
runtime selected positions sampled: 14336
```

## Runtime-hook timing receipt

```txt
CUDA total p50: ~1.252 ms
CUDA total p90: ~1.473 ms
CUDA total max: ~52.782 ms
wall total p50: ~1.180 ms
wall total p90: ~1.427 ms
wall total max: ~48.497 ms
```

The max outlier is treated as runtime/harness shape sensitivity or compilation/cache residue. This receipt is for implementation/schema parity, not a stable latency table.

## Decision

```txt
The actual runtime hook function can produce selected-position telemetry over synthetic packed KV shapes matching the v0.4 bridge band.
Those runtime events can be projected into the Casey-guided telemetry schema and pass validation.
This advances implementation parity, not serving readiness.
```

## Next useful step

```txt
Default-off runtime schema adapter patch:
  make runtime_hook.py optionally emit epkv.runtime.telemetry.v1 directly in dry-run mode,
  preserve legacy event format by default,
  validate synthetic dry-run output with validate-epkv-runtime-telemetry.mjs.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not answer-quality evidence.
- Not evidence-utilization improvement evidence.
- Selected positions are geometry, not model attention.
