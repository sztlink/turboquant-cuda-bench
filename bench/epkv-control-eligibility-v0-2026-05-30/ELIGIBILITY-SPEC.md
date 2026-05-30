# EPKV Control Eligibility v0 - Day 2 pre-registration

Status: pre-registered detector spec for a shadow run. This is not an override policy.

## Question

After the N=500 no-delta, is there a natural, detectable, reproducible slice where control could help entity-hop RealRAG without damaging cases already closed by the path prompt?

## Non-claim

This spec does not claim EPKV improves natural RealRAG globally.

It only defines an operational detector to test whether the autopsy categories from Day 1 have any detectable surface without using gold-derived features.

## Source artifacts

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-llm-500/summary.json
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-answer-rerank-gated-v1-500/summary.json
bench/epkv-control-eligibility-v0-2026-05-30/n500-taxonomy-all.jsonl
```

The first two files provide operational inputs. The taxonomy file is allowed only for posthoc evaluation.

## Allowed detector inputs

The detector may use:

```txt
question text
path_prompt output text only
rerank/verifier output text only
verifier confidence string
verifier selected field
verifier rationale text
candidate strings
selected titles and edge/title metadata from retrieval context
surface features derived from those strings
```

## Forbidden detector inputs

The detector must not use:

```txt
gold answer
EM / contains / F1 labels
answer_string_present_in_docs
support_title_recall
full_support_recall
primary_path_status
candidate_has_gold
any field derived by comparing to gold
```

Those fields may only appear in a posthoc evaluation block after the detector has already made its decision.

## Operational states

### `closed`

The path output is concrete, answer-like, and not caught by a repair condition. The detector should preserve path.

### `near_closed`

The path output is concrete and the verifier output is also concrete, with high token-level similarity but no full normalized containment. This is a candidate for non-destructive answer repair, not broad semantic replacement.

### `open_broken`

The path output is visibly not closed without seeing gold. Examples:

```txt
empty output
UNKNOWN / not mentioned / not specified / uncertain
schema artifact such as "place of birth" or "date of death"
long explanatory sentence rather than answer span
answer-type mismatch for the question
```

This is a candidate for path-failure rescue only if the verifier answer is concrete, high-confidence, type-compatible, and no negative guard fires.

### `guarded_no_claim`

The row might look tempting, but a negative guard fired. The detector records the row and abstains.

### `out_of_scope_for_control`

The row does not provide enough operational evidence for a control decision. It may be retrieval/path/schema limited, but that is not asserted operationally unless shown by non-gold metadata.

## Lanes

### Lane A: `alias_or_answer_repair`

Purpose: repair a near-closed answer surface without broad semantic replacement.

Activation conditions:

```txt
verifier confidence is high
path output is concrete
verifier output is concrete
path and verifier do not have full normalized containment in either direction
token Jaccard(path, verifier) >= 0.72
answer type is compatible with the question
no negative guard fires
```

This lane is meant for cases like missing particles, spelling/canonicalization, or span tightening where the two strings clearly name almost the same answer.

### Lane B: `path_failure_rescue`

Purpose: test whether control can rescue visibly broken path outputs.

Activation conditions:

```txt
verifier confidence is high
path output is not concrete, or is a schema artifact / refusal-like answer
verifier output is concrete
path and verifier do not have full normalized containment in either direction
answer type is compatible with the question
no negative guard fires
```

### Lane C: `abstain_preserve_path`

Purpose: protect closed path answers and avoid semantic replacement when the path looks answer-like.

### Lane D: `guarded_no_claim`

Purpose: preserve rows where a tempting verifier output carries visible risk.

## Negative guards

### `containment_preserve_path`

If path and verifier have full normalized containment in either direction, do not use semantic override. This avoids replacing a more specific answer with a shorter one or vice versa during Day 2.

### `relation_depth_confusion_risk`

If the question asks for a grandparent or a maternal/paternal relation and the verifier rationale appears to select a one-hop parent/child relation as the answer, abstain.

### `unsupported_inference_risk`

If the verifier rationale says the answer is inferred from context rather than directly stated, abstain. Trigger phrases include:

```txt
reasonable to infer
production context
does not directly state
not directly state
likely
probably
```

### `attribute_owner_as_attribute_risk`

For questions asking for place/date attributes, if the verifier answer is described as the director, performer, composer, father, mother, husband, wife, son, or daughter whose attribute is needed, abstain. This blocks selecting the owner of the attribute instead of the attribute value.

### `answer_type_mismatch`

If the answer shape visibly conflicts with the question type, abstain. Minimal rules:

```txt
when/date questions require a date-like answer
nationality questions require a short non-date answer
where/place questions reject date-like and refusal-like answers
```

## Shadow decision

Day 2 does not change the final answer.

For each row, the detector records:

```txt
eligible true/false
lane
reasons
guards
would_override true/false
final_answer_unchanged true
```

## Posthoc evaluation

After decisions are recorded, the script may join Day 1 taxonomy and scoring to measure:

```txt
eligible_count
lane counts
wins/losses/ties vs path if the proposed verifier answer had been used
F1 delta vs path
autopsy-label distribution inside eligible rows
retrieval/path-limited contamination
path-solved damage risk
```

This posthoc block is for audit only, not detector input.

## Criteria at the end of Day 2

### Promote to an actual override pilot only if all hold

```txt
eligible_count >= 20
EM wins > EM losses
EM losses == 0 or every loss is explained by a pre-registered guard fix
eligible rows are not dominated by retrieval/path-limited autopsy labels
no material damage to rows solved by path_prompt
rules are reproducible without gold-derived features
```

### Continue detector iteration only if all hold

```txt
eligible_count >= 5
EM wins >= EM losses in posthoc shadow evaluation
eligible rows show higher concentration of potentially control-relevant autopsy labels than the full sample baseline
qualitative audit finds no obvious guard class missing
```

### Stop or pivot if any hold

```txt
eligible_count is anecdotal
eligible precision is near the baseline rate
eligible rows are dominated by retrieval/path-limited failures
losses appear in already-closed path cases
rules require gold-derived information to work
```

## Interpretation boundary

A passing Day 2 detector would only authorize a small pilot. It would not authorize a public claim that EPKV improves RealRAG.

A failing Day 2 detector should be preserved as a useful negative receipt and should push the next decision toward detector redesign, retrieval/path work, or freezing the v0 result.
