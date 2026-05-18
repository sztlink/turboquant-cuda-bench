# vLLM TurboQuant needle retrieval, 4090 WSL2 — 128K / 160K / 192K

Date: 2026-05-11.

Purpose: cross-stack replication of the 5-position needle retrieval task from `bench/needle-retrieval-2026-05-10` (llama-cpp + Qwen 27B q8/turbo4) now on the vLLM CUDA path of TheTom's fork (`vllm-turboquant @ feature/turboquant_plus`), with Qwen 2.5-7B-Instruct, `kv_cache_dtype=turboquant_k8v4`, and YaRN RoPE scaling. Same prompts and same hit criterion (exact key match in the answer), so the two runs are directly comparable on the retrieval axis.

## Setup

- Host: same RTX 4090 / WSL2 Ubuntu 24.04 from `bench/vllm-smoke-2026-05-10`
- vLLM build: `0.1.dev1+g36fc04825` (commit `36fc04825`)
- Model: `Qwen/Qwen2.5-7B-Instruct` (32K native; YaRN added at runtime — the `-1M` variant is incompatible with this fork's FlashAttention path)
- `kv_cache_dtype=turboquant_k8v4`
- `gpu_memory_utilization=0.88`, `enforce_eager=True`
- YaRN RoPE scaling via `hf_overrides`: `{"rope_type": "yarn", "factor": <F>, "original_max_position_embeddings": 32768}`
- Prompts: identical files reused from `bench/needle-retrieval-2026-05-10/prompts/` — 5 positions (p05, p25, p50, p75, p95) at each of 128K / 160K / 192K target depth. Each prompt is 3500 lines with the canonical key `AYA-<DEPTH>-<POS>-K<NNN>-Z9` injected at the position fraction.
- Sampling: `temperature=0.0, max_tokens=64, seed=42`. Hit = expected key literal appears in the generated text.

## Results — main run

| depth | YaRN factor | prompt tokens | hits | mean gen time | KV cache size | concurrency @ ctx |
|---:|---:|---:|---:|---:|---:|---:|
| 128K | 4.0 | 115,629 | **5/5** | 21.7 s | 224,816 | 1.72x |
| 160K | 5.0 | 148,629 | **3/5** | 33.0 s | 224,528 | 1.37x |
| 192K | 6.0 | 178,329 | **5/5** | 45.1 s | 224,224 | 1.14x |

The `160K @ factor=5.0` outlier failed only on the extreme positions: p05 and p95 each returned a key that started with `AYA-110K-...` instead of `AYA-160K-...` (the model substituted "110K" for "160K") and also returned `z9` lowercase in p05. p25, p50, p75 hit cleanly. The other three depths hit all five positions exactly.

## Ablation — 160K, factor=6.0 instead of 5.0

| depth | YaRN factor | hits | answers |
|---:|---:|---:|---|
| 160K | **5.0** (exact, just enough) | 3/5 | p05 → `AYA-110K-p05-K050-z9` ❌, p95 → `AYA-110K-p95-K950-Z9` ❌ |
| 160K | **6.0** (over-scaled to cover 192K) | **5/5** | all positions match `AYA-160K-pNN-KNNN-Z9` |

This single ablation isolates the cause: same model, same prompts, same KV config, only the YaRN factor differs. The 3/5 result was not a context-length limit and not a TurboQuant artifact — it was the YaRN exact-fit factor mis-aligning extreme positions. Over-scaling the factor (factor=6 used for a 160K window, room for 192K) resolves it.

## Cross-stack readout vs llama-cpp

Reference run in this repo: `bench/needle-retrieval-2026-05-10/RESULTS.md` (llama-cpp-turboquant + Qwen 27B q8/turbo4, no longctx-svc).

| depth | llama-cpp Qwen 27B q8/turbo4 | vLLM Qwen 2.5-7B + YaRN + turboquant_k8v4 |
|---:|---:|---:|
| 128K | 5/5 | 5/5 |
| 160K | 5/5 | 5/5 (factor=6) · 3/5 (factor=5) |
| 192K | 5/5 | 5/5 |

On the retrieval axis alone (single key, no decoys), both stacks pass 5/5 from 128K through 192K. **The retrieval ceiling is not where they differ**, at least with this corpus shape. The actually interesting comparison is the decoy/ranking gap from `bench/longctx-proxy-hard-2026-05-10` (8/8 retrieval, 5/8 answer with top_k=16 and decoys) — that's the next test on the vLLM side.

Tokenizer note: the prompt files report depth in the filename, but the actual tokenized length differs by tokenizer: 183.7K tokens in llama.cpp tokenizer (Qwen 27B) vs 178.3K in HF tokenizer (Qwen 2.5-7B) for the same 192K-labelled prompt. Comparison is on the prompt content, not the exact token count.

## TurboQuant + TriAttention V3 in the loop

Each run logs:
```
INFO [cuda.py:368] Using TURBOQUANT attention backend out of potential backends: ['TURBOQUANT'].
INFO [gpu_model_runner.py:1171] TriAttention V3 Tier 2: tokenizer bound from Qwen/Qwen2.5-7B-Instruct on first scheduled_new_reqs.
```

So the needle is being recovered with the TurboQuant K8V4 KV-cache compression and TriAttention V3 reasoning path both active — not just FA2 + native KV. That makes this an end-to-end check of the fork's longctx path, not only a TurboQuant smoke.

## Throughput / latency

Generation time decreases as the needle moves toward the end of the prompt (more context already attended, less reasoning to traverse):

| depth | p05 gen | p25 gen | p50 gen | p75 gen | p95 gen |
|---:|---:|---:|---:|---:|---:|
| 128K | 28.6 s | 26.9 s | 23.9 s | 18.3 s | 10.6 s |
| 160K (f=6) | 42.7 s | 40.7 s | 36.6 s | 28.3 s | 16.3 s |
| 192K | 57.8 s | 55.9 s | 50.4 s | 38.9 s | 22.6 s |

The trend across depth (128K → 160K → 192K) and across position (p05 → p95) is monotonic and clean. No timeout, no NaN, no truncated output.

## Limitations / next steps

- N=5 per depth, single seed, deterministic. Throughput numbers are not benchmark-grade.
- Single model (Qwen 2.5-7B-Instruct). Not yet replicated on a model size comparable to the llama-cpp run (27B).
- YaRN factor tuning is preliminary. The 160K result suggests factor calibration matters; a small sweep (factor ∈ {4, 5, 5.5, 6, 8}) at the same depth would establish the safe range.
- The natural next bench is the **decoy/ranking task** from `bench/longctx-proxy-hard-2026-05-10` — that's where the llama-cpp work surfaced retrieval≠answer at top_k=16. Replicating it on vLLM requires either a longctx-svc analogue or manual splice of the same retrieved chunks into the user message.

## Artifacts

- `vllm-needle.py` — harness, configurable via `NEEDLE_DEPTH` and `NEEDLE_FACTOR` env vars
- `prompt_manifest.json` — same manifest as `bench/needle-retrieval-2026-05-10/`
- `needle-128k-r4.log` — 128K full vLLM stdout, factor=4.0, 5/5
- `needle-160k.log` — 160K factor=5.0, 3/5
- `needle-160k-f6.log` — 160K factor=6.0 ablation, 5/5
- `needle-192k.log` — 192K factor=6.0, 5/5

## Cross-link

- `bench/needle-retrieval-2026-05-10/` — llama-cpp side, same prompts
- `bench/vllm-smoke-2026-05-10/` — first-light vLLM smoke (8K / 16K / 16K, 0.5B / 7B / 32B-AWQ)
- `bench/longctx-proxy-hard-2026-05-10/` — decoy task on llama-cpp + longctx-svc (next target for vLLM)
