# Evidence-Paged KV runtime integration design — paused contract

> Status: design contract only. Do **not** install the compact fallback policy into serving from this document.
>
> Purpose: make the observed offline behavior legible as states, invariants, telemetry, and kill-switch requirements before any future runtime-contact experiment.

## Boundary

```txt
serving mutation: no
real-prompt hook-on: paused
claim type: candidate-selection / plumbing / behavior map
not claimed: serving speedup, production attention, answer-quality improvement
```

This document is a membrane between offline receipts and possible runtime work. It is not an implementation approval.

## What has actually been observed

The offline receipts have converged on a behavior grammar:

```txt
local concentration in chunk candidates
-> GPU overflow detector flags affected query heads
-> if few heads are flagged: compact fallback can reuse probe candidates for unflagged heads
-> if many heads are flagged: exact-only is safer and often cheaper
```

Primary receipts:

```txt
bench/evidence-paged-kv-gpu-overflow-detector-2026-05-19/RESULTS.md
bench/evidence-paged-kv-adaptive-path-2026-05-19/RESULTS.md
bench/evidence-paged-kv-gpu-mask-control-2026-05-19/RESULTS.md
bench/evidence-paged-kv-compact-fallback-2026-05-19/RESULTS.md
bench/evidence-paged-kv-compact-fallback-flag-sweep-2026-05-19/RESULTS.md
bench/evidence-paged-kv-compact-fallback-shape-sweep-2026-05-19/RESULTS.md
bench/evidence-paged-kv-compact-fallback-policy-grid-2026-05-19/RESULTS.md
```

Candidate policy from the policy grid:

```txt
if M <= 4096:
  exact-only / compact disabled
else if flagged_head_rate >= 0.75:
  exact-only
else:
  compact fallback
```

Caveat: `0.75` and `4096` are sampled-grid contours, not laws. The grid is synthetic and shape-sensitive.

## State model

Any runtime-facing integration must report one explicit mode per event:

| Mode | Meaning | Allowed output behavior |
|---|---|---|
| `disabled` | Hook is off. | Original path only. |
| `dry-run` | Candidate kernels may run for telemetry, then return `None`. | Original path only. |
| `exact-only` | Policy declines compact fallback and uses original/exact path. | Original path only unless explicitly in synthetic offline harness. |
| `compact-fallback` | Probe + detector + compact fallback selected. | Not allowed on real prompts yet. |
| `degraded-fallback` | Any error, unsupported shape, or incomplete telemetry. | Original/exact path only. |

No event may be emitted without a mode.

## Fail-closed invariant

Runtime policy must fail closed:

```txt
unknown shape
missing block table
unexpected dtype/layout
candidate_count exceeds kernel bound
telemetry write fails
CUDA error
flag count unavailable
privacy guard trips
event cap reached without explicit coverage marker
```

All of the above must force:

```txt
mode = degraded-fallback
output = original/exact path
```

No approximate output may be emitted for real prompts.

## Candidate policy interface

The policy function must be pure and report its reasons.

Inputs:

```txt
seq_len M
Hq
global_k
probe_local_top
fallback_local_top
num_chunks
flagged_head_count
flagged_head_rate
kernel bounds
feature flags
```

Output:

```txt
mode
reason_code
policy_version
```

Candidate policy version:

```txt
epkv.compact_fallback.policy.v1.synthetic_grid_2026_05_19
```

Reason codes:

```txt
hook_disabled
seq_guard_exact_only
flag_rate_exact_only
compact_fallback_selected
unsupported_shape
kernel_bound_exceeded
telemetry_incomplete
event_cap_reached
cuda_error
privacy_guard
manual_kill_switch
```

## Telemetry contract

Each event must include process geometry, not prompt content:

```json
{
  "schema": "epkv.runtime.telemetry.v1",
  "tag": "...",
  "mode": "dry-run|exact-only|compact-fallback|degraded-fallback|disabled",
  "decision": "...",
  "reason_code": "...",
  "policy_version": "...",
  "seq_len": 65536,
  "Hq": 28,
  "Hk": 4,
  "D": 128,
  "global_k": 32,
  "probe_local_top": 8,
  "fallback_local_top": 32,
  "num_chunks": 128,
  "flagged_head_count": 14,
  "flagged_head_rate": 0.5,
  "seq_guard": 4096,
  "flag_rate_threshold": 0.75,
  "timing_ms": {
    "probe_candidates": 0.0,
    "detector": 0.0,
    "compact_merge": 0.0,
    "global_select": 0.0,
    "value": 0.0,
    "exact_fallback": 0.0,
    "total_hook_wall": 0.0,
    "total_hook_cuda": 0.0
  },
  "coverage": {
    "event_index": 1,
    "event_cap": 0,
    "cap_hit": false,
    "bucket": "seq_len:..."
  },
  "privacy": {
    "prompt_text": false,
    "raw_token_ids": false,
    "selected_positions_only": true
  }
}
```

Do not log:

```txt
prompt text
raw token ids
user data
answer text
```

Selected positions, if traced, are selection geometry only. They are not model attention and not evidence usage.

## Timing invariants

Telemetry must separate:

```txt
probe_candidates
detector
compact_merge
global_select
value
exact_fallback
total_hook_wall
total_hook_cuda
```

A single aggregate `elapsed_ms` is insufficient because it hides the behavioral transition Casey flagged: the interesting form is the decision process, not only the p50.

## Correctness and shadow checks

Before any runtime-contact experiment beyond dry-run:

1. Shadow correctness must compare sampled compact-fallback output against exact reference in an offline or synthetic serving harness.
2. Tolerance breach must auto-disable compact fallback.
3. Unsupported shape must never attempt compact fallback.
4. Candidate policy must report coverage by seq_len bucket.

Recommended tolerance field:

```txt
max_abs_error <= receipt-specific tolerance from offline replay, recorded per shape
```

Do not generalize one fixture's tolerance to production behavior.

## Kill switch and restore contract

Default state:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
```

Required kill switches:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_RUNTIME_COMPACT_FALLBACK=0
VLLM_EPKV_RUNTIME_DRY_RUN=1
VLLM_EPKV_RUNTIME_MAX_SEQ=<guard>
VLLM_EPKV_RUNTIME_MAX_EVENTS=<guard>
```

Any serving experiment must end with a recorded restore receipt:

```txt
/health: 200
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_RUNTIME_SYNC_TIMING=0
GPU returned to expected idle/service state
```

Infra mutation still requires explicit confirmation before execution.

## Allowed next experiments

Allowed now:

1. Implement this document as a source-level design reference.
2. Add a default-off telemetry schema validator for offline event files.
3. Build a hook-off bridge that maps evidence spans to selection-geometry schema without serving mutation.
4. Run additional offline grid only if it targets a named uncertainty, e.g. non-power-of-two shape instability.

Not allowed yet:

```txt
real-prompt hook-on
compact fallback in serving
public speedup claim
quality claim
attention claim
```

## Runtime-contact ladder

If this ever proceeds, the ladder should be:

```txt
L0 offline harness only
L1 default-off source patch with schema tests
L2 hook-off telemetry parser over existing logs
L3 synthetic serving dry-run, returns original path
L4 real-prompt dry-run only after privacy review and explicit confirmation
L5 compact fallback serving experiment only after separate review
```

Current position:

```txt
L0 complete for synthetic candidate-policy receipts
L1 design only
```

## Decision

The next artifact should be the interface contract, not another kernel receipt by default.

```txt
Cristalize the behavior map and telemetry contract.
Do not crystallize compact fallback as a serving solution.
```
