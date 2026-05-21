# RealRAG R4A — LLM judge panel

Status: complete
Primary artifact: `bench/evidence-utilization-realrag-r4a-llm-judge-panel-2026-05-21/`

## Boundary

```txt
LLM-as-judge: triage only
human ground truth: no
internal evidence-use proof: no
answer-quality claim: no
paid/frontier API: no
```

R4A uses the local default model to add rubric diversity to the existing R3K adjudication-light items. It is designed to choose a better human review subset, not to replace human adjudication.

## Panel

```txt
records: 200
rubrics:
- r3k_existing_local_judge
- strict_equivalence
- semantic_acceptability
panel disagreement: 61
```

Majority labels:

```txt
correct: 148
partial: 8
wrong: 44
```

## Why this exists

The goal is to avoid asking humans to review only easy cases. R4A surfaces:

```txt
panel disagreements
metric-open but judge-positive cases
metric-closed but judge-negative cases
no-support success / leakage-risk cases
partial-answer edge cases
parse/error-prone judge outputs
```

## Next artifact

R4B converts this triage into a blinded 150-row Google Sheets human-calibration batch.

See: [`REALRAG-R4B-HUMAN-CALIBRATION-BATCH.md`](REALRAG-R4B-HUMAN-CALIBRATION-BATCH.md)
