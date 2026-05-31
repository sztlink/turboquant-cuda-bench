# Answer Interface v0

## Status

```txt
local_policy
no_4090
no_llm_call
no_runtime_mapping
no_megakernel
```

## Why this exists

The authorized answer-from-chain smoke showed a useful failure:

```txt
explicit path candidate object: strong
LLM asked to answer from that object: over-refused
```

The over-refusal was not fixed by another prompt. It was fixed by changing the
interface contract:

```txt
if the path object already has a final answer, return it
if the path object is missing a final answer, fall back to the baseline path prompt
```

## Policy

```txt
answer_interface_v0 = candidate_direct_rendered_else_config0_path_prompt
```

Operational rule:

```txt
if top_candidate.answer_candidate exists:
    output rendered top_candidate.answer_candidate
else:
    output config0 path_prompt output
```

Rendering is deliberately small:

```txt
strip one-line boilerplate
strip trailing comma
for person answers, strip appositive descriptors like `, leader ...` or `, daughter ...`
```

No gold answer is used for selection or rendering.

## Artifacts

```txt
build-answer-interface-v0.mjs
answer-interface-v0-offset1500-n100.jsonl
answer-interface-v0-summary.json
```

## Results on fresh offset1500 N=100

| condition | EM | contains | F1 | refusal/missing |
|---|---:|---:|---:|---:|
| answer_interface_v0 | 0.460 | 0.570 | 0.557 | 0.010 |
| candidate_direct_unrendered | 0.440 | 0.540 | 0.527 | 0.280 |
| answer_from_chain_smoke | 0.300 | 0.370 | 0.350 | 0.510 |
| config0_path_prompt | 0.180 | 0.260 | 0.288 | 0.020 |
| current_path_prompt | 0.140 | 0.200 | 0.248 | 0.020 |

Pairwise EM movement:

```txt
vs config0 path prompt:       28 wins / 0 losses / 72 ties
vs current path prompt:       33 wins / 1 loss / 66 ties
vs answer-from-chain smoke:   16 wins / 0 losses / 84 ties
vs unrendered candidate:       2 wins / 0 losses / 98 ties
```

Route distribution:

```txt
candidate_direct_rendered: 72/100
fallback_config0_path_prompt: 28/100
```

## Readout

```txt
overrefusal_fixed_by_not_asking_llm_to_regenerate_candidate_answer
```

The answer interface performs better than the LLM answer-from-chain smoke because
it stops treating a complete path object as something the model must re-decide.

The useful object is the path candidate plus a small rendering/fallback policy.
The LLM is not needed for rows where the path already resolved the answer.

## What this does not prove

- It is not a model-quality result beyond this held-out slice.
- It is not a runtime intervention.
- It is not a megakernel gate pass.
- It does not prove the path extractor generalizes globally.
- It does not compare against a fresh unseen offset yet.

## Decision

```txt
use_answer_interface_v0_as_local_policy
no_more_answer_from_chain_prompt_smokes_by_default
no_runtime_mapping_yet
no_megakernel_yet
```

## Next useful work

No GPU required:

```txt
alias and granularity normalization
ambiguous candidate ranking review
fresh no-LLM offset before any new 4090 run
```
