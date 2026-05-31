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
- [`NO-LLM-PASS1.md`](NO-LLM-PASS1.md)

## Pass 1 artifacts

```txt
build-path-candidates-v2.mjs
path-candidates-offset1500-n100.jsonl
path-candidate-summary.json
build-answer-from-chain-packets.mjs
answer-from-chain-packets-offset1500-n100.jsonl
```

Operational metrics do not use the gold answer for selection. Gold/support/evidence
fields are used only after candidate selection for diagnostics.

## Pass 1 decision

```txt
manual_review_next
no_4090_yet
```
