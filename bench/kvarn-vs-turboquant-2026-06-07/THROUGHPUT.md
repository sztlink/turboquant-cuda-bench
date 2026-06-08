# Serving throughput: does it scale with batch?

2026-06-08. Qwen3-4B, RTX 4090 (WSL2). Measures aggregate decode throughput as a
function of concurrency, for KVarN vs TurboQuant vs fp16 KV. Probe:
[`throughput_probe.py`](./throughput_probe.py) (stdlib only, `time.monotonic()` so a
host clock step cannot corrupt timing).

All three served with the same flags: `--no-enable-prefix-caching
--no-enable-chunked-prefill --max-model-len 4096 --gpu-memory-utilization 0.90
--max-num-seqs 256`, CUDA graphs on (no `--enforce-eager`).

## Result (aggregate tokens/sec)

| concurrency N | KVarN k4v2 | TurboQuant k4v2_nc | fp16 |
|---------------|-----------|--------------------|------|
| 1   | 46  | 96   | 101  |
| 8   | 87  | 596  | 648  |
| 32  | 96  | 1345 | 1500 |
| 64  | 96  | 1691 | 1894 |
| 128 | 96  | 1921 | 2150 |

KVarN saturates at ~96 tok/s from N=8 onward; TurboQuant and fp16 scale roughly
linearly. At batch 128 KVarN is ~20x below TurboQuant. Single-stream (N=1) it is
competitive.

## Root cause

KVarN's own `jit_monitor` logs, during the concurrent burst:

```
WARNING [jit_monitor] Triton kernel JIT compilation during inference:
_sinkhorn_log_kernel. This causes a latency spike;
consider extending warmup to cover this shape/config.
```

The running-set shape changes every decode step under dynamic batching, so
`_sinkhorn_log_kernel` recompiles continuously. The engine never schedules more
than ~22 concurrent requests with 60+ waiting and KV-cache usage at ~3% (capacity
is not the bottleneck). This persists in three configs:

- eager (`--enforce-eager`),
- with a warmup burst at each N before measuring,
- with CUDA graphs.

So it is not a config quirk on the caller side. Filed: huawei-csl/KVarN#15.

## Caveats

- One model (Qwen3-4B), one TurboQuant preset (`turboquant_k4v2_nc`).
- KVarN's quality is excellent and separate from this: near-lossless vs fp16 at
  the lowest bit budget tested (see `RESULTS-CORRECTED.md`), plus ~4x more KV
  capacity. This is specifically about batched-serving throughput.
- WSL2; but the TurboQuant and fp16 controls ran on the same box and scaled fine,
  so the flat KVarN curve is not a WSL artifact.
