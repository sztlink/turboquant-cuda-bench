# Option B shadow run - alternative-signal detector

This is an exploratory last attempt after Day 2. It is shadow-only and cannot authorize override deployment.

## Signal availability

The existing N=500 artifacts do not contain raw logits, token probabilities, calibrated confidence distributions, or non-empty retriever scores. Option B therefore uses proxy signals only.

## Result

```txt
total rows: 100
eligible: 1
not eligible: 99
```

### Eligible by lane

| lane | count |
|---|---:|
| `low_selection_entropy_rescue` | 1 |

## Posthoc evaluation

Gold labels are used only after detector decisions are recorded.

| metric | value |
|---|---:|
| eligible EM wins | 0 |
| eligible EM losses | 0 |
| eligible EM ties | 1 |
| eligible target-relevant count | 0 |
| eligible retrieval/path-limited count | 1 |
| projected global EM delta | 0.000000 |
| projected global F1 delta | 0.004000 |

### Eligible rows

| idx | lane | outcome | path | proposed |
|---:|---|---|---|---|
| 557 | `low_selection_entropy_rescue` | `tie` | Place of origin | Lugdunum in Roman Gaul |

## Bootstrap

```json
{
  "option_b_shadow_vs_path_em_diff": {
    "reps": 5000,
    "seed": 20260530,
    "mean": 0,
    "ci95": [
      0,
      0
    ]
  }
}
```

## Exploratory criteria

```json
{
  "continue_to_fresh_holdout_shadow": {
    "eligible_count_at_least_5": false,
    "no_em_losses": true,
    "em_wins_at_least_3": false,
    "not_dominated_by_retrieval_path_limited": false,
    "bootstrap_lower_bound_nonnegative": true,
    "target_concentration_above_baseline": false,
    "pass": false
  },
  "promote_to_override_now": {
    "pass": false,
    "reason": "Forbidden by spec. Option B is exploratory and must be validated on fresh holdout first."
  }
}
```

Decision: `stop_option_b_or_redesign_again_not_recommended`.

## Interpretation

Option B did not satisfy the exploratory criteria. Further detector redesign is not recommended before pivoting to retrieval/path or preserving the negative result.
