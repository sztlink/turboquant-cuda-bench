# Answer Interface v0 Holdout, offset2000 N=100

## Status

```txt
fresh_no_llm_holdout
weak_generalization
no_4090
no_llm_call
no_runtime_mapping
no_megakernel
```

## Question

Does the Answer Interface v0 result from offset1500 survive a fresh no-LLM slice?

This holdout tests the part that can be tested without the 4090:

```txt
retrieval rows -> explicit path candidates -> direct rendered answer when candidate exists
```

It does not run a fresh path-prompt baseline, so it is not a full replacement for
the offset1500 comparison against config0 path prompt.

## Inputs

Retrieval-only run:

```txt
holdout-offset2000-n100-config0-skipllm/summary.json
```

Command shape:

```txt
epkv-entity-hop-retrieval.py \
  --offset 2000 \
  --limit 100 \
  --top-k 10 \
  --bm25-first 8 \
  --seed-top 0 \
  --second-per-mention 0 \
  --max-seed-expansions 4 \
  --max-doc-mentions 3 \
  --pool-limit 80 \
  --skip-llm \
  --skip-bge \
  --skip-extract
```

## Retrieval-only coverage

| metric | value |
|---|---:|
| support title recall | 0.724 |
| full support recall | 0.440 |
| answer string present rate | 0.810 |

Retrieval coverage is not the bottleneck on this slice.

## Path candidate holdout

| metric | value |
|---|---:|
| start entity found rate | 0.990 |
| candidate row rate | 0.930 |
| top answer candidate rate | 0.580 |
| single top candidate rate | 0.320 |
| ambiguous top candidate rate | 0.240 |
| top path support title recall | 0.795 |
| top path full support rate | 0.680 |

Posthoc diagnostics for the top candidate:

| object | EM | contains | F1 | missing/refusal |
|---|---:|---:|---:|---:|
| answer_interface_v0, no baseline fallback available | 0.150 | 0.260 | 0.276 | 0.420 |
| candidate_direct_unrendered | 0.150 | 0.260 | 0.271 | 0.420 |

For comparison, offset1500 had:

| object | EM | contains | F1 | missing/refusal |
|---|---:|---:|---:|---:|
| answer_interface_v0 with config0 fallback | 0.460 | 0.570 | 0.557 | 0.010 |
| candidate_direct_unrendered | 0.440 | 0.540 | 0.527 | 0.280 |

## Readout

```txt
answer_interface_v0_did_not_generalize_as_a_no_llm_candidate_extractor_on_offset2000
```

The fresh slice has good retrieval coverage but weak answer closure. The path object
is often near the right evidence, but the answer extractor/ranker is not stable
enough to justify a positive receipt or any runtime/kernel work.

## Failure shape

Common observed failures:

```txt
missing answer candidate despite support titles present
city vs city+region granularity mismatch
country vs demonym alias mismatch
appositive/person descriptor not fully rendered
relation parser lacks uncle/child templates
wrong family edge chosen in crowded genealogy rows
```

Examples:

```txt
idx 2000: spouse_place_of_birth, gold Westminster, no answer candidate
idx 2004: director_place_of_death, output Hamburg, gold Hamburg, Germany
idx 2007: director_place_of_birth, output Paterson, gold Paterson, New Jersey
idx 2069: director_country_of_citizenship, output Austrian, gold Austria
idx 2073: director_country_of_citizenship, output American, gold America
```

## Decision

```txt
no RS6 positive receipt
no 4090 continuation from this result
no runtime mapping
no megakernel
revise candidate extractor alias/granularity before more GPU
```

## Next useful work

No GPU:

```txt
1. Add alias/granularity policy spec before implementation.
2. Add missing relation templates only if they are explicit in the question parser.
3. Re-run offset1500 and offset2000 no-LLM after the spec.
4. Only consider 4090 if both slices clear a candidate-quality gate.
```
