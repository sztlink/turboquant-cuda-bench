# turboquant-cuda-bench

> Your model found the right chunk. Why did it still answer wrong?

This is a public research archive for long-context quality probes and KV-cache experiments on local GPUs.

The current front is **evidence utilization**:

```txt
retrieved != used
```

A long-context / RAG system can retrieve the correct evidence, place it in context, and still answer from the wrong record.

Start here:

- [Evidence Path: three scenes where finding is not using](06-publicable/longctx/evidence-path/README.md) — readable entry point
- [Evidence-utilization phase package](bench/evidence-utilization-phase-2026-05-17/RESULTS.md) — aggregate results
- [CASK × KVFidelity bridge v2](bench/cask-kvfidelity-bridge-v2-2026-05-17/README.md) — synthetic action/target/source-rank bridge
- [Start Here](00-context/START-HERE.md) — repo-level orientation and caveats

## Canonical research structure

This repository is the **material canonical archive** for the TurboQuant / KVFidelity front: protocols, raw logs, processed traces, scripts, analysis, and publicable artifacts. `memory-md` keeps synthesis and decisions; `/tmp` is only a scratch/bancada layer.

Other entry points:

- [CANON.md](CANON.md) — current canonical stance and caveats
- [MANIFEST.md](MANIFEST.md) — promoted artifacts and checksums
- [00-context/CURRENT.md](00-context/CURRENT.md) — current brief for the next session
- [CASK/KVFidelity Trace Atlas experiment](03-lab/experiments/2026-05-13-cask-aime24-n30-trace-atlas/experiment.md)
- [KVFidelity Trace Atlas lab note v2](05-analysis/kvfidelity/2026-05-15-trace-atlas-lab-note-v2.md)
- [KVFidelity Casey Atlas v4](06-publicable/kvfidelity/2026-05-trace-atlas-v4/)

## Hardware

| Machine | GPU | VRAM | SM | OS |
|---------|-----|------|----|----|
| aya2 | RTX 4090 | 24 GB | SM89 (Ada Lovelace) | Windows 11 |
| felipe-pc | RTX 3090 | 24 GB | SM86 (Ampere) | Windows 11 |

## Models covered

This repository contains CUDA benchmark data for several TurboQuant test targets:

| Model | Notes |
|-------|-------|
| **Qwen3.6-35B-A3B** Q4_K_M | MoE hybrid; 10 full-attention (GQA, 2 KV heads) + 40 GDN/Mamba recurrent. Production server target. |
| **Qwen3.6-27B** Q4_K_M | Dense model used for REFRACT GTM/Trajectory and DFlash tests. |
| **Qwen3-32B** Q4_K_M | Dense model used to test REFRACT scale sensitivity on SM86. |
| **Qwen2.5-0.5B / 7B / 7B-1M / 32B-AWQ** | vLLM-side targets for the 2026-05 cross-stack runs: smoke, needle (up to 192K with YaRN), decoy/resolution replay. |

Production server baseline: `llama-server` TheTom fork, 65K ctx, flash-attn on.

## Builds

| Build | Commit | Notes |
|-------|--------|-------|
| TheTom HEAD | `11a241d0d` | sparse-V CUDA disabled (PR#105) |
| TheTom nosparse | `65a2c690f` | current production server |
| spiritbuun TCQ | `2cc97a81c` | requires `-DGGML_CUDA_FA_ALL_QUANTS=ON` |
| TurboQuant attn-fix | `69d8e4be4` | REFRACT attn-fix rerun, `REFRACT_TRAJECTORY` patch, clean CUDA/C++ binary |
| **vllm-turboquant** | `36fc04825` | `feature/turboquant_plus` branch — vLLM CUDA path with TurboQuant + TriAttention V3. Build recipe: [`bench/vllm-smoke-2026-05-10/BUILD-CUDA.md`](bench/vllm-smoke-2026-05-10/BUILD-CUDA.md) |

## Benchmarks

| Date | Benchmark | What |
|------|-----------|------|
| 2026-04-13 | [throughput-30b-moe](bench/throughput-30b-moe/) | Qwen3-30B-A3B MoE throughput + PPL |
| 2026-04-14 | [niah](bench/niah/) | NIAH retrieval q8_0-K+turbo3-V, 65K ctx |
| 2026-04-24 | [sparse-v](bench/sparse-v/) | sparse-V dequant skip — SM89 + SM86 |
| 2026-04-24 | [ppl-35b-a3b](bench/ppl-35b-a3b/) | PPL wikitext-2, Qwen3.6-35B-A3B |
| 2026-04-24 | [tg-context](bench/tg-context/) | TG vs ctx depth, turbo3 + turbo4 |
| 2026-04-27 | [iq4nl-repro](bench/iq4nl-repro/) | IQ4_NL vs Q4_K_M repro — @lkaupp case |
| 2026-05-03 | [dflash](bench/dflash/) | DFlash speculative decoding, 27B dense |
| 2026-05-05 | [refract-attnfix](bench/refract-attnfix/) | REFRACT attn-fix: GTM vs Trajectory, 27B+32B, SM86+SM89 |
| 2026-05-06 | [q4-hybrid-refract](bench/q4-hybrid-refract/) | REFRACT q4_0 KV on Qwen3.6-35B-A3B hybrid: KLD vs Trajectory |
| 2026-05-06 | [agentic-context-fidelity](bench/agentic-context-fidelity/) | A/B action-level fidelity smoke: q8/q8 vs q4/q4 through 32k |
| 2026-05-06 | [acf-ramp-protocol](notes/acf-ramp-protocol.md) | Draft threshold/ramp protocol for action-level fidelity, analogous to FTP testing |
| 2026-05-09 | [thetom-stack-smoke](bench/thetom-stack-smoke/) | Local adapter smoke for tqkit, REFRACT, and longctx-svc receipts |
| 2026-05-09 | [consumer-context](bench/consumer-context-2026-05-09/) | Consumer long-ctx fit/throughput probe, 27B q8/q8 + q8/turbo4 + turbo4/turbo4 on 4090 |
| 2026-05-10 | [consumer-boundary-clean](bench/consumer-boundary-clean-2026-05-10/) | 128K/160K/192K boundary bench with VRAM logging; q8/q8 times out at 192K, turbo4 fits |
| 2026-05-10 | [needle-retrieval](bench/needle-retrieval-2026-05-10/) | 5-position needle retrieval at 128K/160K/192K, Qwen 27B q8/turbo4 |
| 2026-05-10 | [longctx-proxy](bench/longctx-proxy-2026-05-10/) | First end-to-end test of `longctx-svc` proxy in front of `llama-server` on 4090 |
| 2026-05-10 | [longctx-proxy-hard](bench/longctx-proxy-hard-2026-05-10/) | Hard proxy sweep with decoys and top_k {2,4,8,16}; **retrieval 8/8 / answer 5/8** at k=16 |
| 2026-05-10 | [longctx-decoy-isolation](bench/longctx-decoy-isolation-2026-05-10/) + [longctx-decoy-resolution](bench/longctx-decoy-resolution-2026-05-10/) | Targeted resolution of the proxy-hard gap: reranker / policy_splice / query rewrite **→ 16/16** |
| 2026-05-16 | [longctx-utilization-overnight](bench/longctx-utilization-overnight-2026-05-16/) | Sanitized confirmation: retrieval 8/8 but baseline/anti-decoy prompt closure 5/8; filtered splice/oracle 8/8; targeted reranker rank 1 and closure 4/4 |
| 2026-05-16 | [longctx-utilization-expanded](bench/longctx-utilization-expanded-2026-05-16/) | Synthetic n=24 staging confirmation: retrieval 19/24; baseline/anti-decoy closure 9/24; filtered splice closure 19/24; includes 4090 preflight/watchdog structural note |
| 2026-05-16 | [longctx-rerank-timeout-smoke](bench/longctx-rerank-timeout-smoke-2026-05-16/) | Structural smoke for local `longctx-svc` patch: killable rerank timeout/fallback returns safely instead of hanging `/retrieve` |
| 2026-05-17 | [evidence-utilization-phase](bench/evidence-utilization-phase-2026-05-17/) | Synthetic phase package: depth sweep, prompt scaffolds, and distractor taxonomy. Rank / decoys-before / distractor type dominate closure more than raw context depth. |
| 2026-05-17 | [cask-kvfidelity-bridge-v2](bench/cask-kvfidelity-bridge-v2-2026-05-17/) | Synthetic action-router bridge: upstream KV/cache method → downstream action/target/source-rank fidelity. Shows action/rank can survive after exact payload identity fails under tight budgets. |
| 2026-05-10 | [vllm-migration-scout](bench/vllm-migration-scout-2026-05-10/) | Pre-WSL2 readiness scout for the vLLM CUDA branch (historical; superseded same day) |
| 2026-05-10 | [vllm-smoke](bench/vllm-smoke-2026-05-10/) | First-light vLLM TurboQuant on 4090 WSL2: Qwen 0.5B/8K, 7B/16K, 32B-AWQ/16K + 12-way concurrency w/ V3 enabled; includes [BUILD-CUDA.md](bench/vllm-smoke-2026-05-10/BUILD-CUDA.md) |
| 2026-05-11 | [vllm-needle](bench/vllm-needle-2026-05-11/) | Needle retrieval cross-stack: vLLM Qwen 2.5-7B + YaRN at 128K/160K/192K, with YaRN factor sweep at 160K |
| 2026-05-11 | [vllm-decoy](bench/vllm-decoy-2026-05-11/) | Decoy + resolution replay cross-stack: same prompts as llama-cpp, identical 5/8 → 4/4 numbers |

## Recent results

- **KVFidelity / action-trace synthesis (2026-05-07):** [summary](notes/kvfidelity-2026-05-07-summary.md)
- **Related work / terminology:** [positioning note](notes/kvfidelity-related-work.md)
- **Comparator v2 + same-build severity sweep:** [method/results](notes/kvfidelity-comparator-v2.md)
- **Frozen hold-out:** [protocol](notes/kvfidelity-holdout-protocol.md) · [reviewed result](notes/kvfidelity-holdout-result.md)
- **TC-31 steering/order follow-ups:** [steering](notes/kvfidelity-tc31-prompt-steering-result.md) · [batch/order](notes/kvfidelity-tc31-batch-order-result.md)
- **Order-sensitivity soak:** [protocol](notes/kvfidelity-order-sensitivity-soak-protocol.md) · [reviewed result](notes/kvfidelity-order-sensitivity-soak-result.md)
- **TheTom public-stack integration:** [integration note](notes/thetom-stack-integration.md) · [local smoke receipt](bench/thetom-stack-smoke/latest/RESULTS.md) · [REFRACT KLD fix smoke](bench/thetom-stack-smoke/refract-kldfix-2026-05-09/RESULTS.md) · [Qwen KLD smoke](bench/thetom-stack-smoke/qwen-kld-smoke-2026-05-09/RESULTS.md) · [Qwen KLD CLI receipt](bench/thetom-stack-smoke/qwen-kld-cli-2026-05-09/RESULTS.md)
- **Longctx decoy/ranking gap (2026-05-10, confirmed 2026-05-17):** `longctx-svc` proxy on 4090 + Qwen 27B reaches retrieval 8/8 at `top_k=16` but final-answer 5/8 — three handles where the canonical chunk was in context but the model emitted a decoy or refused. The 2026-05-16 sanitized rerun confirms anti-decoy prompting alone remains 5/8, while filtered splice/oracle recover 8/8. In the targeted resolution run, reranking puts canonical evidence at rank 1 with no decoy before it and closes 4/4. The expanded synthetic staging fixture repeats the same pattern at n=24: retrieval 19/24, baseline/anti-decoy closure 9/24, filtered splice closure 19/24. The 2026-05-17 phase package extends this across 11,376 promoted synthetic runs: depth 20k/80k/160k stayed close, baseline prompt beat negative/positive/structured scaffolds, and stale records / near-duplicates were much harder than unrelated noise. See [longctx-utilization-overnight](bench/longctx-utilization-overnight-2026-05-16/RESULTS.md), [longctx-utilization-expanded](bench/longctx-utilization-expanded-2026-05-16/RESULTS.md), and [evidence-utilization-phase](bench/evidence-utilization-phase-2026-05-17/RESULTS.md).
- **CASK × KVFidelity bridge (2026-05-17):** a 120-case synthetic action-router fixture separates upstream cache method from downstream `action` / `target` / `source_rank` fidelity. FullKV baseline was 119/120 exact. At tight budget 512, CASK preserved action 117/120 and rank 108/120 but exact target only 2/120; at 1024, CASK recovered to 109/120 exact; at 2048, CASK and TriAttention matched the FullKV ceiling on this fixture. This is a bridge/methodology probe, not a global method ranking. See [cask-kvfidelity-bridge-v2](bench/cask-kvfidelity-bridge-v2-2026-05-17/README.md).
- **Cross-stack (llama-cpp ↔ vLLM, 2026-05-11):** the same 5/8 decoy outcome reproduces on five independent (stack × family × size) configurations: llama-cpp Qwen 27B, vLLM Qwen 2.5-{7B, 14B-AWQ, 32B-AWQ}, vLLM Mistral 7B. Same 3 handles fail in all; brass-river-index emits **byte-identical** `DECOY-0616-1` on llama-cpp Qwen 27B, vLLM Qwen 7B, and vLLM Qwen 32B-AWQ. Corpus property, not stack/model property. Reranker-only path (`rerank_proxy` via `longctx-svc 0.3.0a3` → `bge-reranker-v2-m3`) is 4/4 on llama-cpp 27B, vLLM 14B/32B-AWQ, and **vLLM Mistral 7B** — but only 3/4 on vLLM Qwen 2.5-7B. Mistral 7B passes at the same parameter count where Qwen 2.5-7B fails, so the gap is family/calibration rather than capacity. A second-pass audit revealed three nested failures on the glass-orchid-vector handle: (1) the retriever in longctx-svc doesn't surface the dedicated canonical shard (`shard_1380.md` with `SECRET VALUE:` format) within `top_k=50`; (2) the top-3 reranker positions are decoys lexically dense in the alias phrase; (3) the only chunk in the returned set containing the secret is `manifest.json` in JSON format, which Qwen 2.5-7B under strict prompts refuses to reconcile. `policy_splice` (canonical first in plain text in the user message) is 4/4 invariant across all 5 configurations — it bypasses all three failures at once. Full readout in [vllm-decoy/RESULTS.md](bench/vllm-decoy-2026-05-11/RESULTS.md); narrative synthesis in [notes/longctx-cross-stack-synthesis-2026-05-11.md](notes/longctx-cross-stack-synthesis-2026-05-11.md).

Short read: same-config controls were stable, while cross-KV action traces could drift. Prompt/tool-use steering can recover benchmark pass/fail on TC-31, but it does not guarantee identical traces; TC-31 also depends on scenario order/context. The order-sensitivity soak extends this: controls were stable within fixed orders, while traces varied across order permutations.

## Related work / positioning

KVFidelity applies **trajectory-aware / trace-based evaluation** to KV/V-cache compression: paired action-trace comparison across runtime inference configurations, with scenario order as a measured axis.

This repo does not claim novelty for trajectory-aware evaluation itself. SciBORG (Muhoberac, Chopra et al., arXiv:2507.00081) explicitly uses "action trace fidelity" as an agent-benchmark dimension; TRACE and TRAJECT-Bench frame broader trajectory-aware evaluation; AgentPex and trace-assurance work evaluate agentic traces against specifications or contracts. On the KV side, CASK is the closest cousin for token-level replay fidelity under KV compression, while Hold Onto That Thought benchmarks reasoning under cache compression.

The narrower contribution here is this KV-cache-level instantiation: action-level traces as the measured object, paired cross-config comparisons under same-build controls, frozen hold-out / trace-bound review, and scenario order as a measured variable. See [related work](notes/kvfidelity-related-work.md).

## Key findings

- **q8_0-K + turbo4-V**: +0.48% PPL, ~178 t/s TG — production sweet spot for 35B-A3B
- **sparse-V CUDA**: −0.3% to −2.8% overhead across all contexts on SM89. Positive only on Metal (M5 Max: up to +22.8% at 32K).
- **IQ4_NL vs Q4_K_M**: same degradation curve under q8/turbo4 — weight quant is not the source of the ctx-depth penalty.
- **SM89 vs SM86**: −54% TG at 131K (SM89) vs −71% (SM86, @lkaupp) — dispatch penalty scales with SM generation, not model quant.
- **REFRACT Trajectory vs GTM**: after the attention fix, 27B is stable across 3090/4090 within ~0.5 pts, but `ctv=turbo3` shows sign-inversion: GTM passes while Trajectory degrades/fails; 32B amplifies the path-preservation failure.
- **q4_0 on hybrid 35B-A3B**: `q4_0/q4_0` stays KLD-close (98.81) but is DEGRADED under REFRACT Trajectory path preservation (65.70) against a `q8_0/q8_0` reference.
- **Action-level vs token-level fidelity**: the Agentic Context Fidelity smoke preserved measured action-level behavior through 32k on Qwen3.6-35B-A3B under `q4_0/q4_0`, despite REFRACT token/path degradation. This is a dimensional finding, not a claim of global equivalence.
- **Retrieval vs answer separation under decoys**: at `top_k=16` with adversarial DECOY chunks in the retrieved set, `longctx-svc` reaches retrieval 8/8 but the model answers 5/8 — the canonical chunk is inside the context, but a decoy is what reaches the decoder. Reranker on the proxy or external splice both recover to 16/16. The wrong answer (`DECOY-0616-1` on brass-river-index) is identical across llama-cpp Qwen 27B and vLLM Qwen 2.5-7B with the same chunks — splice/presentation issue, not model capacity.
- **vLLM TurboQuant first light on 4090**: `turboquant_k8v4` + FA2 (forced; FA3 incompatible) gives ~80 tok/s decode and 197K KV-cache tokens of headroom at Qwen 7B / 16K — 12-way concurrency at full 16K request size. With TriAttention V3 eviction enabled (`VLLM_TRIATT_ENABLED=1` plus GQA fallback envs), headroom grows to 225K tokens and concurrency to 13.78x at the same request size.

## Methodology

All benchmarks use `llama-bench` unless noted:

```bat
llama-bench.exe -m <model> -ngl 99 -fa 1 -p 512 -n 128 -r 2 -o md
```

Context depths and KV configs specified per test. Full reproduction commands in each benchmark folder.

## Discussion

- [ggml-org/llama.cpp #20969](https://github.com/ggml-org/llama.cpp/discussions/20969) — TurboQuant Extreme KV Cache Quantization
- [REFRACT attn-fix comment](https://github.com/ggml-org/llama.cpp/discussions/20969#discussioncomment-16822042)
- [X thread: REFRACT attn-fix rerun](https://x.com/sztlink/status/2051817370117619967)
