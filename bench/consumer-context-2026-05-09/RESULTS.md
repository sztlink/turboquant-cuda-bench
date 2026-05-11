# Consumer long-context bench, 4090, Qwen3.6 27B dense

Date: 2026-05-09 local / 2026-05-10 UTC.

Purpose: stop packaging and get a simple read on TheTom TurboQuant behavior where it matters: larger dense model plus long context on one consumer RTX 4090.

## Setup

- GPU: NVIDIA RTX 4090, 24 GB VRAM.
- Binary: `C:\turbo-build\llama-cpp-turboquant\build\bin\llama-bench.exe`.
- Binary SHA256: `3A397CC18F382136F1164665B118471F6E4E616A2AB747622DB285F530481280`.
- Source commit on 4090: `69d8e4be4` with local dirty files unrelated to `llama-bench` plus the KLD repair in `perplexity.cpp`.
- Model: `C:\models\q36_27b_new.gguf`, reported by llama-bench as `qwen35 27B Q4_K - Medium`, 17.52 GB model file, 26.90B params.
- Command shape: `llama-bench -ngl 99 -fa 1 -p 512 -n 64 -d <depth> -r 1 -o json --no-warmup`, unless marked as fit probe.
- KV layouts tested: `q8_0/q8_0`, `q8_0/turbo4`, `turbo4/turbo4`.

## Throughput results, full p512 / n64 bench

| depth | KV K/V | status | PP tok/s | TG tok/s | note |
|---:|---|---|---:|---:|---|
| 64K | q8_0/q8_0 | ok | 1753.25 | 31.77 | raw JSON complete |
| 64K | q8_0/turbo4 | ok | 1814.03 | 30.38 | raw JSON complete |
| 64K | turbo4/turbo4 | ok | 1745.16 | 30.32 | raw JSON complete |
| 128K | q8_0/q8_0 | ok | 1211.82 | 24.70 | raw JSON complete |
| 128K | q8_0/turbo4 | ok | 1279.91 | 23.23 | raw JSON complete |
| 128K | turbo4/turbo4 | ok | 1279.37 | 23.31 | raw JSON complete |
| 240K | q8_0/q8_0 | timeout | timeout/no JSON | timeout/no JSON | 900s guard hit, no JSON; orphan process was killed |
| 240K | q8_0/turbo4 | timeout | timeout/no JSON | timeout/no JSON | 900s guard hit, no JSON; orphan process was killed |
| 240K | turbo4/turbo4 | interrupted | timeout/no JSON | timeout/no JSON | overall runner timed out before cell guard; orphan process was killed |

## Fit probes, p1 / n1

These are not throughput numbers. They answer a narrower question: can the model/context/layout initialize and complete a minimal bench inside a 300s guard?

| depth | KV K/V | status | PP tok/s | TG tok/s | guard |
|---:|---|---|---:|---:|---:|
| 192K | q8_0/q8_0 | timeout/no JSON | timeout/no JSON | timeout/no JSON | 300s |
| 192K | q8_0/turbo4 | completed | 15.53 | 17.13 | 300s |
| 192K | turbo4/turbo4 | completed | 14.40 | 17.07 | 300s |
| 240K | turbo4/turbo4 | timeout/no JSON | timeout/no JSON | timeout/no JSON | 300s |

## Readout

- At 64K and 128K, all three KV layouts completed on the 4090 with the dense 27B model.
- At 128K, `q8_0/turbo4` and `turbo4/turbo4` prefill were slightly faster than `q8_0/q8_0`, while decode was slightly slower. The decode delta is small enough that the first practical value is memory/headroom, not raw speed.
- The useful capacity boundary showed up around 192K in the minimal probe: `q8_0/q8_0` did not produce JSON inside 300s, while `q8_0/turbo4` and `turbo4/turbo4` did.
- 240K was not a clean result. Full p512/n64 runs and the p1/n1 turbo4/turbo4 probe hit guards with no JSON, near full VRAM. Treat this as a practical timeout in this harness, not a hard architectural impossibility.

## Caveats

- Single run per cell, no warmup. This is a field probe, not a publication benchmark.
- The 240K attempts were killed after timeout; no quality or throughput claim should be made from them.
- `llama-bench -d` measures synthetic depth behavior. It is useful for capacity and throughput smoke, but it is not a retrieval or quality benchmark.
- No public claim or Discord post yet. This should stay private until we run a cleaner repeat and, if needed, a retrieval/quality check.

## Raw artifacts

- `raw/*.json`: full p512/n64 `llama-bench` outputs.
- `fit-probes/*.json`: p1/n1 capacity probes.
- `summary.parsed.json`: normalized summary.
- `run_consumer_context_bench_ssh.sh`: local SSH runner used for the first matrix.
