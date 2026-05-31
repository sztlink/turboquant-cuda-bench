# Dispatcher spec

## Purpose

Define the interface a future EPKV micro-megakernel would consume.

This is not a runtime implementation.

## Input object

A future runtime dispatcher should not consume free-form prompt text. It should
consume a path-to-page object derived from explicit path candidates.

```json
{
  "schema": "epkv.megakernel_dispatch.v0",
  "request_id": "opaque-request-id",
  "sequence_id": 0,
  "model_family": "qwen2.5|qwen3|llama|other",
  "runtime": "vllm",
  "kv_format": "fp16|fp8|turboquant_k8v4|other",
  "policy": {
    "mode": "observe_only|probe_only|compact_fallback|exact_only|disabled",
    "global_k": 32,
    "probe_local_top": 8,
    "fallback_local_top": 32,
    "max_flagged_head_rate_for_compact": 0.75,
    "fail_open": true
  },
  "path": {
    "path_id": "qid-or-runtime-path-id",
    "template": "director_place_of_birth",
    "answer_slot": "place",
    "risk_flags": ["multi_step_relation", "attribute_owner_template"],
    "steps": [
      {
        "path_step_id": 1,
        "relation": "director",
        "from_title": "Nuits Rouges",
        "to_title": "Georges Franju",
        "evidence_title": "Nuits Rouges",
        "support_role": "bridge"
      },
      {
        "path_step_id": 2,
        "relation": "place_of_birth",
        "from_title": "Georges Franju",
        "to_value": "Fougeres",
        "evidence_title": "Georges Franju",
        "support_role": "answer"
      }
    ]
  },
  "row_map": [
    {
      "path_step_id": 1,
      "source_title": "Nuits Rouges",
      "layer_id": 0,
      "head_group": 0,
      "block_id": 123,
      "block_offset": 17,
      "row_index": 7873,
      "row_score_prior": null
    }
  ]
}
```

## Dispatcher modes

| mode | behavior | allowed now? |
|---|---|---|
| `disabled` | always original attention | yes |
| `observe_only` | record row/page metadata, no attention mutation | yes, after infra approval |
| `probe_only` | compute cheap probe candidates, original output remains authoritative | only after quality gate + infra approval |
| `compact_fallback` | use probe for unflagged heads, exact fallback for flagged heads | future only |
| `exact_only` | skip probe, exact candidate path | future only |

## Decision policy

A future dispatcher should use a small decision tree:

```txt
if fail_open is false -> reject config
if row_map missing -> disabled
if quality_gate_passed is false -> observe_only
if flagged_head_rate >= max_flagged_head_rate_for_compact -> exact_only
else -> compact_fallback
```

The policy must be logged as data, not hidden in code.

## Required telemetry

Each request/layer/head group should emit:

```json
{
  "schema": "epkv.megakernel_dispatch_event.v0",
  "request_id": "opaque-request-id",
  "path_id": "qid-or-runtime-path-id",
  "layer_id": 0,
  "head_group": 0,
  "mode_requested": "compact_fallback",
  "mode_executed": "disabled|observe_only|probe_only|compact_fallback|exact_only",
  "fail_open_reason": null,
  "row_count": 0,
  "page_count": 0,
  "global_k": 32,
  "probe_local_top": 8,
  "fallback_local_top": 32,
  "flagged_head_rate": null,
  "flagged_chunk_rate": null,
  "temp_bytes": null,
  "latency_us": null,
  "correctness_check": "not_run|passed|failed"
}
```

## Safety invariants

```txt
No path object -> original attention.
No row map -> original attention.
Kernel exception -> original attention.
Latency watchdog -> original attention.
Unknown policy mode -> original attention.
Telemetry write failure must not affect generation.
```

## Non-goal

This spec does not define a full transformer megakernel and does not require one.
It defines the narrow boundary for an EPKV micro-megakernel if the quality path earns
runtime contact.
