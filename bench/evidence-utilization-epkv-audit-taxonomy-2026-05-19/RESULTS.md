# Evidence-utilization aggregate audit taxonomy v0.8 — 2026-05-19

> Converts existing aggregate sweeps into answer-side risk labels. This is not runtime geometry and not proof of evidence use.

## Boundary

```txt
source: existing aggregate sweeps only
runtime geometry: no
model attention: no
evidence-use proof: no
EPKV behavior: no
```

## Artifacts

```txt
bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/aggregate-audit-records.jsonl
bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/summary.json
```

## Result

```txt
records: 178
by_severity: {"green":83,"red":58,"yellow":37}
by_label: {"green_aggregate_stable":83,"red_low_hit_rate":40,"yellow_moderate_hit_rate":24,"red_high_wrong_distractor_rate":18,"yellow_wrong_distractor_watch":13}
```

## Highest wrong-rate groups

| source | group | keys | runs | hit_rate | wrong_rate | label |
|---|---|---:|---:|---:|---:|---|
| distractor_taxonomy | by_distractor_rank | `{"distractor":"stale_record","canonical_rank":16}` | 144 | 0.028 | 0.938 | red_high_wrong_distractor_rate |
| distractor_taxonomy | by_distractor_rank | `{"distractor":"conflicting_correction","canonical_rank":16}` | 144 | 0.028 | 0.778 | red_high_wrong_distractor_rate |
| distractor_taxonomy | by_distractor_rank | `{"distractor":"stale_record","canonical_rank":8}` | 144 | 0.215 | 0.764 | red_high_wrong_distractor_rate |
| distractor_taxonomy | by_distractor_rank | `{"distractor":"stale_record","canonical_rank":4}` | 144 | 0.236 | 0.708 | red_high_wrong_distractor_rate |
| phase | by_zone_rank_prompt | `{"zone":"top","canonical_rank":8,"prompt":"baseline"}` | 32 | 0.375 | 0.625 | red_high_wrong_distractor_rate |
| distractor_taxonomy | by_distractor | `{"distractor":"stale_record"}` | 576 | 0.361 | 0.602 | red_high_wrong_distractor_rate |
| phase | by_zone_rank_prompt | `{"zone":"top","canonical_rank":4,"prompt":"baseline"}` | 24 | 0.375 | 0.583 | red_high_wrong_distractor_rate |
| distractor_taxonomy | by_distractor_rank | `{"distractor":"conflicting_correction","canonical_rank":8}` | 144 | 0.500 | 0.438 | red_high_wrong_distractor_rate |

## Lowest hit-rate groups

| source | group | keys | runs | hit_rate | wrong_rate | label |
|---|---|---:|---:|---:|---:|---|
| distractor_taxonomy | by_distractor_rank | `{"distractor":"near_duplicate","canonical_rank":16}` | 144 | 0.007 | 0.389 | red_high_wrong_distractor_rate |
| distractor_taxonomy | by_distractor_rank | `{"distractor":"conflicting_correction","canonical_rank":16}` | 144 | 0.028 | 0.778 | red_high_wrong_distractor_rate |
| distractor_taxonomy | by_distractor_rank | `{"distractor":"stale_record","canonical_rank":16}` | 144 | 0.028 | 0.938 | red_high_wrong_distractor_rate |
| prompt_scaffold | by_prompt_decoys | `{"prompt":"structured","decoys_before":15}` | 108 | 0.139 | 0.000 | red_low_hit_rate |
| phase | by_decoys | `{"decoys_before":15}` | 80 | 0.212 | 0.000 | red_low_hit_rate |
| distractor_taxonomy | by_distractor_rank | `{"distractor":"stale_record","canonical_rank":8}` | 144 | 0.215 | 0.764 | red_high_wrong_distractor_rate |
| phase | by_zone_rank_prompt | `{"zone":"bottom","canonical_rank":8,"prompt":"anti_decoy"}` | 32 | 0.219 | 0.250 | red_low_hit_rate |
| phase | by_zone_rank_prompt | `{"zone":"early","canonical_rank":8,"prompt":"anti_decoy"}` | 32 | 0.219 | 0.094 | red_low_hit_rate |

## Stable green examples

| source | group | keys | runs | hit_rate | wrong_rate | label |
|---|---|---:|---:|---:|---:|---|
| depth | by_decoys | `{"decoys_before":0}` | 2400 | 0.840 | 0.000 | green_aggregate_stable |
| prompt_scaffold | by_decoys | `{"decoys_before":0}` | 2160 | 0.867 | 0.000 | green_aggregate_stable |
| depth | by_prompt | `{"prompt":"baseline"}` | 1920 | 0.821 | 0.004 | green_aggregate_stable |
| depth | by_prompt | `{"prompt":"anti_decoy"}` | 1920 | 0.753 | 0.004 | green_aggregate_stable |
| depth | by_depth | `{"depth_chars":160000}` | 1280 | 0.801 | 0.006 | green_aggregate_stable |
| depth | by_depth | `{"depth_chars":80000}` | 1280 | 0.791 | 0.002 | green_aggregate_stable |
| depth | by_depth | `{"depth_chars":20000}` | 1280 | 0.770 | 0.003 | green_aggregate_stable |
| prompt_scaffold | by_rank | `{"canonical_rank":1}` | 864 | 0.988 | 0.000 | green_aggregate_stable |

## Decision

```txt
The evidence-utilization side now has a reusable aggregate audit taxonomy.
It complements the v0.7 geometry bridge but remains answer-side aggregate risk only.
Use it to prioritize which fixture families should receive geometry/runtime bridge coverage next.
```

## Non-claims

- Not EPKV behavior.
- Not runtime telemetry.
- Not production attention.
- Not evidence-use proof.
- Not answer-quality improvement evidence.
