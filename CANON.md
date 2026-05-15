# TurboQuant / KVFidelity / CASK — Canon

This repository is the **material canonical archive** for the TurboQuant / KVFidelity research front.

`memory-md` remains the cognitive/operational memory of the implante: decisions, work logs, and concise synthesis. This repository preserves the material evidence: protocols, scripts, raw logs, processed traces, analysis notes, and publicable artifacts.

## Current canonical entry point

```txt
00-context/CURRENT.md
```

## Current CASK/KVFidelity package

The latest consolidated package is:

```txt
03-lab/experiments/2026-05-13-cask-aime24-n30-trace-atlas/
05-analysis/kvfidelity/2026-05-15-trace-atlas-lab-note-v2.md
06-publicable/kvfidelity/2026-05-trace-atlas-v4/
```

## Current TurboQuant / Tecnofagia package

The latest sanitized long-context decoy package is:

```txt
bench/tecnofagia-discord-2026-05-14/README.md
bench/tecnofagia-discord-2026-05-14/RESULTS.md
bench/tecnofagia-discord-2026-05-14/sanitized-results-auto-20260515-015428.json
bench/tecnofagia-discord-2026-05-14/sanitized-results-turboquant_k8v4-20260515-090744.json
05-analysis/longctx/2026-05-15-retrieval-is-not-utilization.md
```

Current result:

```txt
vLLM auto / Qwen2.5-7B-Instruct / Discord decoys: 5/5 hits
TurboQuant K8V4 / Qwen2.5-7B-Instruct / Discord decoys: 5/5 hits after fresh vLLM rebuild
```

This belongs to the longctx/retrieval-utilization front, not to the CASK/AIME/KVFidelity benchmark slice.

Current longctx thesis:

```txt
Retrieval success is not utilization success. A retrieved chunk is not a used chunk.
```

## Canonical thesis

A correct answer is not a score. It is a temporal event: it emerges, persists, drifts, closes, or disappears.

In this CASK/AIME24 slice, CASK is not a performance claim. It is the experiment under analysis. KVFidelity is proposed as the diagnostic lens.

## Current empirical stance

Do not claim CASK wins.
Do not claim CASK loses globally.
Do not publish this as a benchmark result.

The current value is methodological: final-answer accuracy hides trajectory phenomena. The trace atlas separates discovery, retention, closure, answer drift, candidate churn, and extraction contamination.

## Boundary of evidence

This package covers:

```txt
Dataset: AIME24 first 30 problems
Model: Qwen3-8B
Runs: FullKV, TriAttention, CASK
max_new_tokens: 2048 / 4096
compressed budgets: 256 / 384 / 512
```

Mandatory caveats:

1. n=30 only.
2. single model.
3. single order / single run.
4. labels are regex/extractor-derived, not human-validated.
5. AIME numeric answers can create incidental matches.
6. TriAttention used packaged stats fallback `for_aime25_experiment/qwen3_8b.pt`, possibly suboptimal for AIME24.
7. compressed budgets tested only 256/384/512.
8. low absolute scores amplify relative noise.

## Structure

```txt
00-context/       current state and front-level framing
02-raw/           raw logs and irreducible evidence
03-lab/           experiment cells with metadata and pointers
04-processed/     normalized traces, matrices, metrics, audits
05-analysis/      interpretation and lab notes
06-publicable/    decks, figures, public-facing packages
07-scripts/       scripts used to transform data into analysis/figures
08-archive/       superseded pointers and deprecated material
```

## Rule

If it sustains a decision, it belongs in this repository.
If it explains a decision, it belongs in `memory-md`.
If it can disappear without epistemic loss, it may remain in `/tmp`.
