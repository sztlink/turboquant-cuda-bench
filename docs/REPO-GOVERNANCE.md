# Repo Governance

This repo is a research archive, not a dump target. The goal is auditability.

## Surfaces

| surface | role | rule |
|---|---|---|
| `README.md` | short public entry | current state only; no session ledger |
| `STATE.md` | canonical truth | update after major falsification or promoted result |
| `bench/MANIFEST.md` | status map | every promoted bench gets status and summary |
| `bench-public/` | public-safe packages | compact, readable, caveated |
| `bench/` | research archive | raw/provenance allowed but must be indexed if cited |
| `07-scripts/` | historical + active scripts | active scripts should be named/linked from manifest or state |
| `docs/` | long-form explanation | move old README-sized narratives here |
| `boring-receipts` sibling | reproducibility receipt layer | standalone receipts only; no raw lab |

## Status labels

Use these labels in `bench/MANIFEST.md`:

```txt
CANONICAL   primary artifact for current claim/falsification
SUPPORTING  useful supporting evidence
NEGATIVE    promoted falsification/no-delta result
SUPERSEDED  replaced by later cleaner artifact
ARCHIVE_ONLY historical/provenance only
SCRATCH     local/probe output; do not cite publicly
```

## Retention rule

Default for new experiments:

```txt
Track:
- README/RESULTS markdown
- compact summary.json
- exact command shape
- small configs / fixtures needed to rerun

Do not track by default:
- per-case response JSON
- raw runs/ directories
- stdout logs
- large records.jsonl/events.jsonl
- temporary policy files
```

If a raw artifact must be tracked, explain why in the artifact README or in `bench/MANIFEST.md`.

## Claim rule

Every promoted result needs:

```txt
claim
non-claim
baseline
N / slice
metric
paired wins/losses when applicable
latency/cost note when applicable
path to raw/provenance if retained
```

## Public language rule

Prefer:

```txt
answer closure
path construction
evidence placement
machine-only reality check
runtime observability
```

Avoid or strictly caveat:

```txt
retrieved ≠ used
evidence utilization as a thesis
internal evidence use
production RAG bottleneck
EPKV fixes RealRAG
human adjudication next gate
```

`retrieved ≠ used` may remain as historical shorthand only when immediately bounded as operational separation between evidence presence and answer closure.

## Promotion workflow

1. Run experiment in a local or ignored output dir when possible.
2. Produce compact `RESULTS.md` + `summary.json`.
3. Decide status: CANONICAL / SUPPORTING / NEGATIVE / SUPERSEDED / ARCHIVE_ONLY / SCRATCH.
4. Update `bench/MANIFEST.md` if promoted.
5. Update `STATE.md` only if the result changes current truth.
6. Mirror to `boring-receipts` only if it is a standalone public reproducibility receipt.

## Stop conditions

Stop and update `STATE.md` instead of adding more machinery when:

```txt
- N increases and the effect disappears.
- A simpler baseline matches or beats the intervention.
- A verifier/reranker produces equal wins and losses.
- The experiment creates more surface area than conclusion.
```

## Current freeze

As of 2026-05-23:

```txt
- hand-written verifier gates are frozen
- sampler/Triton/kernel intervention should wait for a quality delta
- human adjudication is not the active plan
- raw per-case dumps should not be committed by default
```
