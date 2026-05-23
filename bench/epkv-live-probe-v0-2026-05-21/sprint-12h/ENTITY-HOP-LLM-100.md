# Entity-Hop Retrieval + Path Prompt 100

This is the first positive RealRAG bridge after the negative retrieved-relation ECD test.

Pipeline:

```txt
question
-> cheap entity/title-hop retrieval
-> heuristic path/title graph
-> strong prompt / graph path prompt
```

No BGE reranker. No sampler/ECD in this run. This tests whether retrieval/path construction alone can close part of the gap.

Artifacts:

```txt
07-scripts/vllm-hook/epkv-entity-hop-retrieval.py
07-scripts/vllm-hook/epkv-entity-hop-grid.py
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-grid-100/
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-llm-100/
```

## Retrieval grid result

Best fast grid config:

```json
{
  "bm25_first": 8,
  "seed_top": 0,
  "second_per_mention": 0,
  "max_seed_expansions": 4,
  "max_doc_mentions": 3,
  "pool_limit": 80
}
```

Retrieval-only comparison:

| condition | support title recall | full support recall | answer present |
|---|---:|---:|---:|
| BGE reality-check baseline | 0.512 | 0.140 | 0.400 |
| entity-hop grid best | 0.708 | 0.460 | 0.780 |

Interpretation: the simple title/entity-hop retriever substantially improves the actual bottleneck metrics.

## 100-case LLM result

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BGE rerank strong baseline | 0.090 | 0.160 | 0.185 |
| entity-hop strong prompt | 0.190 | 0.310 | 0.290 |
| entity-hop graph/path prompt | 0.250 | 0.340 | 0.330 |

Retrieval stats from the same 100-case run:

```txt
support_title_recall:      0.688
full_support_recall:       0.420
answer_string_present:     0.740
```

Win/loss vs BGE rerank strong:

```txt
BGE EM:          9/100
path prompt EM: 25/100
path wins:      19
path losses:    3
```

## Interpretation

This is the first real bridge from retrieval to answer quality:

```txt
BGE strong:              EM 0.09 / F1 0.185
retrieved relation ECD:  EM 0.07 / F1 0.105
entity-hop path prompt:  EM 0.25 / F1 0.330
```

The previous retrieved-doc relation extractor failed because BGE top-10 often did not contain the chain. Entity-hop retrieval changes the upstream evidence distribution enough that a graph/path prompt wins without needing sampler policy yet.

The updated thesis:

```txt
RealRAG value is in retrieval/path construction first.
ECD/sampler should be applied after entity-hop path confidence, not before.
```

## Next step

Run the same best entity-hop condition with strict path extraction and internal sampler ECD:

```txt
entity-hop docs
-> path extractor candidate
-> internal sampler ECD
-> compare against entity-hop path prompt
```

Success criterion:

```txt
beat EM 0.25 / F1 0.33 without increasing losses.
```

## Service state

Verified after run:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
