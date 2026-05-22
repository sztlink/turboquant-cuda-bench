# Retrieved Relation-Path ECD 100

This is the bridge test after the RAG reality check:

```txt
retrieved docs -> relation/path extraction -> candidate -> internal sampler ECD
```

Artifact:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/retrieved-relation-ecd-100/
```

Script:

```txt
07-scripts/vllm-hook/epkv-retrieved-relation-ecd.py
```

Input:

```txt
BGE rerank top-10 prompts from rag-reality-check-100
```

## Results

| condition | EM | contains | token F1 |
|---|---:|---:|---:|
| BGE rerank strong prompt | 0.090 | 0.160 | 0.185 |
| relation extraction candidate | 0.070 | 0.080 | 0.120 |
| retrieved relation ECD | 0.070 | 0.080 | 0.105 |

Extraction status:

```txt
FOUND: 43
MISSING: 56
empty/parse issue: 1
```

Compared to BGE strong:

```txt
BGE EM: 9/100
retrieved relation ECD EM: 7/100
ECD wins over BGE: 2
ECD losses vs BGE: 4
```

## Interpretation

This bridge **does not improve** over BGE rerank + strong prompt.

The extractor often correctly reports `MISSING`, because the top-10 retrieved docs do not contain the full relation chain. When it does output a candidate, it often picks a plausible but wrong neighbor from distractor evidence.

Representative wrong extracted candidates:

```txt
Rupert -> John, Count Palatine of Neumarkt
Marie Leszczyńska -> Maria Josepha of Saxony
Pakistan -> India
Cahiers du cinéma -> Bath Academy of Media Makeup
```

So the bottleneck is not merely “turn retrieved text into a path” with a small extractor prompt. The retrieval front-end is missing or corrupting the chain.

## Updated thesis

The external critique is reinforced:

```txt
natural retrieval dominates full RealRAG performance here.
```

ECD remains strong as a control-plane once a usable evidence chain exists:

```txt
oracle compact evidence + ECD 100: EM 0.910 / F1 0.931
oracle compact evidence + ECD 300: EM 0.907 / F1 0.934
```

But naive retrieved-doc relation extraction does not bridge the gap:

```txt
BGE strong: EM 0.090 / F1 0.185
retrieved relation ECD: EM 0.070 / F1 0.105
```

## Next implication

Do not go Triton-first yet.

The next meaningful RealRAG step is retrieval/path construction, not faster sampler bias:

```txt
entity-aware retrieval
multi-hop expansion from first-hop entity
graph/path search over retrieved/title entities
then ECD only after chain confidence is high
```

## Service state

Verified after run:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
