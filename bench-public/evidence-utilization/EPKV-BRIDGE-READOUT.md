# EPKV bridge readout — retrieved ≠ used meets selected-position telemetry

> Status: internal/public-safe readout of the bridge work after Track A.
>
> Bottom line: **do not run real-prompt hook-on serving yet.** The useful result is a safe offline pipeline for studying `retrieved ≠ used` as an alignment problem between evidence spans, token/page ranges, and selected-position telemetry.

## One-line thesis

```txt
Evidence-Paged KV is not yet a serving intervention for retrieved ≠ used;
it is now a controlled measurement scaffold for asking where a selected-position path would look.
```

## What exists now

The bridge now has a staged chain of receipts:

| Stage | Receipt | What it proves | What it does not prove |
|---|---|---|---|
| Track A runtime | [`../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md) | guarded hook can emit position-only telemetry events offline; service stayed healthy | serving speedup, production attention, quality improvement |
| Gate redesign | [`../evidence-paged-kv/RUNTIME-GATE-REDESIGN.md`](../evidence-paged-kv/RUNTIME-GATE-REDESIGN.md) | original ratio gate was structurally mismatched; absolute telemetry budget is better | permission to run real-prompt hook-on serving |
| Bridge v0 | [`../../bench/evidence-utilization-epkv-bridge-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-2026-05-19/RESULTS.md) | deterministic evidence records with exact char spans | tokenizer-accurate positions, real selection |
| Bridge v0.1 | [`../../bench/evidence-utilization-epkv-bridge-tokenized-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-tokenized-2026-05-19/RESULTS.md) | token spans and page ranges exist for canonical/decoy evidence | observed vLLM KV allocation, real selected positions |
| Bridge v0.2 | [`../../bench/evidence-utilization-epkv-bridge-replay-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-replay-2026-05-19/RESULTS.md) | the alignment schema can carry `selected_positions_sample`-shaped data and overlap metrics | model attention, EPKV behavior, answer behavior |

## What was validated

### 1. Position-only telemetry schema

The runtime hook can emit events with:

```txt
seq_len
K
temp_scores_bytes
elapsed_ms_sync_timing
elapsed_ms_wall
selected_positions_sample
```

Track A trace run emitted:

```txt
272/272 events with selected-position summaries
0 missing required fields
0 raw prompt text
0 token ids
```

This validates the telemetry substrate, not the model behavior.

### 2. Evidence spans can be frozen

Bridge v0 created 16 deterministic hard cases across:

```txt
canonical_rank: 8, 16
decoys_before: 3, 7
distractor_type: explicit_decoy, stale_record, conflicting_correction, near_duplicate
```

Each record has canonical and decoy char spans.

### 3. Evidence spans can become token/page ranges

Bridge v0.1 used a local Qwen tokenizer and manual Qwen2.5 chat framing to add:

```txt
canonical_token_span_exact
canonical_page_range
decoy.token_span_exact
decoy.page_range
```

Boundary: these are tokenizer-derived page ranges with `block_size=16`, not observed vLLM scheduler allocation.

### 4. Alignment records can be computed

Bridge v0.2 added synthetic selected-position replay fields:

```txt
canonical_selected_heads
decoy_selected_heads
dominant_region
selection_answer_alignment
```

The 100% synthetic alignment rate is expected by construction because the replay is aggregate-proxy-biased. It is a schema test, not a behavioral result.

## What failed

The original gate:

```txt
p90_hook / p90_original_tq <= 2.5
```

failed. This is now treated as a **bad gate**, not merely a bad number.

Why: the denominator was a tiny synthetic TurboQuant decode micro-kernel. The hook deliberately includes score materialization, top-k/softmax, value accumulation, and optional telemetry copies. Comparing those by ratio asks the wrong question for a bridge fixture.

The replacement gate is an absolute telemetry budget:

```txt
no-trace hook p90 <= 2 ms at K=32
trace overhead p90 <= 2 ms at K=32
wall/sync hidden overhead <= 1 ms p90
100% telemetry completeness/privacy
```

This budget is for deciding whether telemetry is bounded enough to study; it is not a speedup claim.

## Decision

Do **not** proceed to real-prompt hook-on serving yet.

Allowed next work:

```txt
offline metadata bridge
token/page mapping
offline selected-position replay
real offline KV replay, if needed
serving baseline hook-off (B0)
```

Completed B0 serving baseline:

- [`../../bench/evidence-utilization-epkv-serving-baseline-b0-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-serving-baseline-b0-2026-05-19/RESULTS.md)

B0 result: hook-off synthetic serving p90 gives an approximate 15% per-completion-token overhead budget of ~5.01 ms. Track A K=32 trace overhead fits under that budget, so a **synthetic hook-on dry-run probe** is plausible with explicit infra confirmation.

Paused until explicit confirmation / additional control:

```txt
real-prompt hook-on dry-run trace
intervention bridge
quality comparison
public EPKV claim
```

## Next experiment, if continuing

The next non-serving experiment is **real offline KV replay**:

```txt
for each tokenized bridge fixture:
  construct synthetic Q/KV tensors whose page ranges correspond to canonical/decoy spans
  run Phase 2a selected-page path offline
  attach actual selected_positions_sample from the kernel path
  compute overlap against canonical/decoy page ranges
```

This would replace the synthetic v0.2 replay with real offline selected-position behavior, still without serving prompts through the hook.

## Safe public phrasing

Safe:

```txt
We connected evidence-utilization fixtures to a guarded selected-position telemetry scaffold.
The first runtime gate said: not ready for real-prompt serving.
The bridge now continues offline, mapping evidence spans to token/page ranges before any intervention claim.
```

Unsafe:

```txt
Evidence-Paged KV fixes retrieved ≠ used.
Evidence-Paged KV improves answer quality.
Evidence-Paged KV is faster than production attention.
The selected positions are model attention.
```

## Non-claims

- Not production attention.
- Not serving speedup.
- Not answer-quality improvement.
- Not evidence-utilization improvement.
- Not a PagedAttention/FlashAttention comparison.
- Not model attention.
- Not a real selected-position trace in bridge v0/v0.1/v0.2.
