# Evidence-Path Runtime Telemetry v0.5 — read-only CI verifier

Status: Phase 1 read-only verification gate complete
Primary artifact: `bench/evidence-path-runtime-telemetry-v05-readonly-ci-2026-05-21/`

## One-line result

Phase 1 telemetry artifacts can now be verified without an endpoint: public docs, machine reports, and telemetry event files pass a read-only CI-style check.

## Boundary

```txt
source: committed telemetry artifacts and public docs
mode: read-only/no-endpoint CI verifier
endpoint required: no
serving mutation: no
model inference: no
vLLM patch: no
EPKV hook-on: no
output-changing path: no
```

This is not a serving benchmark, speedup claim, answer-quality claim, attention attribution, or proof of evidence use.

## Command

```bash
node 07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v05-readonly-ci.mjs
```

## Checks

```txt
public docs checked: 5
machine reports checked: 6
event files schema-validated: 4
failed checks: 0
status: passed
```

Docs checked:

```txt
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md
```

Event files validated:

```txt
v0 replay events
v0.1 sidecar events
v0.3 guarded sidecar events
v0.4 nested guarded sidecar events
```

## Relation to earlier telemetry gates

```txt
v0:   RealRAG replay -> telemetry schema -> validator pass
v0.1: synthetic local request -> sidecar telemetry -> validator pass
v0.2: sidecar/security fixtures -> fail-closed + privacy regression pass
v0.3: guarded sidecar run loop -> preflight + served-model guard + postflight pass
v0.4: config-driven CI-style command -> guarded run pass
v0.5: read-only/no-endpoint verifier -> committed artifacts pass
```

## Decision

```txt
Phase 1 telemetry now has both endpoint-mode lab validation and no-endpoint public artifact validation.
```

## Next gate

```txt
Telemetry v0.6: consolidate v0–v0.5 into a single public Phase 1 telemetry index and freeze the current non-intervention boundary.
```

## Source artifacts

```txt
bench/evidence-path-runtime-telemetry-v05-readonly-ci-2026-05-21/RESULTS.md
bench/evidence-path-runtime-telemetry-v05-readonly-ci-2026-05-21/summary.json
bench/evidence-path-runtime-telemetry-v05-readonly-ci-2026-05-21/readonly-ci-report.json
```
