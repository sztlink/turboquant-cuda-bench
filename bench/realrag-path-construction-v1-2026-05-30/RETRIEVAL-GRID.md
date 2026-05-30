# Retrieval-only grid - offsets 0 / 500 / 1000

## Status

Done. No LLM calls.

Commands used:

```bash
python3 07-scripts/vllm-hook/epkv-entity-hop-grid.py \
  --out-dir bench/realrag-path-construction-v1-2026-05-30/retrieval-grid-offset{OFFSET}-n100 \
  --limit 100 \
  --offset {OFFSET} \
  --top-k 10
```

Offsets:

```txt
0
500
1000
```

## Question

Before spending 4090 LLM time, can a cheap retrieval/path configuration improve support and answer availability on fresh slices?

## Grid shape

The grid swept:

```txt
bm25_first: 8, 12, 20
seed_top: 0, 2
second_per_mention: 0
max_doc_mentions: 3, 6
pool_limit: 80
top_k: 10
```

## Main result

The same config won all three offsets:

```json
{
  "config_id": 0,
  "bm25_first": 8,
  "seed_top": 0,
  "second_per_mention": 0,
  "max_seed_expansions": 4,
  "max_doc_mentions": 3,
  "pool_limit": 80,
  "top_k": 10
}
```

Interpretation:

```txt
Smaller first-hop retrieval with fewer mention expansions keeps the top-10 cleaner.
Bigger pools add distractors faster than they add useful support.
```

## Best config by offset

| offset | support title recall | full support recall | answer present | full support + answer | avg pool | avg edges |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0.690 | 0.420 | 0.730 | 0.420 | 15.1 | 9.1 |
| 500 | 0.713 | 0.390 | 0.760 | 0.390 | 15.0 | 8.7 |
| 1000 | 0.673 | 0.380 | 0.700 | 0.380 | 15.2 | 8.6 |

## Comparison against current configured retriever

A current-config retrieval-only baseline was run for offsets 0 and 500 with:

```txt
bm25_first: 12
seed_top: 3
second_per_mention: 1
max_doc_mentions: 5
pool_limit: 80
top_k: 10
```

| offset | config | support | full support | answer present | full support + answer |
|---:|---|---:|---:|---:|---:|
| 0 | current | 0.525 | 0.230 | 0.610 | 0.230 |
| 0 | grid best | 0.690 | 0.420 | 0.730 | 0.420 |
| 500 | current | 0.582 | 0.260 | 0.720 | 0.260 |
| 500 | grid best | 0.713 | 0.390 | 0.760 | 0.390 |

Delta:

| offset | support delta | full support delta | answer present delta | full support + answer delta |
|---:|---:|---:|---:|---:|
| 0 | +0.165 | +0.190 | +0.120 | +0.190 |
| 500 | +0.131 | +0.130 | +0.040 | +0.130 |

## Gate result

The coverage continue criterion passes on offsets 0 and 500:

```txt
full_support_and_answer improves by >= +0.05 absolute
```

Observed:

```txt
offset 0:   +0.190
offset 500: +0.130
```

Offset 1000 lacks a current-config comparison because the current retrieval path with second-hop BM25 expansion is slow, but the grid-best absolute coverage remains stable:

```txt
full_support_and_answer: 0.380
answer_present: 0.700
```

## What this means

The first pivot test found a real retrieval/path signal without LLM calls.

The result is not yet an answer-quality claim. It only says:

```txt
The retrieved top-10 evidence geometry can be made cleaner by reducing noisy expansion.
```

## Next step

Run a small answer-quality test with the winning retrieval config:

```txt
offset 500, n=100 first
then offset 1000, n=100 if offset 500 does not regress
```

Compare:

```txt
current entity_hop_path_prompt
vs
winning retrieval config + same path prompt
```

Proceed only if:

```txt
EM wins > EM losses
EM delta >= +0.03
F1 delta >= +0.05
```

## Non-claims

This does not claim:

```txt
answer quality improved yet
retrieval alone solves RealRAG
EPKV improves RealRAG
```

It only justifies spending one bounded 4090 answer-quality run on the winning retrieval geometry.
