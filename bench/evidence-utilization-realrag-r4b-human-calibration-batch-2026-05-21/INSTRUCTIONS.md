# RealRAG R4B — human calibration instructions

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
