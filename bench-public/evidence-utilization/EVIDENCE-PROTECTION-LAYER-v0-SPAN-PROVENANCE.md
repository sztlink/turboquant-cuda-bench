# Evidence Protection Layer v0 — span provenance

Status: PROTECT gate complete
Primary artifact: `bench/evidence-protection-layer-v0-span-provenance-2026-05-21/`

## One-line result

Support/evidence spans from RealRAG R3L survive deterministic protected packing as public-safe hashed span provenance and estimated page geometry.

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

This is not an answer-quality claim, attention claim, evidence-use proof, serving benchmark, or runtime intervention.

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

## Manifest contents

Each manifest row contains:

```txt
hashed question/record ids
condition
source closure metric
support rank
protected pack hash
estimated paragraph/page ranges
protected support span hashes
protection marker name
validation checks
```

It excludes:

```txt
question text
paragraph text
prompt text
raw token ids
gold answer
prediction/completion text
user data
```

## Why this matters

Telemetry observes. Protection needs a form that can preserve evidence spans before any runtime intervention exists.

This gate establishes the first non-intervention protection unit:

```txt
evidence span -> protected marker -> packed range -> hashed provenance
```

## Decision

```txt
EPL v0 passes: PROTECT can begin as packing/provenance, not hook/kernel work.
```

## Next gate

```txt
EPL v0.1: structural output-equivalence / packing invariance.
```

Required v0.1 properties:

```txt
paragraph multiset preserved
support span hashes preserved
no-support emptiness preserved
protected pack hash stable under deterministic transform
no text leakage
no model inference required
```

## Source artifacts

```txt
bench/evidence-protection-layer-v0-span-provenance-2026-05-21/RESULTS.md
bench/evidence-protection-layer-v0-span-provenance-2026-05-21/summary.json
bench/evidence-protection-layer-v0-span-provenance-2026-05-21/span-provenance.jsonl
```
