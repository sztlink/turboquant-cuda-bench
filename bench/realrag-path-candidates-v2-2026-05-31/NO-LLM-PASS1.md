# No-LLM Pass 1 - Explicit path candidates

## Status

```txt
no_4090_used
manual_review_next
```

This pass builds explicit path candidates before answer generation. It uses the
fresh offset1500 N=100 slice from RealRAG Path Construction v1.

Selection inputs:

```txt
question text
retrieved selected titles
title graph edges
2Wiki context text for retrieved titles
regex/template relation extractors
```

Selection does **not** use:

```txt
gold answer
supporting_facts
evidence triples
LLM verifier score
LLM prompt output
```

Gold/support/evidence fields are used only after selection for diagnostics.

## Artifacts

```txt
build-path-candidates-v2.mjs
path-candidates-offset1500-n100.jsonl
path-candidate-summary.json
build-answer-from-chain-packets.mjs
answer-from-chain-packets-offset1500-n100.jsonl
```

## Operational metrics

| metric | value |
|---|---:|
| rows | 100 |
| start entity found | 0.98 |
| candidate row rate | 0.98 |
| top answer candidate rate | 0.71 |
| single top candidate rate | 0.29 |
| ambiguous top candidate rate | 0.32 |
| rows with generic-title suppression | 73 |
| generic titles suppressed | 146 |
| average candidate count | 4.61 |

## Posthoc diagnostics

These diagnostics are not used for candidate selection.

| metric | explicit path candidate | config0 path prompt | delta |
|---|---:|---:|---:|
| EM | 0.400 | 0.180 | +0.220 |
| contains | 0.480 | 0.260 | +0.220 |
| F1 | 0.495 | 0.288 | +0.207 |

Pairwise EM movement vs config0 path prompt:

```txt
wins: 25
losses: 3
ties: 72
```

Pairwise EM movement vs current path prompt:

```txt
wins: 28
losses: 2
ties: 70
```

Path support diagnostics:

| metric | value |
|---|---:|
| top path support-title recall | 0.825 |
| top path full-support rate | 0.640 |

## Why this matters

RS5 showed that prompt-level guards failed by over-refusal. This pass moves the
control object upstream:

```txt
not answer override
not prompt guard
explicit path object before answer generation
```

The path object is now strong enough for manual review because it improves the
posthoc answer diagnostic over the same offset1500 config0 path-prompt run without
using gold during selection.

This is **not yet** a public RealRAG quality claim. It is an internal gate result:

```txt
path candidates look materially better than prompt guards
manual review before any new 4090 answer-from-chain run
```

## Template notes

Strongest families in this first pass:

```txt
paternal_grandfather
father_date_of_birth
father_date_of_death
director_place_of_birth
```

Known weak families:

```txt
spouse_place_of_birth
father_country_of_citizenship
performer_place_of_birth
award_received
country/nationality normalization
```

The explicit path object catches many cases where the LLM stopped one hop too early.
Examples from the fresh offset1500 slice:

| idx | template | config0 path prompt | explicit path candidate | gold |
|---:|---|---|---|---|
| 1500 | paternal_grandfather | Wymond Carew | John Carew | John Carew |
| 1504 | performer_father | Rufus Wainwright | Loudon Wainwright III | Loudon Wainwright III |
| 1508 | paternal_grandfather | King Louis VI of France | Robert I, Count of Dreux | Robert I, Count of Dreux |
| 1509 | paternal_grandmother | Duchess Amelia of Württemberg | Duchess Charlotte Georgine of Mecklenburg-Strelitz | Duchess Charlotte Georgine of Mecklenburg-Strelitz |
| 1513 | spouse_date_of_death | 1974 | 9 January 1993 | 9 January 1993 |
| 1515 | father_place_of_death | November 5, 1990 | Manhattan | Manhattan |
| 1516 | father_date_of_death | 14 October 1172 | 2 February 1345 | 2 February 1345 |
| 1526 | father_date_of_birth | 1501 | 1485 | 1485 |

Remaining losses vs config0 path prompt are informative:

| idx | template | explicit path candidate | gold | config0 path prompt |
|---:|---|---|---|---|
| 1576 | director_educated_at | Krastyo Sarafov National Academy for Theatre | Krastyo Sarafov National Academy for Theatre and Film Arts | Krastyo Sarafov National Academy for Theatre and Film Arts |
| 1584 | director_place_of_birth | Cedofeita | Porto | Porto |
| 1598 | composer_award_received | no candidate | State Artist | State Artist |

## Answer-from-chain packets

A dry-run packet builder now emits the future smoke-test prompts without calling an
LLM:

```txt
answer-from-chain-packets-offset1500-n100.jsonl
rows: 100
complete candidate paths: 71
```

The prompt contains the question, explicit chain steps, snippets, answer slot, and
candidate final answer. `eval_gold` is stored only as metadata and must not be
included in a live prompt.

## Decision

```txt
manual_review_next
no_4090_yet
```

Manual review should inspect:

```txt
candidate ranking on ambiguous rows
place granularity normalization
institution-name truncation
award/composer extraction
country/nationality normalization
```

Only after that should an answer-from-selected-chain smoke be considered, and only
with explicit infra authorization.
