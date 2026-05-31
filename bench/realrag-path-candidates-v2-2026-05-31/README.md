# RealRAG Path Candidates v2

Opened after RS5 closed prompt-guard iteration.

## Decision

```txt
Stop prompt guards.
Build explicit path candidates before answer generation.
No 4090 until no-LLM path-object metrics improve.
```

## Start here

- [`PLAN.md`](PLAN.md)

## First task

```txt
build-path-candidates-v2.mjs
```

Read existing v1 summaries and emit:

```txt
path-candidates-offset1500-n100.jsonl
path-candidate-summary.json
```

Operational metrics must not use the gold answer for selection.
