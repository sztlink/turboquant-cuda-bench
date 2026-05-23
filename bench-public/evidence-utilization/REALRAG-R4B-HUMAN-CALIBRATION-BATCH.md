# RealRAG R4B — human calibration batch

Status: superseded for continued review by [`REALRAG-R4B-V2-HUMAN-CALIBRATION-DEDUPED.md`](REALRAG-R4B-V2-HUMAN-CALIBRATION-DEDUPED.md)
Primary artifact: `bench/evidence-utilization-realrag-r4b-human-calibration-batch-2026-05-21/`

## Boundary

```txt
human adjudication target: answer acceptability / answer closure calibration
not evidence-use proof
not attention attribution
not serving benchmark
not runtime intervention
```

## What was built

A 150-row blinded review batch for Google Sheets.

Visible review fields:

```txt
question
gold_answer
model_answer
support facts
human_label
human_confidence
human_notes
reviewer_id
reviewed_at
```

Trailing metadata fields are prefixed with `hidden_` and should stay hidden during first-pass review:

```txt
dataset / bucket / condition
exact-match / F1 / closure
LLM panel labels
selection score / phase
```

## Batch composition

```txt
selected rows: 150
source R4A panel records: 200
```

By dataset:

```txt
2wiki: 127
hotpotqa: 23
```

By condition:

```txt
no_support: 31
bge_rerank_top10: 72
bm25_top10: 39
oracle_first: 8
```

By panel majority:

```txt
correct: 109
partial: 8
wrong: 33
```

Selection phase:

```txt
high_value: 74
stratified_cell: 26
fill_high_score: 50
```

## Google Sheets

A Google Sheet was created from the batch with:

```txt
instructions tab
adjudication_batch tab
schema tab
dashboard tab
reviewer label dropdown
confidence dropdown
hidden metadata columns
```

The sheet was shared with Felipe's known accounts. The private sheet link is stored in the machine artifact summary, not required for public interpretation.

## Labels

```txt
correct     = semantically answers the question
partial     = useful but incomplete or ambiguous
wrong       = incorrect, contradictory, or non-answer
parse_error = invalid/truncated/non-answer output
unclear     = cannot decide from provided information
```

## Source artifacts

```txt
bench/evidence-utilization-realrag-r4b-human-calibration-batch-2026-05-21/human-calibration-batch.csv
bench/evidence-utilization-realrag-r4b-human-calibration-batch-2026-05-21/human-calibration-batch.jsonl
bench/evidence-utilization-realrag-r4b-human-calibration-batch-2026-05-21/INSTRUCTIONS.md
bench/evidence-utilization-realrag-r4b-human-calibration-batch-2026-05-21/summary.json
```
