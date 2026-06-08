# KVarN vs TurboQuant — head-to-head KV-cache quantization benchmark

> **SUPERSEDED (2026-06-08).** The KVarN MATH "collapse" reported below was a
> configuration bug on my side (vLLM `enable_prefix_caching` + `enable_chunked_prefill`
> ON, on a checkout ~57 commits behind), not a KVarN property. With the correct
> config on current main, KVarN k4v2 is near-lossless. See **`RESULTS-CORRECTED.md`**
> for the corrected table and conclusions. This file is kept for the record.

**Date:** 2026-06-07 · **Hardware:** RTX 4090 (WSL2 Ubuntu-24.04) · **Status:** complete (4B); partial (7B, see limitation)

Head-to-head of two KV-cache quantization backends, both vLLM forks:
- **TurboQuant** (TheTom `vllm-turboquant` @ `feature/turboquant_plus`, vLLM `0.1.dev1+g36fc048`) — impl of Google DeepMind TurboQuant (ICLR 2026) + TriAttention V3.
- **KVarN** (`huawei-csl/KVarN`, vLLM `0.1.dev1+g6c7dac`, v0.22.0 base) — Huawei, arXiv 2606.03458. Hadamard + Sinkhorn dual-scaling variance-norm.

## Method
- **Same models** served by both forks: Qwen3-4B, Qwen2.5-7B-Instruct. **dtype float16** everywhere. max_model_len 4096, enforce_eager, greedy (temp 0).
- **Iso-bits comparison:** TurboQuant `turboquant_k4v2_nc` vs KVarN `kvarn_k4v2_g128` — **identical bit budget (4-bit K, 2-bit V)**, different method. Plus TQ shipped `turboquant_k8v4` (8/4).
- **Control for the vLLM-version confound:** fp16 (no KV quant) run on **both forks**. If they match, version differences don't explain quant deltas.
- **Harness:** `lm-eval-harness` 0.4.12 via the OpenAI `local-completions` endpoint (eval decoupled from serving). gsm8k (N=500), minerva_math (N≈700, 100/subtask), humaneval (N=164, pass@1).

## Results (gsm8k = flexible-extract / strict-match · math = exact_match · humaneval = pass@1)

### Qwen3-4B  (GQA 4:1 — power of 2 — KVarN runs)
| config | bits K/V | gsm8k | math | humaneval | KV tokens |
|---|---|---|---|---|---|
| fp16 (TQ fork) | 16/16 | 0.874/0.864 | 0.399 | 0.720 | ~baseline |
| fp16 (KVarN fork) | 16/16 | 0.872/0.864 | 0.403 | 0.713 | ~baseline |
| TQ k8v4 | 8/4 | 0.850 | 0.397 | 0.671 | 216k |
| **TQ k4v2** | 4/2 | 0.826 | 0.279 | 0.585 | 339k |
| **KVarN k4v2** | 4/2 | **0.842** | **0.000**† | **0.726** | 410k |

### Qwen2.5-7B-Instruct  (GQA 7:1 — NOT power of 2 — KVarN k4v2 crashes, see Limitation)
| config | bits K/V | gsm8k | math | humaneval |
|---|---|---|---|---|
| fp16 (TQ fork) | 16/16 | 0.832/0.776 | 0.319 | 0.646 |
| fp16 (KVarN fork) | 16/16 | 0.836/0.774 | 0.319 | 0.646 |
| TQ k8v4 | 8/4 | 0.830 | 0.279 | 0.628 |
| **TQ k4v2** | 4/2 | 0.802 | 0.160 | 0.598 |
| **KVarN k4v2** | 4/2 | ✗ kernel crash |

## Findings

1. **vLLM-version confound is negligible.** fp16 matches across both forks on both models and all 3 benchmarks (e.g., 7B math 0.319 = 0.319). Quant deltas are attributable to the **method**, not the runtime.

2. **At iso-bits 4/2, KVarN beats TurboQuant on short/structured tasks** (Qwen3-4B): gsm8k +1.6pt, **HumanEval +14.1pt (0.726 vs 0.585 — KVarN ≈ fp16 on code; TQ craters)**. KVarN's Sinkhorn dual-scaling preserves per-token fidelity better.

3. **† KVarN degenerates on long-form generation.** KVarN math = 0.000 is NOT a reasoning collapse — it is generation instability. From 700 KVarN math samples:
   - **57% degenerate** into repetition/garbage (`444444…`, `denominator denominator…`)
   - only **39% emit a `\boxed{}`** answer (extraction fails on the rest)
   - **fp16 baseline (same greedy decode): only 10% degenerate** → KVarN degenerates **~6× more**
   TurboQuant at the same 4/2 holds (math 0.279). The 2-bit V error accumulates over long decode → runaway repetition. gsm8k (short) and HumanEval (structured code) are largely spared.

4. **TurboQuant is more robust/portable:** runs on both GQA ratios and holds long-gen; KVarN is more accurate where it runs and on short tasks.

## Limitation — KVarN kernel bug (GQA must be power-of-2)
KVarN `kvarn_k4v2_g128` crashes at inference on Qwen2.5-7B (GQA 28/4 = 7:1). Root cause in the KVarN Triton decode kernel:
```
qh = tl.arange(0, Q_PER_KV)   # query heads in this group
# triton.compiler.errors: arange's range must be a power of 2
```
`Q_PER_KV` = num_heads / num_kv_heads. Qwen3-4B = 4 (ok); Qwen2.5-7B = 7 (fails). So KVarN k4v2 only supports power-of-2 GQA ratios. fp16 on the same fork/model works (it is the quant kernel, not the model). Reported upstream (draft issue in this dir).

## Caveats (read before citing)
- **Throughput NOT compared.** On this WSL2 host KVarN ran ~7× slower (e.g., gsm8k 997s vs ~130s) — but that is the WSL `pin_memory=False` penalty on KVarN's data path, not the method. A throughput claim needs a native-Linux GPU. Omitted here.
- `minerva_math` (limit 100/subtask) ≈ MATH but not the paper's exact MATH500 set.
- N is bounded (500/≈700/164), not full test sets.
- KVarN math `0.000` partly reflects extraction failing on degenerate output (some samples did reach a correct `\boxed`). The 57%-degeneration figure is the honest characterization, not the raw 0.000.
- Raw data: `results.csv`. Extraction/degeneration script: `analyze.py`.
