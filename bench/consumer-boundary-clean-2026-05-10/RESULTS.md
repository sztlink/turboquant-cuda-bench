# Boundary clean bench, 4090, Qwen3.6 27B dense

Date: 2026-05-09 local to 2026-05-10 local.

Purpose: repeat the practical context boundary with VRAM logging after the first rough field probe. This tests whether TurboQuant KV creates usable headroom at 192K on one RTX 4090.

## Setup

- GPU: NVIDIA RTX 4090, 24 GB VRAM.
- Binary: `C:\turbo-build\llama-cpp-turboquant\build\bin\llama-bench.exe`.
- Binary SHA256: `3A397CC18F382136F1164665B118471F6E4E616A2AB747622DB285F530481280`.
- Source commit on 4090: `69d8e4be4`.
- Model: `C:\models\q36_27b_new.gguf`, reported as `qwen35 27B Q4_K - Medium`, 17.52 GB file, 26.90B params.
- Command shape: `llama-bench -ngl 99 -fa 1 -p 64 -n 16 -d <depth> -r 1 -o json --no-warmup`.
- Contexts: 128K, 160K, 192K.
- Layouts: `q8_0/q8_0`, `q8_0/turbo4`, `turbo4/turbo4`.
- Repeats: 3 per cell.
- VRAM sampling: every 5 seconds during each cell.

## Aggregate results

| context | KV K/V | ok/runs | timeouts | PP tok/s mean | TG tok/s mean | peak VRAM max | elapsed mean |
|---:|---|---:|---:|---:|---:|---:|---:|
| 128K | q8_0/q8_0 | 3/3 | 0 | 746.59 | 24.23 | 22004 MiB | 84.7 s |
| 128K | q8_0/turbo4 | 3/3 | 0 | 730.23 | 22.69 | 20914 MiB | 84.0 s |
| 128K | turbo4/turbo4 | 3/3 | 0 | 719.62 | 22.68 | 20914 MiB | 84.0 s |
| 160K | q8_0/q8_0 | 3/3 | 0 | 626.13 | 22.01 | 23262 MiB | 110.0 s |
| 160K | q8_0/turbo4 | 3/3 | 0 | 636.99 | 20.43 | 21900 MiB | 110.3 s |
| 160K | turbo4/turbo4 | 3/3 | 0 | 637.26 | 20.45 | 21900 MiB | 110.7 s |
| 192K | q8_0/q8_0 | 0/3 | 3 | n/a | n/a | 24122 MiB | 305.0 s |
| 192K | q8_0/turbo4 | 3/3 | 0 | 582.88 | 18.27 | 22930 MiB | 142.0 s |
| 192K | turbo4/turbo4 | 3/3 | 0 | 583.16 | 18.28 | 22928 MiB | 142.3 s |

## Run-level results

| run | context | KV K/V | status | PP tok/s | TG tok/s | peak VRAM | elapsed |
|---:|---:|---|---|---:|---:|---:|---:|
| 1 | 128K | q8_0/q8_0 | ok | 759.31 | 24.09 | 21986 MiB | 85 s |
| 1 | 128K | q8_0/turbo4 | ok | 754.50 | 22.80 | 20898 MiB | 84 s |
| 1 | 128K | turbo4/turbo4 | ok | 719.89 | 22.66 | 20914 MiB | 84 s |
| 1 | 160K | q8_0/q8_0 | ok | 642.67 | 21.98 | 23262 MiB | 110 s |
| 1 | 160K | q8_0/turbo4 | ok | 637.60 | 20.40 | 21900 MiB | 110 s |
| 1 | 160K | turbo4/turbo4 | ok | 637.84 | 20.50 | 21900 MiB | 111 s |
| 1 | 192K | q8_0/q8_0 | timeout | n/a | n/a | 24122 MiB | 305 s |
| 1 | 192K | q8_0/turbo4 | ok | 600.07 | 18.34 | 22928 MiB | 142 s |
| 1 | 192K | turbo4/turbo4 | ok | 575.41 | 18.35 | 22928 MiB | 143 s |
| 2 | 128K | q8_0/q8_0 | ok | 721.20 | 24.37 | 22004 MiB | 85 s |
| 2 | 128K | q8_0/turbo4 | ok | 716.74 | 22.74 | 20894 MiB | 84 s |
| 2 | 128K | turbo4/turbo4 | ok | 720.95 | 22.86 | 20914 MiB | 84 s |
| 2 | 160K | q8_0/q8_0 | ok | 642.57 | 22.11 | 23262 MiB | 110 s |
| 2 | 160K | q8_0/turbo4 | ok | 635.68 | 20.40 | 21900 MiB | 110 s |
| 2 | 160K | turbo4/turbo4 | ok | 635.87 | 20.58 | 21900 MiB | 111 s |
| 2 | 192K | q8_0/q8_0 | timeout | n/a | n/a | 24122 MiB | 305 s |
| 2 | 192K | q8_0/turbo4 | ok | 574.08 | 18.23 | 22928 MiB | 142 s |
| 2 | 192K | turbo4/turbo4 | ok | 574.97 | 18.25 | 22928 MiB | 142 s |
| 3 | 128K | q8_0/q8_0 | ok | 759.27 | 24.24 | 21986 MiB | 84 s |
| 3 | 128K | q8_0/turbo4 | ok | 719.45 | 22.53 | 20914 MiB | 84 s |
| 3 | 128K | turbo4/turbo4 | ok | 718.03 | 22.51 | 20914 MiB | 84 s |
| 3 | 160K | q8_0/q8_0 | ok | 593.16 | 21.95 | 23262 MiB | 110 s |
| 3 | 160K | q8_0/turbo4 | ok | 637.69 | 20.48 | 21900 MiB | 111 s |
| 3 | 160K | turbo4/turbo4 | ok | 638.06 | 20.26 | 21884 MiB | 110 s |
| 3 | 192K | q8_0/q8_0 | timeout | n/a | n/a | 24122 MiB | 305 s |
| 3 | 192K | q8_0/turbo4 | ok | 574.48 | 18.25 | 22930 MiB | 142 s |
| 3 | 192K | turbo4/turbo4 | ok | 599.09 | 18.23 | 22928 MiB | 142 s |

## Readout

- 128K and 160K completed for all layouts across all three runs.
- 192K `q8_0/q8_0` timed out in all three runs at about 24.1 GB peak VRAM.
- 192K `q8_0/turbo4` completed in all three runs at about 22.93 GB peak VRAM, with decode around 18.27 tok/s mean.
- 192K `turbo4/turbo4` completed in all three runs at about 22.93 GB peak VRAM, with decode around 18.28 tok/s mean.
- On this harness, the practical story is not speedup. The story is that TurboQuant KV turns the 192K 27B dense case from timeout into a completed run on a 4090.

## Practical interpretation

- `q8_0/q8_0` is comfortable at 128K, tight but usable at 160K, and impractical at 192K in this test.
- `q8_0/turbo4` and `turbo4/turbo4` keep 192K usable, but decode drops to about 18 tok/s.
- 272K raw context with this exact dense 27B setup is unlikely to be comfortable on a 24 GB 4090 without a smaller batch, a more compressed KV layout, model offload, or a model with smaller KV.

## Caveats

- This is still `llama-bench` synthetic depth, not a retrieval or quality benchmark.
- Single machine, one binary, one model file.
- No public claim should be made from this alone. The next step is retrieval/needle or longctx-svc evaluation on the 192K TurboQuant configuration.

## Artifacts

- `summary.jsonl`: one record per run.
- `summary.parsed.json`: aggregate and raw normalized records.
- `raw/*.json`: raw `llama-bench` outputs.
- `samples/*.vram.csv`: VRAM samples per cell.
- `boundary-clean-task.log`: runner log.
