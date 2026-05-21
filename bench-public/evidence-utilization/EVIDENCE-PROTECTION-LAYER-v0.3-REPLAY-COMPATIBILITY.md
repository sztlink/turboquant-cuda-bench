# Evidence Protection Layer v0.3 — real-record replay compatibility

Status: PROTECT gate complete
Primary artifact: `bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21/`

## One-line result

RealRAG-derived protected packs have one safe stable path, while support-reordering transforms are blocked until equivalence/adjudication exists.

## Boundary

```txt
regime: PROTECT
mode: real-record replay compatibility
model inference: no
serving mutation: no
vLLM patch: no
EPKV hook-on: no
runtime output-changing path: no
text fields: none
```

This is not an answer-quality claim, attention claim, evidence-use proof, serving benchmark, or runtime intervention.

## Policy

```txt
stable protected packing: allow if structural invariance passed
support_first_stable: block pending equivalence/adjudication
support_last_stable: block pending equivalence/adjudication
```

## Result

```txt
records: 7964
allowed decisions: 7964
blocked decisions: 15928
status: passed
```

Checks:

```txt
all records have at least one allowed path: true
all reorder transforms blocked: true
all allowed paths structural-pass: true
no text fields: true
```

## Coverage by condition

| condition | records | pass rate | allowed decisions | blocked decisions |
|---|---:|---:|---:|---:|
| `bm25_top10` | 1991 | 100.0% | 1991 | 3982 |
| `bge_rerank_top10` | 1991 | 100.0% | 1991 | 3982 |
| `oracle_first` | 1991 | 100.0% | 1991 | 3982 |
| `no_support` | 1991 | 100.0% | 1991 | 3982 |

## Why this matters

EPL v0.2 showed that protected rewrites can change synthetic outputs and therefore must be blocked when not equivalent.

EPL v0.3 applies that lesson conservatively to real-record replay:

```txt
stable marker-preserving pack: allowed
reorder transforms: blocked pending stronger evidence
```

This prevents PROTECT from becoming intervention by stealth.

## Decision

```txt
EPL v0.3 passes: real-record compatibility has a safe stable path and blocks unproven reorder transforms.
```

## Next gate

```txt
EPL v0.4: PROTECT index / boundary freeze.
```

## Source artifacts

```txt
bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21/RESULTS.md
bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21/summary.json
bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21/replay-compatibility.jsonl
```
