# RealRAG Path Construction v1

Operational front opened after gated-control closure.

## Status

Retrieval-only grid complete. No LLM calls were used.

Key docs:

- [`PLAN.md`](PLAN.md)
- [`RETRIEVAL-GRID.md`](RETRIEVAL-GRID.md)
- [`retrieval-grid-summary.json`](retrieval-grid-summary.json)

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

## Decision

Coverage gate passed.

Next step requires 4090 LLM time and therefore `[CONFIRMAR:INFRA]` before running:

```txt
bounded answer-quality run on offset 500 n100 using winning retrieval config
```
