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
- [`MANUAL-REVIEW-NEXT.md`](MANUAL-REVIEW-NEXT.md)
- [`NO-LLM-PASS2.md`](NO-LLM-PASS2.md)
- [`answer-from-chain-smoke-offset1500-n100-4090/RESULTS.md`](answer-from-chain-smoke-offset1500-n100-4090/RESULTS.md)

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

## Current decision

```txt
path_candidates_improved
answer_from_chain_smoke_mixed_or_gate_failed_by_refusal
no_runtime_mapping_yet
no_megakernel_yet
```

Pass 2 improved the explicit no-LLM path object to EM/F1 `0.440 / 0.527` posthoc,
with `26 wins / 0 losses / 74 ties` vs config0 path prompt. The authorized 4090
answer-from-chain smoke improved F1 vs config0, but failed the gate because refusal
rate jumped to `0.510`.
