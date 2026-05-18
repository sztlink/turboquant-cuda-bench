# CASK × KVFidelity bridge v2 — 2026-05-17

Synthetic action-router bridge for separating upstream KV/cache compression from downstream action-trace fidelity.

**Status:** field artifact / methodology probe. Not a global CASK or TriAttention benchmark.

## What was tested

A Qwen3-8B CASK runtime was run on the same 120 synthetic evidence/action fixtures under:

- FullKV
- TriAttention budgets 512 / 1024 / 2048
- CASK budgets 512 / 1024 / 2048

Each fixture asks for one machine-readable action trace:

```txt
FINAL_ACTION=<action>;FINAL_TARGET=<target>;SOURCE_RANK=<rank>
```

Metrics separate:

- `action`: did the model choose the right operation?
- `target`: did it preserve the exact payload/target identity?
- `rank`: did it point to the right evidence rank?
- `exact`: did all three survive together?
- edit distance: how far the emitted target drifted from the expected target.

## Headline result

| run | exact | action | target | rank |
|---|---:|---:|---:|---:|
| FullKV | 119/120 | 119/120 | 119/120 | 120/120 |
| TriAttention 512 | 0/120 | 115/120 | 0/120 | 0/120 |
| TriAttention 1024 | 0/120 | 115/120 | 0/120 | 0/120 |
| TriAttention 2048 | 119/120 | 119/120 | 119/120 | 120/120 |
| CASK 512 | 1/120 | 117/120 | 2/120 | 108/120 |
| CASK 1024 | 109/120 | 119/120 | 109/120 | 120/120 |
| CASK 2048 | 119/120 | 119/120 | 119/120 | 120/120 |

## Interpretation boundary

The useful observation is layered, not method-global:

```txt
action fidelity can survive after payload fidelity fails
source-rank fidelity can survive after target identity fails
budget thresholds matter sharply in this fixture
```

For CASK at budget 512, action and rank often survived while exact target identity collapsed. At 1024, most payload fidelity returned. At 2048, this synthetic fixture matched FullKV within the observed baseline ceiling.

Do **not** read this as a general claim that CASK or TriAttention wins/loses. This is one synthetic action-router bridge cell on one model and one prompt family.

## Files

- `RESULTS.md` — generated tables.
- `bridge-summary.sanitized.json` — aggregate and per-case metrics without raw model outputs.
- `case-method-metrics.jsonl` — per case/method metric rows.
- `run-bridge-v2-remote.sh` — historical runner used locally; machine paths are environment-specific.
- `PRIVACY-AUDIT.md` — privacy notes.
