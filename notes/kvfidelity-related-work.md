# KVFidelity related work and terminology note

Date: 2026-05-09  
Status: positioning note for README / public summaries

## Conservative positioning

KVFidelity applies **trajectory-aware / trace-based evaluation** to KV/V-cache compression:

```text
paired action-trace comparison across runtime inference configurations, with scenario order as a measured axis.
```

This note does not claim novelty for trajectory-aware evaluation itself. The narrower contribution is this specific instantiation for KV/V-cache compression and tool-use traces.

## Terminology

SciBORG (Muhoberac, Chopra et al., arXiv:2507.00081) explicitly uses **"action trace fidelity"** as an agent-benchmark dimension, alongside output correctness and system-state progression. It does not appear to define a formal capitalized/hyphenated term "Action-Trace Fidelity".

Safe wording:

```text
SciBORG uses "action trace fidelity" as a benchmark dimension. KVFidelity applies a related trace-fidelity lens to paired runtime-config comparisons under KV/V-cache compression.
```

Avoid:

```text
Action-Trace Fidelity was defined by Chopra et al.
```

## Closest agent / trace evaluation work

- **SciBORG** — Muhoberac, Chopra et al., arXiv:2507.00081. Compares action traces against encoded valid command sequences / blueprints and aggregates a conformance score.
- **TRACE** — Chen et al., WWW 2026 / arXiv:2602.21230. Trajectory-aware evaluation of deep research agents with a hierarchical trajectory utility function.
- **TRAJECT-Bench** — He et al., arXiv:2510.04550. Tool-use trajectory benchmark with exact match, inclusion, tool-usage / parameter checks, and LLM-judge trajectory satisfaction.
- **AgentPex / Willful Disobedience** — Sharma, Barke, Zorn, arXiv:2603.23806. Evaluates agentic traces against extracted behavioral specifications, including transition and argument specs.
- **Trace-Based Assurance Framework** — Paduraru, Bouruc, Stefanescu, arXiv:2603.18096. Defines Message-Action Traces and paired comparisons across system configuration κ, seed z, and perturbation schedule δ; methodology only, no KV-cache experiment.
- **TraxGen** — Mazzolenis & Zhang, NeurIPS 2025 workshop. Generates ground-truth trajectories with hard/soft order and parameter triplets.
- **WebGraphEval** — Qian et al., arXiv:2510.19205. Multi-turn web-agent evaluation via merged weighted action graphs.
- **Project Ariadne** — Khanzadeh, arXiv:2601.02314. Pairs original vs counterfactually intervened reasoning traces.

## Closest KV-cache compression work

- **CASK** — Kim & Gwon, arXiv:2604.10900. Closest KV cousin: behavior-preserving framing and token-level teacher-forced replay against full-KV continuations (top-1, top-5, mean NLL, first mismatch).
- **Hold Onto That Thought** — arXiv:2512.12008. Benchmarks KV-cache compression on reasoning tasks with task accuracy and attention-loss analysis.
- **CurDKV** — Sengupta et al., arXiv:2509.15038. Uses fidelity in the attention-output similarity / CUR decomposition sense.
- **VQKV** — Wang et al., arXiv:2603.16435. Uses high-fidelity for KV-vector reconstruction and downstream task-score retention.
- **KQ-SVD** — Lesens, Rakhshan, Rabusseau, arXiv:2512.05916. Provides analytical attention-fidelity guarantees; adjacent unless discussing bounds.

## What KVFidelity adds

Within the reviewed corpus, KVFidelity occupies a narrower slot:

1. **action-level traces** as the measured object, not just next-token, attention, or final task score;
2. **paired A/B trace comparison across runtime inference configurations**, specifically KV/V-cache format changes;
3. **same-build duplicate controls**, frozen hold-out, and trace-bound review metadata;
4. **scenario order / runtime context** as an experimental axis;
5. decomposition into **tool action-class path** and **semantic argument drift**.

Safer claim:

```text
We do not claim novelty of trajectory-aware evaluation as such. The contribution is this KV-cache-level instantiation: paired action-trace evaluation across runtime KV/V-cache configurations, with same-build controls, hold-out review, and scenario order as a measured axis.
```

## Overclaims to avoid

- first trajectory-aware evaluation;
- first replay-based KV evaluation;
- first reasoning-on-KV benchmark;
- first paired-trace comparison without qualifying the paired axis;
- unscoped "behavior-preserving" claims;
- analytical attention-fidelity guarantees.

## Draft public wording

```text
Related-work update: SciBORG (Muhoberac/Chopra et al., arXiv:2507.00081) explicitly uses "action trace fidelity" as an agent-benchmark dimension.

KVFidelity sits in the broader trajectory-aware / trace-based evaluation space, applying paired action-trace comparison to KV/V-cache compression with scenario order as a measured axis.
```
