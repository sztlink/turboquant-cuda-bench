#!/usr/bin/env python3
"""
Aggregate serving-throughput probe for KV-cache quant backends.

Fires N concurrent /v1/completions against a vLLM OpenAI endpoint and measures
aggregate output tokens/sec. Uses time.monotonic() so a WSL/NTP wall-clock step
cannot corrupt the timing. Stdlib only.

Usage:
    python3 throughput_probe.py http://localhost:8001/v1/completions 1 8 32 64 128

Serve commands used for the numbers in THROUGHPUT.md (Qwen3-4B, RTX 4090):

  # KVarN (Huawei)
  vllm serve Qwen/Qwen3-4B --dtype float16 --kv-cache-dtype kvarn_k4v2_g128 \
    --block-size 128 --no-enable-prefix-caching --no-enable-chunked-prefill \
    --max-model-len 4096 --gpu-memory-utilization 0.90 --max-num-seqs 256 \
    --port 8001 --served-model-name spikemodel

  # TurboQuant (TheTom vllm-turboquant fork), turboquant_k4v2_nc
  # same flags, --kv-cache-dtype turboquant_k4v2_nc (no --block-size)

  # fp16 baseline: same flags, drop --kv-cache-dtype
"""
import urllib.request, json, time, sys
from concurrent.futures import ThreadPoolExecutor

base = sys.argv[1]
Ns = [int(x) for x in sys.argv[2:]] or [1, 8, 32, 64, 128]
MAXTOK = 128
PROMPT = ("A modern out of order CPU core fetches an instruction, decodes it into "
          "micro ops, renames its registers to remove false dependencies, dispatches "
          "it to a reservation station, executes it on a free functional unit, accesses "
          "the cache hierarchy on a memory operation, and finally retires it in program "
          "order from the reorder buffer. ") * 8  # ~529 prompt tokens

def one(_):
    body = json.dumps({"model": "spikemodel", "prompt": PROMPT,
                       "max_tokens": MAXTOK, "temperature": 0}).encode()
    req = urllib.request.Request(base, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=900) as r:
        u = json.loads(r.read()).get("usage", {})
    return u.get("completion_tokens", 0)

def burst(N):
    t0 = time.monotonic()
    with ThreadPoolExecutor(max_workers=N) as ex:
        toks = list(ex.map(one, range(N)))
    wall = time.monotonic() - t0
    return (sum(toks) / wall if wall > 1e-6 else 0.0), wall

for N in Ns:
    burst(N)                       # warmup (compile/capture shapes)
    agg, wall = burst(N)           # measured
    print(f"N={N:<4} aggregate_tok_s={agg:8.1f}  wall_s={wall:.2f}")
