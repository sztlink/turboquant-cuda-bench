# EPKV Evidence-Controlled Decoding — Quality Proof 100

This is the pragmatic quality gate before Triton kernelization.

Goal:

```txt
prove quality gain from the current Python/dynamic-policy internal sampler path
before investing in kernel implementation
```

## Batch

Built 100 compact 2Wiki evidence cases and span maps with one tokenizer load:

```txt
07-scripts/vllm-hook/epkv-build-2wiki-span-batch.py
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/quality-proof-100/
```

Internal sampler + relation fallback run:

```txt
closed: 98/100
elapsed: 1161.64 sec
internal_sampler_policy: 78/80 closed
relation_path_then_decode: 20/20 closed
```

Quality evaluation:

```txt
07-scripts/vllm-hook/epkv-quality-eval.py
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/quality-proof-100/quality-eval/
```

## EM / contains / token-F1

| system | EM | contains | token F1 |
|---|---:|---:|---:|
| baseline | 0.300 | 0.700 | 0.395 |
| internal sampler + relation fallback | 0.910 | 0.980 | 0.931 |

Delta:

```txt
EM: +0.610
contains: +0.280
token F1: +0.536
```

## By winning layer

| layer | n | EM | contains | F1 |
|---|---:|---:|---:|---:|
| internal_sampler_policy | 80 | 0.887 | 0.975 | 0.914 |
| relation_path_then_decode | 20 | 1.000 | 1.000 | 1.000 |

## Interpretation

This clears the quality gate for the Evidence-Controlled Decoding thesis:

```txt
baseline prompt-only RAG: weak exact answer surface
internal sampler policy: large surface-answer repair
relation path fallback: repairs path-construction failures
```

The kernel plan is now justified as runtime optimization, not speculative architecture.

## Caveats

- Dataset slice is first 100 compositional/inference 2Wiki records from local dev set.
- Evidence was compacted from 2Wiki triples into explicit evidence lines.
- Metrics are automatic EM/contains/token-F1 against gold answer.
- This is not human adjudication, but it is stronger than closure-only because it scores answer quality directly.

## Final service state after run

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
