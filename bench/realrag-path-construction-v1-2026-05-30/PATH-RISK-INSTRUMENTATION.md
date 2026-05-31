# Path-risk instrumentation and guard plan

## Status

Done. This is a no-LLM instrumentation pass over the existing offset500 and offset1500 answer-quality runs.

Generated files:

```txt
path-risk-instrumentation-summary.json
path-risk-cases.jsonl
path-risk-guard-spec.json
```

## Why

Config0 improved retrieval coverage, but fresh answer quality did not clear the gate. The next step is to identify operational risk states before spending more 4090 time.

## Runs analyzed

| run | n | wins | losses | ties | avg EM delta | avg F1 delta | type mismatches |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| offset500 | 100 | 10 | 4 | 86 | 0.060 | 0.082 | 25 |
| offset1500 | 100 | 10 | 6 | 84 | 0.040 | 0.040 | 31 |
| overall | 200 | 20 | 10 | 170 | 0.050 | 0.061 | 56 |

## Operational flags

| flag | count | share | wins | losses | avg EM delta | avg F1 delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| answer_granularity_risk | 126 | 0.630 | 12 | 6 | 0.048 | 0.079 |
| attribute_owner_risk | 114 | 0.570 | 11 | 7 | 0.035 | 0.054 |
| same_family_title_neighborhood | 113 | 0.565 | 12 | 7 | 0.044 | 0.059 |
| relation_depth_risk | 95 | 0.475 | 13 | 5 | 0.084 | 0.096 |
| candidate_crowding | 37 | 0.185 | 4 | 0 | 0.108 | 0.120 |
| generic_distractor_density | 35 | 0.175 | 3 | 0 | 0.086 | 0.101 |
| target_entity_sparse | 20 | 0.100 | 1 | 1 | 0.000 | -0.053 |
| no_flag | 12 | 0.060 | 1 | 0 | 0.083 | 0.139 |

## Guard interpretation

The risk flags are operational proxies. They do not use the gold answer to decide the guard. Gold is only used in the eval block to count wins and losses after the fact.

Most important guard families:

```txt
attribute_owner_risk
relation_depth_risk
answer_granularity_risk
generic_distractor_density
same_family_title_neighborhood
```

## Decision

Do not spend another 4090 run on config0 alone. The next LLM run should test the guarded path prompt or an explicit pre-answer path filter.

Minimum next test:

```txt
offset1500 n100
current config0 path_prompt
vs config0 guarded_path_prompt
same selected docs, only prompt guard changes
```

Pass condition:

```txt
losses decrease without erasing wins
F1 delta vs unguarded config0 >= +0.03
UNKNOWN/refusal rate does not dominate
```

## Non-claims

This instrumentation does not claim that the guards work. It only defines what must be tested before the next positive claim.
