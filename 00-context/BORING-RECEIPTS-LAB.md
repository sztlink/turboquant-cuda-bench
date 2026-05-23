# Boring Receipts Lab — NVIDIA validation for Waffle/TurboQuant

Status: inaugurated 2026-05-22, then EXTRACTED to its own repo same day.  
Now lives at: github.com/sztlink/boring-receipts · live https://sztlink.github.io/boring-receipts/  
Local: `~/implante/research/boring-receipts/` (sibling of this repo).  
Origin: AYA Crypto Infra Lab detour, 2026-05-22  
Owner: Felipe / AYA

## Why this exists

During the AYA Crypto Infra Lab exploration, the “NVIDIA validation” thread drifted back into Waffle/TurboQuant. Felipe correctly identified that this is **not a crypto-revenue front**, but the name and service shape are strong for the Waffle/TurboQuant context.

This file parks the idea here so it does not keep contaminating the crypto field.

## Working name

```txt
Boring Receipts Lab
```

## One-line thesis

```txt
Send branch + command shape. We return boring receipts.
```

## What “boring receipts” means

No hype, no vague benchmark claims. A receipt should include:

- repo / branch / commit;
- build flags;
- OS / driver / CUDA;
- GPU model and VRAM;
- exact command;
- model / quant / context;
- tok/s, TTFT, VRAM peak, power if available;
- quality smoke or failure reproduction;
- stdout/stderr/log excerpts;
- status: pass / fail / inconclusive;
- caveats and next step.

## Best initial fit

Waffle/TurboQuant hardware validation:

- Ampere/3090 now;
- Ada/4090 later;
- llama.cpp / turboquant / TriAttention / MTP / longctx branches;
- no need to route through Felipe’s repo;
- useful contribution = receipts, not positioning.

## Draft language for later, not posted

```txt
On the hardware-validation side: I can be a NVIDIA node when TriAttention + longctx hits llama.cpp.

4090 is busy today, but I can run Ampere/3090 now and Ada/4090 later.

If you have a branch + command shape, I’ll return boring receipts: commit, flags, driver, VRAM, tok/s/TTFT, quality/PPL/task output, and failures.

No need to route it through my repo.
```

## Guardrails

- Do not post without Felipe approval.
- Do not build/benchmark remotely without `[CONFIRMAR:INFRA]`.
- 4090 remains strategic; 3090 is the first validation node.
- Unknown repos/containers require inspection and sandboxing.
- This is not a crypto-income thesis. It belongs to TurboQuant/Waffle.

## First artifact — DONE (2026-05-22)

Built in `../boring-receipts/`:

- `receipt-template.yaml` ✅
- `receipt-template.md` ✅
- `receipts/2026-05-22-3090-llama31-8b-q4km-baseline.md` ✅ (real run on AYA-3090)
- `DRAFT-waffle-message.md` ✅ (clay, NOT posted — awaits Felipe visual approval)

Inaugural numbers: mainline llama.cpp b9286, Llama-3.1-8B Q4_K_M on RTX 3090 —
pp512 4448 tok/s, tg 131 tok/s, 6.3 GB VRAM, ~345 W, 68 °C.

Built out 2026-05-22 (autonomous run):
- `CANON.md` (reader doctrine) + `AXES.md` (axes, gate, scoring, visual form) + `GLOSSARY.md`.
- Rung 2 quant sweep receipt with **exercised quality gate**: Q4/Q5/Q8, tg
  131.9/118.7/90.3 t/s, PPL 7.50/7.39/7.33 (gate-v1 PPL Δ<5% vs Q8 → PASS).
- Delta-sheet SVG generator (`scripts/generate-delta-sheet.mjs`) in szt.link tokens.
- Navigable microsite `docs/boring-receipts.html` (linked from `docs/index.html`).

Updated 2026-05-23: Boring Receipts was extracted and pushed as a sibling public repo.
This note remains only as historical context so the idea does not re-contaminate this archive.

Current boundary:
- `boring-receipts` = standalone public reproducibility receipts.
- `turboquant-cuda-bench` = broader research archive and lab ledger.
- Do not duplicate raw lab surfaces into Boring Receipts.
