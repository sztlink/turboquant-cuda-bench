# RealRAG Path Candidates v2 - plan

## Status

Opened after RS5 closed prompt-guard iteration.

Input receipt:

```txt
Boring Receipts RS5 - RealRAG Path Construction v1 - Retrieval Coverage Reproduced, Prompt Guards Failed
```

Input artifacts:

```txt
bench/realrag-path-construction-v1-2026-05-30/RETRIEVAL-GRID.md
bench/realrag-path-construction-v1-2026-05-30/ANSWER-QUALITY-OFFSET1500.md
bench/realrag-path-construction-v1-2026-05-30/GUARDED-PATH-OFFSET1500.md
bench/realrag-path-construction-v1-2026-05-30/NARROW-GUARDS-OFFSET1500.md
```

## Council decision

```txt
Stop prompt guards.
Move upstream to explicit path-candidate construction.
No 4090 until the path object improves on a fresh no-LLM slice.
```

## Working thesis

```txt
The model is receiving a noisy set of passages and a heuristic graph.
Prompt instructions cannot reliably force the correct relation path.
The next object must be a visible candidate path before answer generation.
```

## What v1 proved

```txt
retrieval coverage can be improved by reducing noisy expansion
fresh offset1500 full_support_recall improved 0.230 -> 0.380
fresh offset1500 answer_present improved 0.570 -> 0.760
fresh answer quality was mixed, EM +0.040 and F1 +0.040
all-purpose prompt guards failed by over-refusal
global guarded refusal rate: 0.68
narrow guard-family refusal rate: 0.47 to 0.55
```

## Non-goals

Do not do in v2:

```txt
No more prompt wording tweaks as the primary intervention.
No answer override gate.
No gold answer in operational selection.
No 4090 LLM answer run until no-LLM path metrics improve.
No public positive claim from path instrumentation alone.
```

## Object to build

A path candidate is a structured object built before answer generation:

```json
{
  "question_id": "...",
  "question_type": "who|where|when|which_country|nationality|institution|other",
  "template": "media_attribute|parent_attribute|grandparent|spouse|direct_attribute|unknown",
  "start_entities": ["..."],
  "owner_entity": "...",
  "target_relation": "father|mother|spouse|performer|director|composer|place_of_birth|date_of_death|...",
  "candidate_chain": [
    {"from":"...", "relation_hint":"...", "to":"...", "evidence_title":"...", "source":"title_edge|selected_title|question_match"}
  ],
  "answer_slot": "person|place|date|country|nationality|institution|other",
  "risk_flags": ["generic_title", "same_family_neighborhood", "relation_depth", "attribute_owner"],
  "operational_score": 0.0
}
```

## No-LLM phases

### Phase 1 - candidate extraction from existing summaries

Input:

```txt
answer-quality-offset1500-n100-config0/summary.json
answer-quality-offset1500-n100-current/summary.json
```

Build candidates from:

```txt
question surface spans
selected_titles
entity/title edges
non-generic title filter
relation templates
media-chain templates
family/title-neighborhood density
```

Output:

```txt
path-candidates-offset1500-n100.jsonl
path-candidate-summary.json
```

Operational metrics, no gold selection:

```txt
candidate_count
start_entity_found_rate
owner_entity_candidate_rate
non_generic_candidate_rate
single_top_candidate_rate
ambiguous_top_candidate_rate
generic_title_suppression_count
same_family_neighborhood_count
relation_depth_template_count
attribute_owner_template_count
```

Posthoc diagnostics, not used for selection:

```txt
full_support_recall_by_candidate_state
answer_present_by_candidate_state
EM/F1 by candidate_state from prior answer run
```

### Phase 2 - path candidate filtering

Test no-LLM filters:

```txt
generic title suppression
question-span anchored starts
relation-depth templates
attribute-owner templates
media-chain exact work title first
same-family neighborhood demotion unless directly linked
```

Gate to continue:

```txt
start_entity_found_rate improves or stays high
non_generic_candidate_rate improves
ambiguous_top_candidate_rate decreases
posthoc answer-present does not drop
```

### Phase 3 - answer-from-chain smoke only after gate

Only with `[CONFIRMAR:INFRA]`:

```txt
same offset1500 n100
same retrieved docs
compare unstructured path_prompt vs answer_from_selected_chain
```

Pass condition:

```txt
F1 delta >= +0.05 vs unstructured path_prompt
EM wins > losses
UNKNOWN/refusal rate <= unstructured path_prompt + 0.05
```

## Stop rules

Stop before LLM if:

```txt
candidate extraction mostly selects generic titles
candidate extraction cannot identify start/owner entity in >= 50% rows
filters reduce answer_present proxy sharply
ambiguous candidates remain dominant
```

Stop after one LLM smoke if:

```txt
F1 delta < +0.05
losses match or exceed wins
refusal rate rises
failures are same-family or attribute-owner drift again
```

## First implementation task

Create a no-LLM builder:

```txt
build-path-candidates-v2.mjs
```

It should read existing v1 summary JSONs and emit path-candidate JSONL plus a summary.

No 4090 required.
