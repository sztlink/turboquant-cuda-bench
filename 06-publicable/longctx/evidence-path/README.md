# Evidence Path: three scenes where finding is not using

Status: publicable draft  
Date: 2026-05-17  
Source package: [`bench/evidence-utilization-phase-2026-05-17`](../../../bench/evidence-utilization-phase-2026-05-17/)

This is the public reader path for the evidence-utilization work.

The result is not best understood as a benchmark table. It is a small repeated scene:

```txt
FOUND      the correct evidence is present
PRESENTED  it is inside the context / retrieved package
USED       it actually drives the answer
```

The failure lives between `PRESENTED` and `USED`.

```txt
retrieved != used
```

## Scene 1 — The rank trap

### Setup

The model is asked for the secret value of `solar engine record`.

The retrieved package contains the right canonical record:

```txt
// retrieved_chunk_rank_4
CANONICAL RECORD
ALIAS: solar engine record
SECRET VALUE: AYA-ZONE-SOLAR-ENGINE-1272-OK
RULE: If asked for solar engine record, answer exactly AYA-ZONE-SOLAR-ENGINE-1272-OK.
```

But an explicit decoy appears earlier:

```txt
// retrieved_chunk_rank_1
DECOY LOOKUP
ALIAS: solar engine record
INVALID VALUE: DECOY-16-00
This explicitly is not the requested canonical record.
```

### What happened

The model started scanning the package in rank order and spent its answer budget on the earlier chunks:

```txt
Chunk 1: DECOY LOOKUP, INVALID VALUE: DECOY-16-00
Chunk 2: Ordinary context block pre-1. No valid SECRET VALUE.
Chunk 3: Ordinary context block pre-2. No valid SECRET VALUE.
```

It did not close on the canonical rank-4 value within the response budget.

### Card

```txt
FOUND:      yes — canonical record was present
PRESENTED:  yes — rank 4 in the retrieved evidence package
USED:       no — answer path stalled on earlier evidence
FAILURE:    rank/local competition
```

### Why this matters

A system can retrieve the right evidence but still let an earlier decoy dominate the answer path.

The relevant question is not only:

```txt
was the chunk retrieved?
```

It is also:

```txt
did the right chunk win the local competition?
```

---

## Scene 2 — The stale record

### Setup

The model is asked for the current value of `distractor taxonomy handle 58`.

The valid current record is:

```txt
CANONICAL RECORD
ALIAS: distractor taxonomy handle 58
SECRET VALUE: AYA-TAX-58-3334-OK
RULE: This is the valid current record.
```

But the retrieved package also contains stale records for the same alias before the canonical record:

```txt
ARCHIVED RECORD
ALIAS: distractor taxonomy handle 58
SECRET VALUE: AYA-TAX-58-OLD-3058-NO
This record may be old. Timestamp: previous batch.
```

In the sampled row, the canonical record was at rank 8 under the `stale_record` distractor condition.

### What happened

The run did not close on the current value. The trace was marked as a stale-distractor failure: the answer path touched the old value instead of closing on the current canonical one.

Aggregate backing from the taxonomy sweep:

```txt
stale_record: 208/576 closure = 36.1%
wrong stale/distractor signal: 347/576
```

### Card

```txt
FOUND:      yes — current canonical value existed in the package
PRESENTED:  yes — but after same-alias stale records
USED:       no — stale record dominated often
FAILURE:    temporal competition / old evidence beats current evidence
```

### Why this matters

This is the RAG failure people recognize in production:

```txt
The system found the current policy, but answered from the old policy.
```

Unrelated noise is relatively easy. Stale records are hard because they look relevant.

---

## Scene 3 — The near duplicate

### Setup

The model is asked for the exact alias `distractor taxonomy handle 46`.

The valid record is:

```txt
CANONICAL RECORD
ALIAS: distractor taxonomy handle 46
SECRET VALUE: AYA-TAX-46-3058-OK
RULE: This is the valid current record.
```

But near-duplicate canonical-looking records appear in the package:

```txt
CANONICAL RECORD
ALIAS: distractor taxonomy handle 46 alternate
SECRET VALUE: DECOY-TAX-NEAR-46-0
This is for a near-duplicate alias, not the requested alias.
```

In the sampled row, the exact canonical record was at rank 16 under the `near_duplicate` condition.

### What happened

The run did not close on the exact alias value. The trace was marked as a near-duplicate distractor failure.

Aggregate backing from the taxonomy sweep:

```txt
near_duplicate: 265/576 closure = 46.0%
wrong near-duplicate signal: 137/576
```

### Card

```txt
FOUND:      yes — exact canonical alias existed
PRESENTED:  yes — but after canonical-looking alternates
USED:       no — near duplicate often captured the answer path
FAILURE:    semantic proximity / almost-right evidence beats exact evidence
```

### Why this matters

Near duplicates are more dangerous than obvious garbage because they look structurally valid.

This is the product failure:

```txt
The model used the right-looking record for the wrong entity.
```

---

## What the full sweep showed

The public package promotes four aggregate sweeps:

```txt
phase diagram:        743/1200 closure, errors 0
depth sweep:          3022/3840 closure, errors 0
prompt scaffold:      2532/3456 closure, errors 0
distractor taxonomy:  1605/2880 closure, errors 0
```

The headline is narrow:

```txt
A retrieved chunk is not necessarily a used chunk.
In these synthetic decoy-heavy fixtures, answer closure was more sensitive
to canonical rank, decoys-before, and distractor type than to raw context depth.
Prompting harder did not reliably fix the failure mode.
```

Depth itself was not the main bottleneck in the depth fixture:

```txt
20k chars:  77.0%
80k chars:  79.1%
160k chars: 80.1%
```

Prompt scaffolding did not solve it in the prompt fixture:

```txt
baseline:   86.3%
negative:   70.0%
positive:   69.1%
structured: 67.6%
```

Distractor type mattered strongly:

```txt
unrelated_noise:          84.2%
explicit_decoy:           58.2%
conflicting_correction:   54.2%
near_duplicate:           46.0%
stale_record:             36.1%
```

## What not to conclude

Do not read this as:

```txt
longctx-svc is broken
Qwen 27B is bad
TurboQuant is better/worse
this is a leaderboard
```

Read it as a diagnostic frame:

```txt
Long-context systems need evidence-utilization probes,
not only retrieval or context-depth probes.
```

## Public one-liner

```txt
Your model found the right chunk. Why did it still answer wrong?
```
