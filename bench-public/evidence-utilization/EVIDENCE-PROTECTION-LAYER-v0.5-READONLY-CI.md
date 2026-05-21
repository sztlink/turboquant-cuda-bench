# Evidence Protection Layer v0.5 — read-only verifier

Status: PROTECT verification gate complete
Primary artifact: `bench/evidence-protection-layer-v05-readonly-ci-2026-05-21/`

## One-line result

PROTECT docs, reports, and JSONL artifacts can be verified without endpoint access or runtime contact.

## Boundary

```txt
mode: read-only PROTECT artifact verification
endpoint required: no
model inference: no
serving mutation: no
vLLM patch: no
EPKV hook-on: no
output-changing path: no
```

This is not a serving benchmark, speedup claim, answer-quality claim, attention attribution, or proof of evidence use.

## Command

```bash
node 07-scripts/evidence-utilization/run-evidence-protection-layer-v05-readonly-ci.mjs
```

## Result

```txt
public docs checked: 5
machine reports checked: 4
jsonl artifacts checked: 4
failed checks: 0
status: passed
```

## Relation to prior PROTECT gates

```txt
v0:   span provenance
v0.1: structural packing invariance
v0.2: synthetic answer-equivalence / fail-closed
v0.3: real-record replay compatibility
v0.5: read-only artifact verifier
```

## Decision

```txt
PROTECT has endpoint-mode smoke where needed and no-endpoint artifact validation.
Kernel/intervention remains inactive.
```

## Source artifacts

```txt
bench/evidence-protection-layer-v05-readonly-ci-2026-05-21/RESULTS.md
bench/evidence-protection-layer-v05-readonly-ci-2026-05-21/summary.json
bench/evidence-protection-layer-v05-readonly-ci-2026-05-21/readonly-ci-report.json
```
