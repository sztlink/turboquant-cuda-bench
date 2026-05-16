# Start here — TurboQuant / KVFidelity / retrieval-utilization

This repo is an independent research archive from local CUDA hardware, mainly an RTX 4090.

It is **not** a benchmark leaderboard and does not claim that a method globally wins or loses.

## What to read first

Latest retrieval-utilization result:

```txt
bench/longctx-utilization-expanded-2026-05-16/RESULTS.md
```

Core analysis note:

```txt
05-analysis/longctx/2026-05-15-retrieval-is-not-utilization.md
```

Current canonical stance:

```txt
CANON.md
```

## Short version

Using TheTom's `longctx-svc` as the retrieval/proxy layer, a synthetic decoy-heavy fixture separates retrieval from actual answer use.

```txt
n=24 synthetic
retrieval_hit: 19/24
baseline answer: 9/24
anti-decoy prompt: 9/24
filtered splice: 19/24
```

Readout:

```txt
A retrieved chunk is not necessarily a used chunk.
Prompting alone did not fix this fixture; cleaner evidence placement did.
```

## What this is

A methodology probe for quality testing under long-context / retrieval / KV-cache work.

Useful fields:

```txt
retrieval_hit
canonical_rank
decoys_before
closure / final answer correctness
tokens_to_correct, when available
action-trace drift, for agent/tool cases
```

## What this is not

```txt
not a public benchmark claim
not a claim that longctx-svc is broken
not a claim that Qwen 27B is bad
not a claim about TurboQuant quality globally
```

The current finding is narrower:

```txt
In this fixture, evidence can be present in retrieved context and still fail to become the final answer.
```

## Credit / stack clarity

`longctx-svc` is TheTom's retrieval/proxy layer. The fixtures and analysis here are local tests built around that layer.

## Current structural note

The rerank path is being handled separately. A local patch adds a killable rerank timeout/fallback so slow CPU cross-encoder scoring cannot hang `/retrieve` indefinitely:

```txt
bench/longctx-rerank-timeout-smoke-2026-05-16/RESULTS.md
07-scripts/patches/longctx-svc-rerank-timeout-2026-05-16.patch
```
