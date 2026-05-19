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
| Bridge v0.3 | [`../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md) | synthetic Q/K tensors can run real offline score+topK and emit selected-position/page overlap records | model attention, serving behavior, real prompt KV allocation |
| Bridge v0.4 | [`../../bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/RESULTS.md) | existing bridge records can be projected into the runtime telemetry schema and pass the L1 validator | serving behavior, hook-on traces, real evidence use |
| Bridge v0.5 | [`../../bench/evidence-utilization-epkv-runtime-parity-bridge-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-runtime-parity-bridge-2026-05-19/RESULTS.md) | actual runtime hook function can emit selected-position telemetry over synthetic packed KV bridge-band shapes and be projected to the L1 schema | serving readiness, stable latency, model behavior |
| Bridge v0.6 | [`../../bench/evidence-utilization-epkv-runtime-schema-v1-adapter-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-runtime-schema-v1-adapter-2026-05-19/RESULTS.md) | default-off source adapter can emit `epkv.runtime.telemetry.v1` directly in dry-run mode | live deployment, serving readiness, real-prompt tracing |
| Bridge v0.7 | [`../../bench/evidence-utilization-epkv-answer-audit-bridge-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-answer-audit-bridge-2026-05-19/RESULTS.md) | existing fixtures can be mapped to green/yellow/red audit labels from answer proxy + selected-position geometry | evidence-use proof, model behavior, quality evaluation |
| Taxonomy v0.8 | [`../../bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/RESULTS.md) | existing aggregate sweeps can be ranked with answer-side risk labels to choose next bridge targets | runtime geometry, EPKV behavior, evidence-use proof |
| Target queue v0.9 | [`../../bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/RESULTS.md) | 16 high-risk fixture families selected for next hook-off geometry bridge coverage | runtime execution, model behavior, evidence-use proof |
| Target materialization v1.0 | [`../../bench/evidence-utilization-epkv-target-materialization-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-target-materialization-2026-05-19/RESULTS.md) | v0.9 target skeletons materialized into 16 schema-valid synthetic hook-off telemetry events | runtime behavior, live request tracing, evidence-use proof |
| Audit-join v1.1 | [`../../bench/evidence-utilization-epkv-audit-join-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-audit-join-2026-05-19/RESULTS.md) | target queue + materialized events + validator report joined into action states: 13 bridge-ready, 3 needs fixture detail | runtime behavior, evidence-use proof, deployment readiness |
| Replay pack v1.2 | [`../../bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/RESULTS.md) | 13 bridge-ready decoy-risk targets packed as compact hook-off replay records | runtime behavior, live request tracing, evidence-use proof |

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

### 5. Synthetic Q/K tensors can drive real offline topK

Bridge v0.3 replaced direct position fabrication with deterministic synthetic Q/K tensors and a real dot-product score + topK path:

```txt
records: 16
selected-position samples: 16/16
selected positions total: 14336
seq_len range: 817..1549
Hq/Hk/D/K: 28/4/64/32
```

Observed probe readout:

```txt
dominant regions: {"neither":6,"decoy":6,"canonical":4}
proxy dominant answer classes: {"canonical":8,"decoy":8}
probe alignment with proxy class: 62.5%
query-label region consistency: 100% heads / 100% positions
```

This validates tensor → topK → selected-position → page-overlap plumbing. The 100% query-label consistency is expected from synthetic construction; it is still synthetic and not model behavior.

### 6. Hook-off bridge records can satisfy runtime telemetry contract

Bridge v0.4 projects the v0.3 offline KV replay records into `epkv.runtime.telemetry.v1` events and validates them with the L1 schema validator:

```txt
records/events: 16/16
validator: PASS
validator errors: 0
seq_len range: 817..1549
selected positions total: 14336
dominant regions: {"neither":6,"decoy":6,"canonical":4}
```

This validates representational fit between the evidence-span bridge and the Casey-guided runtime telemetry contract. It is hook-off: no serving mutation, no model inference, no real-prompt trace.

### 7. Actual runtime hook can satisfy the bridge-band schema via adapter

Bridge v0.5 drives the actual guarded `runtime_hook.maybe_decode` function on synthetic packed TurboQuant-shaped KV caches with sequence lengths taken from v0.4 events, then projects the legacy runtime events into `epkv.runtime.telemetry.v1`:

```txt
events: 16
validator: PASS
validator errors: 0
seq_len range: 817..1549
runtime selected positions sampled: 14336
CUDA total p50/p90: ~1.25 / ~1.47 ms
```

This advances implementation/schema parity: the real hook boundary can produce selected-position geometry in the bridge band. It is still dry-run, synthetic KV, no serving mutation, no real prompt, and not a stable latency table.

### 8. Runtime hook can emit schema-v1 directly in dry-run mode

Bridge v0.6 adds a default-off source adapter:

```txt
VLLM_EPKV_RUNTIME_SCHEMA_V1=1
```

When enabled together with dry-run, the runtime hook emits `epkv.runtime.telemetry.v1` directly instead of requiring post-hoc projection:

```txt
events: 4
validator: PASS
validator errors: 0
modes: ["dry-run"]
reason_codes: ["dry_run_telemetry_only"]
runtime selected positions sampled: 3584
```

Legacy event format remains default. The adapter was tested as a standalone copied module, not deployed into the live vLLM service.

### 9. Evidence-span + geometry can produce audit labels

Bridge v0.7 joins existing offline bridge records with schema-valid selected-position geometry and emits green/yellow/red audit states:

```txt
records: 16
severities: {"yellow":6,"red":6,"green":4}
labels: {"yellow_neither_geometry_inconclusive":6,"red_decoy_geometry_compatible_with_wrong_proxy":6,"green_canonical_geometry_compatible":4}
```

This is the first complete scaffold for:

```txt
retrieval spans -> token/page ranges -> selected-position geometry -> audit label
```

The labels are compatibility states, not proof of model evidence use.

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
real offline KV replay
serving baseline hook-off (B0)
```

Completed B0 serving baseline:

- [`../../bench/evidence-utilization-epkv-serving-baseline-b0-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-serving-baseline-b0-2026-05-19/RESULTS.md)

B0 result: hook-off synthetic serving p90 gives an approximate 15% per-completion-token overhead budget of ~5.01 ms. Track A K=32 trace overhead fits under that budget, so a **synthetic hook-on dry-run probe** was plausible with explicit infra confirmation.

Completed B1 serving synthetic dry-run:

- [`../../bench/evidence-utilization-epkv-serving-dryrun-b1-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-serving-dryrun-b1-2026-05-19/RESULTS.md)

B1 result: contact succeeded and service was restored, but the event cap was hit before all prompt bands were represented. Treat it as a contact receipt, not final serving latency characterization.

Completed B1.1 serving synthetic dry-run with warmup separation:

- [`../../bench/evidence-utilization-epkv-serving-dryrun-b11-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-serving-dryrun-b11-2026-05-19/RESULTS.md)

B1.1 result: event cap problem fixed (`3232` steady events, cap not hit, `3232/3232` selected summaries), all prompt bands covered, service restored. Serving latency still shows first-request-per-band warmup/autotune effects, so this is a stronger synthetic telemetry receipt but still not a real-prompt green light.

Completed offline KV replay v0.3:

- [`../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/RESULTS.md)

v0.3 result: no serving and no model inference; deterministic synthetic Q/K tensors generated selected-position samples via real offline score+topK computation for all 16 bridge records. This advances the bridge plumbing, not the behavioral claim.

Completed hook-off telemetry bridge v0.4:

- [`../../bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/RESULTS.md)

v0.4 result: the 16 offline KV replay records project into schema-valid `epkv.runtime.telemetry.v1` events (`16/16`, validator `PASS`, `0` errors). This proves representational fit with the runtime telemetry contract, not serving behavior.

Paused until explicit confirmation / additional control:

```txt
real-prompt hook-on dry-run trace
intervention bridge
quality comparison
public EPKV claim
```

## Next experiment, if continuing

The next non-serving experiment is now:

```txt
replay-pack validator v1.3:
  validate v1.2 replay-pack invariants
  fail on raw selected-position samples, missing non-claim boundaries, or non-hook-off records
  emit pass/fail receipt
```

Alternative: refine the 3 needs-fixture-detail targets. Real prompts remain paused.

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
- Bridge v0.3 selected positions are real topK over synthetic tensors, not model attention or behavioral evidence.
