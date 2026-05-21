# Evidence-Path Runtime Telemetry v0 — replay bridge

Status: validated
Date: 2026-05-21

## Boundary

```txt
source: RealRAG HotpotQA R3L records
mode: offline replay-derived geometry
serving mutation: no
model inference: no
real-prompt hook-on: no
prompt text: not included
raw token ids: not included
selected/page positions: estimated geometry, not attention
```

This is the first Phase 1 telemetry artifact. It validates that the Phase 0 RealRAG evidence-placement records can be projected into the existing `epkv.runtime.telemetry.v1` event contract without exposing prompt text or raw token ids.

It is not evidence of runtime behavior, evidence use, speedup, or answer-quality improvement.

## Artifacts

```txt
07-scripts/evidence-utilization/build-evidence-path-runtime-telemetry-v0.mjs
bench/evidence-path-runtime-telemetry-v0-2026-05-21/events.jsonl
bench/evidence-path-runtime-telemetry-v0-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v0-2026-05-21/validation-report.json
```

## Validation

```txt
validator: 07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs
events: 7964
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

## What the event contains

Each event contains:

```txt
schema: epkv.runtime.telemetry.v1
mode: dry-run
decision: telemetry_only_no_runtime_mutation
reason_code: dry_run_telemetry_only
process geometry fields: seq_len, Hq, Hk, D, global_k, local top-k, chunks
timing fields: all zero, because this is replay-only
coverage: event index/cap/bucket
privacy: prompt_text=false, raw_token_ids=false, selected_positions_only=true
replay_geometry: hashed ids, condition, support rank/page estimates, closure metrics
```

## What it deliberately excludes

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

## Decision

```txt
Phase 1 can start with schema-valid, default-off telemetry replay.
The existing EPKV runtime telemetry contract can represent RealRAG evidence-path geometry.
No serving mutation was needed.
No real-prompt hook-on was performed.
```

## Next gate

```txt
Telemetry v0.1: add a default-off runtime emitter that can produce the same schema from synthetic/local prompts, still without changing model outputs.
```

Do not move to intervention until telemetry, privacy validation, and adjudication boundaries are stable.
