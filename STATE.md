# Current State — turboquant-cuda-bench

Last updated: 2026-05-31

## One-line state

This is a research archive for answer-closure, path-construction, KV/cache fidelity, and vLLM runtime observability probes. It has produced useful diagnostics, but it has **not** shown that EPKV/sampler/verifier control improves natural RealRAG quality.

## Current canonical truth

```txt
Evidence placement, retrieval, and path construction affect answer closure.
Direct entity-hop path prompting is the strongest LLM natural RealRAG baseline so far.
Hand-written verifier/rerank gates did not beat direct path prompting at N=500.
Prompt-level path guards failed by over-refusal on the fresh offset1500 slice.
No-LLM explicit path candidates improved, but the first answer-from-chain smoke failed the refusal gate.
Oracle/compact evidence control remains an upper bound, not natural retrieval proof.
Runtime EPKV/sampler work remains lab/observability, not production proof.
```

## Latest path-construction state: explicit candidates before answers

Artifacts:

```txt
bench/realrag-path-construction-v1-2026-05-30/
bench/realrag-path-candidates-v2-2026-05-31/NO-LLM-PASS2.md
bench/realrag-path-candidates-v2-2026-05-31/answer-from-chain-smoke-offset1500-n100-4090/RESULTS.md
```

Path Construction v1 result:

```txt
retrieval coverage reproduced on fresh offset1500
answer quality stayed mixed and failed the F1 gate
global guarded prompt failed by over-refusal
narrow guard-family prompts also underperformed same-run path prompt
```

No-LLM Path Candidates v2 pass 2:

| object | EM | contains | F1 |
|---|---:|---:|---:|
| config0 path prompt, offset1500 | 0.180 | 0.260 | 0.288 |
| explicit path candidate, posthoc diagnostic | 0.440 | 0.540 | 0.527 |

Pairwise EM movement vs config0 path prompt:

```txt
wins: 26
losses: 0
ties: 74
```

Authorized answer-from-chain smoke:

| object | EM | contains | F1 | refusal/missing |
|---|---:|---:|---:|---:|
| answer from chain | 0.300 | 0.370 | 0.350 | 0.510 |
| direct candidate object | 0.440 | 0.540 | 0.527 | 0.280 |
| config0 path prompt | 0.180 | 0.260 | 0.288 | 0.020 |

Smoke readout:

```txt
F1 improved over config0, but refusal rate failed the gate.
No runtime mapping yet.
No megakernel yet.
```

Boundary:

```txt
This is not a new natural RealRAG quality claim.
Candidate selection did not use gold answers, but the metric is posthoc.
Pass 2 candidate cleanup resolved the three EM losses vs config0.
The answer smoke showed that the model over-refuses when asked to re-answer from the path object.
Next step is not kernel work; it is revising the answer interface/path object without another GPU run by default.
```

## Key falsification: N=500 machine-only RealRAG check

Artifact:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/machine-reality-500/RESULTS.md
```

Results:

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BM25→BGE ref | 0.018 | 0.032 | 0.037 |
| entity-hop strong | 0.172 | 0.288 | 0.285 |
| entity-hop path prompt | **0.216** | **0.306** | **0.324** |
| raw answer rerank | 0.212 | 0.308 | 0.322 |
| gated rerank v1 | 0.216 | 0.304 | 0.323 |

Paired gated v1 vs path prompt:

```txt
wins:       2
losses:     2
ties:       496
discordant: 4
p-value:    1.0
EM delta:   0.000, 95% CI [-0.008, 0.008]
F1 delta:  -0.000, 95% CI [-0.007, 0.007]
```

Interpretation:

```txt
At N=500, answer rerank / gated verifier control does not produce a quality delta over direct entity-hop path prompting.
Small-slice gains at N=100/N=300 were slice-sensitive.
Freeze hand-written verifier gates.
```

## Best current natural RealRAG baseline and upstream object

LLM answer baseline:

```txt
entity-hop retrieval + graph/path prompt
```

Upstream object under inspection:

```txt
explicit path candidates before answer generation
```

Why:

```txt
Entity-hop path prompting improved over weak BM25/BGE references in the 2Wiki series.
It remained the baseline that gated answer control failed to beat at N=500.
The no-LLM explicit path candidate pass now catches many missing-hop errors before answer generation.
```

## Oracle / compact-evidence upper bound

The compact/oracle ECD quality proof remains useful, but only as an upper bound:

```txt
quality-proof-100 policy: EM ≈ 0.910 | F1 ≈ 0.931
quality-proof-300 policy: EM ≈ 0.907 | F1 ≈ 0.934
```

Boundary:

```txt
This does not prove natural RealRAG performance. It proves that when evidence is already compact, clean, and targetable, decoding control can recover answers.
```

## What the repo proves reasonably well

```txt
- Position/rank/path presentation affects answer closure.
- Synthetic and public QA probes can expose closure failures even when support is present.
- Strong retrieval/path construction matters more than downstream verifier control in current natural 2Wiki runs.
- Explicit path candidates can expose the missing hop that direct path prompting often stops before.
- vLLM runtime/sampler/KV intervention is technically feasible in a lab setting.
- KV/cache probes can separate action/rank/payload fidelity.
- The research workflow can falsify its own claims and preserve negative results.
```

## What the repo does not prove

```txt
- That “retrieved ≠ used” is a dominant production RAG bottleneck.
- That EPKV, sampler-side bias, value-mix, or verifier gates improve natural RealRAG quality.
- That selected-position telemetry is internal model evidence use.
- That any EPKV runtime path is production-ready.
- That LLM verifier confidence is calibrated.
- That small-slice gains generalize.
```

## Public framing to use

Preferred:

```txt
answer closure diagnostics
path-construction probes
machine-only RealRAG reality checks
KV/cache fidelity and runtime observability
```

Avoid as thesis language:

```txt
retrieved ≠ used
evidence utilization as a strong claim
Evidence-Paged KV as a RealRAG fix
human adjudication as next blocker
production RAG value
internal evidence use
```

`retrieved ≠ used` may remain as historical shorthand only if immediately bounded as operational separation between evidence presence and answer closure.

## Current operating decision

```txt
No more hand-written verifier gate tweaks.
No more prompt-guard wording tweaks for RealRAG.
No more sampler/Triton/kernel work until a quality delta exists.
No new raw per-case dumps in the active repo by default.
Next work should be explicit path-candidate review, path normalization, and then a small answer-from-selected-chain smoke only after infra authorization.
```

## Repo organization state

Immediate governance files:

```txt
README.md                         short public entry
STATE.md                          current canonical truth
REPO-AUDIT-2026-05-23.md          hostile repo audit
bench/MANIFEST.md                 bench status map
docs/REPO-GOVERNANCE.md           retention/promotion rules
```

Sibling public receipt layer:

```txt
https://github.com/sztlink/boring-receipts
```

Recommended future split only after the membrane is stable:

```txt
turboquant-cuda-bench   archive / historical research ledger
boring-receipts         public reproducibility receipts
epkv-runtime-lab        optional clean runtime/vLLM lab if that line continues
```
