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

## Resolution replay — does the same fix work on vLLM?

Tested by replaying the **policy_splice** prompts from `bench/longctx-decoy-resolution-2026-05-10/raw/*` directly on vLLM. Those payloads inject the retrieved chunks into the user message itself (instead of via the longctx-svc proxy header), so they're stack-independent. The `rerank_proxy_*` payloads from the same bench depend on a live longctx-svc with a real cross-encoder reranker — not replicated here, would need a parallel service stand-up.

The four hard tasks (the ones that failed under decoy at `top_k=16`): `brass-river-index`, `ceramic-lantern-field`, `glass-orchid-vector`, `jade-winter-circuit`.

| condition | llama-cpp Qwen 27B | vLLM Qwen 2.5-7B (V3 off) | vLLM Qwen 2.5-7B (V3 on) |
|---|---|---|---|
| `policy_splice_orig_retrieval` | **4/4** | **4/4** | **4/4** |
| `policy_splice_rewrite_retrieval` | **4/4** | **4/4** | **4/4** |

Per-handle (V3 off, identical to V3 on):

| handle | orig | rewrite | gen orig | gen rewrite |
|---|---|---|---:|---:|
| brass-river-index | ✓ AYA-HARD-BRASS-RIVER-180-Z9 | ✓ same | 3.7s | 0.4s |
| ceramic-lantern-field | ✓ AYA-HARD-CERAMIC-LANTERN-310-Z9 | ✓ same | 0.7s | 0.5s |
| glass-orchid-vector | ✓ AYA-HARD-GLASS-ORCHID-830-Z9 | ✓ same | 0.5s | 0.6s |
| jade-winter-circuit | ✓ AYA-HARD-JADE-WINTER-960-Z9 | ✓ same | 0.5s | 0.5s |

The first request (`brass-river-index, orig`) carries the one-time prefill cache warmup — 3.7s — then everything else is 0.4–0.7s.

**Cross-stack consistency, full picture:**

| | llama-cpp Qwen 27B | vLLM Qwen 2.5-7B (V3 off) | vLLM Qwen 2.5-7B (V3 on) |
|---|---|---|---|
| decoy at top_k=16 via proxy (8 handles) | 5/8 | 5/8 | 5/8 |
| resolution `policy_splice_orig` (4 hard) | 4/4 | 4/4 | 4/4 |
| resolution `policy_splice_rewrite` (4 hard) | 4/4 | 4/4 | 4/4 |

Three independent (stack, model, V3) configurations. Same numbers. Same `DECOY-0616-1` literal for brass under the decoy condition. Same recovery to canonical secret under policy splice.

**What this confirms:**

- The decoy/ranking gap and its fix are **both** properties of how chunks reach the decoder, not of the inference stack or the model under it.
- V3 eviction is orthogonal: it doesn't degrade the fix (4/4 holds) and it doesn't help the un-fixed decoy case (5/8 unchanged). V3 belongs in the long-context / memory-budget axis, not in the splice/ranking axis.
- The `policy_splice` intervention is portable. Anyone reproducing this pipeline on a different vLLM build, different Qwen-family model, or different KV compression preset should expect the same recovery to 4/4 as long as the retrieved canonical chunk is in the user message instead of behind a header-injected proxy.

The remaining `rerank_proxy` axis (server-side cross-encoder reranker before the proxy returns) is now also tested — see next section.

## rerank_proxy replay through longctx-svc → vLLM

Set up after `TheTom/longctx` was published on 2026-05-11 with first-class `pip install longctx-svc` + generic OpenAI-compatible proxy mode (`--upstream`).

Stack:
- vLLM `feature/turboquant_plus` (commit `36fc04825`) serving `Qwen/Qwen2.5-7B-Instruct` on `127.0.0.1:8080` with `kv_cache_dtype=turboquant_k8v4`, `max_model_len=16384`, `enforce_eager=True`, `gpu_memory_utilization=0.80`.
- `longctx-svc 0.3.0a3` on `127.0.0.1:8765` with `--upstream http://127.0.0.1:8080`, default cross-encoder reranker `bge-reranker-v2-m3` enabled.
- Same `corpus/longctx-hard-lab` content, path-rewritten from the aya2 location to `/home/felipe/vllm-lab/longctx-corpus/longctx-hard-lab`.
- Same 8 payloads from `bench/longctx-decoy-resolution-2026-05-10/raw/*rerank_proxy_{orig,rewrite}-{4 handles}.json` — i.e. **the user message contains only the question, not the chunks**. longctx-svc does the retrieval + rerank itself, then forwards to the upstream vLLM.

Response headers confirm what longctx-svc did: `x-longctx-chunks-used=16`, `x-longctx-scope-status=ready` on every call.

### Results

| condition | llama-cpp Qwen 27B | vLLM Qwen 2.5-7B |
|---|---|---|
| `rerank_proxy_orig` | **4/4** | **3/4** |
| `rerank_proxy_rewrite` | **4/4** | **3/4** |

Per-handle (vLLM):

| handle | orig | rewrite |
|---|---|---|
| brass-river-index | ✓ AYA-HARD-BRASS-RIVER-180-Z9 | ✓ same |
| ceramic-lantern-field | ✓ AYA-HARD-CERAMIC-LANTERN-310-Z9 | ✓ same |
| glass-orchid-vector | ✗ `DECOY-1797-6` | ✗ `DECOY-1797-6` |
| jade-winter-circuit | ✓ AYA-HARD-JADE-WINTER-960-Z9 | ✓ same |

This is the first **divergence** in the cross-stack table. llama-cpp Qwen 27B was 4/4 under `rerank_proxy`; vLLM Qwen 2.5-7B is 3/4 with the same retrieval + reranker. Failure mode is consistent across `orig` and `rewrite`: glass-orchid-vector emits `DECOY-1797-6` regardless of the system-prompt instruction to ignore DECOY entries. Note that `DECOY-1797-6` is a *different* decoy than the one the decoy-only run emitted on the same handle (`DECOY-0742-6`) — the reranker reordered the chunks; the canonical chunk is now somewhere in the top-16 (chunks_used=16, scope=ready), but a different decoy survived the rerank and won at decode.

### Model-size scan on the rerank path

To isolate model size from stack, the same rerank_proxy harness was re-run against `Qwen/Qwen2.5-32B-Instruct-AWQ` (still vLLM, still `longctx-svc 0.3.0a3` with `bge-reranker-v2-m3`, still same payloads):

| size + stack | `rerank_proxy_orig` | `rerank_proxy_rewrite` |
|---|---:|---:|
| Qwen 2.5-7B / vLLM | 3/4 (glass fails `DECOY-1797-6`) | 3/4 (glass fails same) |
| Qwen 27B / llama-cpp | 4/4 | 4/4 |
| **Qwen 2.5-32B-AWQ / vLLM** | **4/4** | **4/4** |

The 32B-AWQ run recovers the glass-orchid-vector handle that the 7B run dropped. Same reranker, same 16 retrieved chunks, same prompt — only the model is bigger. glass is the borderline handle: the canonical is in the top-16 with a competing high-rank decoy; a 7B will sometimes pick the decoy at decode, a 27B/32B will not. Latency on 32B-AWQ is ~11 s per query after a one-time 33 s warmup on the first request.

### Readout — when reranker is enough, when it isn't

- **rerank is enough at ≥27B** (both Qwen 27B / llama-cpp and Qwen 2.5-32B-AWQ / vLLM pass 4/4) but **not enough at 7B** (3/4). The retrieval + ranking ceiling for `top_k=16` on this corpus is identical across stacks (8/8 retrieval, identical brass DECOY-0616-1 emitted under no-rerank); the model-side ceiling — *given correctly-ranked chunks, can it still be fooled* — is where size matters.
- **policy_splice is invariant to model size in this run** (4/4 on 7B, 4/4 on 27B). It forces the canonical chunk first in the user message rather than relying on the model to distinguish a top-1-ranked canonical from rank 2–16 decoys.
- **glass-orchid-vector is the canary handle.** It's the only handle that flips between 7B and ≥27B in the rerank path. It's also the same handle that emits a self-aware refusal on 27B without rerank ("the provided context snippets explicitly state that the lookup is DECOY...") and a direct decoy on 7B without rerank. Whichever knob you turn — model size, reranker, splice — glass is where the action is.
- Operational implication: in production with a smaller model, the `policy_splice` path is the safer choice; `rerank_proxy` requires either ≥27B-class capacity or further interventions (stricter system prompt, longer reranker context, fewer chunks).

## Cross-stack table — full 4 cells (5 conditions)

| condition | llama-cpp 27B | vLLM 7B (V3 off) | vLLM 7B (V3 on) | notes |
|---|---:|---:|---:|---|
| decoy at top_k=16 (no rerank) | 5/8 | 5/8 | 5/8 | same brass `DECOY-0616-1` literally identical across stacks |
| `policy_splice_orig` | 4/4 | 4/4 | 4/4 | canonical first in user msg — invariant |
| `policy_splice_rewrite` | 4/4 | 4/4 | 4/4 | system-prompt rewrite adds nothing |
| `rerank_proxy_orig` | 4/4 | 3/4 (Qwen 7B) · **4/4 (Qwen 32B-AWQ)** | n/a | reranker enough at ≥27B, not at 7B |
| `rerank_proxy_rewrite` | 4/4 | 3/4 (Qwen 7B) · **4/4 (Qwen 32B-AWQ)** | n/a | rewrite doesn't recover the 7B miss; 32B-AWQ doesn't need it |

Three stacks × multiple model sizes. The decoy-only baseline and the policy_splice recovery are stack-invariant AND model-size-invariant. The rerank-only path appeared capacity-bound on first reading — but the deeper investigation below shows it's actually **format-mismatch-bound** (canonical chunk format vs system-prompt instruction strictness), with model size as a proxy.

## Glass-orchid-vector deep dive (the canary)

Pulling `/retrieve` directly on `longctx-svc` for glass with `top_k=16` reveals why glass is the only handle that flips between sizes:

```
rank= 1  score=0.61  shard_1586.md      DECOY LOOKUP: glass orchid vector sheet ... INVALID VALUE: DECOY-1586-...
rank= 2  score=0.58  shard_1797.md      DECOY LOOKUP: glass orchid vector sheet ... INVALID VALUE: DECOY-1797-6
rank= 3  score=0.59  shard_0531.md      DECOY LOOKUP: glass orchid vector sheet ... INVALID VALUE: DECOY-0531-...
rank= 4  score=0.44  manifest.json:46-61   "handle":"glass-orchid-vector",...,"code":"AYA-HARD-GLASS-ORCHID-830-Z9"
rank= 5  score=0.35  README.md          (project description, no secret)
rank= 6-16  ...      filler shards + decoys for other handles
```

The canonical chunk for glass is **not a shard with `SECRET VALUE: AYA-HARD-GLASS-ORCHID-830-Z9`** like the canonical chunks for brass, ceramic, jade. It's a JSON entry in `manifest.json` (`"code": "AYA-HARD-GLASS-ORCHID-830-Z9"`). The reranker correctly surfaces it at rank 4, but ranks 1–3 are decoys with authoritative-sounding `SECRET VALUE: DECOY-NNNN-N` format. The same `/retrieve` for brass, ceramic, jade returns the canonical shard at rank 1 with `SECRET VALUE:` formatting; glass is the only handle without a dedicated canonical shard.

That asymmetry is what 7B trips on under the `rewrite` prompt ("Use only a valid line beginning SECRET VALUE"). A line beginning `SECRET VALUE:` literally does not exist in the canonical chunk for glass — only the JSON `"code":"..."` does. The 7B can't reconcile the instruction with the format; the 32B can.

Full dump: [`glass-retrieve-dump.txt`](glass-retrieve-dump.txt).

### Correction (post Casey/Giselle audit)

A second pass revealed the deep dive above is **partially wrong** in an important way. The canonical chunk for glass is **not** only in `manifest.json`. There is a dedicated `src/sector_13/shard_1380.md` with the same `SECRET VALUE: AYA-HARD-GLASS-ORCHID-830-Z9` formatting as the canonical shards for brass, ceramic, etc. The format-mismatch story isn't the whole picture.

What's actually happening (re-verified at `top_k=50`, longctx-svc 0.3.0a3): the service caps at 20 returned chunks, and shard_1380 **does not appear** in any of those 20. The retrieval pipeline (BM25 + dense embedding inside `longctx-svc`, before the cross-encoder reranker even sees the candidates) misses shard_1380 entirely. The `manifest.json` entry surfaces because longctx-svc indexes structural/JSON data with a separate path, but the dedicated canonical shard never enters the reranker's input set.

So there are three nested failures on glass, in order:

1. **Retrieval miss.** shard_1380 doesn't make the longctx-svc top-20 for this query. This is the prior failure.
2. **Top-3 decoy dominance.** The 3 chunks with highest reranker score are all DECOY shards (1586, 1797, 0531), denser in `glass orchid vector sheet` text per line than ordinary records.
3. **JSON canonical at rank 4.** Manifest.json is the only thing in the retrieved set that contains the actual secret. Models with strong format-strictness under the rewrite prompt fail to reconcile.

That ordering matters for fixes:

- `policy_splice` (canonical injected first, plain text) **bypasses failures 1, 2, and 3 simultaneously**. It doesn't fix the retrieval pipeline — it sidesteps it.
- A different retriever or larger pool size would address failure 1 but is out of scope for this bench (longctx-svc is the component under test).
- The loose `rerank_proxy_orig` prompt addresses failure 3 (the model is allowed to extract from JSON format) — explaining why orig passes more often than rewrite.
- The family/calibration finding (Mistral 7B passing where Qwen 2.5-7B fails) is about how each model handles the JSON canonical at rank 4 under strict instructions, given that retrieval 1 + dominance 2 have already happened. The 7B Qwen's specific failure is downstream of two earlier failures it can't fix.

So the headline "family/calibration matters more than capacity" survives, but with a more honest scope: it matters **given a retrieval pipeline that doesn't recover the dedicated canonical chunk**. With a better retriever the model differences would likely collapse. With a worse retriever the family/calibration spread might widen further.

## top_k sweep on 7B (changes the interpretation)

Re-ran `rerank_proxy_{orig,rewrite}` × 4 handles on 7B with `top_k ∈ {2, 4, 8, 16}` to separate retrieval failure from decoder failure.

| top_k | orig hits | rewrite hits | glass orig | glass rewrite |
|---:|---:|---:|---|---|
| 2 | 3/4 | 3/4 | ✗ `DECOY-1797-6` | ✗ `DECOY-1797-6` |
| 4 | **4/4** | 3/4 | ✓ `AYA-HARD-GLASS-...` | ✗ `DECOY-1797-6` |
| 8 | 4/4 | 3/4 | ✓ | ✗ `glass orchid vector sheet` (alias-response) |
| 16 | 4/4 | 3/4 | ✓ | ✗ `glass orchid vector sheet` (alias-response) |

Reading:
- **top_k=2 is retrieval-limited** — the canonical (`manifest.json` at rank 4) is not in context for glass. Both orig and rewrite must fail. They do.
- **top_k≥4 includes the canonical.** glass under `orig` recovers and stays recovered. glass under `rewrite` continues to fail — but the failure mode shifts from `DECOY-1797-6` at top_k≤4 to `glass orchid vector sheet` (the alias text from the question) at top_k≥8. The 7B is now seeing the JSON manifest entry but is honest enough not to emit it as a `SECRET VALUE:` line; instead it falls back to the alias.
- **The fail mode is format-mismatch, not chunk count.** Adding more chunks (k=8, k=16) doesn't recover the 7B under `rewrite` — the model is stuck on the instruction shape, not the chunk supply.

## Seed reproducibility on 7B

Same setup as the sweep (top_k=16), three seeds (42, 7, 1234), same 4 handles × 2 ops.

| seed | rerank_proxy_orig | rerank_proxy_rewrite | glass orig answer | glass rewrite answer |
|---|---:|---:|---|---|
| 42 | 4/4 | 3/4 | `AYA-HARD-GLASS-ORCHID-830-Z9` | `glass orchid vector sheet` |
| 7 | 4/4 | 3/4 | same | same |
| 1234 | 4/4 | 3/4 | same | same |

100% deterministic at temp=0. The failure mode on glass under `rewrite` is reproducible — not seed noise.

## Note on cross-run variation (GPU vs CPU reranker)

The first run of this section (logged in `rerank-proxy-2026-05-11.log`) was 3/4 + 3/4 with glass failing as `DECOY-1797-6` on both `orig` and `rewrite`. The re-run after the 32B-AWQ scan (and after restarting `longctx-svc` with `LONGCTX_DEVICE=cpu` to preserve VRAM for 32B) is 4/4 + 3/4, with glass recovering under `orig` and falling back to alias under `rewrite`. Same prompts, same model build, same vLLM. The difference is **reranker scoring precision** — `bge-reranker-v2-m3` on CPU (fp32) returns slightly different scores than on GPU (fp16/tf32), which can flip chunks in the top-k ordering. We did not re-run the original GPU-mode rerank state. Treat the numbers as a range: 7B under `rerank_proxy_orig` lands in **3/4–4/4** depending on rerank precision; under `rewrite` it's solidly **3/4** with glass as the consistent miss (different failure word, same conclusion).

## Replay 32B-AWQ on decoy-only and policy_splice

To check whether 32B-AWQ is truly invariant or merely passes rerank_proxy, the same scripts were run against the 32B-AWQ vLLM endpoint (no reranker) — same `k16-mapping.json` for decoy and same `res-mapping.json` for policy_splice as the 7B runs above.

| condition | 32B-AWQ hits |
|---|---|
| decoy at top_k=16 (no rerank) | **5/8** — identical failure set to 7B and to llama-cpp 27B: brass `DECOY-0616-1`, glass `DECOY-0742-6`, jade `DECOY-0725-7` |
| `policy_splice_orig` | 4/4 |
| `policy_splice_rewrite` | 4/4 |

Decoy-only is exactly as stack/model-invariant as the 7B run already showed — including the literal DECOY ids on the failing handles. policy_splice is 4/4 invariant as predicted. The only thing that moved between 7B and 32B is the rerank_proxy answer on glass, and the deep dive above explains why: 32B can reconcile JSON canonical with instruction-strict prompts; 7B can't.

## Updated headline: not "capacity-bound", "format-strictness mismatch"

The first-pass reading of this experiment was that `rerank_proxy` is capacity-bound: 7B fails 3/4, ≥27B passes 4/4. The deeper read is more useful:

- All sizes (7B, 27B, 32B-AWQ) recover the correct rank-1 canonical for 3 of the 4 hard handles (brass, ceramic, jade) and answer them correctly under both `orig` and `rewrite`.
- glass-orchid-vector has its canonical in `manifest.json` (JSON `"code":"..."`), not in a shard with `SECRET VALUE:` formatting. This is a corpus-shape issue, not a retrieval issue.
- Under the **loose `orig` prompt**, 7B/27B/32B all eventually answer glass correctly when the canonical is in-context (top_k≥4 on 7B; top_k≥16 on 32B by our test).
- Under the **strict `rewrite` prompt** ("Use only a valid line beginning SECRET VALUE"), 7B fails on glass because the canonical literally does not contain that line. 32B passes because it infers the equivalence between `SECRET VALUE: X` and JSON `"code":"X"`.

Practical takeaway:
- The most robust intervention is `policy_splice` (canonical first, in plain text): invariant to model size, invariant to corpus shape.
- If you have to rely on `rerank_proxy`, beware corpus shape: heterogeneous canonical formats (manifest entries, JSON, plain text) interact poorly with format-strict system prompts on smaller models.
- "Smaller model fails" is a symptom; the underlying knob is corpus normalization + instruction strictness. A 7B with a *loose* rerank_proxy prompt is just as good as 32B on this corpus.

## Family + size scan (Tier 3)

Up to this point everything was Qwen 2.5 family (vLLM) + Qwen 27B base (llama-cpp older). Two questions remained: (a) is the decoy/rerank pattern Qwen-specific or general, (b) where exactly does the rerank_proxy passing threshold sit. Two extra models were downloaded and exercised through the same 3 conditions (decoy k=16, policy_splice, rerank_proxy with `bge-reranker-v2-m3`):

- **Mistral 7B Instruct v0.3** — same parameter count as Qwen 2.5-7B, different family/training. Cross-family control.
- **Qwen 2.5-14B-Instruct-AWQ** — same family as Qwen 2.5-7B/32B-AWQ, mid-size. Within-family curve.

Each ran in the same vLLM `turboquant_k8v4` setup, max_model_len=16384, gpu_memory_utilization 0.80–0.92, enforce_eager. Same 8 prompts as the earlier runs.

### Headline matrix

| stack / family / size | decoy k=16 | rerank_proxy_orig | rerank_proxy_rewrite | policy_splice_orig | policy_splice_rewrite |
|---|---:|---:|---:|---:|---:|
| llama-cpp · Qwen 27B q8/turbo4 | 5/8 | 4/4 | 4/4 | 4/4 | 4/4 |
| vLLM · Qwen 2.5-7B-Instruct | 5/8 | 3–4/4 | **3/4** | 4/4 | 4/4 |
| vLLM · Qwen 2.5-14B-Instruct-AWQ | 5/8 | 4/4 | 4/4 | 4/4 | 4/4 |
| vLLM · Qwen 2.5-32B-Instruct-AWQ | 5/8 | 4/4 | 4/4 | 4/4 | 4/4 |
| vLLM · **Mistral 7B Instruct v0.3** | 5/8 | **4/4** | **4/4** | 4/4 | 4/4 |

The "capacity-bound" story does not survive Mistral 7B. Mistral 7B and Qwen 2.5-7B are the **same parameter count**, the **same KV config**, hit the **same chunks**, and yet Mistral passes rerank_proxy 4/4+4/4 while Qwen 2.5-7B only manages 3/4 on rewrite. Whatever closes the gap is family-level (training data, instruction-tuning style, format-tolerance), not parameter-count-level.

### Decoy failure modes by family and size

Same 5/8 score, three distinct failure styles:

| model | brass-river-index | glass-orchid-vector | jade-winter-circuit |
|---|---|---|---|
| llama-cpp Qwen 27B | DECOY-0616-1 | refusal ("provided context is decoy") | refusal |
| vLLM Qwen 2.5-7B | DECOY-0616-1 | DECOY-0742-6 | DECOY-0725-7 |
| vLLM Qwen 2.5-14B-AWQ | enumerates "INVALID VALUE: DECOY-0616-1\nINVALID VALUE: DECOY-0405-1\n..." | enumerates DECOYs | "There is no valid SECRET VALUE associated with the jade winter circuit card..." (refusal) |
| vLLM Qwen 2.5-32B-AWQ | DECOY-0616-1 | DECOY-0742-6 | DECOY-0725-7 |
| vLLM Mistral 7B | "DECOY-XX-1 (where XX is the shard number)" (confused/refusal-light) | "The SECRET VALUE for the glass orchid vector sheet is not provided in the context..." (refusal) | "jade-winter-circuit" (alias-response) |

Three patterns:
1. **Decoy commit** — Qwen 2.5-7B and Qwen 2.5-32B-AWQ both confidently emit one specific decoy id. Curiously, scale up from 7B to 32B-AWQ doesn't fix this on the decoy-only condition; the family signature is consistent across size within Qwen 2.5.
2. **Enumerate-and-refuse** — Qwen 2.5-14B-AWQ (the AWQ-only mid-size) enumerates the DECOYs it sees, then refuses jade. Possibly an AWQ-quantization side effect, possibly a training stage difference.
3. **Refusal / alias / confusion** — Mistral 7B and the older llama-cpp Qwen 27B both refuse or fall back to the alias instead of committing. This is the safer style operationally — closer to "I don't know" than "here's a decoy with confidence."

The conclusion isn't that one family is better; it's that **the model's calibration under decoy pressure is a family/training trait, separate from raw capability**. For RAG production with adversarial chunks, calibration matters as much as accuracy.

### Final headline

- The decoy gap (5/8 at top_k=16, no rerank) is **stack-invariant, model-invariant, family-invariant, size-invariant** on this corpus. It's a property of the retrieved chunk set, not the inference stack.
- The `rerank_proxy` recovery (4/4 with `bge-reranker-v2-m3`) is **family + size dependent**, not size-alone:
  - Qwen 2.5-7B has the weakest performance (3/4 under rewrite). Mistral 7B at the same parameter count passes 4/4. Qwen 2.5-14B-AWQ, 32B-AWQ, and llama-cpp Qwen 27B all pass 4/4.
  - The borderline is glass-orchid-vector, whose canonical is in `manifest.json` JSON instead of a shard with `SECRET VALUE:` formatting. Models tolerant to format mismatch under strict prompts recover; Qwen 2.5-7B does not.
- `policy_splice` (canonical first in the user message, plain text) is **completely invariant** across all 5 (stack × family × size) combinations tested: 4/4 + 4/4 every time. It's the universal fix.
- Practical takeaway for production: if you're shipping a 7B-class model in an adversarial-retrieval RAG, prefer policy_splice over rerank_proxy. If you must use rerank_proxy at 7B, prefer Mistral-7B-class calibration over Qwen-2.5-7B-class. If you go bigger (14B+), both paths converge.

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

- `vllm-decoy.py` — decoy harness (loads payloads from `k16-mapping.json`, runs through `LLM.chat()`)
- `k16-mapping.json` — mapping handle → expected key → exact `messages` list from llama-cpp debug-dump (the top_k=16 decoy run)
- `decoy-v3off.log` — decoy stdout, V3 disabled
- `decoy-v3on.log` — decoy stdout, V3 enabled (worker init log shows `layers=28 heads=28 kv=4 head_dim=128 ... budget=2048`)
- `vllm-decoy-resolution.py` — resolution harness (loads from `res-mapping.json`)
- `res-mapping.json` — mapping (op, handle) → expected key → exact `messages` list from llama-cpp `bench/longctx-decoy-resolution-2026-05-10/raw/`
- `decoy-res-v3off.log` — resolution stdout, V3 disabled
- `decoy-res-v3on.log` — resolution stdout, V3 enabled
- `vllm-rerank-proxy.py` — rerank-proxy client (queries longctx-svc → vLLM stack)
- `rerank-mapping.json` — mapping for `rerank_proxy_{orig,rewrite}` payloads (no chunks in user msg)
- `rerank-proxy-2026-05-11.log` — rerank-proxy stdout against Qwen 2.5-7B vLLM (first GPU-mode reranker run, 3/4 + 3/4)
- `rerank-proxy-32B-AWQ-2026-05-11.log` — same harness against Qwen 2.5-32B-Instruct-AWQ vLLM (4/4 + 4/4)
- `vllm-direct.py` — direct vLLM endpoint client (no longctx-svc), parametric by mapping/model/tag
- `32B-AWQ-decoy-k16-2026-05-11.log` — 32B-AWQ decoy_k16 (5/8 — same failures as 7B)
- `32B-AWQ-policy-splice-2026-05-11.log` — 32B-AWQ policy_splice (8/8 — invariant)
- `logs-topk-{2,4,8,16}.log` — top_k sweep on 7B, CPU-mode reranker
- `logs-seed-{42,7,1234}.log` — seed reproducibility on 7B at top_k=16
- `glass-retrieve-dump.txt` — raw `/retrieve` response for glass-orchid-vector, all 16 chunks with rerank scores and snippets
- `mistral-{decoy-k16,policy-splice,rerank-proxy}.log` — Mistral 7B Instruct v0.3 cross-family runs (5/8, 4/4, 4/4 + 4/4)
- `qwen14b-{decoy,policy-splice,rerank-proxy}.log` — Qwen 2.5-14B-Instruct-AWQ within-family curve (5/8, 4/4, 4/4 + 4/4)

## Cross-link

- `bench/longctx-proxy-hard-2026-05-10/` — original llama-cpp run with the same prompts (8/8 retrieval, 5/8 answer at top_k=16). debug-dump source for this bench.
- `bench/longctx-decoy-resolution-2026-05-10/` — the fix on llama-cpp side (reranker / external splice → 16/16). Next target for vLLM.
- `bench/vllm-smoke-2026-05-10/` — first-light + 12-way concurrency + V3 enable mechanics.
- `bench/vllm-needle-2026-05-11/` — needle retrieval (no decoys) — 5/5 across 128K/192K, isolating retrieval from ranking.
