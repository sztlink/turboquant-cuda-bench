# EPKV Control Eligibility v0

Seven-day intensive sprint to test whether fine-grained control has a detectable natural-quality window after the N=500 no-delta.

## Sprint thesis

```txt
After the N=500 no-delta, control is only alive if there is a natural, detectable, reproducible eligible slice where it improves quality over entity-hop path prompting.
```

## Day 1 status

Done.

Artifacts:

- [`TAXONOMY.md`](TAXONOMY.md)
- [`N500-AUTOPSY.md`](N500-AUTOPSY.md)
- [`n500-autopsy-summary.json`](n500-autopsy-summary.json)
- [`n500-taxonomy-all.jsonl`](n500-taxonomy-all.jsonl)
- [`n500-failure-taxonomy.jsonl`](n500-failure-taxonomy.jsonl)
- [`build-n500-autopsy.mjs`](build-n500-autopsy.mjs)

## Day 1 readout

```txt
Path prompt exact successes: 108/500
Path prompt exact failures: 392/500

Retrieval/path-limited failures:       201/392
Potentially control-relevant failures: 187/392

Gated overrides: 20/500
Override outcomes: 2 wins / 2 losses / 16 ties
```

## Gate

Continue to Day 2, but with a narrowed hypothesis:

```txt
Fine-grained control may help a detectable eligible slice.
```

Not allowed:

```txt
Fine-grained control improves natural RealRAG globally.
```

## Day 2 status

Done.

Artifacts:

- [`ELIGIBILITY-SPEC.md`](ELIGIBILITY-SPEC.md)
- [`RUN-MANIFEST.json`](RUN-MANIFEST.json)
- [`SHADOW-RUN.md`](SHADOW-RUN.md)
- [`shadow-summary.json`](shadow-summary.json)
- [`eligibility-receipts.jsonl`](eligibility-receipts.jsonl)
- [`build-eligibility-shadow.mjs`](build-eligibility-shadow.mjs)

Readout:

```txt
Shadow detector eligible rows: 4/500
Eligible EM wins/losses/ties: 2 / 0 / 2
Projected global EM delta if used: +0.004
Projected global F1 delta if used: +0.002
Decision: do_not_promote_pivot_or_redesign_detector
```

The detector found a clean but anecdotal slice. It did not pass the pre-registered threshold for override pilot or detector iteration.

## Option B exploratory redesign

Done.

Artifacts:

- [`OPTION-B-REDESIGN-SPEC.md`](OPTION-B-REDESIGN-SPEC.md)
- [`OPTION-B-RUN-MANIFEST.json`](OPTION-B-RUN-MANIFEST.json)
- [`OPTION-B-SHADOW-RUN.md`](OPTION-B-SHADOW-RUN.md)
- [`option-b-summary.json`](option-b-summary.json)
- [`option-b-receipts.jsonl`](option-b-receipts.jsonl)
- [`build-option-b-shadow.mjs`](build-option-b-shadow.mjs)

Readout:

```txt
True logits/probability entropy available: no
Proxy signals used: selection entropy, answerer agreement entropy, char-trigram similarity, uncertainty score, direct-evidence score
Option B eligible rows: 8/500
Eligible EM wins/losses/ties: 5 / 0 / 3
Projected global EM delta if used: +0.010
Projected global F1 delta if used: +0.0047
Decision: freeze_option_b_for_fresh_holdout_shadow_only
```

Option B found a small repair-heavy slice. Because it is exploratory after Day 2, it must not be promoted to override. It can only be frozen and tested on a fresh holdout shadow run.

## Fresh holdout status

Done after `[CONFIRMAR:INFRA]`.

Artifacts:

- [`RUN-HOLDOUT-FRESH.md`](RUN-HOLDOUT-FRESH.md)
- [`FINAL-DECISION.md`](FINAL-DECISION.md)
- [`PIVOT-RETRIEVAL-PATH.md`](PIVOT-RETRIEVAL-PATH.md)
- [`holdout-offset500-n100/option-b-holdout-shadow-run.md`](holdout-offset500-n100/option-b-holdout-shadow-run.md)
- [`holdout-offset500-n100/option-b-holdout-summary.json`](holdout-offset500-n100/option-b-holdout-summary.json)

Readout:

```txt
Holdout offset: 500
Holdout n: 100
Option B eligible rows: 1/100
Eligible EM wins/losses/ties: 0 / 0 / 1
Eligible target-relevant count: 0
Eligible retrieval/path-limited count: 1
Projected global EM delta: 0.000
Decision: stop_option_b_or_redesign_again_not_recommended
```

## Final decision

```txt
close_gated_control_for_now
```

Do not run Option C now. The next useful work is retrieval/path construction or collecting genuinely new uncertainty signals before scoring, not another hand-written string gate.
