# vLLM TurboQuant decoy/ranking replay, 4090 WSL2 — same prompts as `longctx-proxy-hard-2026-05-10`

Date: 2026-05-11.

Purpose: cross-stack replay of the **decoy + ranking** task from `bench/longctx-proxy-hard-2026-05-10/`. The original llama-cpp + longctx-svc run at `top_k=16` produced **retrieval 8/8 / answer 5/8** — three handles where the canonical chunk was inside the model's context but the model picked a decoy or refused. The question for vLLM: same pattern, different pattern, or different fail mode?

To make the comparison clean, this run **reuses the exact spliced prompts** (system + user messages) that the original longctx-svc constructed and sent to llama-server. Those payloads are in `bench/longctx-proxy-hard-2026-05-10/debug-dump/*.json`. Same chunks, same instructions, same questions — only the inference backend differs.

## Setup

- Inference: vLLM + TheTom `vllm-turboquant @ feature/turboquant_plus` (commit `36fc04825`), 4090 / WSL2 Ubuntu 24.04
- Model: `Qwen/Qwen2.5-7B-Instruct` (the llama-cpp baseline was `Qwen 27B q8_0/turbo4` — model is different, prompts are identical)
- `kv_cache_dtype=turboquant_k8v4`, `max_model_len=16384`, `enforce_eager=True`, `gpu_memory_utilization=0.85`
- Sampling: `temperature=0.0, max_tokens=128, seed=42`
- Hit criterion: expected key (`AYA-HARD-<HANDLE>-<NNN>-Z9`) appears literally in the answer
- Two conditions tested:
  - **V3 off** (`VLLM_TRIATT_ENABLED` unset, default off) — closest to the llama-cpp baseline
  - **V3 on** (`VLLM_TRIATT_ENABLED=1` + GQA fallback envs for Qwen 7B) — full V3 eviction path active

The 8 spliced payloads at `top_k=16` are mapped to handles in `k16-mapping.json`. Each payload contains the same 16 retrieved chunks the longctx-svc selected for that handle.

## Headline result

| handle | llama-cpp Qwen 27B (turbo4, V3 off) | vLLM Qwen 2.5-7B (V3 off) | vLLM Qwen 2.5-7B (V3 on) |
|---|---|---|---|
| aurora-blue-compass | ✓ AYA-HARD-AURORA-BLUE-050-Z9 | ✓ same | ✓ same |
| brass-river-index | ✗ **DECOY-0616-1** | ✗ **DECOY-0616-1** (literally identical) | ✗ **DECOY-0616-1** (literally identical) |
| ceramic-lantern-field | ✓ | ✓ | ✓ |
| delta-archive-needle | ✓ | ✓ | ✓ |
| ember-signal-route | ✓ | ✓ | ✓ |
| feldspar-memory-gate | ✓ | ✓ | ✓ |
| glass-orchid-vector | ✗ refusal ("provided context is decoy") | ✗ DECOY-0742-6 | ✗ DECOY-0742-6 |
| jade-winter-circuit | ✗ refusal ("provided context is decoy") | ✗ DECOY-0725-7 | ✗ DECOY-0725-7 |
| **TOTAL** | **5/8** | **5/8** | **5/8** |

## Readout

- **Three independent stacks, same 5/8 number.** llama-cpp main + Qwen 27B q8/turbo4. vLLM CUDA-fork + Qwen 2.5-7B turboquant_k8v4 + FA2 (V3 off). Same plus V3 eviction on. All three converge on the same 5 hits and same 3 misses.
- **The failures correlate with the same handles**, not with stack or model size. brass / glass / jade fail across all three. aurora / ceramic / delta / ember / feldspar succeed across all three.
- **brass-river-index produces the literally identical wrong answer `DECOY-0616-1` on llama-cpp + Qwen 27B and on vLLM + Qwen 2.5-7B.** Same chunks, same wrong shard picked, same decoy id emitted. This is the strongest signal in the run: the wrong answer isn't model-specific reasoning failure — it's a property of which chunk in the spliced context the decoy injection makes look most authoritative at decoder time. Different model architectures, same fooling.
- **glass-orchid-vector and jade-winter-circuit fail in different surface forms** between stacks (llama-cpp 27B refuses; vLLM 7B emits a different DECOY-xxxx-y), but the same `top_k=16` retrieval is the cause in both cases. Model capacity changes how the failure is reported, not whether it happens.
- **V3 eviction is irrelevant at this prompt scale.** Prompts are ~3.5K tokens; V3 default budget is 2048 cells/seq. With chunked prefill, eviction does not fire on payloads this small. V3 helps where attention budget is the bottleneck. Decoy/ranking failure here is upstream of attention budget — it's about which chunks reach the decoder, ranked how.
- **Closest interpretation matches the llama-cpp run's own readout** at `bench/longctx-proxy-hard-2026-05-10/RESULTS.md`: "presentation/ranking issue at the splice layer, not capacity." This run is cross-stack evidence for that interpretation.

## Practical implication

If the wrong-answer DECOY id is exactly reproducible across stacks (`DECOY-0616-1` on brass), then the fix is in the splice/rerank layer, not the model. That's where the `bench/longctx-decoy-resolution-2026-05-10/` follow-up landed: server-side reranker + external splice both closed the gap to 16/16. Same fix should apply on vLLM.

The natural next move is: replicate `decoy-resolution` on vLLM. Either (a) run a real reranker between the longctx-svc and the vLLM endpoint, or (b) splice the canonical chunk first in the user message instead of via the proxy header. Both worked on llama-cpp.

## Timing & per-request stats

| handle | gen V3 off | gen V3 on | prompt_tok | out_tok |
|---|---:|---:|---:|---:|
| aurora-blue-compass | 3.7s | 4.0s | 3457 | 17 |
| brass-river-index | 0.5s | 0.5s | 3453 | 11 |
| ceramic-lantern-field | 0.6s | 0.6s | 3459 | 18 |
| delta-archive-needle | 0.6s | 0.6s | 3457 | 17 |
| ember-signal-route | 0.6s | 0.6s | 3457 | 15 |
| feldspar-memory-gate | 0.6s | 0.6s | 3492 | 17 |
| glass-orchid-vector | 0.5s | 0.5s | 3457 | 11 |
| jade-winter-circuit | 0.5s | 0.5s | 3448 | 11 |

The aurora first-request bump (3.7s) is one-time warmup; subsequent requests run with prefill caching at ~0.5–0.6s per request. V3 on adds no measurable latency at this scale (consistent with no eviction firing).

## Limitations / next steps

- N=8 prompts. Single batch, no repeats.
- One model size per stack (27B llama-cpp vs 7B vLLM). The model mismatch matters for *capacity* questions but not for the *which chunk fools the model* question — and the literal DECOY-0616-1 collision shows the answer is the same anyway.
- Did not test the decoy-resolution interventions (reranker / external splice) on vLLM yet. That's the natural next bench.
- V3 budget defaults (2048 cells/seq) are not stressed here. A long-context decoy run (32K+ context with embedded decoys, V3 budget forced to evict) would exercise V3's actual role.

## Artifacts

- `vllm-decoy.py` — harness (loads payloads from `k16-mapping.json`, runs through `LLM.chat()`)
- `k16-mapping.json` — mapping handle → expected key → exact `messages` list from llama-cpp debug-dump
- `decoy-v3off.log` — full vLLM stdout, V3 disabled
- `decoy-v3on.log` — full vLLM stdout, V3 enabled (worker init log shows `layers=28 heads=28 kv=4 head_dim=128 ... budget=2048`)

## Cross-link

- `bench/longctx-proxy-hard-2026-05-10/` — original llama-cpp run with the same prompts (8/8 retrieval, 5/8 answer at top_k=16). debug-dump source for this bench.
- `bench/longctx-decoy-resolution-2026-05-10/` — the fix on llama-cpp side (reranker / external splice → 16/16). Next target for vLLM.
- `bench/vllm-smoke-2026-05-10/` — first-light + 12-way concurrency + V3 enable mechanics.
- `bench/vllm-needle-2026-05-11/` — needle retrieval (no decoys) — 5/5 across 128K/192K, isolating retrieval from ranking.
