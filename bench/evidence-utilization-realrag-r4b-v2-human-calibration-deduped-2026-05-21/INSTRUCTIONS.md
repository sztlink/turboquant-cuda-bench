# RealRAG R4B-v2 — human calibration instructions

This is the deduplicated R4B batch. Each question/qid appears at most once. Previously filled human labels from the first R4B sheet were preserved where the source row remained the representative row.

Judge whether the model answer answers the question. Use the gold answer and support facts as reference.

Do **not** judge whether the model internally used the evidence.

Allowed labels:

- correct — semantically answers the question
- partial — contains a useful but incomplete/ambiguous answer
- wrong — does not answer correctly or contradicts the answer
- parse_error — invalid/truncated/non-answer output
- unclear — cannot decide from the provided information

Recommended confidence: 1 low / 2 medium / 3 high.

Visible columns should be judged first. Hidden columns contain condition/metric/LLM panel metadata for analysis after review.
