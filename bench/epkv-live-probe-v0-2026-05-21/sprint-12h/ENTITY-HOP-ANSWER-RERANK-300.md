# Entity-Hop Confidence-Gated Answer Rerank 300

300-case scale-up of the 100-case confidence-gated answer rerank result.

Pipeline:

```txt
entity-hop retrieval/path prompt over 300 cases
-> answer rerank only when strong/path outputs disagree
-> conservative gate: override path only when verifier confidence=high and outputs do not overlap
```

Artifacts:

```txt
entity-hop-llm-300/
entity-hop-answer-rerank-300/
entity-hop-answer-rerank-gated-300/
```

## Results

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BM25→BGE ref | 0.030 | 0.053 | 0.062 |
| entity-hop strong prompt | 0.177 | 0.310 | 0.311 |
| entity-hop graph/path prompt | 0.220 | 0.317 | 0.333 |
| raw answer rerank | 0.223 | 0.327 | 0.338 |
| confidence-gated answer rerank | 0.223 | 0.320 | 0.333 |

Retrieval stats from 300-case entity-hop run:

```txt
support_title_recall:      0.706
full_support_recall:       0.430
answer_string_present:     0.770
```

Win/loss vs path prompt:

```txt
raw rerank wins:   8
raw rerank losses: 7

gated wins:        3
gated losses:      2
gated overrides:   10
```

## Comparison to 100-case result

| run | path EM | path F1 | gated EM | gated F1 | wins | losses |
|---|---:|---:|---:|---:|---:|---:|
| 100-case | 0.250 | 0.330 | 0.270 | 0.345 | 2 | 0 |
| 300-case | 0.220 | 0.333 | 0.223 | 0.333 | 3 | 2 |

The 100-case positive signal does **not** robustly scale. On 300 cases the gated reranker is only +1 EM over path prompt and introduces two losses.

## Wins/losses

Gated wins:

| idx | gold | path output | gated output |
|---:|---|---|---|
| 51 | London | Place of origin | London |
| 152 | Nine Network | Morning | Nine Network |
| 183 | Hugh de Stafford, 2nd Earl of Stafford | Hugh Stafford, 2nd Earl of Stafford | Hugh de Stafford, 2nd Earl of Stafford |

Gated losses:

| idx | gold | path output | gated output |
|---:|---|---|---|
| 53 | Homs | Homs | Syria |
| 137 | Agrippina the Elder | Agrippina the Elder | Nero |

## Interpretation

The confidence gate helps relative to raw rerank, but does not produce a robust improvement over direct entity-hop path prompting at 300 cases.

Current best non-oracle mechanism remains:

```txt
entity-hop retrieval + graph/path prompt
```

Answer rerank may still be useful, but only with stricter abstention. The verifier's `confidence=high` is not calibrated enough: it can confidently pick a plausible neighbor and erase a correct exact answer.

## Decision

No Boring Receipts gain update. The RS2 100-case result should be treated as a promising small-slice result, not a scaled claim.

## Next step

Stricter exact-answer preservation before any override:

```txt
1. If path output is an exact title/entity from selected docs, require verifier to cite contradiction before override.
2. If verifier answer is a neighbor/title in graph but path is also a candidate, abstain.
3. Add lexical answer-type guard: date/person/place/org type must match question.
4. Evaluate as a classifier: override only on cases where path is likely wrong.
```

In short:

```txt
learn/select override policy, do not trust verifier confidence string.
```

## Service state

Verified after run:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
