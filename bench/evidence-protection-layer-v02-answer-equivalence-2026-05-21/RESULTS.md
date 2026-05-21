# Evidence Protection Layer v0.2 — synthetic answer-equivalence harness

Status: passed with one protected rewrite blocked
Date: 2026-05-21

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

This gate compares original synthetic prompts against protected rewrites on the existing local endpoint. The contract is:

```txt
same output/closure -> protected rewrite allowed
mismatch -> fail closed / protected rewrite blocked
```

This is not an answer-quality claim, attention claim, evidence-use proof, serving benchmark, or production intervention.

## Artifacts

```txt
07-scripts/evidence-utilization/run-evidence-protection-layer-v02-answer-equivalence.mjs
bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/answer-equivalence.jsonl
bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/summary.json
bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/privacy-scan-report.json
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

## Decision

```txt
EPL v0.2 passes: protected rewrites can be evaluated under an equivalence-or-fail-closed contract, and non-equivalent rewrites are blocked rather than promoted.
```

## Next gate

```txt
EPL v0.3: real-record replay compatibility — apply the same allow/block contract to hashed RealRAG-derived packs without storing prompt or answer text.
```

Still out of scope:

```txt
runtime hook
kernel/page-selection path
production output-changing intervention
attention/evidence-use proof
serving speedup
answer-quality claims
```
