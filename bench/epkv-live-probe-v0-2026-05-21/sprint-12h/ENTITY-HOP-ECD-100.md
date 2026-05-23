# Entity-Hop Path Extractor + ECD 100

Test:

```txt
entity-hop docs
-> graph/path prompt
-> strict path extractor candidate
-> internal sampler ECD
```

This tests whether ECD adds value after the improved entity-hop evidence distribution.

Artifacts:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-ecd-100/
```

## Results

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BGE rerank strong baseline | 0.090 | 0.160 | 0.185 |
| entity-hop strong prompt | 0.180 | 0.300 | 0.275 |
| entity-hop graph/path prompt | 0.260 | 0.340 | 0.320 |
| entity-hop path extractor candidate | 0.110 | 0.200 | 0.158 |
| entity-hop path extractor + ECD | 0.130 | 0.200 | 0.172 |

Retrieval stats:

```txt
support_title_recall:      0.677
full_support_recall:       0.410
answer_string_present:     0.730
```

Extractor status:

```txt
FOUND:   44
MISSING: 56
```

Win/loss:

```txt
BGE EM:              9/100
path prompt EM:     26/100
extractor EM:       11/100
extractor+ECD EM:   13/100

ECD wins vs path:    1
ECD losses vs path: 14
ECD wins vs BGE:    10
ECD losses vs BGE:   6
```

## Interpretation

Negative result for this version of ECD integration.

Entity-hop retrieval/path prompting remains the best non-oracle RealRAG result:

```txt
BGE strong:                 EM 0.09 | F1 0.185
retrieved-doc relation ECD: EM 0.07 | F1 0.105
entity-hop path prompt:     EM 0.26 | F1 0.320
entity-hop extractor+ECD:   EM 0.13 | F1 0.172
```

The problem is the strict extractor/candidate bottleneck, not sampler mechanics:

- The graph/path prompt can often answer directly from richer entity-hop docs.
- The strict extractor marks 56/100 as MISSING, including many cases where the path prompt answered correctly.
- When the extractor emits a candidate, it can collapse to a wrong neighbor or partial phrase.
- ECD can only amplify the candidate it receives; it cannot recover from missing/wrong candidate selection.

Representative loss mode:

```txt
path prompt: 12 June 1516
extractor: MISSING
ECD: empty
```

Representative win mode:

```txt
gold: Gura Humorului
path prompt: Palos Verdes Estates, California, USA
extractor candidate: Gura Humorului
ECD output: Gura Humorului
```

## Updated thesis

ECD remains validated in oracle/compact-evidence setting:

```txt
quality-proof-100 policy: EM 0.910 | F1 0.931
quality-proof-300 policy: EM 0.907 | F1 0.934
```

But in natural RealRAG, current ECD integration is downstream of a brittle candidate extractor.

The best current RealRAG mechanism is:

```txt
entity-hop retrieval + graph/path prompt
```

not:

```txt
strict extractor -> single candidate -> sampler bias
```

## Next step

Do not force single-candidate ECD. Next experiment should use soft/multi-candidate evidence control:

```txt
entity-hop docs
-> generate N candidate answers / paths
-> policy bias over multiple candidates, not one extractor candidate
-> do not suppress direct path-prompt answer when extractor is MISSING
```

A practical next test:

```txt
entity-hop path prompt with logprobs/candidate shortlist
-> bias top N answer entities from title graph + path prompt output
-> compare against path prompt EM 0.26 / F1 0.32
```

## Service state

Verified after run:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
