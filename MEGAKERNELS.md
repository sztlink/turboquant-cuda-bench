# Megakernels

## Current stance

```txt
Do not build a full transformer megakernel now.
Do not spend GPU time on kernel work until the quality path is gated.
Prepare the boundary where a future megakernel could attach.
```

The useful interpretation of "megakernel" in this repo is not a giant fused
transformer block. It is a staged runtime boundary where evidence/path selection,
candidate scoring, fallback policy, and value accumulation become one coherent
GPU-side execution object.

## Three different things people may call a megakernel

| name | meaning | status here |
|---|---|---|
| Full transformer megakernel | fuse large parts of the model block: projections, attention, MLP, residuals | not justified, not planned |
| Attention megakernel | fuse score, select, softmax, value for the attention path | valid long-term shape, blocked on quality/runtime gates |
| EPKV micro-megakernel | fuse candidate path scoring, local/global selection, compact fallback, and value accumulation for selected evidence pages | plausible future shape, prepare interface now |

## Why not a full transformer megakernel

A full megakernel would optimize the wrong boundary for the current state.

Current facts:

```txt
RealRAG gated verifier control failed N=500.
Prompt-level path guards failed by over-refusal.
No-LLM explicit path candidates are promising but still posthoc diagnostics.
EPKV kernels have receipts, not production attention.
vLLM runtime contact remains a separate boundary from microbench kernels.
```

A full megakernel would create a large integration burden before the repo has a
natural quality result that deserves runtime mutation.

## What exists already

The Evidence-Paged KV kernel line already materialized several pieces:

```txt
v4: clean public score -> top-k/softmax -> value receipt, hybrid Torch middle
v5: best current custom K=32 path, but K=128 collapses
v7: best no-full-score-materialization architecture, but slower at larger M
compact fallback: GPU-side probe -> detector -> fallback candidate merge proof
```

The important lesson is not "make bigger kernels." The important lesson is:

```txt
candidate handling and fallback policy are the real boundary
```

## The right next shape

The next useful runtime shape is an adaptive dispatcher, not a monolith:

```txt
path candidate object
  -> row/page selection map
  -> probe local candidates
  -> GPU overflow detector
  -> compact fallback or exact-only policy
  -> global select + softmax
  -> value accumulation
  -> fail-open to normal attention when guard fails
```

This is a micro-megakernel only if the path object earns runtime contact.

## Gates before any GPU/kernel run

No new kernel run should happen until all are true:

1. A no-LLM path object can be mapped to concrete context rows/pages.
2. Manual review confirms it is improving paths, not just formatting answer strings.
3. A small answer-from-selected-chain smoke is authorized and passes a quality gate.
4. The runtime hook can fail open to original vLLM/TurboQuant behavior.
5. The receipt names correctness, memory, latency, and fallback behavior separately.

## Non-claims

Do not claim:

- production attention;
- serving speedup;
- superiority over PagedAttention, FlashAttention, or vLLM default attention;
- that EPKV improves natural RealRAG quality;
- that no-LLM path-candidate diagnostics are a model-quality result;
- that a megakernel is the next implementation step.

## Current action

Prepare the megakernel readiness membrane:

```txt
bench/epkv-megakernel-readiness-v0-2026-05-31/
```

This is documentation and interface design only. No infra mutation. No 4090 run.
