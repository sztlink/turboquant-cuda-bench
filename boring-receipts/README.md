# Boring Receipts Lab

> Send branch + command shape. We return boring receipts.

A NVIDIA validation node for the Waffle/TurboQuant community. No hype, no vague
benchmark claims — just verifiable receipts: repo/branch/commit, build flags,
OS/driver/CUDA, GPU/VRAM, exact command, model/quant/context, tok/s, TTFT,
VRAM peak, power, quality smoke or failure reproduction, status, caveats.

**What "boring" actually means: the ladder runs from the noob to the Waffle
House.** The same plain, reproducible receipt format covers the person who just
downloaded a GGUF and ran one command, *and* the expert validating a
TriAttention/longctx branch under load. Every rung is reproducible by the rung
below it. We never skip steps to look advanced — skipping the floor is the
opposite of boring.

Context and rationale: [`../00-context/BORING-RECEIPTS-LAB.md`](../00-context/BORING-RECEIPTS-LAB.md)

## The ladder

| rung | who | what the receipt proves | reproducible by |
|---|---|---|---|
| **1 — noob** | anyone with a GPU | downloaded a prebuilt llama.cpp + a GGUF, ran one command, here are the real tok/s | a beginner in ~10 min |
| **2 — quant** | local user | same model across quants (Q4/Q5/Q8): the speed↔quality trade-off | rung 1 |
| **3 — build** | tinkerer | source build + flags (e.g. flash-attn): the delta vs the prebuilt | rung 2 |
| **4 — serving** | someone who serves | vLLM/SGLang aggregate throughput, req/s, TTFT, ITL under concurrency | rung 3 |
| **5 — Waffle House** | the community | a TriAttention/longctx/MTP branch: delta vs baseline + quality smoke + failures | rung 4 |

The point is the *whole climb*, not the top. A receipt nobody can reproduce is
just a benchmark claim.

## Layout

- `CANON.md` — the doctrine: *for whom*. A receipt re-executes (it does not address
  a reader); the gesture is truth, the human layer has reading primacy; the ladder
  is transferable trust.
- `AXES.md` — *what*: which axes a receipt may vary (runtime), what it holds
  invariant (the quality gate), what it only cites (the probe/RAG family in the
  parent repo), how it compares (scoring), and its visual form (the delta sheet).
- `scripts/generate-delta-sheet.mjs` — generates the delta-sheet SVG from the data
  (sibling render; edit data, re-run). Output in `assets/` + `../docs/assets/`.
- `receipt-template.yaml` — structured receipt skeleton.
- `receipt-template.md` — human-readable receipt skeleton (for PR/Discord).
- `receipts/` — completed receipts, one file per run.
- `GLOSSARY.md` — plain definitions of the terms used *in a receipt* (tok/s, pp/tg,
  TTFT, ITL, quant, ngl, VRAM peak, power…). The human layer that lets a beginner
  distrust a number. Research vocabulary lives in [`../GLOSSARY.md`](../GLOSSARY.md).
- `DRAFT-waffle-message.md` — outreach drafts (clay, **not** posted without approval).

## Engines & regimes

A receipt is **engine-aware**. Single-stream and serving are not comparable:

- **llama.cpp** — single-stream: pp tok/s, tg tok/s (`llama-bench`).
- **vLLM / SGLang / TensorRT-LLM** — serving: aggregate output tok/s, requests/s,
  TTFT, ITL under concurrency (`vllm bench` / `benchmark_serving.py`).

Reporting a single "tok/s" without the regime is the hype this lab refuses.

## Nodes

| node | machine | engine | status |
|---|---|---|---|
| AYA-3090 | felipe-pc, Windows, RTX 3090 24 GB | llama.cpp (native) | live ✅ |
| AYA-3090-wsl | felipe-pc, WSL2 Ubuntu | vLLM / SGLang | available, not set up |
| AYA-4090 | RTX 4090, Win+WSL2 | vLLM (installed) | later — LLM-busy |
| AYA2 | NUC, CPU-only | — | not an inference node |

## Receipts so far

- **Rung 1 (noob)** — `receipts/2026-05-22-3090-llama31-8b-q4km-baseline.md` —
  prebuilt llama.cpp b9286, Llama-3.1-8B Q4_K_M: pp512 4448 tok/s, tg 131 tok/s,
  6.3 GB VRAM, ~345 W. Reproducible by anyone with a GPU and 10 minutes.

Next rungs climb from here; we don't jump to the top.

## Guardrails

- No remote build/benchmark without Felipe's `[CONFIRMAR:INFRA]`.
- No posting without Felipe's explicit visual approval.
- Unknown repos/containers require inspection and sandboxing.
- 3090 is the first validation node; 4090 stays strategic.
- This is a TurboQuant/Waffle front, not a crypto-income thesis.
