# Evidence-utilization ↔ Evidence-Paged KV bridge — offline metadata v0

> Status: offline metadata bridge. No serving, no real prompts run, no real EPKV selection.
>
> Purpose: produce a deterministic 16-case fixture record set that wires evidence-utilization
> spans into the Track A runtime hook event schema, so the next bridge step (telemetry or
> intervention) has a frozen target before it runs.

## Boundary

```txt
bridge_version: v0
bridge_layer:   offline_metadata_only
no real EPKV selection, no real inference, no tokenizer call
runtime hook event schema referenced from Track A receipt only
```

## Inputs

- Spec: [`bench-public/evidence-utilization/EPKV-BRIDGE-SPEC.md`](../../bench-public/evidence-utilization/EPKV-BRIDGE-SPEC.md)
- Track A receipt: [`bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md`](../evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md)
- Aggregates:
  - [`bench-public/evidence-utilization/phase-aggregate.json`](../../bench-public/evidence-utilization/phase-aggregate.json)
  - [`bench-public/evidence-utilization/distractor-taxonomy-aggregate.json`](../../bench-public/evidence-utilization/distractor-taxonomy-aggregate.json)
- Hook module: [`07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py`](../../07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py)

## Case matrix

Deterministic 16 hard cases:

| axis | values |
|---|---|
| canonical rank | 8, 16 |
| decoys before  | 3, 7 |
| distractor     | explicit_decoy, stale_record, conflicting_correction, near_duplicate |
| prompt scaffold | baseline |
| zone           | no_zone_padding (retrieved section only) |
| total          | 16 |

Mean estimated prompt tokens (heuristic, chars/token=3.6): 1279.2

## Aggregate proxy (answer class when this fixture would be run)

Proxy stats come from the public distractor-taxonomy aggregate (`by_distractor_rank`). They are not
measurements of these specific bridge records; they are the closest published hit-rate band for the
(distractor, rank) cell. No claim of identity between the proxy and a real run.

Proxy is keyed on `(distractor, canonical_rank)`; the same value applies across both
`decoys_before` cells in this matrix.

| distractor | rank | proxy hit rate | proxy wrong-distractor rate | proxy runs |
|---|---:|---:|---:|---:|
| conflicting_correction | 8 | 50.0% | 43.8% | 144 |
| conflicting_correction | 16 | 2.8% | 77.8% | 144 |
| explicit_decoy | 8 | 44.4% | 0.0% | 144 |
| explicit_decoy | 16 | 40.3% | 4.2% | 144 |
| near_duplicate | 8 | 36.8% | 27.8% | 144 |
| near_duplicate | 16 | 0.7% | 38.9% | 144 |
| stale_record | 8 | 21.5% | 76.4% | 144 |
| stale_record | 16 | 2.8% | 93.8% | 144 |

## Runtime layer (offline)

Each record carries a runtime stanza marked `offline_metadata_only`:

```txt
hook:                  evidence_paged_kv.runtime.phase2a.v0
mode:                  offline_metadata_only
enabled_in_serving:    false
no_real_selection:     true
K (would-be):          32
layout_reference:      turboquant_k8v4 packed slot_size=196 (Track A)
track_a_runtime_decision: cost_ratio_gate_fail; bridge proceeds via metadata-only path
schema_validation:     event + selection-summary fields referenced, not emitted
```

Expected Track A event fields (referenced for downstream wiring, not produced here):

```txt
- ts
- tag
- event_index
- hook
- mode
- decision
- elapsed_ms_sync_timing
- elapsed_ms_wall
- query_shape
- kv_cache_shape
- block_table_shape
- seq_len
- K
- temp_scores_bytes
- fallback_after_max_events
- selected_positions_sample
```

## Evidence layer spans

Each record records:

- `canonical_chunk_index` (1..16) — position of canonical record in the retrieved section;
- `canonical_char_span_in_user_prompt` — exact char range of the canonical block content;
- `canonical_token_span_estimate` — char span divided by chars/token heuristic;
- `decoy_spans[]` — same shape for each non-canonical chunk;
- `total_chunks` is always 16 (matches phase fixture);
- `zone` is `no_zone_padding`: no top/bottom filler added around the section, so spans stay tight.

Spans are computed from the rendered user prompt string deterministically. No tokenizer was
called; tokens are estimated via `chars/token` heuristic and explicitly labeled as such.

## Output files

```txt
records.jsonl    16 records, one per case
summary.json     aggregate counts + proxy summary + non-claims
RESULTS.md       this file
```

## Non-claims

- no serving claim
- no model-quality claim
- no real EPKV selection trace
- no tokenizer-accurate spans
- no leaderboard score

## Next step

When the cost-ratio gate is redesigned or passed, the bridge can graduate from v0 (offline
metadata) to v1 (telemetry-only Option A under `VLLM_EPKV_RUNTIME_DRY_RUN=1`). At that point
these records can be re-emitted with real `selected_positions_sample` blocks attached to the
same fixture ids, allowing direct alignment of evidence spans against runtime selected positions.
