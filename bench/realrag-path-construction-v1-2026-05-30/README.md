# RealRAG Path Construction v1

Operational front opened after gated-control closure.

## Status

Retrieval-only grid complete. Offset500 answer-quality run complete. Fresh offset1500 answer-quality run complete.

Key docs:

- [`PLAN.md`](PLAN.md)
- [`RETRIEVAL-GRID.md`](RETRIEVAL-GRID.md)
- [`ANSWER-QUALITY-OFFSET500.md`](ANSWER-QUALITY-OFFSET500.md)
- [`ANSWER-QUALITY-OFFSET1500.md`](ANSWER-QUALITY-OFFSET1500.md)
- [`retrieval-grid-summary.json`](retrieval-grid-summary.json)
- [`answer-quality-offset500-n100-comparison.json`](answer-quality-offset500-n100-comparison.json)
- [`answer-quality-offset1500-n100-comparison.json`](answer-quality-offset1500-n100-comparison.json)

## Main finding

The same cheap retrieval config won offsets 0, 500 and 1000:

```txt
bm25_first: 8
seed_top: 0
second_per_mention: 0
max_doc_mentions: 3
pool_limit: 80
top_k: 10
```

Coverage vs current-config retrieval-only baseline:

```txt
offset 0:   full_support_and_answer +0.190
offset 500: full_support_and_answer +0.130
```

## Answer-quality offset500

Against the existing offset500 path_prompt baseline:

```txt
EM: 0.210 -> 0.270, delta +0.060
F1: 0.295 -> 0.376, delta +0.082
wins/losses/ties: 10 / 4 / 86
```

## Fresh answer-quality offset1500

Against a same-slice current-config comparator:

```txt
EM: 0.140 -> 0.180, delta +0.040
F1: 0.248 -> 0.288, delta +0.040
wins/losses/ties: 10 / 6 / 84
CI95 crosses zero
```

Retrieval coverage still reproduced:

```txt
full_support_recall: 0.230 -> 0.380, delta +0.150
answer_present:      0.570 -> 0.760, delta +0.190
```

## Decision

Coverage gate passed. Offset500 answer-quality gate passed. Fresh offset1500 answer-quality gate did not pass.

Do not promote config0 as a positive public result.

Next step:

```txt
path-risk instrumentation and relation/answer-type guards before another 4090 LLM run
```
