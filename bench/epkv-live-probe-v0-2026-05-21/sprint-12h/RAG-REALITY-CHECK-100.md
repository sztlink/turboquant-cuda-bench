# RAG Reality Check 100

This run tests the critique that real RAG may be bottlenecked more by retrieval quality and distractor robustness than by positional/KV utilization.

Artifact:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/rag-reality-check-100/
```

Script:

```txt
07-scripts/vllm-hook/epkv-rag-reality-check.py
```

Conditions:

```txt
BM25 top-10 + basic prompt
BM25 top-10 + strong answer-only prompt
BM25 top-30 -> BGE reranker top-10 + strong prompt
```

Dataset/corpus:

```txt
2Wiki local dev slice: first 100 compositional/inference records
corpus docs: 56,687 context documents
```

## Results

| condition | EM | contains | token F1 | support-title recall | answer string in docs |
|---|---:|---:|---:|---:|---:|
| BM25 basic | 0.000 | 0.040 | 0.031 | 0.493 | 0.280 |
| BM25 strong | 0.070 | 0.130 | 0.150 | 0.493 | 0.280 |
| BM25→BGE rerank strong | 0.090 | 0.160 | 0.185 | 0.512 | 0.400 |

For comparison, oracle compact evidence quality proof over the same first 100:

| condition | EM | contains | token F1 |
|---|---:|---:|---:|
| oracle evidence baseline | 0.300 | 0.700 | 0.395 |
| oracle evidence + internal sampler/relation ECD | 0.910 | 0.980 | 0.931 |

300-case oracle evidence proof:

| condition | EM | contains | token F1 |
|---|---:|---:|---:|
| oracle evidence baseline | 0.327 | 0.720 | 0.428 |
| oracle evidence + internal sampler/relation ECD | 0.907 | 0.987 | 0.934 |

## Interpretation

The critique is substantially correct for natural retrieval:

```txt
BM25/BGE retrieval often does not place the full evidence chain in top-10.
```

Even with BGE reranking:

```txt
full support-title recall: 14/100
answer string present in selected docs: 40/100
EM: 9/100
```

So the ECD quality proof is **not yet a full RealRAG proof**. It is an oracle-evidence/control-plane proof.

But the comparison also clarifies the opportunity:

```txt
When evidence is present and structured, ECD moves EM from ~0.30 to ~0.91.
When natural retrieval is weak, rerank+prompt only reaches ~0.09 EM.
```

Therefore the real project should be framed as:

```txt
Evidence-Controlled Decoding is a decoder/control-plane for cases where a usable evidence chain is present or can be constructed.
It does not replace retrieval; it needs a retrieval/relation-construction front-end.
```

## Strategic consequence

Do **not** frame this as “positional bias solver for RAG”.

Better framing:

```txt
retrieval finds candidate evidence
relation compiler builds a path
sampler policy forces answer-surface commitment to that path
telemetry records which evidence controlled which token
```

The next decisive experiment is not Triton yet. It is:

```txt
retrieval -> relation-path construction -> ECD policy
```

on non-oracle retrieved passages.

## Service state

This run did not change the EPKV policy file. Health verified after completion:

```txt
/health OK
```
