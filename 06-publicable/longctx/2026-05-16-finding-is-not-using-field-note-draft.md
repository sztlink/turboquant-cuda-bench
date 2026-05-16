# Finding is not using

Status: draft field note  
Date: 2026-05-16

A long-context system can find the right evidence and still fail to use it.

That is the small result here.

Using TheTom's `longctx-svc` as the retrieval/proxy layer, I ran a synthetic decoy-heavy fixture on a local RTX 4090 with Qwen 27B.

The question was not throughput, and not simply needle retrieval. The question was whether retrieved evidence became the final answer.

## Result

```txt
n=24 synthetic
retrieval_hit: 19/24
baseline answer: 9/24
anti-decoy prompt: 9/24
filtered splice: 19/24
```

The model often had the canonical evidence available. But in the baseline path it still answered with a decoy, refused, or failed to close.

Prompting harder did not help this fixture.

Moving the canonical evidence into a cleaner answer position did.

## Why this matters

A lot of long-context testing asks:

```txt
did retrieval find the chunk?
```

This fixture asks a second question:

```txt
did the answer actually use the chunk?
```

Those are different measurements.

A useful quality report should separate at least:

```txt
retrieval_hit
canonical_rank
decoys_before
closure / final answer correctness
tokens_to_correct, when available
action-trace drift, for agent/tool cases
```

## Caveat

This is synthetic staging evidence, not a benchmark claim.

It does not say `longctx-svc` is broken. It does not say Qwen 27B is bad. It does not say anything global about TurboQuant.

It says only this:

```txt
found evidence is not the same as used evidence.
```

## Material

```txt
https://github.com/sztlink/turboquant-cuda-bench/tree/main/bench/longctx-utilization-expanded-2026-05-16
```
