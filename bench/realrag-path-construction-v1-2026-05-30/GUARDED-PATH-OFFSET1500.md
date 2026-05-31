# Guarded path prompt - offset 1500 n100

## Status

Done. This run tested the prompt-level answer-type/relation guards added after the mixed config0 fresh holdout.

Authorization:

```txt
Autorizo infra
```

## Run shape

```txt
limit: 100
offset: 1500
top_k: 10
bm25_first: 8
seed_top: 0
second_per_mention: 0
max_seed_expansions: 4
max_doc_mentions: 3
pool_limit: 80
skip_bge: true
skip_extract: true
disable_ecd: true
include_guarded_path: true
```

Output:

```txt
guarded-path-offset1500-n100/
guarded-path-offset1500-n100-comparison.json
```

## Conditions

Same retrieved docs and graph. Prompt conditions:

```txt
entity_hop_path_prompt
entity_hop_path_guarded
```

The guarded prompt added answer-type, relation-depth, attribute-owner, generic-title, same-neighborhood, and media-chain instructions.

## Same-run result

Primary comparison:

```txt
entity_hop_path_prompt -> entity_hop_path_guarded
```

| metric | path prompt | guarded path | delta |
|---|---:|---:|---:|
| EM | 0.150 | 0.080 | -0.070 |
| contains | 0.240 | 0.090 | -0.150 |
| F1 | 0.271 | 0.120 | -0.151 |

Per-case EM movement:

```txt
wins:   0
losses: 7
ties:   93
```

Refusal/UNKNOWN behavior:

```txt
path prompt refusal rate:    0.01
guarded path refusal rate:   0.68
```

## Historical comparison

Against the previous unguarded config0 offset1500 run:

```txt
previous unguarded config0: EM 0.180, F1 0.288
guarded path:              EM 0.080, F1 0.120
```

Per-case EM movement vs previous unguarded config0:

```txt
wins:   1
losses: 11
ties:   88
```

## Decision

```txt
guarded_prompt_failed_do_not_continue
```

The guard prompt failed the pass condition:

```txt
losses did not decrease
F1 delta was negative
UNKNOWN/refusal rate dominated
```

## Interpretation

The guard text correctly named the risk classes, but operationally it over-corrected by turning many partially correct answers into `UNKNOWN`.

This means the next version should not be a stricter all-purpose prompt contract. The useful direction is narrower:

```txt
instrument risk states before generation
apply local guards only where they target a known failure mode
avoid global UNKNOWN pressure
preserve short-answer extraction when evidence is present but incomplete
```

## What not to do next

Do not run the same guarded prompt again.

Do not promote guarded path as an improvement.

Do not publish as a positive receipt.

## Next technical move

If continuing this front, implement a shadow-only risk classifier or local prompt variants by risk family:

```txt
attribute-owner only
relation-depth only
answer-granularity only
generic-title suppression only
```

Each should be compared against the unguarded config0 path prompt on the same selected docs.

But the immediate public-safe packaging should be a mixed/negative receipt:

```txt
retrieval coverage reproduced; global guarded prompt failed by over-refusal
```
