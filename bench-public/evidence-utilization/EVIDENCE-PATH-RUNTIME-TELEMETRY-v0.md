# Evidence-Path Runtime Telemetry v0 — replay bridge

Status: Phase 1 opened, default-off/offline
Primary artifact: `bench/evidence-path-runtime-telemetry-v0-2026-05-21/`

## One-line result

The Phase 0 RealRAG evidence-placement records can be projected into the existing `epkv.runtime.telemetry.v1` event schema as public-safe, validated telemetry replay events.

This starts Phase 1 as telemetry, not intervention.

## Boundary

```txt
source: RealRAG HotpotQA R3L records
mode: offline replay-derived geometry
serving mutation: no
model inference: no
real-prompt hook-on: no
output-changing path: no
prompt text: not included
raw token ids: not included
selected/page positions: estimated geometry, not attention
```

This artifact does not claim runtime behavior, evidence use, serving speedup, production RAG value, or answer-quality improvement.

## Validation

```txt
events: 7964
validator: 07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs
schema: epkv.runtime.telemetry.v1
valid: true
errors: 0
mode: dry-run
reason_code: dry_run_telemetry_only
```

## Coverage by condition

| condition | events | closure | support present | support page overlap | mean seq len est | mean selected pages est |
|---|---:|---:|---:|---:|---:|---:|
| `bm25_top10` | 1991 | 62.4% | 100.0% | 100.0% | 1520.8 | 91.8 |
| `bge_rerank_top10` | 1991 | 64.6% | 100.0% | 100.0% | 1520.8 | 91.8 |
| `oracle_first` | 1991 | 66.2% | 100.0% | 100.0% | 1520.8 | 91.8 |
| `no_support` | 1991 | 6.1% | 0.0% | 0.0% | 1296.2 | 77.8 |

## Event shape

Each telemetry event includes:

```txt
schema/mode/reason_code
process geometry fields required by the runtime validator
zeroed timing fields, because this is replay-only
coverage bucket/index/cap
privacy declaration
hashed source ids
estimated support/page geometry
closure metrics from the source record
```

It deliberately excludes:

```txt
prompt text
raw token ids
completion text
predicted answer
gold answer
user data
attention weights
live hook timings
```

## Why this matters

Phase 0 closed the answer-closure evidence-placement line. Phase 1 needs a bridge from answer-side records to runtime-observable geometry without jumping to live intervention.

This artifact proves only that the telemetry membrane exists:

```txt
RealRAG record -> evidence/path geometry -> epkv.runtime.telemetry.v1 -> validator pass
```

It does not prove that selected pages were attended to or used by the model.

## Decision

```txt
Phase 1 is open as Evidence-Path Runtime Telemetry.
The first gate is schema-valid and public-safe.
Live hook-on remains unnecessary for this artifact.
```

## Next gate

```txt
Telemetry v0.1: default-off runtime emitter on synthetic/local prompts.
```

Required properties for v0.1:

```txt
same epkv.runtime.telemetry.v1 schema
kill-switch/default-off behavior
privacy validator before publication
no output-changing path
no speed or quality claim
```

## Source artifacts

```txt
bench/evidence-path-runtime-telemetry-v0-2026-05-21/RESULTS.md
bench/evidence-path-runtime-telemetry-v0-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v0-2026-05-21/validation-report.json
bench/evidence-path-runtime-telemetry-v0-2026-05-21/events.jsonl
```
