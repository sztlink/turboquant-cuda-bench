# Evidence-utilization phase package — 2026-05-17

Synthetic long-context quality package for the retrieval-utilization front.

The central behavior:

```txt
FOUND      retrieved evidence is present
PRESENTED  rank/decoys/context decide what competes locally
USED       answer closure may still fail
```

Start with:

```txt
RESULTS.md
```

Sealed offline milestone:

```txt
OFFLINE-MILESTONE-v1.9.md
```

Bridge docs:

```txt
EPKV-BRIDGE-SPEC.md
EPKV-BRIDGE-READOUT.md
EPKV-BEHAVIOR-MAP.md
EVIDENCE-PATH-LEDGER.md
EVIDENCE-PATH-LEDGER-VIEW.html
OFFLINE-MILESTONE-v1.9.md
```

Included sweeps:

- `phase/` — evidence zone, canonical rank, and decoys-before phase diagram.
- `depth/` — 20k / 80k / 160k context-depth sweep.
- `prompt-scaffold/` — baseline vs negative / positive / structured prompt variants.
- `distractor-taxonomy/` — unrelated noise vs explicit decoy / stale record / conflicting correction / near duplicate.
- `controller/` — overnight sequence wrapper log and done marker.

Not included: raw per-request `summary.jsonl` / raw answers. Those remain local staging artifacts.

Core thesis:

```txt
retrieved != used
evidence depth != evidence utilization
local evidence competition dominates closure
```
