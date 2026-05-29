# TurboQuant Atlas

> A public-safe reading architecture for the TurboQuant / REFRACT / KVFidelity / RealRAG / vLLM / EPKV archive.

This atlas is not a new result. It is a map of what survived, what failed, what remains an upper bound, and what should stay lab-only. The N=500 no-delta is a promoted falsification inside the archive, not the whole thesis of the repo.

If this file and [`STATE.md`](STATE.md) disagree, [`STATE.md`](STATE.md) wins.

## Current truth

The short version:

- **SURVIVED:** KV-cache quantization fidelity needs trajectory-level gates, not just PPL, KLD, or token match.
- **SURVIVED:** REFRACT shows the fragile cache axis depends on architecture, quantization scheme, and metric family.
- **SURVIVED:** KVFidelity is a useful paired action-trace lens for KV/V-cache runtime configuration changes.
- **SURVIVED:** vLLM and llama.cpp cross-stack replays reproduced useful long-context and decoy/ranking behavior.
- **SURVIVED:** Evidence-Paged KV has valid kernel and runtime-observability receipts, but not a production serving claim.
- **SURVIVED:** evidence placement, retrieval, rank, path construction, and schema shape affect answer closure.
- **UPPER BOUND:** compact/oracle evidence control can produce large answer-quality lift when evidence is already clean and targetable.
- **NEGATIVE:** hand-written verifier/rerank gates did not beat direct entity-hop path prompting at N=500.
- **FROZEN:** no more hand-written verifier gates as the main path.
- **LAB ONLY:** EPKV sampler/runtime/kernel interventions remain instrumentation unless a natural quality delta exists.

Canonical status pages:

- [`TECHNICAL-FINDINGS.md`](TECHNICAL-FINDINGS.md) - three-axis technical map.
- [`STATE.md`](STATE.md) - current truth and non-claims.
- [`KEY-FINDINGS.md`](KEY-FINDINGS.md) - public readout, caveated by `STATE.md`.
- [`bench/MANIFEST.md`](bench/MANIFEST.md) - canonical, supporting, negative, superseded, archive-only map.
- [`bench-public/README.md`](bench-public/README.md) - promoted public packages.
- [`REPO-AUDIT-2026-05-23.md`](REPO-AUDIT-2026-05-23.md) - why this atlas became necessary.

## How to read this atlas

Status vocabulary:

| status | meaning |
|---|---|
| `SURVIVED` | Still useful after later falsifications and caveats. |
| `NEGATIVE` | A promoted no-delta or falsification result. |
| `FROZEN` | Do not continue this direction by default. |
| `UPPER BOUND` | Strong result under controlled/oracle conditions, not natural proof. |
| `LAB ONLY` | Technical instrumentation or prototype, not public quality/production claim. |
| `ARCHIVE ONLY` | Historical context, not an entry point. |

Rule for each lane:

```txt
question -> what survived -> boundary -> canonical artifact -> public status
```

This repo is an archive of decisions and receipts, not a leaderboard.

## Technical axis map

```txt
Axis I   : KV-cache quantization fidelity   (llama.cpp / PPL / KLD / REFRACT)
Axis II  : action-trace fidelity             (KVFidelity / CASK bridge)
Axis III : runtime and kernel engineering    (vLLM cross-stack / EPKV kernels v1-v7)
```

The RealRAG line belongs to answer-closure and path-construction diagnostics. It is not the whole archive.

## Lane 0 - KV-cache quantization fidelity

**Question:** do KV-cache quantization claims preserve quality, memory shape, throughput shape, and generation trajectory across architectures and metrics?

### What survived

`SURVIVED` PPL, KLD, and token-match are insufficient alone. Generation-path preservation needs a trajectory-level gate.

RotorQuant retest:

- Llama 3.1 8B, head_dim=128: iso3 beats turbo3 on PPL, but planar3/iso3 K cache is larger than q8_0 and measured throughput is much worse in this harness.
- Qwen3.6-27B, head_dim=256: turbo3 beats planar3/iso3 on PPL and memory/throughput shape.

REFRACT:

- Dense 27B/32B under turbo3: GTM can pass while Trajectory degrades or fails, with V-cache turbo3 as the suspicious axis.
- Hybrid 35B-A3B under q4_0: q4_0 looks strong under GTM/KLD but degrades under Trajectory; K-only q4 is slightly worse than V-only q4 in this run.

Runtime/kernel-adjacent reproductions:

- CUDA sparse-V dequant skip is net-negative in tested 3090/4090 depths.
- IQ4_NL and Q4_K_M share the same long-context q8/turbo4 degradation curve; the penalty is dominated by the KV dequant kernel in this setup.
- DFlash default `p-min=0.75` is worse than `p-min=0.9` and fixed draft=8; a proper high-depth DFlash test needs larger-memory hardware.

### Boundary

These are regime-specific receipts. Do not claim a universal best KV scheme, universal architecture law, or downstream task-accuracy equivalence from REFRACT bands.

### Canonical artifacts

- [`TECHNICAL-FINDINGS.md`](TECHNICAL-FINDINGS.md)
- [`bench-public/refract-trajectory/RESULTS.md`](bench-public/refract-trajectory/RESULTS.md)
- [`bench/rotorquant/results-llama8b.md`](bench/rotorquant/results-llama8b.md)
- [`bench/rotorquant/results.md`](bench/rotorquant/results.md)
- [`bench/q4-hybrid-refract/results.md`](bench/q4-hybrid-refract/results.md)
- [`bench/sparse-v/results.md`](bench/sparse-v/results.md)
- [`bench/iq4nl-repro/results.md`](bench/iq4nl-repro/results.md)
- [`bench/dflash/adaptive-draft-results.md`](bench/dflash/adaptive-draft-results.md)

## Lane A - Answer closure and RealRAG

**Question:** if evidence is present in the context, does the answer close correctly?

### What survived

`SURVIVED` Evidence presence is not enough. Rank, placement, evidence competition, relation path, and schema shape change closure.

HotpotQA showed a stable position/rank effect:

- R1 full: `oracle_first 51.1%`, `bm25_retrieved 46.2%`, `oracle_last 42.7%`, `no_support 6.8%`.
- R2 rank curve: `rank_1 51.4%`, `rank_last 42.4%`, `rank_8 38.7%`.
- R3B natural retrieval: BGE rerank improved HotpotQA over BM25 by `+4.4 pp`, 95% CI `[+2.7, +6.1]`.

2Wiki did not follow the same paragraph-rerank story:

- R3G: `bm25_top10 33.3%`, `bge_rerank_top10 33.8%`, `oracle_first 31.9%`.
- R3I: `context_bge_direct 31.8%`, `support_sentences_typeaware 55.0%`, `evidence_triples_direct 75.5%`.
- R3J: naive sentence compression dropped to `23.0%` while gold triples remained high.

### Boundary

This does not prove internal model evidence use. It is answer-side closure under controlled public QA probes.

### Canonical artifacts

- [`bench-public/evidence-utilization/REALRAG-HOTPOTQA-R1.md`](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R1.md)
- [`bench-public/evidence-utilization/REALRAG-HOTPOTQA-R2-RANKCURVE.md`](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R2-RANKCURVE.md)
- [`bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md`](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md)
- [`bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md`](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md)
- [`bench-public/evidence-utilization/REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md`](bench-public/evidence-utilization/REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md)
- [`bench-public/evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md`](bench-public/evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md)
- [`bench-public/evidence-utilization/REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md`](bench-public/evidence-utilization/REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md)

## Lane B - Path construction and the N=500 turn

**Question:** after stronger natural retrieval/path construction, do answer rerank/verifier gates add quality?

### What survived

`SURVIVED` Entity-hop retrieval and path prompting became the strongest non-oracle natural 2Wiki baseline in this line.

Early 100-case bridge:

- BGE strong: `EM 0.090`, `F1 0.185`.
- Entity-hop path prompt: `EM 0.250`, `F1 0.330`.
- Confidence-gated answer rerank: `EM 0.270`, `F1 0.345`.

### What failed

`NEGATIVE` The small gated-rerank signal did not scale.

N=500 machine-only reality check:

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BM25 to BGE ref | 0.018 | 0.032 | 0.037 |
| entity-hop strong | 0.172 | 0.288 | 0.285 |
| entity-hop path prompt | **0.216** | **0.306** | **0.324** |
| raw answer rerank | 0.212 | 0.308 | 0.322 |
| gated rerank v1 | 0.216 | 0.304 | 0.323 |

Paired gated v1 vs path prompt:

```txt
wins/losses/ties: 2 / 2 / 496
EM delta:          0.000, 95% CI [-0.008, 0.008]
F1 delta:         -0.000, 95% CI [-0.007, 0.007]
p-value:           1.0
```

### Boundary

The no-delta result freezes hand-written verifier gates. It does not erase the earlier answer-closure archive or the path-construction insight.

### Canonical artifacts

- [`bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md`](bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md)
- [`bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-LLM-100.md`](bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-LLM-100.md)
- [`bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ANSWER-RERANK-100.md`](bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ANSWER-RERANK-100.md)
- [`bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ANSWER-RERANK-GATED-V1.md`](bench/epkv-live-probe-v0-2026-05-21/sprint-12h/ENTITY-HOP-ANSWER-RERANK-GATED-V1.md)

## Lane C - KVFidelity and CASK diagnostic lens

**Question:** can final pass/fail hide behavior drift when only the runtime KV/cache mechanism changes?

### What survived

`SURVIVED` KVFidelity applies trajectory-aware / trace-based evaluation to KV/V-cache compression. It compares paired action traces across runtime configurations under same-build controls.

Key N=28 result:

```txt
q8/q8 control:       100% action / semantic / full / status
q8/turbo3 A/B:       action 82.1%, semantic 53.6%, full 50.0%, status 100%
turbo3/turbo3 A/B:  action 67.9%, semantic 46.4%, full 46.4%, status 92.9%
```

After source review, the strongest examples were:

- TC-46: workflow truncation.
- TC-74: entity-resolution/order/argument drift under pass to pass.
- TC-62: semantic argument drift with action-class path preserved.

CASK related-work boundary was also validated publicly by Skyline-23:

- CASK: token-distribution / teacher-forced replay fidelity for reasoning-oriented KV compression.
- KVFidelity: downstream paired action/tool-trace fidelity under runtime KV/V-cache configuration changes.

### Boundary

This is not a global safety ranking of KV modes. It is a diagnostic lens showing that aggregate pass/fail can miss trace changes.

### Canonical artifacts

- [`bench-public/kvfidelity/kvfidelity-2026-05-07-summary.md`](bench-public/kvfidelity/kvfidelity-2026-05-07-summary.md)
- [`bench-public/kvfidelity/kvfidelity-comparator-v2.md`](bench-public/kvfidelity/kvfidelity-comparator-v2.md)
- [`bench-public/cask-kvfidelity-bridge/README.md`](bench-public/cask-kvfidelity-bridge/README.md)
- [`bench-public/cask-kvfidelity-bridge/RESULTS.md`](bench-public/cask-kvfidelity-bridge/RESULTS.md)

## Lane D - vLLM and cross-stack long context

**Question:** do the same long-context and decoy behaviors reproduce across inference stacks?

### What survived

`SURVIVED` The research front had already migrated to vLLM. The valuable result is not only that vLLM ran, but that it reproduced and clarified several long-context behaviors.

Needle retrieval with vLLM TurboQuant K8V4:

```txt
128K: 5/5
160K: 5/5 with YaRN factor 6, 3/5 with exact-fit factor 5
192K: 5/5
```

Decoy/ranking replay:

- llama.cpp Qwen 27B, vLLM Qwen 2.5-7B V3 off, and vLLM Qwen 2.5-7B V3 on all landed at `5/8` under decoy top_k=16.
- The `brass-river-index` failure produced the literally identical wrong answer `DECOY-0616-1` across stacks.
- `policy_splice` recovered the hard tasks to `4/4` across stacks.

FP8 vs TurboQuant K8V4:

- BF16 auto and `turboquant_k8v4` produced the same `5/8` decoy behavior.
- Naive FP8 and on-the-fly FP8 collapsed to `0/8`.
- Dataset-calibrated FP8 recovered structure but lost exact precision in this workload.

### Boundary

These are regime-specific receipts: Qwen family, local 4090, exact-match/adversarial retrieval, selected context shapes. They do not refute broader FP8 claims on different suites or model scales.

### Canonical artifacts

- [`bench-public/vllm-cross-stack/needle-192k-results.md`](bench-public/vllm-cross-stack/needle-192k-results.md)
- [`bench-public/vllm-cross-stack/decoy-replay-results.md`](bench-public/vllm-cross-stack/decoy-replay-results.md)
- [`bench-public/vllm-cross-stack/fp8-vs-turboquant-results.md`](bench-public/vllm-cross-stack/fp8-vs-turboquant-results.md)
- [`VLLM-RUNTIME-LINEAGE-4090.md`](VLLM-RUNTIME-LINEAGE-4090.md)

## Lane E - EPKV kernels and runtime observability

**Question:** can evidence-aware KV access be made executable as pages/tokens/selection geometry, and can it touch live serving safely enough to observe?

### What survived

`SURVIVED` Evidence pages can be represented as a CUDA execution shape and as vLLM runtime telemetry. This is a lab and observability contribution.

Kernel receipts:

- v4 is the best public receipt: score -> top-k/softmax -> value accumulation.
- v5 is the fastest custom path for some `K=32` cases.
- v7 is the best architectural shape: page-local top-k without full score materialization.

Selected v4 numbers:

```txt
8192 rows K=32:    PyTorch 1.3494 ms vs kernel 0.1485 ms
32768 rows K=32:   PyTorch 1.3711 ms vs kernel 0.3277 ms
131072 rows K=128: PyTorch 2.9051 ms vs kernel 0.2660 ms
```

Runtime/sampler work:

- span -> token -> KV page mapping;
- evidence page score boost telemetry;
- token-range and answer-token targeting;
- dynamic internal sampler policy file;
- scaffold suppression and candidate token bias;
- default-off restore/health discipline.

### Upper bound

`UPPER BOUND` Compact/oracle evidence control produced a large quality lift when evidence was already clean and targetable:

```txt
quality-proof-300 baseline: EM 0.327, F1 0.428
internal sampler + relation path: EM 0.907, F1 0.934
wins over baseline: 176
losses vs baseline: 2
```

### Boundary

This is not natural RealRAG proof, not a production serving-speedup claim, and not proof of internal model evidence use.

### Canonical artifacts

- [`bench-public/evidence-paged-kv/RESULTS.md`](bench-public/evidence-paged-kv/RESULTS.md)
- [`bench-public/evidence-paged-kv/VERSION-TAXONOMY.md`](bench-public/evidence-paged-kv/VERSION-TAXONOMY.md)
- [`bench-public/evidence-paged-kv/VLLM-HOOK-PLAN.md`](bench-public/evidence-paged-kv/VLLM-HOOK-PLAN.md)
- [`bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md`](bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md)
- [`bench-public/evidence-utilization/EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md`](bench-public/evidence-utilization/EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md)
- [`bench/epkv-live-probe-v0-2026-05-21/sprint-12h/QUALITY-PROOF-300.md`](bench/epkv-live-probe-v0-2026-05-21/sprint-12h/QUALITY-PROOF-300.md)

## Lane F - Boring Receipts as proof apparatus

**Question:** how should this work circulate without becoming hype?

### What survived

`SURVIVED` Boring Receipts became the public proof apparatus for reproducible local GPU/runtime receipts.

It is not a leaderboard. It gives positive, negative, blocked, mixed, and no-delta results equal archival dignity.

Core sibling:

- [`https://github.com/sztlink/boring-receipts`](https://github.com/sztlink/boring-receipts)
- [`https://sztlink.github.io/boring-receipts/`](https://sztlink.github.io/boring-receipts/)

Useful pages:

- [`HOW-TO-READ.md`](https://github.com/sztlink/boring-receipts/blob/main/HOW-TO-READ.md)
- [`NEGATIVES.md`](https://github.com/sztlink/boring-receipts/blob/main/NEGATIVES.md)
- [`PRESERVATION.md`](https://github.com/sztlink/boring-receipts/blob/main/PRESERVATION.md)
- [`PROCESS-INDEX.md`](https://github.com/sztlink/boring-receipts/blob/main/PROCESS-INDEX.md)
- [`receipts/2026-05-23-4090-vllm-realrag-gated-answer-rerank.md`](https://github.com/sztlink/boring-receipts/blob/main/receipts/2026-05-23-4090-vllm-realrag-gated-answer-rerank.md)
- [`receipts/2026-05-25-4090-thetom-vllm-clean-baseline-build-smoke.md`](https://github.com/sztlink/boring-receipts/blob/main/receipts/2026-05-25-4090-thetom-vllm-clean-baseline-build-smoke.md)

### Boundary

Boring Receipts is the circulation layer. It does not make every lab result public-ready.

## What remains private or internal

Do not publish or foreground:

- raw Discord text, message IDs, DMs, private server excerpts, or social surveillance artifacts;
- secrets, IPs, tokens, logs with operational sensitivity, or private paths;
- raw per-case dumps unless already promoted and sanitized;
- live 4090 overlay behavior as upstream TheTom evidence;
- new X/Discord claims without a concrete receipt.

## Public reading paths

### For a newcomer

1. [`STATE.md`](STATE.md)
2. [`bench-public/WHAT-SURVIVED.md`](bench-public/WHAT-SURVIVED.md)
3. [`bench-public/README.md`](bench-public/README.md)
4. [`KEY-FINDINGS.md`](KEY-FINDINGS.md)

### For a hostile reviewer

1. [`STATE.md`](STATE.md)
2. [`bench/MANIFEST.md`](bench/MANIFEST.md)
3. [`REPO-AUDIT-2026-05-23.md`](REPO-AUDIT-2026-05-23.md)
4. [`bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md`](bench/epkv-live-probe-v0-2026-05-21/sprint-12h/MACHINE-ONLY-REALITY-500.md)

### For an upstream maintainer

1. [`THETOM-CLEAN-BASELINE-PLAN.md`](THETOM-CLEAN-BASELINE-PLAN.md)
2. [`VLLM-RUNTIME-LINEAGE-4090.md`](VLLM-RUNTIME-LINEAGE-4090.md)
3. [`KERNEL-MAP.md`](KERNEL-MAP.md)
4. Boring Receipts clean baseline receipt.

### For a researcher interested in trace evaluation

1. [`bench-public/kvfidelity/kvfidelity-2026-05-07-summary.md`](bench-public/kvfidelity/kvfidelity-2026-05-07-summary.md)
2. [`bench-public/cask-kvfidelity-bridge/RESULTS.md`](bench-public/cask-kvfidelity-bridge/RESULTS.md)
3. [`bench-public/evidence-utilization/REALRAG-HOTPOTQA-R1.md`](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R1.md)
4. [`bench-public/evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md`](bench-public/evidence-utilization/REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md)

## Next executable gestures

`FROZEN` Do not continue hand-written verifier gates by default.

`NEXT` If the front continues technically:

1. create clean TheTom baseline receipts before any upstream claim;
2. improve path construction, not verifier wording;
3. use Boring Receipts for public runtime validation;
4. publish only compact field guides or receipts, not raw archives;
5. keep news.szt.link as editorial condensation, not lab dump.

## Final boundary

The N=500 no-delta is not the end of the work. It is the membrane that separates overclaim from surviving structure.

What remains valuable is not one winning benchmark. It is the grammar of the archive:

```txt
trace fidelity
cross-stack replay
path/schema construction
kernel/runtime observability
negative-result preservation
```
