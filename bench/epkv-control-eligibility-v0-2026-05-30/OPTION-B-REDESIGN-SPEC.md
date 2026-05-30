# Option B redesign spec - alternative-signal shadow detector

Status: exploratory last attempt after Day 2. This is not a public proof and not an override policy.

## Reason for Option B

Day 2 produced a clean but anecdotal detector:

```txt
eligible: 4/500
EM wins/losses/ties: 2 / 0 / 2
decision: do_not_promote_pivot_or_redesign_detector
```

Felipe requested one last exploratory redesign using different signal families, such as entropy, uncertainty, verifier confidence distribution, or embedding similarity, with stricter criteria.

## Signal availability audit

The existing N=500 artifacts do not contain raw logits, token probabilities, calibrated verifier probability distributions, or non-empty retriever score arrays.

Available:

```txt
question text
path / strong / bge / verifier outputs
categorical verifier confidence
verifier selected candidate ids
verifier rationale text
candidate strings
selected title metadata
```

Unavailable in current artifacts:

```txt
logits entropy
probability margin
token-level uncertainty
numeric verifier confidence distribution
non-empty selected_scores
model hidden-state embeddings
```

Therefore this option uses operational proxies only:

```txt
selection entropy proxy from verifier selected ids
answerer agreement entropy across bge / strong / path / verifier outputs
surface embedding similarity via character trigram cosine
path uncertainty score from refusal/schema/shape markers
direct-evidence score from verifier rationale
candidate variant evidence
specificity direction and compression ratio
```

If a future run stores logits or calibrated confidence vectors, this detector should be rewritten instead of treating these proxies as equivalent.

## Design rule

Option B must be stricter than Day 2 in one way and broader in another:

```txt
stricter: no broad semantic replacement of a concrete path answer
broader: allow non-destructive repairs that Day 2 blocked via containment preservation
```

The detector is allowed to propose only repairs/rescues in narrow lanes. It still runs in shadow mode.

## Forbidden detector inputs

Same as Day 2:

```txt
gold answer
EM / contains / F1
answer_string_present_in_docs
support_title_recall
full_support_recall
primary_path_status
candidate_has_gold
any field derived by comparing to gold
```

## Alternative signals

### `selection_entropy_proxy`

Derived from `verifier.selected`.

```txt
0.0   = exactly one non-UNKNOWN selected candidate
0.5   = two selected candidates
1.0+  = more than two or UNKNOWN included
```

This is not calibrated probability. It is only a dispersion proxy.

### `answerer_agreement_entropy`

Cluster outputs from:

```txt
bge_ref
strong
path_prompt
rerank/verifier
```

using normalized containment and character trigram cosine. Lower entropy means more answerer agreement. This is a diagnostic signal, not a sufficient condition.

### `surface_embedding_similarity`

Character trigram cosine plus token Jaccard between path and verifier outputs.

Used for alias-like repair only when broad replacement is blocked.

### `path_uncertainty_score`

Points for:

```txt
empty output
refusal-like output
schema artifact output
uncertain / not specified / not mentioned
long explanatory sentence instead of answer span
```

### `direct_evidence_score`

Rationale markers such as:

```txt
states
directly states
explicitly states
according to
mentioned in
```

Negative markers such as `reasonable to infer`, `likely`, or `does not directly state` trigger guards.

## Lanes

### Lane 1: `date_specificity_repair`

Purpose: allow a verifier to expand a year-only path answer into a full date only when dispersion is low.

Conditions:

```txt
question asks when/date
path is exactly a year
verifier answer contains the same year plus date words or day/month detail
verifier confidence is high
selection_entropy_proxy == 0
verifier rationale has direct evidence markers
candidate list or another answerer contains the verifier answer
no negative guard fires
```

### Lane 2: `compressed_span_repair`

Purpose: extract a shorter answer span from an overlong path answer.

Conditions:

```txt
path is concrete but overlong or schema-prefixed
verifier answer is a normalized subspan of path
verifier answer is materially shorter than path
verifier confidence is high
selection_entropy_proxy <= 0.5
verifier rationale has direct evidence markers
no negative guard fires
```

Examples of allowed shape, without using gold:

```txt
"X's spouse is Y" -> "Y"
"Place of birth: Z" -> "Z"
```

### Lane 3: `alias_embedding_repair`

Purpose: repair near-identical answer strings without broad semantic replacement.

Conditions:

```txt
path and verifier are both concrete
no normalized containment in either direction
surface_embedding_similarity is high
candidate list contains both variants or another answerer supports the verifier variant
verifier confidence is high
verifier rationale has direct evidence markers
no negative guard fires
```

### Lane 4: `low_selection_entropy_rescue`

Purpose: rescue visibly broken path outputs only when verifier dispersion is minimal.

Conditions:

```txt
path_uncertainty_score >= 1
verifier answer is concrete
verifier confidence is high
selection_entropy_proxy == 0
verifier rationale has direct evidence markers
answer type is compatible with the question
no negative guard fires
```

## Negative guards

```txt
unsupported_inference_risk
relation_depth_confusion_risk
attribute_owner_as_attribute_risk
answer_type_mismatch
specificity_expansion_risk unless Lane 1 applies
semantic_replacement_of_concrete_path unless Lane 2 or Lane 3 applies
UNKNOWN selected for a rescue or repair
```

## Shadow mode

The detector records `would_override`, but final answer remains unchanged.

## Exploratory criteria

Because this is an after-Day-2 exploratory redesign, it cannot by itself authorize an override policy.

### Continue only to a fresh holdout shadow run if all hold

```txt
eligible_count >= 5
EM losses == 0 in posthoc N=500 audit
EM wins >= 3 in posthoc N=500 audit
eligible rows are not dominated by retrieval/path-limited autopsy labels
projected global EM bootstrap CI lower bound >= 0
all operational decisions can be reproduced without gold-derived fields
```

### Do not promote to override unless a fresh holdout later satisfies

```txt
eligible_count >= 20 on fresh data
EM wins > EM losses on fresh data
EM loss rate <= 5 percent of eligible rows
no material damage to path-solved rows
rules frozen before scoring
```

## Interpretation boundary

A good Option B result means only:

```txt
There may be a small, repair-heavy eligible slice worth testing on a fresh holdout.
```

It does not mean:

```txt
EPKV improves RealRAG globally.
The N=500 no-delta is overturned.
The detector is deployable.
```
