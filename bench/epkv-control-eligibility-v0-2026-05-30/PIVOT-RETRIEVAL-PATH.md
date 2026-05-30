# Pivot - retrieval/path construction

## Why pivot

The gated-control line is closed for now after fresh holdout.

The larger recurring signal is upstream:

```txt
N=500 path failures: 392
N=500 retrieval/path-limited failures: 201 / 392

Holdout path failures: 79
Holdout retrieval/path-limited failures: 56 / 79
```

Raw answer rerank/verifier control stayed symmetric:

```txt
N=500 gated v1 vs path: 2 wins / 2 losses / 496 ties
Holdout raw rerank vs path: 2 wins / 2 losses
```

Option B did not reproduce:

```txt
inspected N=500: 8 eligible, 5 wins, 0 losses, 3 ties
fresh holdout:   1 eligible, 0 wins, 0 losses, 1 tie
```

The next useful front is not another hand-written gate. It is retrieval/path construction.

## Working thesis

```txt
Answer closure is currently limited more by evidence/path construction than by a downstream verifier override.
```

## Candidate next sprint

Name:

```txt
Entity-Hop Path Construction v1
```

Operational plan:

```txt
bench/realrag-path-construction-v1-2026-05-30/PLAN.md
```

Question:

```txt
Can we improve path_prompt EM/F1 by changing retrieved evidence geometry and path/schema construction before the answer is generated?
```

Primary splits:

| split | offset | n | purpose |
|---|---:|---:|---|
| inspect-a | 0 | 100 | rapid iteration against known historical slice |
| inspect-b | 500 | 100 | known holdout from gated-control closure |
| fresh-a | 1000 | 100 | first fresh validation if available |
| scaled | 0 | 500 | only after a held-out win is observed |

Primary baselines:

```txt
bge_ref
entity_hop_strong
entity_hop_path_prompt
raw_answer_rerank as diagnostic only
oracle support-present / compact evidence as upper bound only
```

## Initial targets

### 1. Retrieval coverage grid on fresh slices

Measure support and answer presence across offsets, not only first N.

Metrics:

```txt
support_title_recall
full_support_recall
answer_string_present_rate
full_support_and_answer
pool_size
edge_count
```

Constraints:

```txt
No LLM calls needed for first pass.
Use offsets 0, 500, 1000 if available.
```

### 2. Path-schema instrumentation

Separate these states before generation:

```txt
full path present
partial path present
answer string present but path incomplete
answer absent
relation-depth ambiguity
attribute-owner ambiguity
```

Goal: make the path construction failure visible before asking the LLM to answer.

### 3. Prompt shape split

Do not ask one prompt to both infer the chain and answer. Test:

```txt
chain-first JSON extractor
answer-from-chain prompt
direct path prompt baseline
```

Important: strict single-candidate ECD already failed. This is not a return to ECD. It is path construction and answer formatting.

### 4. Relation-depth and attribute-owner guards upstream

The verifier losses showed recurring structural confusions:

```txt
father selected as paternal grandfather
attribute owner selected instead of requested place/date attribute
film/title decoy relation selected over target entity
```

Move those guards into path candidate construction, not only downstream override.

### 5. Holdout-first evaluation

Every improvement must be tested on a held-out offset before interpretation.

Minimum report:

```txt
inspected slice result
fresh holdout result
wins/losses/ties vs path_prompt
retrieval/path-limited split
negative examples preserved
```

## Success and stop rules

Minimum continue criterion:

```txt
full_support_and_answer improves by >= +0.05 absolute
or answer_string_present_rate improves by >= +0.08 absolute without lowering full_support_recall
```

Minimum answer-quality criterion:

```txt
EM wins > EM losses
EM delta >= +0.03 absolute
F1 delta >= +0.05 absolute
no new recurring relation-depth or attribute-owner failure class
```

Strong receipt-worthy success criterion:

```txt
EM delta >= +0.08 absolute
F1 delta >= +0.12 absolute
bootstrap CI lower bound > 0
losses qualitatively bounded and explained
```

Stop before spending 4090 LLM time if retrieval/path construction does not improve support/path coverage on fresh slices.

Stop and preserve a negative receipt if answer gains are offset-specific, losses match wins, schema introduces relation-depth regressions, or the method needs gold-derived signals.

## Non-goals

Do not do in this phase:

```txt
No new hand-written answer override gate.
No Option C unless new pre-scoring uncertainty signals are actually stored.
No kernel/runtime claims.
No public positive receipt from inspected slice only.
No gold answer in operational detectors.
```

## Non-claims

This pivot does not claim:

```txt
EPKV improves RealRAG globally
gated control is impossible
retrieval alone solves answer closure
```

It only follows the strongest remaining evidence after the gated-control holdout failed.
