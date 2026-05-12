# vLLM KV-cache dtype sweep on decoy k=16

**Date:** 2026-05-11
**Stack:** vLLM `feature/turboquant_plus` @ `36fc04825` (panels A/M/R/TQ), stock vLLM 0.20.2 (panel C). RTX 4090 (24 GiB), WSL2 Ubuntu 24.04
**Model:** `Qwen/Qwen2.5-7B-Instruct`, BF16 weights (A/M/R/TQ) or W8A8-FP8 calibrated weights (C). `max_model_len=16384`, `gpu_memory_utilization=0.85`, `enforce_eager=True`
**Workload:** 8 handles, k=16 retrieved chunks per handle, identical prompts + seed=42 (`k16-mapping.json` from `bench/vllm-decoy-2026-05-11/`)

## Headline

| panel | `kv_cache_dtype` | scales | hits | failure mode |
|---|---|---|---|---|
| A | `auto` (BF16) | n/a | **5/8** | 3 decoy commits |
| TQ | `turboquant_k8v4` | n/a (built-in) | **5/8** | byte-identical to A |
| M | `fp8` | 1.0 (no calibration) | **0/8** | gibberish across all 8 (token-mangle, path-leak, loop, format-echo) |
| R | `fp8` + `calculate_kv_scales=True` | random-token on-the-fly | **0/8** | dominantly loop / collapse — worse than M |
| C | `fp8` (W8A8-KV8) | dataset-calibrated, ultrachat_200k 512 samples | **0/8** | "near-miss": correct template, single-digit precision error on 3 hit-class handles; format-echo / prompt-echo on the 2 decoy-class handles BF16 also fails |

## What this answers

**Q1: Is the decoy 5/8 ceiling caused by KV-cache compression?**
No. `auto` (BF16, zero compression) and `turboquant_k8v4` (≥4× compression) hit the same 5/8 with byte-identical literals on the same 3 failing handles. The gap is upstream of compression — it lives in the retrieval pipeline + prompt format + family calibration, documented in `bench/vllm-decoy-2026-05-11/RESULTS.md`. Compression is exonerated.

**Q2: How does naive FP8 KV compare to TurboQuant's K8V4?**
Naive `fp8` (`scales=1.0`) collapses to 0/8 with structural breakage — eight different *kinds* of broken output across 8 prompts (token-mangle, path-leak, loop, format-echo). On-the-fly random-token scaling is *worse* — all 8 outputs are dominated by loops or 1-3-token collapses. As a drop-in, vLLM's `kv_cache_dtype=fp8` without calibrated scales is unusable on Qwen 2.5-7B for this workload.

**Q3: Does dataset-calibrated FP8 recover the BF16 behavior at 7B drop-in scale?**
Partially. Calibrated W8A8-FP8 (`llmcompressor` recipe with `ultrachat_200k` 512 samples, 2048 max_seq_length, per-tensor static FP8 on weights + input_activations + KV cache scheme) **recovers structure** — the model generates the correct AYA-HARD-X-N-Z9 template, the correct decoy-commit behavior on the handles that decoy at BF16, and the correct system-prompt-aware refusal pattern. It does **not** recover precision — three handles BF16 hits exactly are emitted with a single wrong digit in the secret-value suffix (`AURORA-BLUE-055` instead of `050`; `DELTA-ARCHIVE-44` instead of `440`; `EMBER-SIGNAL-571` instead of `570`). On exact-match grading this is 0/8. On Levenshtein-1 grading, 3/8. On qualitative "got the structure right," 5/8 are in the right regime.

## Why this matters in the public TurboQuant debate

Red Hat AI (Kurtic, Wilkinson, Bonanni, Goin, Marques — `vllm.ai/blog/turboquant`) report FP8 KV at "zero accuracy cost vs BF16, 100% throughput" on Llama-3.3-70B / Qwen3-30B / MiniMax-M2.7, tested on AIME25, GPQA:Diamond, MATH500, LiveCodeBench-v6, and `openai/mrcr`. The claim is well-supported in that regime.

The regime tested here is different:

- Scale: 7B (their smallest is 30B sparse + reasoning model)
- Benchmark: exact-match on adversarial retrieval, not partial-credit reasoning
- Calibration: best available drop-in (per-tensor static) on consumer hardware, not their FP8-block at 70B+

In this regime, the same calibration method that gives them "zero cost" gives us "0/8 with characteristic near-miss precision errors." Not a refutation of their claim. A demonstration of where the claim has scope — and where TurboQuant K8V4, which matches BF16 byte-for-byte here with no calibration step at all, holds an asymmetric advantage.

## Detailed per-handle receipts

See `FAILURE-CATALOG.md` for all 8 outputs across all 5 panels with one-word failure-mode labels per handle. Logs in `fp8vs-auto.log`, `fp8vs-fp8.log`, `fp8vs-fp8-otf.log`, `fp8vs-calibrated.log` (verbatim per-handle outputs + full vLLM init).

## Reproduction

```bash
# Panels A, M (in the feature/turboquant_plus venv)
python vllm-decoy-dtype-sweep.py auto
python vllm-decoy-dtype-sweep.py fp8

# Panel R (same venv)
python vllm-decoy-fp8-otf.py

# Panel C (separate venv with stock vLLM 0.20.2 — see Caveat)
python calibrate-fp8-qwen7b.py     # ~9m22s on RTX 4090, produces ./qwen2.5-7b-fp8-kv/
python vllm-decoy-calibrated.py    # loads compressed model + kv_cache_dtype=fp8
```

**Caveat (panel C venv):** the calibrated FP8 model was produced and loaded outside the `feature/turboquant_plus` fork because llmcompressor's install pulled `torch 2.10.0` while the fork's compiled C extension was linked against a `torch 2.11.0` nightly. Switching to stock vLLM 0.20.2 was the simplest path; the compressed-tensors W8A8-KV8 model is portable across vLLM versions and the difference is not the variable under test.

## What this does and does not claim

Proven:
- The 5/8 decoy ceiling on this corpus is invariant to KV-cache compression dtype.
- TurboQuant K8V4 preserves full BF16 hit rate at ≥4× compression on this Qwen 2.5-7B + 16K + adversarial-retrieval workload, byte-identically.
- vLLM `kv_cache_dtype=fp8` is not a drop-in replacement at 7B on this workload — neither scales=1.0 nor on-the-fly random-token scaling produce usable output.
- Dataset-calibrated W8A8-KV8 FP8 produces structural recovery but precision loss on this workload.

Out of scope:
- Whether the precision loss persists at higher calibration sample counts (4096+) or different calibration datasets.
- 70B+ scale (cannot fit on a single 24 GB GPU).
- Throughput / VRAM comparison across dtypes.
- AIME25 / GPQA / MATH500 / LiveCodeBench-v6 / mrcr — Red Hat's benchmark suite. Different scoring grammar, different conclusions possible. We did not run them; for the reader who wants those, their blog is the canonical reference.
- Whether the same pattern holds on Mistral / Llama / etc. We tested only Qwen 2.5-7B.

## Receipts

- `vllm-decoy-dtype-sweep.py` — parametric runner for panels A & M
- `vllm-decoy-fp8-otf.py` — panel R
- `calibrate-fp8-qwen7b.py` — produces panel C model
- `vllm-decoy-calibrated.py` — runs panel C
- `fp8vs-auto.log`, `fp8vs-fp8.log`, `fp8vs-fp8-otf.log`, `fp8vs-calibrated.log` — full per-handle vLLM output logs
- `FAILURE-CATALOG.md` — five-panel diptych+ with labeled failure modes
- `k16-mapping.json` — corpus, same as `bench/vllm-decoy-2026-05-11/`
