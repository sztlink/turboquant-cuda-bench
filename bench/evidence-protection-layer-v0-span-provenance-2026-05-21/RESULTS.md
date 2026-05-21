# Evidence Protection Layer v0 — span provenance gate

Status: passed
Date: 2026-05-21

## Boundary

```txt
regime: PROTECT
mode: hook-off/offline deterministic packing provenance
serving mutation: no
model inference: no
vLLM patch: no
EPKV hook-on: no
output-changing runtime path: no
prompt text: not stored
raw token ids: not stored
answers/completions: not stored
```

This is the first PROTECT gate after the Phase 1 telemetry freeze. It verifies that support/evidence spans from RealRAG R3L survive deterministic protected packing/serialization as hashed span provenance and estimated page geometry.

It is not an answer-quality claim, attention claim, evidence-use proof, or runtime intervention.

## Artifacts

```txt
07-scripts/evidence-utilization/build-evidence-protection-layer-v0-span-provenance.mjs
bench/evidence-protection-layer-v0-span-provenance-2026-05-21/span-provenance.jsonl
bench/evidence-protection-layer-v0-span-provenance-2026-05-21/summary.json
```

## Result

```txt
records: 7964
failures: 0
status: passed
```

Checks:

```txt
all support-present records have protected spans: true
all no-support records have zero protected spans: true
paragraph/protected span ranges valid: true
no text fields emitted: true
```

## Coverage by condition

| condition | records | support present | protected records | protected spans | closure | mean seq len est |
|---|---:|---:|---:|---:|---:|---:|
| `bm25_top10` | 1991 | 1991 | 1991 | 3982 | 62.4% | 1570.3 |
| `bge_rerank_top10` | 1991 | 1991 | 1991 | 3982 | 64.6% | 1571.3 |
| `oracle_first` | 1991 | 1991 | 1991 | 3982 | 66.2% | 1570.3 |
| `no_support` | 1991 | 0 | 0 | 0 | 6.1% | 1314.0 |

## What a manifest record contains

```txt
qid hash
record hash
condition
source closure metric
support rank
protected pack hash
estimated paragraph/page ranges
protected support span hashes
protection marker name
validation checks
```

## What it excludes

```txt
question text
paragraph text
prompt text
raw token ids
gold answer
prediction/completion text
user data
```

## Decision

```txt
EPL v0 passes: support spans can be preserved through protected packing as public-safe hashed provenance.
```

## Next gate

```txt
EPL v0.1: structural output-equivalence / packing invariance — prove the protected pack preserves the paragraph multiset, support-span hashes, and no-support emptiness under deterministic transforms.
```

Still out of scope:

```txt
runtime hook
kernel/page-selection path
output-changing intervention
attention/evidence-use proof
serving speedup
answer-quality claims
```
