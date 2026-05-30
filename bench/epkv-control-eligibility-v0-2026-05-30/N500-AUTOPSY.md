# N=500 autopsy: why gated control did not win

Day 1 of `EPKV Control Eligibility v0`.

## Question

Why did gated answer rerank fail to beat direct entity-hop path prompting at N=500?

## Source result

The N=500 reality check was:

```txt
path_prompt EM 0.216 / F1 0.324
gated_v1   EM 0.216 / F1 0.323
wins/losses/ties = 2 / 2 / 496
```

This autopsy joins the entity-hop context summary with the gated rerank summary and classifies each row with a machine-only taxonomy.

## Files produced

```txt
build-n500-autopsy.mjs
n500-autopsy-summary.json
n500-taxonomy-all.jsonl
n500-failure-taxonomy.jsonl
TAXONOMY.md
N500-AUTOPSY.md
```

## Macro finding

Direct path prompt solved 108/500 exact-answer cases. The remaining 392 failures are not one thing.

| primary path status | count | share of failures |
|---|---:|---:|
| `evidence_present_not_closed` | 120 | 30.6% |
| `retrieval_answer_absent` | 102 | 26.0% |
| `partial_path_schema_or_support_miss` | 98 | 25.0% |
| `answer_extraction_or_scoring_artifact` | 53 | 13.5% |
| `model_refusal_or_unknown` | 18 | 4.6% |
| `path_schema_miss_answer_present_elsewhere` | 1 | 0.3% |

## Retrieval/path limitation

A large part of the failure mass is not a clean control target.

```txt
retrieval_answer_absent:                 102
partial_path_schema_or_support_miss:      98
path_schema_miss_answer_present_elsewhere: 1
--------------------------------------------
retrieval/path-limited failures:          201 / 392
```

Readout:

```txt
About half of path-prompt failures are retrieval/path/schema limited before any fine-grained control is applied.
```

This explains why a global gated-control layer is unlikely to move aggregate EM/F1.

## Potential control-relevant mass

There is still a non-trivial autopsy slice where control might be worth testing.

```txt
evidence_present_not_closed:             120
answer_extraction_or_scoring_artifact:     53
model_refusal_or_unknown with answer present: 14
---------------------------------------------
potentially control-relevant failures:    187 / 392
```

Readout:

```txt
The B+C hypothesis is not dead, but it must become eligibility-filtered.
```

The strongest Day 2 target is `evidence_present_not_closed`: answer string and full support were present, but path prompt still failed.

## Support signal

Mean recall differs between successes and failures:

| split | support title recall | full support recall |
|---|---:|---:|
| all rows | 0.727 | 0.454 |
| path successes | 0.855 | 0.620 |
| path failures | 0.691 | 0.408 |

Readout:

```txt
Path construction still matters strongly. Control cannot be evaluated without separating support/path completeness.
```

## Gated-control behavior

The gate barely fired:

| rule | count |
|---|---:|
| `not_high_confidence` | 403 |
| `overlap_preserve_path` | 77 |
| `high_confidence_no_overlap_v1` | 20 |

Only 20/500 rows used the verifier override.

Override outcomes:

| outcome | count |
|---|---:|
| ties | 16 |
| EM wins | 2 |
| EM losses | 2 |

Readout:

```txt
The no-delta is not surprising: the gate had narrow coverage, and the few overrides were symmetric.
```

## The four decisive rows

### Wins

#### idx 183

```txt
Question: Who is Thomas Stafford, 3Rd Earl Of Stafford's father?
Gold: Hugh de Stafford, 2nd Earl of Stafford
Path: Hugh Stafford, 2nd Earl of Stafford
Gated: Hugh de Stafford, 2nd Earl of Stafford
```

Likely readout:

```txt
alias/extraction/scoring precision. Control fixed a near-miss answer string.
```

#### idx 204

```txt
Question: Where did George Lane-Fox (Mp)'s father study?
Gold: Christ's College, Cambridge
Path: Not mentioned in the passages.
Gated: Christ's College, Cambridge
```

Likely readout:

```txt
refusal/unknown despite recoverable evidence. This is a plausible control-eligible case.
```

### Losses

#### idx 100

```txt
Question: What nationality is the director of film Madeleine (1950 Film)?
Gold: British
Path: British
Gated: French
```

Likely readout:

```txt
verifier followed a decoy film/director relation. Control harmed a solved path case.
```

#### idx 368

```txt
Question: Who is Sir William Gore, 3Rd Baronet's paternal grandfather?
Gold: Sir Paul Gore, 1st Baronet
Path: Sir Paul Gore, 1st Baronet
Gated: Sir Ralph Gore, 2nd Baronet
```

Likely readout:

```txt
relation-depth confusion: father selected as paternal grandfather. Control harmed a solved path case.
```

## Day 1 gate decision

Continue to Day 2, but narrow the hypothesis.

Allowed hypothesis:

```txt
Fine-grained control may help a detectable eligible slice.
```

Forbidden hypothesis:

```txt
Fine-grained control improves natural RealRAG globally.
```

Why continue:

```txt
187/392 failures are potentially control-relevant by autopsy.
120 failures have answer string and full support present but did not close.
```

Why narrow:

```txt
201/392 failures are retrieval/path/schema limited.
The previous gate only overrode 20/500 rows.
Overrides were 2 wins / 2 losses.
```

## Day 2 task

Build an eligibility spec without gold-derived features.

Candidate operational signals to test:

```txt
path prompt emits refusal/unknown
path and strong disagree
candidate set has high conflict density
support/path titles are present by retriever metadata
verifier confidence is high but path overlap rule blocks override
relation-depth pattern in question type
path output is a title/entity instead of an answer-like span
```

Gold-derived autopsy signals such as `answer_string_present_in_docs` and `candidate_has_gold` can guide design, but cannot be used in the deployable detector.
