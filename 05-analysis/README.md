# 05-analysis

Interpretive layer: lab notes, findings, contradictions, and decision-making analysis.

## Current long-context analysis

```txt
longctx/2026-05-15-retrieval-is-not-utilization.md
```

Core thesis:

```txt
Retrieval success is not utilization success.
Retrieval depth was not the main bottleneck in the latest synthetic phase package.
Answer closure was dominated by local evidence competition:
canonical rank, decoys-before, and distractor type.
Prompting harder did not reliably fix the observed decoy failure.
```

Current sanitized evidence packages:

```txt
../bench/longctx-utilization-overnight-2026-05-16/RESULTS.md
../bench/longctx-utilization-expanded-2026-05-16/RESULTS.md
../bench/evidence-utilization-phase-2026-05-17/RESULTS.md
../bench/longctx-rerank-timeout-smoke-2026-05-16/RESULTS.md
```

Expanded staging confirmation:

```txt
n=24 synthetic
retrieval 19/24
baseline_proxy 9/24
anti_decoy_proxy 9/24
filtered_splice 19/24
```

Phase package confirmation:

```txt
runs promoted: 11376
errors: 0
rank 1 remains near-closed; rank 16 collapses under competition
20k/80k/160k depth did not materially change closure
baseline prompt beat negative/positive/structured scaffold variants
stale records and near-duplicates were harder than unrelated noise
```

## Current KVFidelity analysis

```txt
kvfidelity/2026-05-15-trace-atlas-lab-note-v2.md
kvfidelity/2026-05-15-label-review-addendum-v0.md
```
