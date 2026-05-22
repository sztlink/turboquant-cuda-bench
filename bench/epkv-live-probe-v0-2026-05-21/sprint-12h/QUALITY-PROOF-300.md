# EPKV Evidence-Controlled Decoding — Quality Proof 300

This is the robustness extension of the 100-case quality gate before Triton/kernel work.

## Batch

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/quality-proof-300/
```

Built 300 compact 2Wiki evidence cases and span maps.

Internal sampler + relation fallback run:

```txt
closed: 296/300
elapsed internal batch: 3373.33 sec
internal_sampler_policy: 235/239 closed
relation_path_then_decode: 61/61 closed
```

Quality evaluation:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/quality-proof-300/quality-eval/
```

## EM / contains / token-F1

| system | EM | contains | token F1 |
|---|---:|---:|---:|
| baseline | 0.327 | 0.720 | 0.428 |
| internal sampler + relation fallback | 0.907 | 0.987 | 0.934 |

Delta:

```txt
EM: +0.580
contains: +0.267
token F1: +0.507
```

Counts:

```txt
baseline EM: 98/300
policy EM: 272/300
wins over baseline: 176
losses vs baseline: 2
both exact: 96
neither exact: 26
```

## By winning layer

| layer | n | EM | contains | F1 |
|---|---:|---:|---:|---:|
| internal_sampler_policy | 239 | 0.883 | 0.983 | 0.918 |
| relation_path_then_decode | 61 | 1.000 | 1.000 | 1.000 |

## Interpretation

The 100-case result replicated at 300-case scale.

The current non-kernel internal policy path delivers a large quality lift:

```txt
baseline prompt-only: EM 0.327 / F1 0.428
ECD internal+relation: EM 0.907 / F1 0.934
```

This is enough to justify deeper runtime work, but it also clarifies where the value comes from:

```txt
~80% of cases route through internal sampler policy
~20% require relation/path construction fallback
```

So the project should not be framed as only KV/position repair. The stronger frame is:

```txt
Evidence-Controlled Decoding = relation/path construction + sampler-side evidence policy.
```

## Failure notes

Closure failures were all in the internal sampler layer, not relation fallback. Examples:

```txt
Íñigo Vélez de Guevara, 7th Count of Oñate
Louis Philippe II, Duke of Orléans
Fíngen mac Áedo Duib
Kujō Michiie
```

Policy EM failures often still had partial F1 because the output included the answer plus explanatory text, spelling variants, or incomplete chain text. This suggests next quality work should include:

```txt
answer-only termination control
relation fallback trigger for low-confidence internal sampler outputs
alias/normalization improvements for names and punctuation
```

## Caveats

- Dataset slice: first 300 compositional/inference 2Wiki records from local dev set.
- Evidence is compacted from 2Wiki triples into explicit evidence lines.
- Metrics are automatic EM/contains/token-F1 against gold answer.
- This is not a natural retrieval test yet.
- Therefore this validates the decoder/control-plane mechanism, not full RealRAG retrieval robustness.

## Gate status

Quality gate for kernelization: **passed**.

But given the external critique about real RAG positional bias, the next strategic test should be a retrieval/rerank/prompt reality check before heavy Triton work:

```txt
BM25 top-k baseline
BM25 + strong prompt
BM25 + BGE rerank + strong prompt
BM25 + internal sampler policy
BM25 + BGE rerank + internal sampler policy
oracle evidence + policy upper bound
```

## Final service state

Verified after run:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
