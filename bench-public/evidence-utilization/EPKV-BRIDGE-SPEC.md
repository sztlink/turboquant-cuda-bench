# Evidence Utilization ↔ Evidence-Paged KV bridge spec

> Status: design spec. No infra execution, no serving claim.
>
> Purpose: connect the public thesis **`retrieved ≠ used`** to the guarded Phase 2a runtime hook without claiming that the hook fixes answer quality.

## Why this bridge exists

The evidence-utilization fixtures showed a behavioral failure:

```txt
right evidence is present in context
but the model closes on a decoy or stale/conflicting record
```

The Evidence-Paged KV runtime line showed a systems capability:

```txt
vLLM real packed KV layout can execute a selected-page path under a guarded hook
```

The bridge should ask one narrow question:

```txt
Can we attach runtime-observable selected pages to evidence-utilization fixtures,
so that answer closure can be studied as a relation between evidence order,
selected pages, and final answer?
```

Not:

```txt
Does Evidence-Paged KV improve answer quality?
```

That would be a later experiment.

## Current facts

### Evidence-utilization side

Public aggregate:

- [`RESULTS.md`](RESULTS.md)

Safe readout:

```txt
A retrieved chunk is not necessarily a used chunk.
In synthetic decoy-heavy fixtures, answer closure was more sensitive
to canonical rank, decoys-before, and distractor type than to raw context depth.
Prompting harder did not reliably fix the failure mode.
```

Important knobs already measured:

- canonical rank;
- decoys-before;
- distractor type;
- prompt scaffold;
- context depth.

### Runtime hook side

Runtime receipt:

- [`../evidence-paged-kv/VLLM-HOOK-PLAN.md`](../evidence-paged-kv/VLLM-HOOK-PLAN.md)
- [`../../bench/evidence-paged-kv-runtime-hook-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-runtime-hook-2026-05-19/RESULTS.md)

Guarded hook facts:

```txt
hook: evidence_paged_kv.runtime.phase2a.v0
layout: turboquant_k8v4 packed slot_size=196
path: Triton score -> Torch top-k/softmax -> Triton value
service default: VLLM_EPKV_RUNTIME_HOOK=0
controlled temporary-on test: 64 runtime decode events
```

Non-claims preserved:

- not production attention;
- not serving speedup;
- not model-quality improvement;
- not evidence-utilization improvement;
- not PagedAttention/FlashAttention comparison.

## Bridge definition

A bridge fixture is one prompt/run with three aligned layers:

| Layer | What it records | Example |
|---|---|---|
| Evidence layer | where canonical/decoy chunks are placed | canonical rank, decoys-before, distractor type |
| Runtime layer | what selected-page hook observed | seq_len, K, temp_scores_bytes, selected positions/pages |
| Answer layer | whether closure used canonical evidence | hit, wrong decoy, refusal, alias-response |

The bridge output is not a single score. It is a per-run alignment record:

```json
{
  "fixture_id": "phase-rank16-decoys7-seed042",
  "evidence": {
    "canonical_rank": 16,
    "decoys_before": 7,
    "distractor_type": "explicit_decoy",
    "canonical_token_span": [1234, 1268],
    "decoy_token_spans": [[800, 834], [910, 944]]
  },
  "runtime": {
    "hook": "phase2a",
    "enabled": true,
    "seq_len": 2048,
    "K": 32,
    "selected_positions_by_head_summary": {
      "canonical_selected_heads": 0,
      "decoy_selected_heads": 18
    },
    "temp_scores_bytes": 229376
  },
  "answer": {
    "hit": false,
    "wrong_decoy": true,
    "emitted": "DECOY-..."
  }
}
```

## Required instrumentation change

The current runtime hook logs only:

```txt
seq_len, K, query_shape, kv_cache_shape, temp_scores_bytes, timing
```

For the bridge, it needs an optional telemetry mode that records compact selected-position summaries.

Suggested env flags:

```txt
VLLM_EPKV_RUNTIME_DRY_RUN=1
VLLM_EPKV_RUNTIME_TRACE_SELECTION=1
VLLM_EPKV_RUNTIME_TRACE_TOP_N=32
```

`VLLM_EPKV_RUNTIME_DRY_RUN=1` is the safety substrate for any future real-prompt telemetry run: the hook runs the Phase 2a kernels and logs timing/selection telemetry, then returns `None` so vLLM falls back to the original TurboQuant output. `TRACE_SELECTION` records compact position-only summaries: sampled selected positions by head and a histogram. Events include CUDA timing and wall timing so telemetry copy overhead is visible. Both flags are default-off.

Suggested event fields:

```json
{
  "selected_positions_sample": {
    "heads": 28,
    "K": 32,
    "positions_by_head_first_n": [[10, 23, 42], [11, 24, 43]],
    "position_histogram": {
      "0-127": 5,
      "128-255": 12
    }
  }
}
```

Privacy/safety rule:

```txt
Log token/page positions and fixture ids, not raw prompt text or secrets.
```

## Fixture construction options

### Option A — telemetry-only bridge, safest first step

Use existing evidence-utilization prompt shapes, but run the model normally and only record runtime selected positions.

Question answered:

```txt
When the model answers a decoy, did the Phase 2a selected positions concentrate around decoys, canonical evidence, or neither?
```

Pros:

- minimal change;
- does not force selected pages into output;
- avoids claiming quality improvement.

Cons:

- selected positions are from the Phase 2a approximate top-k path, not necessarily the original TurboQuant path;
- without dry-run, answer may be generated by hook output if hook is enabled.

Mitigation:

- run baseline default-off first;
- prefer hook-on + `VLLM_EPKV_RUNTIME_DRY_RUN=1` for telemetry so generated answers remain original TurboQuant outputs;
- if dry-run is unavailable, run hook-on only with synthetic prompts and label results separately.

### Option B — metadata-only offline bridge

Do not enable runtime hook in serving. Instead, replay fixture prompts in an offline harness that builds known page/span maps and computes Phase 2a selected positions from synthetic or captured KV layout.

Pros:

- safest for production;
- clean separation from answer generation.

Cons:

- less direct runtime contact;
- harder to map actual vLLM token positions if prompt serialization differs.

### Option C — intervention bridge, not yet recommended

Use selected pages to alter attention/output and compare answer closure.

Pros:

- would test whether Evidence-Paged KV can affect answer behavior.

Cons:

- immediately becomes a quality/improvement experiment;
- high overclaim risk;
- requires stricter correctness and baseline controls.

Decision:

```txt
Start with Option A or B. Do not do Option C yet.
```

## Recommended first bridge experiment

### Name

```txt
bench/evidence-utilization-epkv-bridge-YYYY-MM-DD/
```

### Scope

Small, deliberately boring matrix:

| axis | values |
|---|---|
| handles/fixtures | 8–16 hard cases |
| canonical rank | 1, 4, 16 |
| decoys-before | 0, 3, 7 |
| distractor type | explicit_decoy, stale_record, near_duplicate |
| runtime condition | baseline default-off, Phase 2a hook-on telemetry |
| K | 32 |
| max seq | start ≤2048, then 8192 only if stable |

### Output files

```txt
RESULTS.md
records.jsonl
summary.json
```

### Per-record schema

```json
{
  "fixture_id": "string",
  "condition": "baseline_off|phase2a_hook_on",
  "evidence": {
    "canonical_rank": 4,
    "decoys_before": 3,
    "distractor_type": "stale_record",
    "canonical_span": [0, 0],
    "decoy_spans": []
  },
  "runtime": {
    "hook_events": 0,
    "seq_len": 0,
    "K": 32,
    "temp_scores_bytes": 0,
    "canonical_selected_heads": null,
    "decoy_selected_heads": null
  },
  "answer": {
    "expected": "AYA-...",
    "hit": true,
    "wrong_decoy": false,
    "refusal": false,
    "emitted_class": "canonical|decoy|refusal|alias|other"
  }
}
```

## Metrics

Do not use a single leaderboard score. Use alignment metrics:

```txt
answer_hit_rate_by_condition
wrong_decoy_rate_by_condition
canonical_selected_heads_mean
wrong_decoy_selected_heads_mean
selection_answer_alignment
runtime_overhead_p50/p90
```

Where:

```txt
selection_answer_alignment = whether the emitted answer class matches the evidence region most represented in selected positions
```

This is exploratory. It should not be framed as causal proof.

## Decision gates

### Continue to bridge implementation if

- telemetry can log selected positions without raw prompt text;
- default-off baseline remains stable;
- hook-on test can be bounded by max events / max seq;
- records align evidence spans, runtime positions, and answer class.

### Continue from bridge to intervention only if

- there is a repeated correlation between selected positions and answer class;
- the result is stable across at least two fixture families;
- the intervention hypothesis is explicit and falsifiable.

### Stop / pause if

- telemetry requires invasive vLLM changes;
- runtime hook changes answer behavior before we can interpret telemetry;
- evidence spans cannot be mapped reliably to token/page positions;
- results drift into quality/speed claims without controls.

## Division of labor

Suggested orchestration split:

| Track | Owner | Work |
|---|---|---|
| Runtime benchmark design | delegated agent | propose controlled p50/p90 harness, warmup isolation |
| Bridge spec + fixture schema | Pi/Felipe | maintain conceptual alignment with `retrieved ≠ used` |
| Infra execution | Pi only | stop/run/restore 4090 with explicit infra confirmation |
| Public communication | after consolidation | short update, no overclaim |

## Public-safe phrasing

Safe:

```txt
We connected the evidence-utilization fixtures to a guarded runtime hook design.
The next question is observational: when answer closure fails, where does the
runtime selected-page path put its probability/selection mass?
```

Unsafe:

```txt
Evidence-Paged KV fixes retrieved≠used.
Evidence-Paged KV improves answer quality.
Evidence-Paged KV is faster than production attention.
```

## Immediate next step

Track A runtime benchmark and bridge v0 receipts exist:

- [`../evidence-paged-kv/VLLM-HOOK-PLAN.md`](../evidence-paged-kv/VLLM-HOOK-PLAN.md)
- [`../evidence-paged-kv/RUNTIME-GATE-REDESIGN.md`](../evidence-paged-kv/RUNTIME-GATE-REDESIGN.md)
- [`../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md)
- [`../../bench/evidence-utilization-epkv-bridge-2026-05-19/RESULTS.md`](../../bench/evidence-utilization-epkv-bridge-2026-05-19/RESULTS.md)

Readout: telemetry completeness passed, but the original cost-ratio gate failed. The current bridge step is **metadata/offline bridge v0**, not real-prompt hook-on serving telemetry.

Prepared in the source hook: **telemetry-only selection tracing**, default-off:

```txt
VLLM_EPKV_RUNTIME_TRACE_SELECTION=1
VLLM_EPKV_RUNTIME_TRACE_TOP_N=32
```

Use the prepared dry-run safety flag for real-prompt telemetry:

```txt
VLLM_EPKV_RUNTIME_DRY_RUN=1
```

Then run a tiny bridge fixture in the safer offline/metadata form:

```txt
baseline default-off: answer only
metadata/offline EPKV trace: selected position summary over known fixture spans
```

Only revisit real-prompt hook-on dry-run trace after the cost gate is redesigned or passed. No public claim until the first bridge receipt exists.
