# RealRAG R4B-v2 — deduplicated human calibration batch

Status: ready for continued human review
Primary artifact: `bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/`

## Boundary

```txt
human adjudication target: answer acceptability / answer closure calibration
not evidence-use proof
not attention attribution
not serving benchmark
not runtime intervention
```

## Why v2 exists

The first R4B Google Sheets batch contained repeated question/qid rows across conditions. R4B-v2 deduplicates the batch to one row per question/qid while preserving already-filled human review fields from the sheet.

## What changed

```txt
previous rows: 150
previous duplicate qid groups: 8
previous rows inside duplicate groups: 17
removed duplicate rows: 9
replacement fill rows added: 9
v2 rows: 150
v2 unique qid hashes: 150
preserved human label rows in v2: 18
```

Note: the original sheet had 22 filled labels. Four of those labels were on duplicate rows whose kept representative already had the same label, so v2 carries 18 unique labeled rows and records the collapsed duplicate labels in `dedupe-report.json`.

## Batch composition

By dataset:

```txt
2wiki: 133
hotpotqa: 17
```

By condition:

```txt
no_support: 31
bge_rerank_top10: 72
bm25_top10: 41
oracle_first: 6
```

By panel majority:

```txt
correct: 106
partial: 8
wrong: 36
```

Selection phase:

```txt
r4b_v1_preserved_deduped: 141
r4b_v2_fill_high_score: 9
```

## Google Sheets

A new Google Sheet was created from the deduplicated batch with:

```txt
instructions tab
adjudication_batch tab
schema tab
dashboard tab
reviewer label dropdown
confidence dropdown
hidden metadata columns
preserved human_* fields where already filled
```

The private sheet link is stored in the machine artifact summary, not required for public interpretation.

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
bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/human-calibration-batch.csv
bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/human-calibration-batch.jsonl
bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/INSTRUCTIONS.md
bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/summary.json
bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/dedupe-report.json
```
