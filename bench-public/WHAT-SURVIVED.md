# What Survived the No-Delta

> A public field guide to the TurboQuant archive after the N=500 falsification.

This is not a new claim, not a leaderboard, and not a production benchmark. It is a curated map of what remains useful after the strongest later caveats are applied.

Important correction: the N=500 no-delta belongs to the RealRAG/verifier line. It does not define the whole repository. The broader archive has three axes: KV-cache quantization fidelity, action-trace fidelity, and runtime/kernel engineering.

Read first:

- [`../TECHNICAL-FINDINGS.md`](../TECHNICAL-FINDINGS.md) - three-axis technical map.
- [`../STATE.md`](../STATE.md) - canonical current stance.
- [`../TURBOQUANT-ATLAS.md`](../TURBOQUANT-ATLAS.md) - wider reading architecture.
- [`../bench/MANIFEST.md`](../bench/MANIFEST.md) - artifact status map.

## Boundary first

The N=500 machine-only RealRAG check found no quality delta for gated verifier/rerank control over direct entity-hop path prompting:

```txt
path_prompt EM 0.216 / F1 0.324
gated_v1   EM 0.216 / F1 0.323
wins/losses/ties = 2 / 2 / 496
```

So these are **not** current claims:

- EPKV/sampler/verifier control improves natural RealRAG quality.
- `retrieved != used` is a dominant production RAG bottleneck.
- selected-position telemetry proves internal model evidence use.
- any EPKV hook is production-ready.
- small-slice verifier gains generalize.

Canonical falsification:

- [`../bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md`](../bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md)

## 0. KV-cache quantization fidelity is a first-class axis

**Status:** `SURVIVED`

This is the large buried axis that the RealRAG no-delta does not touch.

What survived:

```txt
PPL, KLD, and token match are not enough to call a KV-cache change lossless.
Generation-path preservation needs a trajectory-level gate.
The fragile cache axis depends on architecture, quantization scheme, and metric family.
```

Main receipts:

- [`../TECHNICAL-FINDINGS.md#axis-i-kv-cache-quantization-fidelity`](../TECHNICAL-FINDINGS.md#axis-i-kv-cache-quantization-fidelity)
- [`../bench/rotorquant/results-llama8b.md`](../bench/rotorquant/results-llama8b.md)
- [`../bench/rotorquant/results.md`](../bench/rotorquant/results.md)
- [`../bench/refract-attnfix/results.md`](../bench/refract-attnfix/results.md)
- [`../bench/q4-hybrid-refract/results.md`](../bench/q4-hybrid-refract/results.md)
- [`../bench/sparse-v/results.md`](../bench/sparse-v/results.md)
- [`../bench/iq4nl-repro/results.md`](../bench/iq4nl-repro/results.md)
- [`../bench/dflash/adaptive-draft-results.md`](../bench/dflash/adaptive-draft-results.md)

Boundary: regime-specific receipts, not a universal ranking of KV-cache schemes.

## 1. Answer closure is placement-sensitive

**Status:** `SURVIVED`

Public QA probes show that evidence rank, placement, and competition affect answer closure.

HotpotQA:

```txt
R1 full: oracle_first 51.1%, bm25_retrieved 46.2%, oracle_last 42.7%, no_support 6.8%
R2:      rank_1 51.4%, rank_last 42.4%, rank_8 38.7%
R3B:     BGE rerank beats BM25 by +4.4 pp, 95% CI [+2.7, +6.1]
```

Why it survived: later no-delta results were about verifier/rerank control over entity-hop path prompting. They did not erase the public-dataset placement/rank diagnostics.

Main receipts:

- [`evidence-utilization/REALRAG-HOTPOTQA-R1.md`](evidence-utilization/REALRAG-HOTPOTQA-R1.md)
- [`evidence-utilization/REALRAG-HOTPOTQA-R2-RANKCURVE.md`](evidence-utilization/REALRAG-HOTPOTQA-R2-RANKCURVE.md)
- [`evidence-utilization/REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md`](evidence-utilization/REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md)
- [`evidence-utilization/REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md`](evidence-utilization/REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md)

Boundary: answer-side closure, not proof of internal evidence use.

## 2. 2Wiki is path/schema-sensitive

**Status:** `SURVIVED`

2Wiki did not reproduce the simple HotpotQA reranker ladder. It exposed a stronger dependency on relation path and schema shape.

```txt
R3G: BM25 33.3%, BGE 33.8%, oracle_first 31.9%
R3I: context_bge_direct 31.8%, support_sentences_typeaware 55.0%, evidence_triples_direct 75.5%
R3J: sentence_bge_top6_direct 23.0%, evidence_triples_gold 74.5%
```

Why it survived: this is the core reason direct entity-hop path prompting became the strongest non-oracle baseline later.

Main receipts:

- [`evidence-utilization/REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md`](evidence-utilization/REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md)
- [`evidence-utilization/REALRAG-2WIKI-R3H-DIAGNOSTIC.md`](evidence-utilization/REALRAG-2WIKI-R3H-DIAGNOSTIC.md)
- [`evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md`](evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md)
- [`evidence-utilization/REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md`](evidence-utilization/REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md)

Boundary: not a universal 2Wiki solution. It is a diagnostic showing that paragraph rerank alone is insufficient.

## 3. KVFidelity remains a useful trace lens

**Status:** `SURVIVED`

KVFidelity asks whether paired action traces remain stable when the model, prompt scaffold, decoding setup, seed, and scenario are held fixed while a runtime KV/cache configuration changes.

Key N=28 signal:

```txt
same-config controls: 100% stable
q8/turbo3 A/B:       action 82.1%, semantic 53.6%, full 50.0%, status 100%
turbo3/turbo3 A/B:  action 67.9%, semantic 46.4%, full 46.4%, status 92.9%
```

After source review, the strongest examples were workflow truncation, entity-resolution/order drift, and semantic argument drift.

Why it survived: it is methodology. It does not depend on the later RealRAG verifier claim.

Main receipts:

- [`kvfidelity/kvfidelity-2026-05-07-summary.md`](kvfidelity/kvfidelity-2026-05-07-summary.md)
- [`kvfidelity/kvfidelity-comparator-v2.md`](kvfidelity/kvfidelity-comparator-v2.md)
- [`kvfidelity/kvfidelity-holdout-result.md`](kvfidelity/kvfidelity-holdout-result.md)

Boundary: not a global safety ranking of KV modes and not a claim that KV compression breaks agents.

## 4. CASK and KVFidelity form a layered boundary

**Status:** `SURVIVED`

The useful public boundary is:

- CASK: token-distribution / teacher-forced replay fidelity.
- KVFidelity: downstream paired action/tool-trace fidelity.

Bridge cell v2 shows that action, target, source rank, and exact continuation can split.

Example high-level shape:

- FullKV and large-budget conditions retain action and target.
- Low-budget CASK/TriAttention conditions can preserve action while losing target identity or rank.

Main receipts:

- [`cask-kvfidelity-bridge/README.md`](cask-kvfidelity-bridge/README.md)
- [`cask-kvfidelity-bridge/RESULTS.md`](cask-kvfidelity-bridge/RESULTS.md)
- [`cask-kvfidelity-bridge/bridge-summary.sanitized.json`](cask-kvfidelity-bridge/bridge-summary.sanitized.json)

Boundary: synthetic bridge, not a global CASK or TriAttention benchmark.

## 5. vLLM cross-stack replays preserved the right failure shape

**Status:** `SURVIVED`

The vLLM migration produced more than a smoke. It gave cross-stack evidence.

Needle retrieval:

```txt
128K: 5/5
160K: 5/5 with YaRN factor 6, 3/5 with exact-fit factor 5
192K: 5/5
```

Decoy/ranking replay:

- llama.cpp 27B, vLLM 7B V3 off, and vLLM 7B V3 on all reached `5/8` under the same decoy top_k=16 prompts.
- One failure reproduced the same wrong literal: `DECOY-0616-1`.
- `policy_splice` recovered hard cases to `4/4` across stacks.

Main receipts:

- [`vllm-cross-stack/needle-192k-results.md`](vllm-cross-stack/needle-192k-results.md)
- [`vllm-cross-stack/decoy-replay-results.md`](vllm-cross-stack/decoy-replay-results.md)

Boundary: specific models, prompts, and retrieval corpus. Not a general long-context benchmark.

## 6. TurboQuant K8V4 beat FP8 drop-in on this adversarial 7B workload

**Status:** `SURVIVED`

In the vLLM decoy dtype sweep:

- BF16 auto and `turboquant_k8v4` matched at `5/8`, with byte-identical literals on this workload.
- naive FP8 and on-the-fly FP8 collapsed to `0/8`.
- calibrated W8A8-KV8 FP8 recovered structure but lost exact precision.

Main receipt:

- [`vllm-cross-stack/fp8-vs-turboquant-results.md`](vllm-cross-stack/fp8-vs-turboquant-results.md)

Boundary: not a refutation of broader FP8 results on different model scales and benchmark suites. It is a local adversarial retrieval receipt.

## 7. Evidence-Paged KV is a valid kernel/runtime lab

**Status:** `LAB ONLY`, with `SURVIVED` receipts

Evidence-Paged KV showed that evidence pages can become execution geometry, not just retrieval metadata.

Public kernel readout:

- v4: best public receipt, score -> top-k/softmax -> value accumulation.
- v5: fastest custom path for some `K=32` cases.
- v7: best architectural shape, page-local top-k without full score materialization.

Selected v4 numbers:

```txt
8192 rows K=32:    PyTorch 1.3494 ms vs kernel 0.1485 ms
32768 rows K=32:   PyTorch 1.3711 ms vs kernel 0.3277 ms
131072 rows K=128: PyTorch 2.9051 ms vs kernel 0.2660 ms
```

Main receipts:

- [`evidence-paged-kv/README.md`](evidence-paged-kv/README.md)
- [`evidence-paged-kv/RESULTS.md`](evidence-paged-kv/RESULTS.md)
- [`evidence-paged-kv/VERSION-TAXONOMY.md`](evidence-paged-kv/VERSION-TAXONOMY.md)

Boundary: no vLLM production integration claim, no serving speedup claim, no answer-quality claim.

## 8. Compact evidence control is a strong upper bound

**Status:** `UPPER BOUND`

When evidence is already compact, clean, and targetable, the internal sampler + relation-path policy produced a large quality lift:

```txt
QUALITY-PROOF-300
baseline: EM 0.327, F1 0.428
policy:   EM 0.907, F1 0.934
wins:     176
losses:   2
```

Main receipt:

- [`../bench/epkv-live-probe-v0-2026-05-21/sprint-12h/QUALITY-PROOF-300.md`](../bench/epkv-live-probe-v0-2026-05-21/sprint-12h/QUALITY-PROOF-300.md)

Boundary: not natural retrieval proof. This is a control-plane upper bound.

## 9. Negative results became part of the apparatus

**Status:** `SURVIVED`

The most important publication shape may be Boring Receipts itself: a public proof apparatus where positive, blocked, mixed, and no-delta results have equal archival dignity.

Sibling project:

- [`https://github.com/sztlink/boring-receipts`](https://github.com/sztlink/boring-receipts)
- [`https://sztlink.github.io/boring-receipts/`](https://sztlink.github.io/boring-receipts/)

Useful entry points:

- [`HOW-TO-READ.md`](https://github.com/sztlink/boring-receipts/blob/main/HOW-TO-READ.md)
- [`NEGATIVES.md`](https://github.com/sztlink/boring-receipts/blob/main/NEGATIVES.md)
- [`PROCESS-INDEX.md`](https://github.com/sztlink/boring-receipts/blob/main/PROCESS-INDEX.md)
- [`receipts/2026-05-23-4090-vllm-realrag-gated-answer-rerank.md`](https://github.com/sztlink/boring-receipts/blob/main/receipts/2026-05-23-4090-vllm-realrag-gated-answer-rerank.md)
- [`receipts/2026-05-25-4090-thetom-vllm-clean-baseline-build-smoke.md`](https://github.com/sztlink/boring-receipts/blob/main/receipts/2026-05-25-4090-thetom-vllm-clean-baseline-build-smoke.md)

Boundary: Boring Receipts is the conservative circulation layer. It does not make every lab artifact a public claim.

## What did not survive

`NEGATIVE` These are not current positive claims:

1. Hand-written verifier/rerank gates improve natural RealRAG quality.
2. `retrieved != used` is a strong general thesis.
3. EPKV sampler/runtime intervention is a natural RAG fix.
4. selected-position telemetry proves internal model evidence use.
5. human adjudication is the next critical-path blocker.
6. live 4090 sztlink overlay behavior is upstream TheTom evidence.

## What remains lab-only

`LAB ONLY` These remain valuable but should not be sold as public proof:

- EPKV runtime hooks.
- dynamic sampler policy files.
- evidence page score boosts.
- token-range/value-mix interventions.
- default-off telemetry and protection layers.
- microbench kernels outside production attention.

Start here if you need the lab map:

- [`evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md)
- [`evidence-utilization/EVIDENCE-PROTECTION-LAYER-INDEX.md`](evidence-utilization/EVIDENCE-PROTECTION-LAYER-INDEX.md)
- [`evidence-utilization/EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md`](evidence-utilization/EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md)

## The shortest honest summary

```txt
The no-delta closed one claim, not the archive.

What survived:
- answer closure depends on rank, path, schema, and evidence competition;
- KVFidelity remains a useful paired action-trace diagnostic;
- vLLM cross-stack replays reproduced meaningful failure and recovery shapes;
- EPKV has valid kernel/runtime observability receipts, not production proof;
- Boring Receipts gives negative results equal public standing.
```
