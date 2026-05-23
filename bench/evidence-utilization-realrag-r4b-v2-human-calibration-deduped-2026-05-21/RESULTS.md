# RealRAG R4B-v2 — deduplicated human calibration batch

Status: ready
Date: 2026-05-21

```txt
selected rows: 150
unique qid hashes: 150
removed duplicate rows: 9
fill rows added: 9
preserved human label rows: 18
source records: 200
```

Files:

```txt
human-calibration-batch.csv
human-calibration-batch.jsonl
INSTRUCTIONS.md
summary.json
dedupe-report.json
google-sheet.json
```

Google Sheet: created and shared with Felipe's known accounts. See `google-sheet.json` / `summary.json` for the private link.

Visible columns come first; condition/metric/LLM metadata columns are trailing hidden_* fields and should be hidden before review.
