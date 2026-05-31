# RealRAG Path Construction v1

Operational front opened after gated-control closure.

## Status

Retrieval-only grid complete. Bounded offset500 answer-quality run complete.

Key docs:

- [`PLAN.md`](PLAN.md)
- [`RETRIEVAL-GRID.md`](RETRIEVAL-GRID.md)
- [`ANSWER-QUALITY-OFFSET500.md`](ANSWER-QUALITY-OFFSET500.md)
- [`retrieval-grid-summary.json`](retrieval-grid-summary.json)
- [`answer-quality-offset500-n100-comparison.json`](answer-quality-offset500-n100-comparison.json)

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

## Decision

Coverage gate passed. Offset500 answer-quality gate passed.

This is still not a final fresh claim because offset500 was already part of the known holdout context.

Next step requires 4090 LLM time and therefore `[CONFIRMAR:INFRA]` before running:

```txt
fresh answer-quality run on offset 1000 or a newer unseen offset, n100, same config0
```
