# Narrow guard-family prompts - offset 1500 n100

## Status

Done. Tested four narrow prompt-level guard families after the global guarded prompt failed by over-refusal.

Guard families tested:

```txt
attribute_owner
relation_depth
answer_granularity
generic_title
```

This run used soft UNKNOWN pressure:

```txt
If evidence is incomplete, still return the best short supported answer. Use UNKNOWN only when no answer value is supported.
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
guarded_path_families: attribute_owner,relation_depth,answer_granularity,generic_title
guarded_path_soft_unknown: true
```

Output:

```txt
narrow-guards-offset1500-n100/
narrow-guards-offset1500-n100-comparison.json
```

## Same-run baseline

Baseline condition:

```txt
entity_hop_path_prompt
```

Baseline result in this run:

```txt
EM: 0.150
F1: 0.277
```

## Results by family

| guard family | EM | F1 | EM delta | F1 delta | wins | losses | ties | refusal rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| attribute_owner | 0.130 | 0.221 | -0.020 | -0.056 | 1 | 3 | 96 | 0.47 |
| relation_depth | 0.130 | 0.212 | -0.020 | -0.065 | 3 | 5 | 92 | 0.53 |
| generic_title | 0.100 | 0.186 | -0.050 | -0.091 | 1 | 6 | 93 | 0.55 |
| answer_granularity | 0.100 | 0.173 | -0.050 | -0.104 | 2 | 7 | 91 | 0.53 |

## Decision

```txt
all_narrow_guard_families_failed_vs_same_run_path_prompt
```

None of the narrow guard families beat the same-run unguarded path prompt.

The softened prompts reduced the worst over-refusal of the global guard, but refusal stayed too high:

```txt
0.47 to 0.55 depending on guard family
```

## Interpretation

The risk taxonomy is still useful as instrumentation, but prompt-level guard text is not the right intervention. Even narrow guard text moves the model toward abstention and lowers F1.

The failure mode is not only that the model needs more instructions. It needs a better candidate path object or a pre-answer selection/filtering step.

## What this rules out

Do not continue with prompt-only guard variants on this slice.

Do not package guard prompts as a positive result.

Do not spend another 4090 run testing similar wording tweaks without changing the path object or candidate selection.

## Next technical move

If continuing the RealRAG front, move one level upstream:

```txt
construct explicit path candidates before answer generation
score/filter candidate paths without gold
then ask answer-from-chain only on the selected path
```

Minimum next experiment should be no-LLM or low-LLM until the path object is visible:

```txt
candidate path extraction from title graph
risk-tagged path candidates
generic-title suppression in candidate selection, not prompt text
relation-depth path templates
attribute-owner path templates
```

## Public-safe receipt stance

This is a negative/mixed result:

```txt
retrieval coverage reproduced
config0 answer quality was mixed
all-purpose guarded prompt failed
narrow prompt guards also failed
```

The useful receipt is not a success claim. It is a boundary marker showing that the next front must build paths, not add more prompt instructions.
