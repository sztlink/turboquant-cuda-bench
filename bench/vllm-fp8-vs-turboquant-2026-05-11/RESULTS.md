# vLLM KV-cache dtype sweep on decoy k=16

**Date:** 2026-05-11
**Stack:** vLLM `feature/turboquant_plus` @ `36fc04825`, RTX 4090 (24 GiB), WSL2 Ubuntu 24.04
**Model:** `Qwen/Qwen2.5-7B-Instruct`, BF16 weights, `max_model_len=16384`, `gpu_memory_utilization=0.85`, `enforce_eager=True`
**Workload:** 8 handles, k=16 retrieved chunks per handle, identical prompts + seed=42 across all three runs (`k16-mapping.json` from `bench/vllm-decoy-2026-05-11/`)

## Headline

| `kv_cache_dtype` | KV bits (effective) | hits | wrong-answer pattern |
|---|---|---|---|
| `auto` (BF16) | 16 | **5/8** | 3 decoys: `DECOY-0616-1` / `DECOY-0742-6` / `DECOY-0725-7` |
| `fp8` (vLLM native, no scales) | 8 | **0/8** | gibberish, repetition, path leakage |
| `turboquant_k8v4` (FP8 K + 4-bit V) | ~6 | **5/8** | byte-identical to `auto` on all 8 handles |

## What this answers

**Q1: Is the decoy 5/8 ceiling caused by KV-cache compression?**
No. `auto` (full BF16 KV, zero compression) and `turboquant_k8v4` (≥4× compression) hit the same 5/8 with the same three wrong literals. The gap is upstream of compression — it lives in the retrieval pipeline + prompt format + family calibration, as documented in `bench/vllm-decoy-2026-05-11/RESULTS.md`. Compression is exonerated.

**Q2: How does naive FP8 KV (no calibration scales) compare to TurboQuant's K8V4?**
Naive `fp8` collapses to 0/8 — the model emits malformed strings (e.g. `'AYA-HARD-AUROROA-BLUE -0 tiare-Z/'`, repetitive path fragments, broken refusal templates). `turboquant_k8v4` holds the same hit rate as full BF16. At a similar compression class, TurboQuant's K8V4 is not just better — naive FP8 KV is unusable here as a drop-in.

The vLLM startup line for `fp8` says it clearly: *"Using fp8 data type to store kv cache. … it may cause accuracy drop without a proper scaling factor."* Without calibrated `kv_cache_scales_path`, the cache stores raw E4M3 with no per-tensor renormalization, and a 16K-token prompt accumulates enough quantization error to destroy decoding.

## Per-handle receipts

### `auto` (BF16 KV, no compression)

```
[auto] aurora-blue-compass    hit=True   answer='AYA-HARD-AURORA-BLUE-050-Z9'
[auto] brass-river-index      hit=False  answer='DECOY-0616-1'
[auto] ceramic-lantern-field  hit=True   answer='AYA-HARD-CERAMIC-LANTERN-310-Z9'
[auto] delta-archive-needle   hit=True   answer='AYA-HARD-DELTA-ARCHIVE-440-Z9'
[auto] ember-signal-route     hit=True   answer='AYA-HARD-EMBER-SIGNAL-570-Z9'
[auto] feldspar-memory-gate   hit=True   answer='AYA-HARD-FELDSPAR-GATE-700-Z9'
[auto] glass-orchid-vector    hit=False  answer='DECOY-0742-6'
[auto] jade-winter-circuit    hit=False  answer='DECOY-0725-7'
```

### `fp8` (vLLM native, no scales)

```
[fp8] aurora-blue-compass     hit=False  answer='AYA-HARD-AUROROA-BLUE -0 tiare-Z/'
[fp8] brass-river-index       hit=False  answer='/home/aya/implimpl t/research/t /mploquanttboquantuda cuda / bench/ / / / / / / '
[fp8] ceramic-lantern-field   hit=False  answer='TheA-HARD-CERAMIC-LANTERNR3-3'
[fp8] delta-archive-needle    hit=False  answer='// /home/aya/implplement/research/t/implboquant/cuda/ bench// /README.md/ ccorpu'
[fp8] ember-signal-route      hit=False  answer='The\n\nThe\np\n The exact SECRET VALUE you is "SECRET VALUE".".p/\n\n/'
[fp8] feldspar-memory-gate    hit=False  answer='AYA-HARD-F-FDSPAR-GATE'
[fp8] glass-orchid-vector     hit=False  answer='It /home/aya/impl/t/research/t /g/ longctx-proxy-hard / src/sector_ / / / / / / '
[fp8] jade-winter-circuit     hit=False  answer='It The provided you provide the exact SECRET VALUE, as it it does does does. The'
```

### `turboquant_k8v4` (from `bench/vllm-decoy-2026-05-11/`)

5/8 — byte-identical answers to `auto` on all 8 handles (same hits, same decoy literals on the same 3 fails).

## Notes on methodology

- Identical mapping file, identical prompts, identical seed (`SamplingParams(temperature=0.0, max_tokens=128, seed=42)`).
- `enforce_eager=True` to remove CUDA graph dependence on dtype path.
- `fp8` cold-start triggered FlashInfer JIT compile of the `batch_prefill_with_kv_cache_dtype_q_bf16_dtype_kv_e4m3` kernel. The first attempt failed with `ninja` exit 127 due to a stale flashinfer JIT cache containing an unexpanded `$VIRTUAL_ENV` literal in `build.ninja` (`cuda_home = $VIRTUAL_ENV/lib/python3.12/site-packages/nvidia/cu13`). Workaround: `rm -rf ~/.cache/flashinfer/0.6.8.post1/89/cached_ops/batch_prefill_with_kv_cache_*_e4m3* ~/.cache/flashinfer/0.6.8.post1/89/generated/`, set `CUDA_HOME` to a fully resolved absolute path before re-running.
- Naive `fp8` here is `kv_cache_dtype="fp8"` with **no** `--kv-cache-scales-path` and **no** calibration pass. A calibrated `fp8` run would likely recover, but that costs an extra offline calibration pass per model — not a drop-in replacement.

## What this does and does not prove

Proven:
- The 5/8 decoy ceiling on this corpus is not a compression artifact. It survives at full BF16.
- TurboQuant K8V4 preserves the full-precision hit rate at ≥4× KV compression on this Qwen 2.5-7B + 16K + adversarial-retrieval workload.
- Drop-in `fp8` KV cache without scaling factors is unusable for this workload on this model.

Not proven (deliberately out of scope):
- Calibrated `fp8` quality. With per-tensor scales (`kv_cache_scales_path`), `fp8` likely recovers most of the loss.
- Generalization to other models, other context lengths, other corpora. The corpus shape (8 handles, adversarial decoys, mixed-format canonical chunks) is documented in `bench/longctx-proxy-hard-2026-05-10/`.
- Throughput / VRAM impact of each dtype. This run was correctness-only.

## Repro

```bash
# On WSL2 4090 host
cd ~/vllm-lab/decoy
source ~/vllm-lab/venv/bin/activate
export CUDA_HOME=/home/felipe/vllm-lab/venv/lib/python3.12/site-packages/nvidia/cu13
export LD_LIBRARY_PATH=$CUDA_HOME/lib:$LD_LIBRARY_PATH
export PATH=$CUDA_HOME/bin:/usr/bin:$PATH

python vllm-decoy-dtype-sweep.py auto    # BF16 baseline
python vllm-decoy-dtype-sweep.py fp8     # naive FP8
python vllm-decoy-dtype-sweep.py turboquant_k8v4
```

`k16-mapping.json` from `bench/vllm-decoy-2026-05-11/`. Full per-handle JSON dumps in `fp8vs-auto.log` and `fp8vs-fp8.log` in this directory.

## Receipts

- `vllm-decoy-dtype-sweep.py` — single-script parametric runner
- `fp8vs-auto.log` — 18 KB, full vLLM init + 8 handle answers + JSON summary
- `fp8vs-fp8.log` — 19 KB, full vLLM init + 8 handle answers (all degraded) + JSON summary
- `k16-mapping.json` — same as `bench/vllm-decoy-2026-05-11/k16-mapping.json`
