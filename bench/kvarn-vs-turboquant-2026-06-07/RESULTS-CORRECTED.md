# KVarN vs TurboQuant — CORRECTED benchmark (Qwen3-4B)

> 2026-06-08. This supersedes the first RESULTS.md. The original run reported a
> KVarN MATH "collapse" (0.00). That was **our configuration bug**, not a KVarN
> property. KVarN's author (@pbicho96) flagged it. We re-ran with the documented
> correct config and a current KVarN checkout. KVarN is near-lossless.

## What was wrong

The first run used vLLM defaults `enable_prefix_caching=ON` and
`enable_chunked_prefill=ON`, on a KVarN checkout 57 commits behind. KVarN stages
its KV per block; prefix caching + chunked prefill break that staging and the
decode degenerates into repetition (the authors document this exact failure).
Fix: `--no-enable-prefix-caching --no-enable-chunked-prefill` on current KVarN.

## Corrected numbers (prefix OFF, chunked OFF, KVarN updated)

bpw measured from KV-cache capacity at fixed budget (gpu_mem_util 0.9,
max_model_len 4096): bpw = 16 x (fp16_tokens / config_tokens). This is NOT an
iso-bits comparison: TurboQuant's k4v2_nc actually costs ~4.7 bpw despite the
4-bit-K / 2-bit-V name, and k8v4 ~7.3 bpw. KVarN k4v2 is the cheapest config
tested. (KVarN's bpw is an upper bound here; its fp16 tail pool reduces the
available KV budget, so true effective bpw is a touch lower.)

| Qwen3-4B          | GSM8K | MATH   | HumanEval | KV tokens | bpw   |
|-------------------|-------|--------|-----------|-----------|-------|
| fp16 (baseline)   | 0.870 | 0.383  | 0.7195    | 99,296    | 16.0  |
| **KVarN k4v2**    | 0.880 | 0.374  | 0.7195    | 405,120   | 3.92  |
| TurboQuant k4v2_nc| 0.815 | 0.291  | 0.5793    | 338,768   | 4.69  |
| TurboQuant k8v4   | 0.845 | 0.369  | 0.7012    | 216,288   | 7.35  |

## Corrected conclusions

1. **KVarN k4v2 is near-lossless.** It matches or beats fp16 on all three
   benchmarks (GSM8K +0.010, MATH -0.009, HumanEval identical), at the **lowest
   bit budget tested** (~3.9 bpw). The "MATH collapse" does not exist with
   correct config.
2. **KVarN matches fp16 with fewer bits than any TurboQuant preset tested.** It
   beats TurboQuant k4v2_nc (~4.7 bpw) on all three despite using ~18% fewer
   bits, and still beats k8v4 (~7.3 bpw, ~87% more bits than KVarN) on GSM8K and
   HumanEval while tying on MATH.
3. **This is one model family.** Per @buun, the win owes to Qwen3/2.5 channel
   imbalance that KVarN's InnerQ-like balancing exploits; our own scale data
   (exp4) shows the HumanEval edge shrinking +14pt (4B fp16) -> +4pt (32B AWQ),
   converging at scale. TurboQuant's eviction / long-context path is a separate
   axis not measured here.

## Still valid from the first run

- The GQA non-power-of-2 kernel bug in KVarN's Triton decode (issue #12). The
  author confirmed fixing. Independent of this config issue.
- BPW measurement method (KV-cache capacity / tokens). Config-independent.

## Credit

@pbicho96 (KVarN author) caught the config bug. The correction is owed to him.
