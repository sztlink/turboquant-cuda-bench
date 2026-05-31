# Manual review next

## Purpose

This is the review queue after the no-LLM explicit path-candidate pass.

Do this before any 4090 answer-from-chain smoke.

## Current gate state

```txt
path candidates are promising
manual review required
no 4090 yet
```

Pass 1 posthoc diagnostic on fresh offset1500 N=100:

```txt
explicit path candidate: EM 0.400 / contains 0.480 / F1 0.495
config0 path prompt:     EM 0.180 / contains 0.260 / F1 0.288
pairwise vs config0:     25 wins / 3 losses / 72 ties
```

Selection did not use gold answers. Metrics above are posthoc diagnostics.

## Review target 1 - the 3 EM losses vs config0

| idx | template | explicit candidate | gold | config0 path prompt | likely fix |
|---:|---|---|---|---|---|
| 1576 | director_educated_at | Krastyo Sarafov National Academy for Theatre | Krastyo Sarafov National Academy for Theatre and Film Arts | Krastyo Sarafov National Academy for Theatre and Film Arts | institution normalization should not truncate `and Film Arts` |
| 1584 | director_place_of_birth | Cedofeita | Porto | Porto | place granularity, district vs city |
| 1598 | composer_award_received | no candidate | State Artist | State Artist | composer/award extraction missing |

These are the highest-priority fixes because config0 path prompt already got them right.

## Review target 2 - no-answer rows by template

| template | no-answer rows |
|---|---:|
| director_place_of_birth | 8 |
| spouse_place_of_birth | 4 |
| father_place_of_birth | 2 |
| father_place_of_death | 2 |
| performer_place_of_birth | 2 |
| spouse_employer | 1 |
| composer_educated_at | 1 |
| paternal_grandmother | 1 |
| father_date_of_death | 1 |
| mother_place_of_birth | 1 |
| spouse_place_of_burial | 1 |
| director_place_of_death | 1 |
| director_country_of_citizenship | 1 |
| performer_award_received | 1 |
| performer_country_of_citizenship | 1 |
| composer_award_received | 1 |

The largest cluster is place extraction after a correctly found director/spouse/father.
Do not solve this with prompt text. Solve it in path/slot extraction or candidate normalization.

## Review target 3 - ambiguous top candidates

32 rows have top-two operational score gap below 3. Some are correct despite ambiguity;
some expose ranking bugs.

Highest-priority ambiguous examples:

| idx | template | top | second | gold | note |
|---:|---|---|---|---|---|
| 1507 | paternal_grandmother | Johann Adolf I, Duke of Saxe-Weissenfels | Johanna Magdalena of Saxe-Altenburg | Johanna Magdalena of Saxe-Altenburg | wrong parent side won tie |
| 1511 | father_in_law | of Osman I | Suleyman Shah | Suleyman Shah | bad cleanup of `father of Osman I` sentence |
| 1522 | paternal_grandfather | Duke Casimir I the Restorer | Duke Casimir I the Restorer | Casimir I the Restorer | title-prefix normalization |
| 1530 | composer_place_of_birth | New York City | New York City | New York | place granularity |
| 1540 | director_country_of_citizenship | Russian | Russian | Soviet | nationality/time-period normalization |
| 1544 | father_place_of_death | Sibyllenort in Lower Silesia | Sibyllenort in Lower Silesia | Szczodre | historical/place alias normalization |
| 1551 | paternal_grandmother | Gundred de Warenne, daughter of William de Warenne, 2nd Earl of Surrey | Elizabeth de Vermandois | Gundred de Warenne | trailing descriptor cleanup |

## Safe next code changes

All are no-LLM and do not require infra:

```txt
1. Split extraction cleanup by answer slot, not by generic cleanValue.
2. Add institution cleanup that preserves `and Film Arts` style names.
3. Add relation-specific place variants: city, city+region, historical alias.
4. Penalize terminal graph-neighbor answers for attribute slots unless text extraction also supports them.
5. Add title-prefix normalization for Duke/Sir/Queen only as posthoc answer rendering, not path selection.
6. Add composer/award and performer/award extractors.
7. Add ambiguity audit: top candidate must beat second by score gap or by support-title coverage.
```

## Future answer-from-chain smoke

The dry-run packets are already built:

```txt
answer-from-chain-packets-offset1500-n100.jsonl
rows: 100
complete candidate paths: 71
```

Do not run them yet. First tighten the no-LLM candidate object and rerun pass 1.

## Stop rule

If a cleanup improves EM by making answer rendering match gold but reduces support-title
recall or increases ambiguous ranking, reject it. The object to improve is the path,
not a gold-shaped string formatter.
