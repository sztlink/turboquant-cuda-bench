# Finding is not using

Status: draft field note  
Updated: 2026-05-17

A long-context system can find the right evidence and still fail to use it.

That is the small result here.

Using TheTom's `longctx-svc` as the retrieval/proxy layer, I ran synthetic decoy-heavy fixtures on a local RTX 4090 with Qwen 27B.

The question was not throughput, and not simply needle retrieval. The question was whether available evidence became the final answer.

## First confirmation

The first expanded fixture showed the gap directly:

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

## Phase package

A larger synthetic phase package then varied rank, decoy position, context depth, prompt scaffolding, and distractor type:

```txt
phase diagram:        743/1200 closure, errors 0
depth sweep:          3022/3840 closure, errors 0
prompt scaffold:      2532/3456 closure, errors 0
distractor taxonomy:  1605/2880 closure, errors 0
```

The clearest finding was not about raw depth.

In the depth sweep, closure stayed close across 20k, 80k, and 160k character contexts:

```txt
20k chars:  77.0%
80k chars:  79.1%
160k chars: 80.1%
```

The sharper failure came from local evidence competition.

Rank and decoys-before dominated answer closure. In the phase diagram:

```txt
rank 1:  93.8%
rank 2:  90.0%
rank 4:  72.5%
rank 8:  60.9%
rank 16: 38.8%
```

Prompt scaffolding also did not solve the failure mode. In one sweep, the simple baseline prompt beat the more explicit variants:

```txt
baseline:   86.3%
negative:   70.0%
positive:   69.1%
structured: 67.6%
```

The type of competing evidence mattered too:

```txt
unrelated_noise:          84.2%
explicit_decoy:           58.2%
conflicting_correction:   54.2%
near_duplicate:           46.0%
stale_record:             36.1%
```

Noise was easy. Stale records and near-duplicates were not.

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
distractor type
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

More specifically:

```txt
A retrieved chunk is not necessarily a used chunk.
In synthetic decoy-heavy fixtures, answer closure was more sensitive
to canonical rank, decoys-before, and distractor type than to raw context depth.
Prompting harder did not reliably fix the failure mode.
```

## Material

Readable three-scene entry:

```txt
https://github.com/sztlink/turboquant-cuda-bench/tree/main/06-publicable/longctx/evidence-path
```

Full aggregate package:

```txt
https://github.com/sztlink/turboquant-cuda-bench/tree/main/bench/evidence-utilization-phase-2026-05-17
```
