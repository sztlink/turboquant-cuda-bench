# Fresh answer-quality run - offset 1500 n100

## Status

Done. Fresh answer-quality run for config0 plus current-config comparator.

Why current comparator was run:

```txt
No offset1500 current-config answer baseline existed.
A fresh answer-quality claim needs same-slice comparison, not only absolute config0 numbers.
```

## Configs

### Current comparator

```txt
limit: 100
offset: 1500
top_k: 10
bm25_first: 12
seed_top: 3
second_per_mention: 1
max_seed_expansions: 4
max_doc_mentions: 5
pool_limit: 80
skip_bge: true
skip_extract: true
disable_ecd: true
```

### Config0

```txt
limit: 100
offset: 1500
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

Outputs:

```txt
answer-quality-offset1500-n100-current/
answer-quality-offset1500-n100-config0/
answer-quality-offset1500-n100-comparison.json
```

## Retrieval delta

| metric | current | config0 | delta |
|---|---:|---:|---:|
| support_title_recall | 0.520 | 0.674 | +0.154 |
| full_support_recall | 0.230 | 0.380 | +0.150 |
| answer_string_present_rate | 0.570 | 0.760 | +0.190 |

The retrieval improvement reproduced clearly on the fresh offset.

## Answer-quality delta

Condition compared:

```txt
entity_hop_path_prompt
```

| metric | current | config0 | delta | bootstrap CI95 |
|---|---:|---:|---:|---:|
| EM | 0.140 | 0.180 | +0.040 | [-0.040, +0.120] |
| contains | 0.200 | 0.260 | +0.060 | [-0.040, +0.160] |
| F1 | 0.248 | 0.288 | +0.040 | [-0.040, +0.124] |

Per-case EM movement:

```txt
wins:   10
losses: 6
ties:   84
```

## Gate result

The answer-quality gate does not pass.

Pre-registered answer-quality continue criterion:

```txt
EM wins > EM losses
EM delta >= +0.03 absolute
F1 delta >= +0.05 absolute
```

Observed:

```txt
wins > losses: yes, 10 > 6
EM delta: pass, +0.040
F1 delta: fail, +0.040 < +0.050
CI lower bound: crosses zero
```

Decision:

```txt
mixed_or_gate_fail
```

## Interpretation

The fresh run confirms a robust retrieval-coverage gain, but the answer-quality gain is too small and uncertain to promote config0 as a positive result.

Working read:

```txt
Cleaner top-10 evidence helps some cases, but answer formation still loses on relation target, answer granularity, and same-neighborhood family/title decoys.
```

This is still useful: retrieval/path construction remains the right front, but simple shrinkage of expansion is not enough by itself.

## What improved

Representative win classes:

```txt
missing answer becomes present in top-10
support chain appears after dropping noisy expansions
place/date answers become extractable
family/title path becomes less swamped by generic decoys
```

## What regressed

Representative loss classes:

```txt
date formatting regressions
nationality/country granularity drift
same-family or same-title neighborhood target drift
support present but wrong relation target selected
```

## Decision

Do not publish a positive Boring Receipt for config0 alone.

Preserve this as a mixed receipt candidate or as an internal run:

```txt
retrieval coverage reproduced
answer quality did not clear gate
```

Recommended next technical step:

```txt
path-risk instrumentation and relation/answer-type guards before another LLM run
```

Specifically track before answer generation:

```txt
relation-depth risk
attribute-owner risk
answer granularity risk
same-family/title-neighborhood density
generic title/document density
support present but multiple plausible answer slots
```

## Non-claims

This does not claim:

```txt
config0 improves RealRAG reliably
EPKV improves RealRAG globally
retrieval shrinkage is enough
```

It shows a real retrieval signal that has not yet become a strong answer-quality win.
