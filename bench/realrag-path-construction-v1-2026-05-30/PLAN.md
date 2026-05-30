# RealRAG Path Construction v1 - operational plan

## Status

Planning artifact for the next front after gated-control closure.

Input decision:

```txt
bench/epkv-control-eligibility-v0-2026-05-30/FINAL-DECISION.md
```

Boring Receipts closure:

```txt
RS4 - Gated Control Closure - Option A / Option B
```

## Thesis

```txt
The main remaining RealRAG bottleneck is evidence/path construction before answer generation, not a downstream verifier override.
```

## Why this front

The control line failed fresh holdout:

```txt
Option A inspected N=500: eligible 4, wins/losses/ties 2/0/2
Option B inspected N=500: eligible 8, wins/losses/ties 5/0/3
Option B holdout N=100: eligible 1, wins/losses/ties 0/0/1
```

The upstream bottleneck is larger:

```txt
N=500 retrieval/path-limited failures: 201 / 392 path failures
Holdout retrieval/path-limited failures: 56 / 79 path failures
```

## Primary objective

Improve answer closure by improving the evidence geometry and path schema supplied to the answer prompt.

Primary comparison:

```txt
current entity_hop_path_prompt
vs
path_construction_v1_prompt
```

## Datasets and splits

### Primary dataset

```txt
local 2Wiki dev slice
filter: type in {compositional, inference}, evidences >= 2
```

### Slices

| split | offset | n | purpose |
|---|---:|---:|---|
| inspect-a | 0 | 100 | rapid iteration against known historical slice |
| inspect-b | 500 | 100 | known holdout from gated-control closure |
| fresh-a | 1000 | 100 | first fresh validation if available |
| scaled | 0 | 500 | only after a held-out win is observed |

Rules:

```txt
No claim from inspect-a alone.
No public receipt without at least one fresh slice.
Do not tune on a slice and report that same slice as final.
```

## Baselines

| baseline | role |
|---|---|
| `bge_ref` | old BM25/BGE reference, weak but preserved |
| `entity_hop_strong` | current direct prompt without explicit path graph primacy |
| `entity_hop_path_prompt` | current non-oracle baseline |
| `raw_answer_rerank` | diagnostic only, not policy |
| oracle support-present / compact evidence if available | upper bound, not deployable |

## Metrics

### Retrieval/path coverage

```txt
support_title_recall
full_support_recall
answer_string_present_rate
full_support_and_answer
pool_size
edge_count
selected_title_count
```

### Answer quality

```txt
exact match
contains
token F1
wins/losses/ties vs entity_hop_path_prompt
bootstrap CI for EM/F1 delta
```

### Path-specific diagnostics

```txt
full_path_present_proxy
partial_path_present_proxy
answer_present_but_path_incomplete
answer_absent
relation_depth_risk_count
attribute_owner_risk_count
film_title_decoy_risk_count
distractor_title_density
```

## Success criteria

### Minimum continue criterion

Continue from retrieval-only grid to LLM answer runs if fresh slice shows:

```txt
full_support_and_answer improves by >= +0.05 absolute
or
answer_string_present_rate improves by >= +0.08 absolute without lowering full_support_recall
```

### Minimum answer-quality criterion

Continue from N=100 to N=500 if fresh slice shows:

```txt
EM wins > EM losses
EM delta >= +0.03 absolute
F1 delta >= +0.05 absolute
no new recurring relation-depth or attribute-owner failure class
```

### Strong success criterion

Treat as receipt-worthy positive if a fresh or scaled run shows:

```txt
EM delta >= +0.08 absolute
F1 delta >= +0.12 absolute
bootstrap CI lower bound > 0
losses qualitatively bounded and explained
```

This is intentionally ambitious. A smaller gain can still be useful, but should be labeled as exploratory or mixed.

## Experiment ladder

### Phase 0 - frozen baseline pack

Output:

```txt
BASELINE.md
baseline-summary.json
baseline-failures.jsonl
```

Tasks:

```txt
collect current entity-hop path metrics for offsets 0, 500, 1000
preserve retrieval/path-limited taxonomy
select 20 representative failure cases for qualitative audit
```

No new LLM behavior yet.

### Phase 1 - retrieval coverage grid, no LLM calls

Goal: improve evidence availability before spending 4090 time.

Candidate changes:

```txt
bm25_first sweep
seed_top sweep
second_per_mention sweep
max_doc_mentions sweep
pool_limit sweep
title-match expansion variants
relation-aware seed extraction from question surface
```

Output:

```txt
RETRIEVAL-GRID.md
retrieval-grid-summary.json
```

Gate:

```txt
Only advance if coverage improves on a fresh slice, not only offset 0.
```

### Phase 2 - path schema construction

Goal: build a structured path before answering.

Candidate path schema:

```json
{
  "question_type": "who|where|when|what|which|why|other",
  "target_relation": "father|paternal_grandfather|place_of_birth|...",
  "start_entity": "...",
  "candidate_chain": [
    {"from":"...", "relation":"...", "to":"...", "evidence_title":"..."}
  ],
  "answer_slot": "entity|date|place|nationality|reason|other",
  "risk_flags": []
}
```

Candidate changes:

```txt
chain-first JSON extractor
answer-from-chain prompt
relation-depth guard upstream
attribute-owner guard upstream
film/title decoy guard upstream
```

Important boundary:

```txt
This is not a return to strict single-candidate ECD. ECD already failed as a shortcut.
This phase tests whether the prompt gets a cleaner path object before answer generation.
```

### Phase 3 - query expansion experiments

Only after Phase 1/2 baselines are stable.

Candidate methods:

```txt
multi-query from question decomposition
step-back query for relation class
HyDE-style hypothetical evidence sentence
recursive retrieval from first-hop path entities
parent/title-document retrieval when title snippets are too narrow
```

Rules:

```txt
Each method must have an ablation.
Do not combine all methods first.
No method gets credit unless it survives a fresh offset.
```

### Phase 4 - receipt packaging

Receipts to prepare if results justify them:

| receipt | condition |
|---|---|
| `RS5 - Path Construction Baseline` | always useful as baseline |
| `RS6 - Retrieval Coverage Grid` | if coverage grid changes the evidence geometry |
| `RS7 - Path Construction v1` | only if fresh holdout improves answer quality |
| `RS7-negative` | if path construction fails or only improves inspected slice |

## Non-goals

Do not do in this phase:

```txt
No new hand-written answer override gate.
No Option C unless new pre-scoring uncertainty signals are actually stored.
No kernel/runtime claims.
No broad EPKV-improves-RAG claim.
No public positive receipt from inspected slice only.
No gold answer in operational detectors.
No raw private logs, endpoints, IPs, or secrets in public artifacts.
```

## First concrete tasks

1. Build a retrieval-only grid runner for offsets 0, 500, 1000.
2. Produce `BASELINE.md` with current path_prompt results and failure taxonomy by split.
3. Add path-risk instrumentation without changing prompts.
4. Run one cheap no-LLM coverage sweep.
5. Only then decide whether to spend 4090 LLM time on a path-schema prompt.

## Stop rules

Stop and preserve a negative receipt if:

```txt
coverage gains do not survive fresh offset
answer gains are offset-specific
wins come with comparable losses
new schema introduces relation-depth or attribute-owner regressions
method requires gold-derived signals
```

## Open question

The most important unknown is whether the retrieval/path-limited label is caused by:

```txt
missing documents
right documents but wrong order
right title but wrong sentence/attribute
ambiguous relation schema
distractor entity with stronger lexical match
```

The first sprint should answer this before proposing a new answer prompt.
