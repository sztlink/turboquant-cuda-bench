# Evidence Protection Layer v0.2 — synthetic answer-equivalence harness

Status: PROTECT gate complete
Primary artifact: `bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/`

## One-line result

A protected rewrite must either preserve the original synthetic output/closure or fail closed. In this smoke gate, 5/6 rewrites were equivalent and 1/6 was blocked.

## Boundary

```txt
regime: PROTECT
mode: synthetic answer-equivalence smoke
serving mutation: no
vLLM patch: no
EPKV hook-on: no
production output-changing path: no
prompt text: not stored
completion text: not stored
raw token ids: not stored
expected values: not stored
```

This is not an answer-quality claim, attention claim, evidence-use proof, serving benchmark, or production intervention.

## Contract

```txt
same output/closure -> protected rewrite allowed
mismatch -> fail closed / protected rewrite blocked
```

## Result

```txt
cases: 6
equivalent outputs: 5/6
same closure: 5/6
equivalence violations: 1/6
protected rewrites allowed: 5/6
fail-closed cases: 6/6
privacy findings: 0
status: passed
```

The one violation was a `rank_5` synthetic case where the protected rewrite changed closure. The harness blocked that protected rewrite as required.

## Why this matters

EPL v0 and v0.1 proved structural span survival. EPL v0.2 adds behavioral safety at the synthetic level:

```txt
protected packing is not automatically promoted
changed outputs are detected and blocked
```

This keeps PROTECT from becoming intervention by accident.

## Decision

```txt
EPL v0.2 passes: protected rewrites can be evaluated under an equivalence-or-fail-closed contract.
```

## Next gate

```txt
EPL v0.3: real-record replay compatibility.
```

Required v0.3 properties:

```txt
use hashed RealRAG-derived packs
no prompt/answer/completion text in artifacts
apply allow/block compatibility checks
no model inference unless synthetic or explicitly isolated
no production mutation
```

## Source artifacts

```txt
bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/RESULTS.md
bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/summary.json
bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/answer-equivalence.jsonl
bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/privacy-scan-report.json
```
