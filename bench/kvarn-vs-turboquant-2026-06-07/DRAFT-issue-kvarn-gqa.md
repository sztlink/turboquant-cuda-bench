# DRAFT — GitHub issue for huawei-csl/KVarN (NOT filed — Felipe review)

**Title:** `kvarn_k4v2_g128` decode kernel crashes on non-power-of-2 GQA ratios (e.g. Qwen2.5-7B, 7:1)

**Body:**

The KVarN decode Triton kernel assumes `Q_PER_KV` (num query heads per KV head) is a power of 2. On models where it isn't — e.g. **Qwen2.5-7B-Instruct** (28 query heads / 4 KV heads = **7**) — engine init crashes at first inference:

```
File ".../vllm/v1/attention/ops/triton_kvarn_decode.py", line ...
    qh = tl.arange(0, Q_PER_KV)   # query heads in this group
triton.compiler.errors.CompilationError: arange's range must be a power of 2
```

`EngineCore` then dies with `EngineDeadError` and the server returns connection-refused to all requests.

**Repro:**
```bash
VLLM_USE_FLASHINFER_SAMPLER=0 vllm serve Qwen/Qwen2.5-7B-Instruct \
  --dtype float16 --kv-cache-dtype kvarn_k4v2_g128 --block-size 128 \
  --max-model-len 4096 --enforce-eager
# loads weights OK, crashes on first decode
```

**Scope:**
- Works: Qwen3-4B (GQA 4:1, power of 2).
- Fails: Qwen2.5-7B-Instruct (GQA 7:1).
- fp16 (no `--kv-cache-dtype`) on the same model/build works → it's the KVarN quant kernel, not the model.

**Suggested fix direction:** pad `Q_PER_KV` up to the next power of 2 in the `tl.arange` and mask the padded lanes, or template the kernel over a padded group size. Happy to test a patch.

**Env:** RTX 4090, CUDA 13, vLLM `0.1.dev1+g6c7dac` (v0.22.0 base), Triton 3.6, WSL2.

---
**Also note (separate, not necessarily an issue):** at `k4v2` on long-form generation (MATH CoT), ~57% of outputs degenerate into repetition vs ~10% for fp16 baseline under identical greedy decode — suggests the 2-bit V path accumulates error over long decode. Can open separately with samples if useful.
