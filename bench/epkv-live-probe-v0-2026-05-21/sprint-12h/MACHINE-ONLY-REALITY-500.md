# RealRAG Machine-Only Reality Check 500

Automatic exact-answer benchmark only. No human adjudication.

Run completed 2026-05-23 on AYA-4090/vLLM endpoint.

Artifacts:

```txt
entity-hop-llm-500/
entity-hop-answer-rerank-500/
entity-hop-answer-rerank-gated-500/
entity-hop-answer-rerank-gated-v1-500/
machine-reality-500/
```

Command chain:

```txt
entity-hop retrieval/path prompt, N=500
-> answer rerank on disagreements
-> gated rerank v0
-> gated rerank v1
-> machine-only report with bootstrap CI
```

## Retrieval diagnostics

```txt
support_title_recall:      0.727
full_support_recall:       0.454
answer_string_present:     0.786
```

## Quality results

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BM25→BGE ref | 0.018 | 0.032 | 0.037 |
| entity-hop strong | 0.172 | 0.288 | 0.285 |
| entity-hop path prompt | **0.216** | **0.306** | **0.324** |
| raw answer rerank | 0.212 | 0.308 | 0.322 |
| gated rerank v0 | 0.216 | 0.304 | 0.323 |
| gated rerank v1 | 0.216 | 0.304 | 0.323 |

## Paired test: gated v1 vs path prompt

```txt
wins:       2
losses:     2
ties:       496
discordant: 4
binomial p: 1.0
```

Bootstrap 95% CI for deltas:

| metric | mean delta | 95% CI |
|---|---:|---:|
| EM | 0.000 | [-0.008, 0.008] |
| contains | -0.002 | [-0.012, 0.006] |
| F1 | -0.000 | [-0.007, 0.007] |

## Interpretation

The N=500 machine-only run does **not** support a quality-delta claim for answer rerank / gated rerank over direct entity-hop path prompting.

The scaled result is effectively:

```txt
entity-hop path prompt == gated rerank v1
```

The 100-case and 300-case positive gated signals were slice-sensitive. At N=500, the verifier/control layer mostly cancels itself out.

## What remains true

```txt
entity-hop path construction is a meaningful improvement over the weak BM25→BGE ref baseline.
```

But this run does **not** prove:

```txt
rerank beats path prompt
confidence-gated answer control beats path prompt
EPKV/sampler-side control improves natural RealRAG quality
```

## Decision

Freeze hand-written verifier gates. Do not publish RS3 as a positive result.

Next useful work is either:

```txt
A. retrieval/path-construction improvement, because retrieval still dominates; or
B. learned/selected override policy on held-out slices, with path prompt as hard baseline.
```

No further manual rule tweaks unless they are evaluated as a policy-selection experiment.

## Service state

Verified after run:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```
