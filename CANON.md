# Canon — turboquant-cuda-bench

This repository is the material research archive for the TurboQuant / KVFidelity / RealRAG / EPKV front.

The current canonical state is **[STATE.md](STATE.md)**. If this file and `STATE.md` disagree, `STATE.md` wins.

## Current canonical stance

After the N=500 machine-only RealRAG check:

```txt
Evidence placement, retrieval, and path construction affect answer closure.
Direct entity-hop path prompting is the strongest non-oracle natural RealRAG baseline so far.
Hand-written verifier/rerank gates did not beat direct path prompting at N=500.
Oracle/compact evidence control is an upper bound, not natural retrieval proof.
Runtime EPKV/sampler work is lab/observability, not production proof.
```

N=500 summary:

```txt
path_prompt EM 0.216 / F1 0.324
gated_v1   EM 0.216 / F1 0.323
wins/losses/ties = 2 / 2 / 496
```

Canonical artifact:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md
```

## Current non-claims

Do not claim:

```txt
- “retrieved ≠ used” is a dominant production RAG bottleneck.
- EPKV/sampler/verifier control improves natural RealRAG quality.
- selected-position telemetry proves internal model evidence use.
- any EPKV runtime hook is production-ready.
- small-slice verifier gains generalize.
- human adjudication is the next critical-path blocker.
```

`retrieved ≠ used` may remain only as historical shorthand for operational separation between evidence presence and answer closure.

## Repository role

This repo preserves material evidence:

```txt
protocols
scripts
raw logs where necessary
processed traces
analysis notes
publicable artifacts
negative results
```

`memory-md` preserves cognitive/operational synthesis. `boring-receipts` preserves standalone public reproducibility receipts.

## Current entry points

```txt
README.md                         short public entry
STATE.md                          current truth and non-claims
KEY-FINDINGS.md                   public findings readout, caveated by STATE
bench/MANIFEST.md                 status map for major bench dirs
REPO-AUDIT-2026-05-23.md          hostile repo audit
docs/REPO-GOVERNANCE.md           retention and promotion policy
bench-public/                     public-safe packages
```

## Status vocabulary

Bench artifacts should be labeled as:

```txt
CANONICAL
SUPPORTING
NEGATIVE
SUPERSEDED
ARCHIVE_ONLY
SCRATCH
```

See `bench/MANIFEST.md`.

## Active freeze

As of 2026-05-23:

```txt
- hand-written verifier gates are frozen
- sampler/Triton/kernel intervention waits for a real quality delta
- no new raw per-case dumps by default
- human adjudication is not the active plan
```

## Structure

```txt
00-context/       front-level framing and historical context
02-raw/           raw logs and irreducible evidence
03-lab/           experiment cells with metadata and pointers
04-processed/     normalized traces, matrices, metrics, audits
05-analysis/      interpretation and lab notes
06-publicable/    decks, figures, public-facing packages
07-scripts/       scripts used to transform data into analysis/figures
08-archive/       superseded pointers and deprecated material
bench/            research archive and experiment outputs
bench-public/     public-safe summaries and receipt packages
docs/             governance and long-form repo documentation
```

## Rule

```txt
If it sustains a decision, it belongs in this repository.
If it explains a decision, it belongs in memory-md.
If it can disappear without epistemic loss, keep it out of git or in /tmp.
If it is public-facing, it must name its non-claims.
```
