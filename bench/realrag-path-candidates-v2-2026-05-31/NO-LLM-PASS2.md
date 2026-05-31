# No-LLM Pass 2 - candidate cleanup before answer smoke

## Status

```txt
no_4090_used_for_pass2
manual_review_fixes_applied
answer_smoke_authorized_after_this_pass
```

This pass addresses the manual-review queue from Pass 1 before spending GPU on an
answer-from-chain smoke.

## Fixes applied

All fixes are local/no-LLM and do not use gold during selection.

```txt
- fixed false generic-title suppression of `The Broken Disk`
- preserved institution names containing `and`, e.g. `Theatre and Film Arts`
- added `named a "State Artist"` award extraction
- added mother extraction from `by his first wife, ...`
- stopped treating `father of X` as a father relation for the subject
- added a narrow place-granularity cleanup for sublocality/city form
- kept terminal graph-neighbor answers disabled for attribute slots unless text supports them
```

## Operational metrics

| metric | pass 1 | pass 2 |
|---|---:|---:|
| start entity found | 0.98 | 0.99 |
| candidate row rate | 0.98 | 0.99 |
| top answer candidate rate | 0.71 | 0.72 |
| single top candidate rate | 0.29 | 0.31 |
| ambiguous top candidate rate | 0.32 | 0.31 |
| generic-title suppression rows | 73 | 73 |
| generic titles suppressed | 146 | 145 |
| average candidate count | 4.61 | 4.57 |

## Posthoc diagnostics

Gold/support/evidence are used only after selection for diagnostics.

| metric | pass 1 explicit path | pass 2 explicit path | config0 path prompt |
|---|---:|---:|---:|
| EM | 0.400 | 0.440 | 0.180 |
| contains | 0.480 | 0.540 | 0.260 |
| F1 | 0.495 | 0.527 | 0.288 |
| support title recall | 0.825 | 0.835 | n/a |
| full support rate | 0.640 | 0.650 | n/a |

Pairwise EM movement vs config0 path prompt:

```txt
pass 1: 25 wins / 3 losses / 72 ties
pass 2: 26 wins / 0 losses / 74 ties
```

Pairwise EM movement vs current path prompt:

```txt
pass 1: 28 wins / 2 losses / 70 ties
pass 2: 31 wins / 1 loss / 68 ties
```

## Manual-review targets resolved

| idx | template | pass 1 | pass 2 | gold |
|---:|---|---|---|---|
| 1576 | director_educated_at | Krastyo Sarafov National Academy for Theatre | Krastyo Sarafov National Academy for Theatre and Film Arts | Krastyo Sarafov National Academy for Theatre and Film Arts |
| 1584 | director_place_of_birth | Cedofeita | Porto | Porto |
| 1598 | composer_award_received | no candidate | State Artist | State Artist |

## Decision

```txt
pass2_ready_for_answer_from_chain_smoke
```

This still is not a public RealRAG quality claim. It is a stronger no-LLM path
object that justified one authorized answer-from-chain smoke.
