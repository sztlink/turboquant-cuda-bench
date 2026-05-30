# Day 2 shadow run - eligibility detector v0

This is a shadow run. It does not change final answers.

## Detector result

```txt
total rows: 500
eligible: 4
not eligible: 496
```

### By lane

| lane | count |
|---|---:|
| `abstain_preserve_path` | 438 |
| `guarded_no_claim` | 53 |
| `no_claim` | 5 |
| `path_failure_rescue` | 3 |
| `alias_or_answer_repair` | 1 |

## Posthoc evaluation

Posthoc scoring uses gold labels only after detector decisions are recorded.

| metric | value |
|---|---:|
| eligible target-relevant count | 4 |
| eligible retrieval/path-limited count | 0 |
| eligible path-solved count | 0 |
| eligible EM wins | 2 |
| eligible EM losses | 0 |
| eligible EM ties | 2 |
| projected global EM delta | 0.004000 |
| projected global F1 delta | 0.002154 |

### Eligible rows

| idx | lane | posthoc status | outcome | path | proposed |
|---:|---|---|---|---|---|
| 128 | `path_failure_rescue` | `model_refusal_or_unknown` | `tie` | Not specified | Oslo |
| 183 | `alias_or_answer_repair` | `answer_extraction_or_scoring_artifact` | `win` | Hugh Stafford, 2nd Earl of Stafford | Hugh de Stafford, 2nd Earl of Stafford |
| 204 | `path_failure_rescue` | `model_refusal_or_unknown` | `win` | Not mentioned in the passages. | Christ's College, Cambridge |
| 415 | `path_failure_rescue` | `evidence_present_not_closed` | `tie` | Place of birth | Manhattan |

## Bootstrap

```json
{
  "gated_v1_vs_path_em_diff": {
    "reps": 5000,
    "seed": 20260530,
    "mean": 0,
    "ci95": [
      -0.008,
      0.008
    ]
  },
  "shadow_policy_vs_path_em_diff": {
    "reps": 5000,
    "seed": 20260530,
    "mean": 0.004,
    "ci95": [
      0,
      0.01
    ]
  }
}
```

## Criteria decision

```json
{
  "promote_to_override_pilot": {
    "eligible_count_at_least_20": false,
    "em_wins_greater_than_losses": true,
    "no_unexplained_em_losses": true,
    "not_dominated_by_retrieval_path_limited": true,
    "no_material_path_solved_damage": true,
    "pass": false
  },
  "continue_detector_iteration": {
    "eligible_count_at_least_5": false,
    "em_wins_at_least_losses": true,
    "higher_target_concentration_than_baseline": true,
    "no_obvious_em_loss": true,
    "pass": false
  }
}
```

Decision: `do_not_promote_pivot_or_redesign_detector`.

## Interpretation

The detector is too narrow or insufficiently validated to promote to an override policy. Preserve as a negative/diagnostic receipt and either redesign detector criteria or pivot to retrieval/path work.
