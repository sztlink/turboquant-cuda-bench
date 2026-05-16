# Start here

If you came here from Discord, GitHub, X, or anywhere else: this repo is a small research archive from local RTX 4090 tests.

The current question is simple:

```txt
When a system retrieves the right evidence, does the model actually use it?
```

In one synthetic decoy-heavy test using TheTom's `longctx-svc` as the retrieval/proxy layer:

```txt
right evidence retrieved: 19/24
baseline answers correct: 9/24
stronger anti-decoy prompt: 9/24
cleaner evidence splice: 19/24
```

Short read:

```txt
retrieved != used
```

The right chunk can be in context and still fail to become the final answer.

## Where to look

Latest result:

```txt
bench/longctx-utilization-expanded-2026-05-16/RESULTS.md
```

Longer analysis:

```txt
05-analysis/longctx/2026-05-15-retrieval-is-not-utilization.md
```

Repo stance / caveats:

```txt
CANON.md
```

## What this is

A quality diagnostic for long-context / retrieval / KV-cache work.

It tracks things like:

```txt
retrieval_hit
canonical_rank
decoys_before
final answer correctness
tokens_to_correct, when available
action-trace drift, for agent/tool cases
```

## What this is not

```txt
not a leaderboard
not a claim that longctx-svc is broken
not a claim that Qwen 27B is bad
not a global TurboQuant quality claim
```

The only claim is narrower:

```txt
finding evidence is not the same as using evidence
```

## Credit / stack clarity

`longctx-svc` is TheTom's retrieval/proxy layer. The fixtures and analysis here are my local tests around that layer.

## Current rerank note

CPU rerank can be slow enough to hang a request. I drafted a local timeout/fallback patch so `/retrieve` can return safely instead of blocking forever:

```txt
bench/longctx-rerank-timeout-smoke-2026-05-16/RESULTS.md
07-scripts/patches/longctx-svc-rerank-timeout-2026-05-16.patch
```

That patch is a service-safety smoke, not a rerank-quality result.
