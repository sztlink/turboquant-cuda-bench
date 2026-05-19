# Retrieved ≠ used — EPKV behavior map

> Public-safe behavior map for the evidence-utilization audit layer.
>
> This is a map of observable compatibility states, not a claim that selected positions are attention or that EPKV improves answers.

## Thesis

```txt
RAG evaluation should not stop at retrieval hit-rate or answer correctness.
There is a missing middle layer: evidence-path telemetry.
```

The current EPKV bridge makes that middle layer legible as geometry:

```txt
retrieved evidence spans
-> token/page ranges
-> selected-position geometry
-> runtime telemetry schema
-> audit label
```

This does **not** prove that the model used the evidence. It shows whether the instrumented selection path is compatible with, incompatible with, or inconclusive about the evidence regions.

## Pipeline

| Layer | Artifact | What it says | What it does not say |
|---|---|---|---|
| Retrieval fixture | canonical/decoy spans | where the evidence and distractors are | whether the model used them |
| Token/page bridge | token spans + page ranges | where those spans live in KV-page coordinates | observed scheduler allocation |
| Selected-position geometry | position/page overlap summaries | whether selected positions overlap evidence regions | attention, causality, answer behavior |
| Runtime telemetry schema | `epkv.runtime.telemetry.v1` | privacy-preserving process receipt | serving readiness |
| Audit label | green/yellow/red/gray | compatibility state for evidence path | proof of evidence use |

## Audit labels

| Label family | Meaning | Safe interpretation |
|---|---|---|
| Green | canonical evidence and selected-position geometry are compatible | the instrumented geometry crosses the canonical region |
| Yellow | geometry is mixed, outside evidence, or proxy/geometry disagree | the trace is inconclusive or needs fallback/recheck |
| Red | decoy/stale/conflicting region is geometry-compatible | the trace surfaces a decoy-risk path |
| Gray | insufficient geometry or telemetry | no safe statement |

Current v0.7 receipt:

```txt
records: 16
green: 4
yellow: 6
red: 6
gray: 0
```

Receipt:

```txt
bench/evidence-utilization-epkv-answer-audit-bridge-2026-05-19/RESULTS.md
```

## Failure classes

The behavior map names failure classes without claiming internal model causality:

```txt
retrieved_but_geometry_inconclusive
selected_decoy_geometry
selected_neither_geometry
canonical_geometry_but_proxy_disagrees
decoy_geometry_compatible_with_wrong_proxy
no_safe_telemetry
```

These are audit states. They are not diagnoses of model attention.

## Runtime state boundary

The runtime contract has explicit states:

```txt
disabled
dry-run
exact-only
compact-fallback
degraded-fallback
```

Current live boundary:

```txt
real-prompt hook-on: paused
compact fallback serving install: paused
schema-v1 adapter: source-ready, default-off, offline smoke-tested
```

## Why this matters

The useful outcome is not “EPKV is faster” or “EPKV fixes RAG.”

The useful outcome is:

```txt
an auditable evidence-utilization layer that can show when retrieved evidence,
selected-position geometry, and answer-side proxy signals are aligned,
misaligned, or inconclusive.
```

That layer can support future fallback, re-query, abstention, or review policies — but only after more validation.

## Safe language

Safe:

```txt
selected-position geometry
evidence-path telemetry
compatibility state
audit label
bridge/plumbing receipt
privacy-preserving process geometry
```

Unsafe:

```txt
attention
proof the model used evidence
answer-quality improvement
serving speedup
EPKV fixes retrieved != used
production attention replacement
```

## Current decision

```txt
The bridge has reached a behavior-map milestone:
retrieval spans -> token/page ranges -> selected-position geometry -> runtime schema -> audit label.

Next technical work should either:
  1. add unit tests for the runtime schema-v1 adapter, or
  2. expand audit labels across more evidence-utilization fixtures.

Do not run real-prompt hook-on yet.
Do not install compact fallback into serving yet.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not answer-quality evidence.
- Not evidence-utilization improvement evidence.
- Audit labels are compatibility states, not proof of model use.
