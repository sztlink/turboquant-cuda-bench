# Start here

If you came here from Discord, GitHub, X, or anywhere else: this repo is a small research archive from local RTX 4090 tests.

The current question is simple:

```txt
When a system retrieves the right evidence, does the model actually use it?
```

In synthetic decoy-heavy tests using TheTom's `longctx-svc` as the retrieval/proxy layer, the latest phase package found:

```txt
phase diagram:        743/1200 closure, errors 0
depth sweep:          3022/3840 closure, errors 0
prompt scaffold:      2532/3456 closure, errors 0
distractor taxonomy:  1605/2880 closure, errors 0
```

Short read:

```txt
retrieved != used
depth != utilization
```

The right chunk can be in context and still fail to become the final answer. In these fixtures, canonical rank, decoys-before, and distractor type mattered more than raw context depth.

## Where to look

Latest result:

```txt
bench/evidence-utilization-phase-2026-05-17/RESULTS.md
```

Previous retrieval/proxy confirmation:

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

In the latest synthetic phase package:

```txt
Retrieval depth was not the main bottleneck.
Answer closure was dominated by local evidence competition.
Prompting harder did not reliably fix it.
```
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
