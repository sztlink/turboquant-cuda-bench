# Boring Receipts — Axes of variation

> A receipt is a point in a coordinate space. This file is the grammar of that
> space: what a receipt may vary, what it must hold invariant, and what it must
> only cite. Two receipts of the same branch should read as *the same question
> asked another way* — that is what makes a receipt a medium and not a panel.

Scope decided 2026-05-22 (option A), with the Casey/Giselle council. Rationale at
the bottom.

## Two kinds of load are not the same kind

The thing you push splits by *what stays fixed*:

- **Runtime load** — you vary **the machine**, the question stays fixed.
  (context, KV dtype, batch, concurrency…) — **this lab's axes.**
- **Probe load** — you vary **the question**, the machine stays fixed.
  (needle position, decoy rank, distractor type, prompt scaffold…) — a research
  program with its own hypotheses. **Lives in the parent repo, cited not absorbed.**

Mixing them breaks the receipt: a `command` that embeds a probe taxonomy is no
longer "run this and you get the same receipt" — it is "run this *if you accept my
theory of evidence*." Runtime axes keep the command self-denouncing.

## Load axes — runtime (what a receipt varies)

| axis | range / values | notes |
|---|---|---|
| **context length** (`n_ctx` / `-d` prefill depth) | 4K → 32K → 128K → 1M | the long-context heart; where KV pressure is real |
| **output length** (`-n`) | 128 → 512 → … | decode work, distinct from context |
| **KV-cache dtype — K** (`-ctk`) | f16 / q8_0 / q4_0 / turbo3/4 / k8v4 | **K is far more quant-sensitive than V** |
| **KV-cache dtype — V** (`-ctv`) | f16 / q8_0 / q4_0 / … | sweet spot often `K=q8_0 / V=q4_0` |
| **flash-attention** (`-fa`) | off / on | prerequisite for KV quant in llama.cpp |
| **batch / ubatch** (`-b` / `-ub`) | 2048 / 512 default | logical vs physical batch |
| **concurrency + request-rate** | 1 → N streams; req/s; burstiness | single-stream vs serving regime |
| **parallelism** (`-ngl`, `-ts`, TP/PP) | offload + multi-GPU split | |
| **scheduler features** | chunked prefill, prefix cache, spec decode, continuous batching | declare explicitly, on/off |
| **KV budget / compression** | 256 / 384 / 512 / 1024 / 2048 | where TurboQuant / CASK act |
| **YaRN / RoPE factor** | context-extension factor | needed past native ctx |

## Measurement axes — performance (what a receipt extracts)

Always report **prefill and decode separately, per context length** — KV quant in
long context degrades *decode only* (~37% slower tg at 110K); *prefill is immune*.
That separation is where a KV optimization reveals or unmasks itself.

| metric | notes |
|---|---|
| **pp t/s** (prefill, compute-bound) | TTFT ≈ prompt_tokens / pp |
| **tg t/s** (decode, memory-bound) | what a chat user feels |
| **TTFT / TPOT / ITL / E2EL** | report at **p50 and p99**, not just mean±sd |
| **goodput** | throughput meeting a declared SLO (e.g. `ttft:2000,tpot:200`) |
| **VRAM peak / KV-buffer MiB** | footprint per context length |

## The quality gate is an invariant, not an axis

The gate is **not** something a receipt sweeps. It is the honesty condition the
receipt asserts about itself: *this optimization preserved behavior within
tolerance.* A diff in a runtime axis reads as **variation**; a diff in the gate
reads as an **alarm**. They are categorically different and must not sit in the
same list.

Gate signals (minimal proof the optimization did not break the model): a quality
smoke, or PPL delta, or a needle-retrieval hit, or a KVFidelity check — **enough
to responsibilize, not full quality measurement.**

Two constitutional clauses (non-negotiable — without them the gate is just a wall
that hides power behind the word "boring"):

1. **The gate criterion is legible in the human layer of the receipt** — not
   buried in the command shape. The reader must see *which* proof was demanded,
   not only that it passed.
2. **The gate is versioned and contestable** — anyone who disagrees with the bar
   can propose another, and the change leaves a trace. A closed gate is a wall; a
   versioned, legible gate is a promise you can be held to.

## Out of scope — cited, not absorbed

The probe / evidence-utilization family — **needle position, canonical rank,
decoys-before, distractor taxonomy, prompt scaffold, top_k, seed** — is a living
research program with its own genealogy. It lives in the parent repo and is
referenced, never copied here: [`../KEY-FINDINGS.md`](../KEY-FINDINGS.md),
[`../GLOSSARY.md`](../GLOSSARY.md), [`../bench-public/`](../bench-public/).
Absorbing it would embalm a perishable, model-specific body of work inside a lab
whose value is durability.

## The ladder, re-read against the axes

The noob→Waffle ladder is a **diagonal** through this space — it climbs runtime
load *and* measurement depth together. But the axes are orthogonal, so the most
useful receipts often move **one axis at a time**:

| rung | moves which axes |
|---|---|
| 1 noob | tiny load (one ctx, one quant), pp/tg only |
| 2 quant | sweep KV dtype K/V; add VRAM |
| 3 build | source + flash-attn flag delta |
| 4 serving | concurrency + request-rate; p50/p99, goodput |
| 5 Waffle | a branch (TriAttention/longctx/MTP) + quality gate + failures |

## Comparison & scoring — never a single speed score

A synthetic "speed score" is the vendor's metric in disguise — the one big number
to post. The lab refuses it. Comparison is honest only when it **carries its
coordinates** in the axes; a number that hides *where in the space* it was measured
is hype. Four honest forms:

1. **Delta vs baseline** — the canonical unit. Not "X tok/s" (meaningless out of
   context) but "+18% tg @128K vs mainline, prefill immune, gate passed."
2. **Curve, not point** — speed under KV-quant is a *function of context*
   (`tg vs n_ctx`), because decode degrades with context and prefill does not. The
   honest speed "score" is the curve, which shows behavior, not a placard.
3. **Goodput under a declared SLO** — the only legitimate scalar: throughput that
   meets a stated latency budget (`ttft:2000,tpot:200`). The SLO is explicit and
   contestable, which is what separates it from a speed score.
4. **Context capacity** — the honest context "score": max `n_ctx` that fits a card
   with the gate passing (e.g. "3090: 197K KV headroom"). Anchored in `(card, gate)`.

## Visual form — the delta sheet

The receipt's visual is a **delta sheet**, not a dashboard (a dashboard that stacks
pp+tg+latency+goodput+VRAM is a cockpit — hype with the look of rigor). One form
answers one question. Three zones, read at increasing resolution up the ladder:

1. **Gate stamp first** — categorical PASS / FAIL / NOT-EXERCISED, before any
   pretty number. Color *is* allowed here because it is a binary fact, not a verdict.
2. **The delta** — `branch − baseline` over the swept axis, **zero as a dead line**
   (where "nothing changed" is visible as nothing). Sign by position; **no
   green/red traffic light on magnitude** (that judges, and a 2%-slower-but-4×-
   cheaper branch must not be painted "red"). Uncertainty band always visible.
3. **Number + sparkline** — the number says *how much*, the sparkline (▁▂▃▅▇) says
   *what shape*. The sparkline never replaces a delta number (it over-smooths).

Projections by rung (same truth, growing resolution): **noob** reads the text strip
(stamp + delta number + trend sparkline) inline in Markdown; **Waffle House** opens
the full SVG (delta band + pp/tg substrate curves, small multiples, clickable
command). The inline sparkline is a first-class citizen — it survives terminal,
screen reader, e-mail, fork — the form that distributes the power to audit the most.

### Visual gate (versioned invariants, not per-receipt taste)

- y anchored at zero, or the crop declared in text on the SVG (a truncated axis lies);
- color distinguishes *series*, never delivers a *verdict*;
- uncertainty band always shown (a clean thin line fakes precision);
- no stroke in the SVG without a counterpart in the YAML (no gradient/shadow/
  smoothing/animation — beauty the data doesn't sustain is makeup);
- small multiples: **locked shared scale** + **order by meaning** (by delta or by
  the swept axis), never by arrival;
- SVG + generator script + YAML versioned together (SVG alone is a mummy);
- static only — a live dashboard concentrates truth in whoever owns the uptime;
  if it exists it is a derived exhibit, never canonical.

Visual tokens inherit the szt.link light editorial system already in this repo
(`docs/GITHUB-VISUAL-DESIGN.md`): warm paper, charcoal ink, semantic color only,
notebook grain. Avoid: SaaS dashboard, neon, **leaderboard framing**, attention-like
heatmaps, animated/scripted SVG.

## Why this scope (council, 2026-05-22)

llama.cpp issue #18722 asked for a canonical minimal KV/long-context benchmark and
was closed **not planned** — because nobody wanted to own opining on the *construct*
(the probe taxonomy). The vacuum this lab fills is the **minimal canonical**
runtime receipt, not the full research program. Casey: keep the command
self-denouncing; the gate is invariant, not axis. Giselle: (C) velocity-without-
quality is the vendor's metric in disguise — it surveils; (B) total memory is
elegant irresponsibility; (A) digests without swallowing — *if* the gate stays
legible and contestable.
