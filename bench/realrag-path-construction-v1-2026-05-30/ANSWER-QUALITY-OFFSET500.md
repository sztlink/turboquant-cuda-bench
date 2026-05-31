# Answer-quality run - offset 500 n100

## Status

Done. Bounded LLM run using the retrieval-grid winning config.

This is a known offset from the gated-control holdout, not a final fresh claim.

## Command shape

```txt
limit: 100
offset: 500
top_k: 10
bm25_first: 8
seed_top: 0
second_per_mention: 0
max_seed_expansions: 4
max_doc_mentions: 3
pool_limit: 80
skip_bge: true
skip_extract: true
disable_ecd: true
```

Output:

```txt
answer-quality-offset500-n100-config0/
answer-quality-offset500-n100-comparison.json
```

Baseline for comparison:

```txt
../epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm/summary.json
```

## Retrieval delta

| metric | baseline | config0 | delta |
|---|---:|---:|---:|
| support_title_recall | 0.560 | 0.724 | +0.164 |
| full_support_recall | 0.240 | 0.400 | +0.160 |
| answer_string_present_rate | 0.690 | 0.790 | +0.100 |

## Answer-quality delta

Condition compared:

```txt
entity_hop_path_prompt
```

| metric | baseline | config0 | delta |
|---|---:|---:|---:|
| EM | 0.210 | 0.270 | +0.060 |
| contains | 0.270 | 0.330 | +0.060 |
| F1 | 0.295 | 0.376 | +0.082 |

Per-case EM movement:

```txt
wins:   10
losses: 4
ties:   86
```

## Gate result

The offset500 answer-quality gate passes:

```txt
EM wins > losses
EM delta >= +0.03
F1 delta >= +0.05
```

Observed:

```txt
10 wins / 4 losses / 86 ties
EM +0.060
F1 +0.082
```

## Interpretation

This is the first positive answer-quality signal after the gated-control line was closed.

The improvement came from changing evidence geometry, not from a downstream override:

```txt
smaller first-hop retrieval
no seed BM25 expansion
no second-hop BM25 per mention
fewer title mentions per doc
heuristic ordering instead of BGE rerank
```

The likely mechanism is lower distractor density in the top-10.

## Losses still matter

The four EM losses show that cleaner retrieval is not uniformly better. Regressions include:

```txt
nationality decoy selected instead of target nationality
spouse/person decoy selected despite support present
place/country granularity shift
relation target drift within same family/title neighborhood
```

This means the next phase should not simply promote config0 globally. It should add path-risk instrumentation and test a fresh answer slice.

## Decision

```txt
continue_to_fresh_answer_quality_holdout
```

Recommended next run:

```txt
offset 1000 or a newer unseen offset
n 100
same config0
same path_prompt comparison
```

If the next run reproduces the improvement, prepare a Boring Receipt for `Path Construction Baseline + Config0`.

If it fails, preserve this as an inspected-slice positive that did not generalize.

## Non-claims

This does not claim:

```txt
RealRAG is solved
EPKV improves RAG globally
config0 should be promoted globally
the result is fresh enough for a public positive receipt
```
