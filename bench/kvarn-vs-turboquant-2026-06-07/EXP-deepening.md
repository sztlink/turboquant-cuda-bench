# KVarN deepening: the 2-bit V failure is on the decode horizon, not the context

> **SUPERSEDED / RETRACTED (2026-06-08).** This entire writeup chases a "MATH
> failure" that does not exist. The degeneration was a config bug on my side
> (vLLM prefix caching + chunked prefill ON, stale checkout), not a KVarN 2-bit-V
> property. With the correct config, KVarN k4v2 is near-lossless on MATH
> (0.374 vs fp16 0.383). The "decode horizon" framing is wrong. See
> **`RESULTS-CORRECTED.md`**. Kept only for the record.

Follow-up to `RESULTS.md`. Two probes on Qwen3-4B (the model where KVarN k4v2 runs; GQA 4:1) to localize *why* KVarN collapses on MATH.

## exp1 - is the MATH collapse a decode-config artifact? No.
Re-ran KVarN k4v2 on minerva_math (N=350) under three decode settings:

| decode | MATH exact_match | degeneration rate |
|---|---|---|
| greedy | 0.00 | 52% |
| repetition_penalty=1.15 | 0.00 | 44% |
| sampled (temp 0.7, top_p 0.95) | 0.00 | 54% |

- repetition_penalty reduces runaway repetition (52% -> 44%) but does **not** recover the score.
- At N=350: **0 correct**. Only **12% emit a `\boxed{}`** at all, and **those answers are wrong** (genuine wrong answer, tails clean, not truncation).
- fp16 = 0.40 and TurboQuant k4v2 = 0.279 on the same task, so it is KVarN-specific.

Conclusion: not an extraction artifact, not a greedy-loop fixable by sampling. The 2-bit V genuinely breaks long-form math generation.

## exp2 - does 2-bit V break long-context *retrieval* too? No.
Ran the long-context decoy probe (16k context, 8 payloads, short 128-token answer) across the three configs:

| config | decoy hits | degeneration |
|---|---|---|
| fp16 | 1/8 | 0/8 |
| TurboQuant k4v2 | 1/8 | 0/8 |
| KVarN k4v2 | 1/8 | 0/8 |

KVarN matches fp16 and TurboQuant exactly, with zero degeneration on the short answer. (The decoy is a hard floor for a 4B model, so accuracy resolution is low, but the degeneration signal is clean.)

## Synthesis
The axis is the **decode horizon (generated tokens)**, not the context length.

| regime | KVarN k4v2 |
|---|---|
| short output (gsm8k, HumanEval) | holds, near fp16 |
| long context, short output (decoy 16k) | holds, = fp16 / TQ |
| long generation (MATH CoT) | collapses |

KVarN's 2-bit V error accumulates over the model's **own generated tokens** during long decode, not over the prompt KV. The KVarN paper's own thesis ("errors accumulate across decoding timesteps") is exactly the failure, localized: it is the decode horizon, not the context window.

## Runners / repro (on the 4090 / WSL2)
- `~/kvarn-lab/exp1.sh` - serves KVarN Qwen3-4B, runs minerva_math under greedy / repetition_penalty / sampled, `--log_samples`.
- `~/kvarn-lab/exp2.sh` + `decoy_run.py` - decoy probe (16k) for fp16 / TurboQuant k4v2 / KVarN k4v2, offline LLM.
- Decoy corpus: `/home/felipe/vllm-lab/decoy/k16-mapping.json` (8 handles, k=16 chunks).

## Caveats
- Qwen3-4B only (KVarN k4v2 crashes on Qwen2.5-7B, GQA 7:1, see KVarN#12).
- Decoy floor is low at 4B (fp16 = 1/8); the retrieval comparison has low resolution. The degeneration contrast (0/8 here vs ~50% in long generation) is the robust signal.
- Throughput still not compared (WSL pinned-memory penalty on KVarN).
