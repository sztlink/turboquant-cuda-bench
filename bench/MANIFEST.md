# Bench Manifest

Status map for the major bench directories. This is an auditability membrane, not a full inventory of every raw run.

Status vocabulary:

| status | meaning |
|---|---|
| CANONICAL | primary artifact for a current public claim or falsification |
| SUPPORTING | useful supporting evidence; not the main current claim |
| NEGATIVE | promoted falsification / no-delta result |
| SUPERSEDED | replaced by a later run or cleaner artifact |
| ARCHIVE_ONLY | historical raw archive; do not use as entry point |
| SCRATCH | local/probe output; do not cite publicly |

## Current canonical / promoted artifacts

| path | family | status | public? | summary | superseded_by |
|---|---|---|---|---|---|
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/machine-reality-500/` | RealRAG / 2Wiki | NEGATIVE | yes, machine-only | N=500: gated verifier/rerank has no quality delta over entity-hop path prompt | — |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md` | RealRAG / 2Wiki | CANONICAL | yes | Human-readable N=500 no-delta report | — |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-answer-rerank-gated-v1-500/` | RealRAG / 2Wiki | NEGATIVE | supporting | Gated v1 at N=500: wins 2 / losses 2 | `machine-reality-500/` |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-answer-rerank-500/` | RealRAG / 2Wiki | SUPPORTING | no | Raw rerank N=500: under path prompt on EM/F1 | `machine-reality-500/` |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-llm-500/` | RealRAG / 2Wiki | SUPPORTING | no | Entity-hop retrieval/path prompt N=500 source run | `machine-reality-500/` |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/QUALITY-PROOF-300.md` | EPKV / oracle compact evidence | SUPPORTING | yes, caveated | Oracle/compact ECD upper bound: policy EM ≈0.907, F1 ≈0.934 | — |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/QUALITY-PROOF-100.md` | EPKV / oracle compact evidence | SUPPORTING | yes, caveated | Oracle/compact ECD upper bound: policy EM ≈0.910, F1 ≈0.931 | `QUALITY-PROOF-300.md` |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/RAG-REALITY-CHECK-100.md` | RealRAG / 2Wiki | SUPPORTING | yes | Early natural retrieval reality check; retrieval bottleneck visible | later entity-hop/N=500 runs |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-LLM-100.md` | RealRAG / 2Wiki | SUPPORTING | yes | Entity-hop path prompt first meaningful bridge | N=500 check |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ANSWER-RERANK-100.md` | RealRAG / 2Wiki | SUPERSEDED | yes, historical | Positive small-slice gated result; did not scale | N=500 check |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ANSWER-RERANK-300.md` | RealRAG / 2Wiki | SUPERSEDED | yes, historical | 300-case v0 mixed result | `ENTITY-HOP-ANSWER-RERANK-GATED-V1.md`, N=500 check |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ANSWER-RERANK-GATED-V1.md` | RealRAG / 2Wiki | SUPERSEDED | yes, historical | 300-case small clean gain; did not scale to N=500 | N=500 check |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-SOFT-POLICY-SWEEP-10H.md` | RealRAG / sampler policy | NEGATIVE | yes | Soft/multi-candidate first-token policy did not beat direct path prompt | N=500 check |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ECD-100.md` | RealRAG / strict extractor ECD | NEGATIVE | yes | Strict extractor+ECD was brittle and under path prompt | entity-hop path prompt |
| `bench/epkv-live-probe-v0-2026-05-21/sprint-12h/RETRIEVED-RELATION-ECD-100.md` | RealRAG / retrieved relation ECD | NEGATIVE | yes | Retrieved relation extractor+ECD underperformed | entity-hop path prompt |
| `bench/epkv-live-probe-v0-2026-05-21/RESULTS.md` | EPKV live probe | CANONICAL | yes | Local canonical ledger for EPKV/RealRAG live-probe family | — |
| `bench/epkv-control-eligibility-v0-2026-05-30/FINAL-DECISION.md` | RealRAG / gated control | NEGATIVE | yes | Option A too small, Option B failed fresh holdout; hand-written gated control closed for now | `bench/realrag-path-construction-v1-2026-05-30/` |
| `bench/realrag-path-construction-v1-2026-05-30/` | RealRAG / retrieval path | NEGATIVE | yes, mixed | Retrieval coverage reproduced, answer quality mixed, prompt guards failed by over-refusal | `bench/realrag-path-candidates-v2-2026-05-31/` |
| `bench/realrag-path-candidates-v2-2026-05-31/NO-LLM-PASS2.md` | RealRAG / explicit path candidates | SUPPORTING | internal, no quality claim | No-LLM explicit path candidates on fresh offset1500: posthoc EM/F1 0.440/0.527 vs config0 path prompt 0.180/0.288; answer smoke later failed refusal gate | `bench/realrag-path-candidates-v2-2026-05-31/answer-from-chain-smoke-offset1500-n100-4090/RESULTS.md` |
| `bench/realrag-path-candidates-v2-2026-05-31/answer-from-chain-smoke-offset1500-n100-4090/RESULTS.md` | RealRAG / answer from explicit chain | NEGATIVE | internal, 4090 smoke | F1 improved over config0, but refusal rate jumped to 0.510; no runtime mapping or megakernel | `bench/realrag-path-candidates-v2-2026-05-31/ANSWER-INTERFACE-V0.md` |
| `bench/realrag-path-candidates-v2-2026-05-31/ANSWER-INTERFACE-V0.md` | RealRAG / answer interface | SUPPORTING | internal, no-LLM | Local policy returns rendered candidate answer or falls back to config0 path prompt; EM/F1 0.460/0.557, 28 wins / 0 losses vs config0 | none |

## Public RealRAG / evidence-placement archive

| path | family | status | public? | summary | superseded_by |
|---|---|---|---|---|---|
| `bench/evidence-utilization-realrag-hotpotqa-r1-full-2026-05-20/` | HotpotQA | CANONICAL | yes | Full R1 answer-closure placement result | — |
| `bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/` | HotpotQA | CANONICAL | yes | Rank curve / position sensitivity | — |
| `bench/evidence-utilization-realrag-hotpotqa-r3a-promptvariants-2026-05-20/` | HotpotQA | SUPPORTING | yes | Prompt variants do not erase rank effect | — |
| `bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/` | HotpotQA | SUPPORTING | yes | BGE rerank closes much of HotpotQA BM25/oracle gap | — |
| `bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/` | HotpotQA | SUPPORTING | yes | 32B scale raises closure but preserves ladder | — |
| `bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/` | HotpotQA | SUPPORTING | yes | Metric/support audit; not human truth | — |
| `bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/` | HotpotQA | SUPPORTING | yes | Local judge triage only | — |
| `bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/` | HotpotQA | ARCHIVE_ONLY | yes, historical | Human adjudication pack; not active plan | — |
| `bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/` | HotpotQA/2Wiki | ARCHIVE_ONLY | yes, historical | Deduped calibration batch; human review is not active plan | — |
| `bench/evidence-utilization-realrag-r4c-calibration-readiness-2026-05-21/` | HotpotQA/2Wiki | ARCHIVE_ONLY | internal | Calibration readiness audit; not active plan | — |
| `bench/evidence-utilization-realrag-hotpotqa-r3f-ai-adjudication-2026-05-20/` | HotpotQA | SUPPORTING | yes | AI triage draft only | — |
| `bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/` | 2Wiki | CANONICAL | yes | 2Wiki does not reproduce HotpotQA reranker ladder | — |
| `bench/evidence-utilization-realrag-2wiki-r3h-diagnostic-2026-05-20/` | 2Wiki | SUPPORTING | yes | Type/schema diagnostic | — |
| `bench/evidence-utilization-realrag-2wiki-r3i-prompt-schema-ablation-2026-05-20/` | 2Wiki | SUPPORTING | yes | Support-sentence/gold-triple upper bounds | — |
| `bench/evidence-utilization-realrag-2wiki-r3j-sentence-compression-2026-05-20/` | 2Wiki | NEGATIVE | yes | Naive sentence compression hurts | — |
| `bench/evidence-utilization-realrag-2wiki-r6-relation-aware-construction-2026-05-21/` | 2Wiki | SUPPORTING | yes, historical | Relation-aware construction attempt; does not supersede N=500 state | later entity-hop/N=500 runs |
| `bench/evidence-utilization-realrag-2wiki-r7-generated-triples-2026-05-21/` | 2Wiki | NEGATIVE | yes, historical | Naive generated triples falsified | later entity-hop/N=500 runs |
| `bench/evidence-utilization-realrag-2wiki-r8-slot-filling-2026-05-21/` | 2Wiki | SUPPORTING | yes, historical | Structured slot filling improved small sample; does not supersede N=500 state | later entity-hop/N=500 runs |
| `bench/evidence-utilization-realrag-r5-statistical-robustness-2026-05-21/` | stats | SUPPORTING | yes | Offline bootstrap/paired deltas for earlier phase | N=500 report for current path line |

## KV-cache quantization fidelity archive

| path | family | status | public? | summary | superseded_by |
|---|---|---|---|---|---|
| `bench/rotorquant/results-llama8b.md` | RotorQuant / PPL / cache size | SUPPORTING | yes | Llama 3.1 8B head_dim=128: iso3 PPL edge holds, but K cache and throughput shape fail in this harness | `TECHNICAL-FINDINGS.md` |
| `bench/rotorquant/results.md` | RotorQuant / PPL / cache size | SUPPORTING | yes | Qwen3.6-27B head_dim=256: turbo3 wins PPL and memory/throughput over planar3/iso3 | `TECHNICAL-FINDINGS.md` |
| `bench-public/refract-trajectory/RESULTS.md` | REFRACT / dense KV trajectory | CANONICAL | yes | Public receipt: GTM/KLD can stay high while Trajectory path score collapses on dense q8/turbo3 | — |
| `bench/refract-attnfix/results.md` | REFRACT / dense KV trajectory | CANONICAL | yes | Dense 27B/32B: GTM permissive, Trajectory exposes V-cache turbo3 drift, cross-GPU sanity included | `bench-public/refract-trajectory/RESULTS.md` |
| `bench/q4-hybrid-refract/results.md` | REFRACT / hybrid q4_0 trajectory | CANONICAL | yes | Hybrid 35B-A3B: q4_0 looks good under GTM/KLD but degrades under Trajectory; K-only q4 slightly worse in this run | `TECHNICAL-FINDINGS.md` |
| `bench/sparse-v/results.md` | CUDA sparse-V | SUPPORTING | yes | sparse-V dequant skip is net-negative on CUDA in tested 3090/4090 depths | `TECHNICAL-FINDINGS.md` |
| `bench/iq4nl-repro/results.md` | long-context turbo4 / weight quant | SUPPORTING | yes | IQ4_NL and Q4_K_M share the same long-context q8/turbo4 degradation curve; penalty dominated by KV dequant kernel in this setup | `TECHNICAL-FINDINGS.md` |
| `bench/dflash/results.md` | DFlash speculative decoding | SUPPORTING | yes | DFlash depth bench limited by non-causal drafter and 24 GB VRAM | `TECHNICAL-FINDINGS.md` |
| `bench/dflash/adaptive-draft-results.md` | DFlash speculative decoding | SUPPORTING | yes | p-min=0.9 and fixed draft=8 beat default p-min=0.75 in tested setup | `TECHNICAL-FINDINGS.md` |

## KV/cache and long-context methodology archive

| path | family | status | public? | summary | superseded_by |
|---|---|---|---|---|---|
| `bench/cask-kvfidelity-bridge-v2-2026-05-17/` | CASK / KVFidelity | CANONICAL | yes | Separates action/rank/target fidelity | — |
| `bench/evidence-utilization-phase-2026-05-17/` | synthetic evidence placement | SUPPORTING | yes | Synthetic rank/decoy taxonomy | public-dataset RealRAG archives |
| `bench/longctx-utilization-overnight-2026-05-16/` | longctx decoy | SUPPORTING | yes | Retrieval can be present while answer closure fails | public RealRAG caveats |
| `bench/longctx-utilization-expanded-2026-05-16/` | longctx decoy | SUPPORTING | yes | Expanded synthetic staging confirmation | public RealRAG caveats |
| `bench/longctx-proxy-hard-2026-05-10/` | longctx decoy | ARCHIVE_ONLY | historical | Early proxy hard sweep | later utilization runs |
| `bench/longctx-decoy-resolution-2026-05-10/` | longctx decoy | ARCHIVE_ONLY | historical | Early resolution sweep | later utilization runs |
| `bench/needle-retrieval-2026-05-10/` | longctx retrieval | SUPPORTING | yes | Needle retrieval passes at long context | decoy closure results |
| `bench/vllm-decoy-2026-05-11/` | cross-stack decoy | SUPPORTING | yes | Cross-stack same-handle failure reproduction | — |
| `bench/evidence-paged-kv-kernel-v4-2026-05-18/` | EPKV kernels | SUPPORTING | yes | Clean score→top-k/softmax→value receipt | kernel summary docs |
| `bench/evidence-paged-kv-kernel-v5-2026-05-18/` | EPKV kernels | SUPPORTING | yes | Best custom K=32 microbench path | kernel summary docs |
| `bench/evidence-paged-kv-kernel-v7-2026-05-18/` | EPKV kernels | SUPPORTING | yes | Best no-full-score-materialization architecture, not fastest | kernel summary docs |
| `bench/evidence-path-runtime-telemetry-v0-2026-05-21/` | runtime telemetry | SUPPORTING | yes, caveated | Hook-off/default-off telemetry schema | telemetry index |
| `bench/evidence-protection-layer-v0-span-provenance-2026-05-21/` | protection layer | SUPPORTING | yes, caveated | Hook-off span provenance | protection index |
| `bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/` | protection layer | SUPPORTING | yes, caveated | Structural packing invariance | protection index |
| `bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21/` | protection layer | SUPPORTING | yes, caveated | Real-record replay compatibility | protection index |
| `bench/epkv-megakernel-readiness-v0-2026-05-31/` | EPKV / megakernel readiness | SUPPORTING | internal, planning only | Defines dispatcher boundary, readiness gates, and receipt template; no kernel run, no serving mutation | none |

## Scratch / raw-output policy

Do not cite these directly unless promoted by a markdown summary and manifest entry:

```txt
*/responses/
*/runs/
*.stdout.json
*.stdout.log
large raw events.jsonl
large raw records.jsonl
```

Historical tracked raw artifacts are retained for provenance. New raw per-case output should not be tracked by default; see `docs/REPO-GOVERNANCE.md`.
