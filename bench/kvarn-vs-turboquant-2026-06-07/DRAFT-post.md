> **SUPERSEDED 2026-06-20.** Este draft propaga a alegação "57% of KVarN outputs degenerate / 2-bit V error compounds over long decode" (ponto 2 abaixo), que foi RETRATADA no commit 45dabed: o "MATH collapse" do KVarN era config bug (vLLM prefix-caching + chunked-prefill ligados, checkout stale), NÃO comportamento do KVarN. RESULTS.md e EXP-deepening.md já carregam o banner de retração; este draft ficou para trás. NÃO usar nem citar o ponto 2. Mantido apenas como rastro histórico. Ver `memory-md/AYA1/research/2026-06-20-kv-github-deepdive-antagonize.md`.

# DRAFT — KVarN vs TurboQuant, head-to-head at iso-bits (NOT published — Felipe review)

> Tom: substância, sem hype/broadcast. Veículo a decidir (#research / discussion #20969 / X).

---

**KVarN (Huawei) vs TurboQuant (DeepMind impl), same bit budget, same models, controlled for the runtime.**

Ran both vLLM forks head-to-head on Qwen3-4B and Qwen2.5-7B, fp16 activations, greedy, via lm-eval-harness. Iso-bits: KVarN `k4v2_g128` vs TurboQuant `k4v2_nc` — both 4-bit K / 2-bit V. Control: fp16 on **both** forks (matches → the vLLM-version difference doesn't explain the deltas).

**Qwen3-4B, 4-bit K / 2-bit V:**
| | gsm8k | MATH | HumanEval |
|---|---|---|---|
| fp16 ref | 0.87 | 0.40 | 0.72 |
| TurboQuant k4v2 | 0.826 | 0.279 | 0.585 |
| KVarN k4v2 | 0.842 | (see below) | **0.726** |

Three things:

1. **On short/structured tasks KVarN's Sinkhorn wins at 2-bit V.** HumanEval: KVarN 0.726 (≈ fp16) vs TurboQuant 0.585. gsm8k slightly ahead too. Per-token fidelity is better.

2. **On long-form generation KVarN destabilizes.** On MATH, 57% of KVarN outputs degenerate into repetition (`444…`, `denominator denominator…`) vs 10% for fp16 — ~6× more. Only 39% emit a `\boxed`. It's not wrong reasoning (many start correct) — the 2-bit V error compounds over long decode into runaway repetition. TurboQuant at the same 4/2 holds (MATH 0.279).

3. **KVarN k4v2 only supports power-of-2 GQA.** It crashes on Qwen2.5-7B (28/4 = 7 query-heads-per-kv) — Triton `arange` must be power of 2. Works on Qwen3-4B (4:1). Filed upstream.

Takeaway: at aggressive 2-bit V, **KVarN trades long-horizon stability for per-token precision**; TurboQuant is the more robust/portable choice, KVarN the more accurate where it fits and on short tasks.

Caveats: throughput not compared (WSL pin-memory penalty skews KVarN — needs native Linux); MATH = minerva_math subset, not exact MATH500; N=500/≈700/164. Full table + raw data + repro: [link to repo].
