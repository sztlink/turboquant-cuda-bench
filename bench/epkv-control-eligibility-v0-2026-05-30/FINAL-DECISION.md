# Final decision - EPKV Control Eligibility v0

## Status

Final decision after fresh holdout: close gated control for now.

Do not run Option C now.

## Sequence

```txt
Day 1 N=500 autopsy:
  path prompt EM 0.216
  gated v1 vs path: 2 wins / 2 losses / 496 ties
  conclusion: global gated-control claim not supported

Day 2 shadow detector:
  eligible 4/500
  2 wins / 0 losses / 2 ties
  conclusion: clean but anecdotal

Option B redesigned detector on inspected N=500:
  eligible 8/500
  5 wins / 0 losses / 3 ties
  conclusion: freeze for fresh holdout only

Fresh holdout offset500 n100:
  eligible 1/100
  0 wins / 0 losses / 1 tie
  eligible target-relevant count: 0
  eligible retrieval/path-limited count: 1
  conclusion: holdout failed
```

## Holdout artifacts

```txt
bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm/summary.json
bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-answer-rerank/summary.json
bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/taxonomy/holdout-autopsy-summary.json
bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/option-b-holdout-summary.json
bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/option-b-holdout-shadow-run.md
bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/option-b-holdout-receipts.jsonl
```

## Holdout readout

Entity-hop holdout baseline:

```txt
path_prompt EM: 0.210
path_prompt F1: 0.295
rerank EM: 0.210
rerank F1: 0.322
raw rerank vs path: 2 wins / 2 losses
```

Option B frozen detector on holdout:

```txt
eligible: 1/100
lane: low_selection_entropy_rescue
EM wins/losses/ties: 0 / 0 / 1
projected global EM delta: 0.000
bootstrap EM CI95: [0, 0]
decision: stop_option_b_or_redesign_again_not_recommended
```

The only eligible row was posthoc `path_schema_miss_answer_present_elsewhere`, counted as retrieval/path-limited rather than target-relevant.

## Decision

```txt
close_gated_control_for_now
```

Reasons:

```txt
fresh holdout eligible_count < 5
fresh holdout EM wins < 3
fresh holdout target-relevant concentration below baseline
fresh holdout eligible row was retrieval/path-limited
raw rerank remained symmetric at 2 wins / 2 losses
```

## What remains true

```txt
Entity-hop path prompting remains the non-oracle baseline.
Option B showed a repair-heavy pattern on inspected data, but it did not reproduce on fresh holdout.
The next useful work is retrieval/path construction or collecting genuinely new uncertainty signals, not another hand-written string gate.
```

## Option C rule

Do not run Option C unless a future dataset/run stores genuinely new operational signals before scoring, such as:

```txt
token logprobs or logits entropy
calibrated verifier probability distribution
retriever or reranker numeric score margins
embedding vectors with pre-registered similarity thresholds
multiple independent verifier samples for disagreement distribution
```

Without those, Option C would only be another string-heuristic redesign and should be skipped.
