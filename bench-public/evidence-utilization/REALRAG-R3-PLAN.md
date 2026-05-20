# RealRAG R3 plan — baselines, judging, and generalization

Status: planned, not run  
Motivation: address the remaining external-review objections after HotpotQA R1/R2.

## Why R3 exists

R1/R2 established a public-dataset effect:

```txt
answer closure is sensitive to evidence placement in HotpotQA distractor
rank_1 > rank_last > rank_3 > rank_8 ≈ rank_5 >> no_support
```

The remaining question is not whether position matters under controlled placement. It is whether the effect survives stronger retrieval/answering pipelines, independent judging, more datasets, and more model families.

## R3 research question

> Does the evidence-placement / middle-burial effect persist after modern reranking, reasoning prompts, independent judging, and dataset/model variation?

## Non-claims preserved

R3 still should not claim:

- proof of internal evidence use;
- model attention attribution;
- production RAG bottleneck dominance;
- Evidence-Paged KV quality improvement;
- runtime readiness.

## Datasets

Minimum:

| dataset | role |
|---|---|
| HotpotQA dev distractor | continuity with R1/R2 |
| 2WikiMultihopQA | multi-hop public QA with different distribution |
| MuSiQue | harder compositional multi-hop QA |

Optional:

| dataset | role |
|---|---|
| NaturalQuestions-open with retrieved passages | single-hop / open-domain contrast |
| LongBench QA subsets | long-context benchmark bridge |
| small agentic trace set | tool/action closure bridge, if privacy-safe |

## Conditions

Keep R2 placement controls:

```txt
rank_1
rank_3
rank_5
rank_8
rank_last
no_support
```

Add retrieval/baseline conditions:

```txt
bm25_retrieved
bm25_plus_reranker
reranker_topk_oracle_support_present
full_candidate_context_original_order
support_only
```

## Answering variants

At minimum:

| variant | purpose |
|---|---|
| direct_short_answer | continuity with R1/R2 |
| cite_then_answer | tests whether explicit citation requirement improves closure |
| reason_then_answer | tests chain-of-thought style placement sensitivity |
| evidence_table_then_answer | tests structured extraction before answer |

Important: if CoT is logged, keep public artifact to final answers + citations/summaries only unless full chain is intentionally public-safe.

## Retrieval/reranking baselines

Local/free first:

| method | notes |
|---|---|
| BM25 | R1/R2 continuity baseline |
| bge-reranker-v2-m3 | already used in longctx-svc work; strong open reranker |
| e5 / bge embedding retrieval | dense baseline if local infra is available |

Optional paid/API:

| method | notes |
|---|---|
| Cohere Rerank | strong external reranker baseline, paid/API |
| frontier model rerank/extract | only with explicit cost/credential approval |

## Models

Minimum local:

| model | reason |
|---|---|
| Qwen2.5-7B-Instruct | continuity with R1/R2 |
| one non-Qwen local model | family-generalization check |

If available/authorized:

| model | reason |
|---|---|
| Qwen3 / Qwen2.5 larger local | scale check |
| frontier API model | external upper-bound check; requires explicit cost approval |

## Judging and labels

Keep deterministic metrics:

```txt
normalized EM
contains answer
token F1
closure = EM or contains or F1 >= threshold
```

Add independent judging:

| judge | purpose |
|---|---|
| LLM-as-judge, blind to condition | semantic correctness beyond string match |
| human audit subset | calibrate LLM judge and closure thresholds |
| supporting-fact citation check | verify whether answer cites / points to gold support |

Suggested human audit:

```txt
N = 200 questions × selected conditions
stratified by: rank_1 only, middle fail, rank_last recovery, no_support leak, all fail
```

## Supporting-fact recall

For each condition, compute:

```txt
gold support paragraph present: yes/no
gold support min rank
gold support all ranks
answer string present in context: yes/no
model cited support title: yes/no / not requested
```

This separates:

```txt
retrieval/support availability
presentation/position
answer closure
citation/justification behavior
```

## Primary metrics

| metric | interpretation |
|---|---|
| closure rate by condition | continuity with R1/R2 |
| EM / F1 / contains | standard QA metrics |
| paired closure deltas with bootstrap CI | same-question causal placement effect |
| LLM-judge correctness | semantic robustness check |
| human/LLM agreement | judge calibration |
| citation-to-support rate | evidence-path surface behavior, not attention |
| no_support closure | leakage/memorization baseline |

## Decision gates

### Gate A — effect survives stronger prompting

Pass if rank/position effect remains under `cite_then_answer` or `reason_then_answer`.

### Gate B — effect survives reranking comparison

Pass if modern reranker improves closure but does not eliminate middle-burial / position sensitivity under controlled placement.

### Gate C — effect generalizes beyond HotpotQA

Pass if the position effect appears in at least one of 2WikiMultihopQA or MuSiQue.

### Gate D — judge agreement acceptable

Pass if deterministic closure and LLM/human judging agree enough to support the public readout, or if disagreement is characterized and reported.

## Failure modes to report honestly

- Reranker eliminates most of the gap: then R1/R2 are a placement pathology, not a persistent RAG issue.
- CoT/citation prompt eliminates most of the gap: then answer protocol matters more than retrieval placement.
- Frontier models eliminate most of the gap: then the effect is model-scale/calibration-specific.
- 2Wiki/MuSiQue do not reproduce: then HotpotQA-specific structure matters.
- no_support closure rises high: memorization/leakage contaminates the dataset.

## Proposed artifact layout

```txt
bench/evidence-utilization-realrag-r3-YYYY-MM-DD/
  RESULTS.md
  summary.json
  records.jsonl
  pairwise-closure-deltas.json
  judge-audit.jsonl
  human-audit-sample.jsonl
  logs/

bench-public/evidence-utilization/REALRAG-R3-RESULTS.md
bench-public/evidence-utilization/REALRAG-R3-SAMPLES.md
```

## Operational envelope

Allowed without additional publication/runtime approval:

- local harness code;
- dataset preparation;
- local/open reranker baselines;
- calls to existing local vLLM endpoint;
- offline judging with local models if available;
- result artifacts in repo.

Requires explicit confirmation:

- paid/API frontier model runs;
- public posting outside committed GitHub docs;
- vLLM restart/kill/deploy/patch;
- EPKV hook-on serving;
- credentialed services beyond already configured read-only tools.
