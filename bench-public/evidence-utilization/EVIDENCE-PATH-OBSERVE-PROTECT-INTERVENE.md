# Evidence path roadmap — Observe / Protect / Intervene

Status: current operating map
Updated: 2026-05-21

This map follows Casey Reas's audit of the plan: kernel is substrate, not storyline. The next useful work should reveal behavior before optimizing or mutating runtime internals.

## Three regimes

| Regime | Question | Allowed forms | Not allowed |
|---|---|---|---|
| OBSERVE | What is happening to evidence placement, closure, and runtime geometry? | answer-closure gates, telemetry replay, sidecar dry-run, validators | output-changing intervention |
| PROTECT | Can evidence spans survive packing/serialization/rewrite with provenance? | deterministic packing, span provenance, output-equivalence harnesses, fail-closed rewrites | live hooks, attention bias, KV mutation |
| INTERVENE | Can runtime behavior be changed safely and measurably? | only after adjudication + telemetry + protection gates | premature kernel/page-selection storyline |

## Current state

```txt
OBSERVE: complete enough for Phase 1 membrane
PROTECT: opening with EPL v0 span provenance
INTERVENE: not started
KERNEL: not started
```

## Completed OBSERVE gates

```txt
Phase 0 RealRAG: answer-closure / evidence placement
Phase 1 telemetry v0: RealRAG replay -> telemetry schema
Phase 1 telemetry v0.1: synthetic runtime sidecar
Phase 1 telemetry v0.2: fail-closed/privacy fixtures
Phase 1 telemetry v0.3: guarded sidecar
Phase 1 telemetry v0.4: CI-style command
Phase 1 telemetry v0.5: read-only/no-endpoint verifier
```

## PROTECT sequence

| Gate | Purpose | Runtime mutation? |
|---|---|---:|
| EPL v0 span provenance | evidence spans survive deterministic packing as hashes/ranges | no |
| EPL v0.1 structural output-equivalence | paragraph multiset/support hashes preserved under packing transforms | no |
| EPL v0.2 synthetic answer-equivalence | protected rewrite preserves synthetic outputs or fails closed | no production mutation |
| EPL v0.3 real-record replay compatibility | RealRAG-style records produce protected packs without leaks | no |
| EPL v1 candidate | only after the above: define a falsifiable protection hypothesis | no by default |

## INTERVENE sequence, not active

```txt
1. dry-run runtime contact with original output preserved
2. correlation + adjudication gate
3. explicit intervention hypothesis
4. reversible hook, default-off
5. only later: kernel/page-selection optimization
```

## Kernel rule

Do not enter kernel work because kernel receipts exist. Enter kernel only when there is a behavior already made legible by OBSERVE and protected by PROTECT.

```txt
kernel = substrate
not roadmap driver
```

## Boundary

```txt
serving mutation: no, until an INTERVENE gate is explicitly opened
vLLM patch: no
EPKV hook-on: no
output-changing production path: no
attention attribution: no
evidence-use proof: no
speed/quality claim: no
```
