# Option B shadow run - alternative-signal detector

This is an exploratory last attempt after Day 2. It is shadow-only and cannot authorize override deployment.

## Signal availability

The existing N=500 artifacts do not contain raw logits, token probabilities, calibrated confidence distributions, or non-empty retriever scores. Option B therefore uses proxy signals only.

## Result

```txt
total rows: 500
eligible: 8
not eligible: 492
```

### Eligible by lane

| lane | count |
|---|---:|
| `compressed_span_repair` | 3 |
| `low_selection_entropy_rescue` | 3 |
| `alias_embedding_repair` | 1 |
| `date_specificity_repair` | 1 |

## Posthoc evaluation

Gold labels are used only after detector decisions are recorded.

| metric | value |
|---|---:|
| eligible EM wins | 5 |
| eligible EM losses | 0 |
| eligible EM ties | 3 |
| eligible target-relevant count | 7 |
| eligible retrieval/path-limited count | 1 |
| projected global EM delta | 0.010000 |
| projected global F1 delta | 0.004699 |

### Eligible rows

| idx | lane | outcome | path | proposed |
|---:|---|---|---|---|
| 102 | `date_specificity_repair` | `win` | 1770 | 2 September 1770 |
| 128 | `low_selection_entropy_rescue` | `tie` | Not specified | Oslo |
| 135 | `compressed_span_repair` | `win` | Imanol Uribe's spouse is María Barranco. | María Barranco |
| 183 | `alias_embedding_repair` | `win` | Hugh Stafford, 2nd Earl of Stafford | Hugh de Stafford, 2nd Earl of Stafford |
| 204 | `low_selection_entropy_rescue` | `win` | Not mentioned in the passages. | Christ's College, Cambridge |
| 219 | `compressed_span_repair` | `win` | Place of birth: San Juan, Puerto Rico | San Juan, Puerto Rico |
| 415 | `low_selection_entropy_rescue` | `tie` | Place of birth | Manhattan |
| 418 | `compressed_span_repair` | `tie` | Barry Mahon was born in Ireland. | Ireland |

## Bootstrap

```json
{
  "option_b_shadow_vs_path_em_diff": {
    "reps": 5000,
    "seed": 20260530,
    "mean": 0.01,
    "ci95": [
      0.002,
      0.02
    ]
  }
}
```

## Exploratory criteria

```json
{
  "continue_to_fresh_holdout_shadow": {
    "eligible_count_at_least_5": true,
    "no_em_losses": true,
    "em_wins_at_least_3": true,
    "not_dominated_by_retrieval_path_limited": true,
    "bootstrap_lower_bound_nonnegative": true,
    "target_concentration_above_baseline": true,
    "pass": true
  },
  "promote_to_override_now": {
    "pass": false,
    "reason": "Forbidden by spec. Option B is exploratory and must be validated on fresh holdout first."
  }
}
```

Decision: `freeze_option_b_for_fresh_holdout_shadow_only`.

## Interpretation

Option B found a small repair-heavy slice with no posthoc EM losses on this inspected N=500. Because it is exploratory after Day 2, it should only be frozen and tested on a fresh holdout shadow run. It should not be promoted to an override policy now.
