# Needle retrieval, 4090, Qwen3.6 27B dense

Date: 2026-05-10.

Purpose: after the fit/throughput boundary showed 192K failing with `q8_0/q8_0` and completing with TurboQuant KV, this run checks whether the completed long-context prompts can retrieve a hidden code.

## Setup

- GPU: RTX 4090, 24 GB.
- Model: `C:\models\q36_27b_new.gguf`, Qwen3.6 27B dense Q4_K_M.
- Binary: `llama-completion.exe` from TheTom llama-cpp-turboquant build.
- Command shape: `-ngl 99 -fa 1 -c <ctx> -f <prompt> -n 256 --temp 0 --seed 42 --no-display-prompt --no-conversation --simple-io --no-warmup --perf`.
- Prompts: synthetic archive with one `NEEDLE_CODE` hidden at 5%, 25%, 50%, 75%, or 95% of the prompt.
- Hit criterion: generated stdout contains the exact expected code.

## Aggregate results

| context | KV K/V | hits/ok | ok/runs | timeouts | prompt toks mean | prefill tok/s mean | decode tok/s mean | peak VRAM max | KV buffer |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 128K | q8_0/q8_0 | 5/5 | 5/5 | 0 | 119132 | 1920.10 | 26.59 | 21906 MiB | 4352 MiB |
| 128K | q8_0/turbo4 | 5/5 | 5/5 | 0 | 119132 | 1904.57 | 23.80 | 20812 MiB | 3264 MiB |
| 160K | q8_0/q8_0 | 5/5 | 5/5 | 0 | 153132 | 1730.02 | 23.97 | 23192 MiB | 5440 MiB |
| 160K | q8_0/turbo4 | 5/5 | 5/5 | 0 | 153132 | 1722.76 | 21.29 | 21830 MiB | 4080 MiB |
| 192K | q8_0/q8_0 | 0/0 | 0/5 | 5 | n/a | n/a | n/a | 24122 MiB | n/a MiB |
| 192K | q8_0/turbo4 | 5/5 | 5/5 | 0 | 183732 | 1592.46 | 18.95 | 22902 MiB | 4896 MiB |
| 192K | turbo4/turbo4 | 5/5 | 5/5 | 0 | 183732 | 1584.11 | 19.04 | 22902 MiB | 4896 MiB |

## Position-level results

| context | pos | KV K/V | status | hit | prompt toks | prefill tok/s | decode tok/s | peak VRAM | elapsed | answer excerpt |
|---:|---:|---|---|---:|---:|---:|---:|---:|---:|---|
| 128K | p05 | q8_0/q8_0 | ok | yes | 119132 | 1938.30 | 26.72 | 21906 MiB | 71 s | <think>  </think>  AYA-128K-p05-K050-Z9 [end of text] |
| 128K | p05 | q8_0/turbo4 | ok | yes | 119132 | 1908.32 | 23.82 | 20812 MiB | 82 s | <think>  </think>  AYA-128K-p05-K050-Z9 [end of text] |
| 128K | p25 | q8_0/q8_0 | ok | yes | 119132 | 1919.92 | 26.64 | 21900 MiB | 82 s | <think>  </think>  AYA-128K-p25-K250-Z9 [end of text] |
| 128K | p25 | q8_0/turbo4 | ok | yes | 119132 | 1902.82 | 23.89 | 20812 MiB | 82 s | <think>  </think>  AYA-128K-p25-K250-Z9 [end of text] |
| 128K | p50 | q8_0/q8_0 | ok | yes | 119132 | 1916.30 | 26.63 | 21900 MiB | 82 s | <think>  </think>  AYA-128K-p50-K500-Z9 [end of text] |
| 128K | p50 | q8_0/turbo4 | ok | yes | 119132 | 1903.97 | 23.79 | 20810 MiB | 82 s | <think>  </think>  AYA-128K-p50-K500-Z9 [end of text] |
| 128K | p75 | q8_0/q8_0 | ok | yes | 119132 | 1909.74 | 26.52 | 21900 MiB | 82 s | <think>  </think>  AYA-128K-p75-K750-Z9 [end of text] |
| 128K | p75 | q8_0/turbo4 | ok | yes | 119132 | 1904.21 | 23.81 | 20812 MiB | 82 s | <think>  </think>  AYA-128K-p75-K750-Z9 [end of text] |
| 128K | p95 | q8_0/q8_0 | ok | yes | 119132 | 1916.25 | 26.43 | 21904 MiB | 82 s | <think>  </think>  AYA-128K-p95-K950-Z9 [end of text] |
| 128K | p95 | q8_0/turbo4 | ok | yes | 119132 | 1903.54 | 23.71 | 20812 MiB | 82 s | <think>  </think>  AYA-128K-p95-K950-Z9 [end of text] |
| 160K | p05 | q8_0/q8_0 | ok | yes | 153132 | 1731.83 | 24.13 | 23192 MiB | 103 s | <think>  </think>  AYA-160K-p05-K050-Z9 [end of text] |
| 160K | p05 | q8_0/turbo4 | ok | yes | 153132 | 1723.55 | 21.27 | 21830 MiB | 103 s | <think>  </think>  AYA-160K-p05-K050-Z9 [end of text] |
| 160K | p25 | q8_0/q8_0 | ok | yes | 153132 | 1729.56 | 23.98 | 23192 MiB | 103 s | <think>  </think>  AYA-160K-p25-K250-Z9 [end of text] |
| 160K | p25 | q8_0/turbo4 | ok | yes | 153132 | 1721.89 | 21.36 | 21830 MiB | 103 s | <think>  </think>  AYA-160K-p25-K250-Z9 [end of text] |
| 160K | p50 | q8_0/q8_0 | ok | yes | 153132 | 1729.55 | 23.96 | 23192 MiB | 103 s | <think>  </think>  AYA-160K-p50-K500-Z9 [end of text] |
| 160K | p50 | q8_0/turbo4 | ok | yes | 153132 | 1722.02 | 21.25 | 21830 MiB | 103 s | <think>  </think>  AYA-160K-p50-K500-Z9 [end of text] |
| 160K | p75 | q8_0/q8_0 | ok | yes | 153132 | 1728.98 | 23.96 | 23192 MiB | 103 s | <think>  </think>  AYA-160K-p75-K750-Z9 [end of text] |
| 160K | p75 | q8_0/turbo4 | ok | yes | 153132 | 1723.08 | 21.26 | 21830 MiB | 103 s | <think>  </think>  AYA-160K-p75-K750-Z9 [end of text] |
| 160K | p95 | q8_0/q8_0 | ok | yes | 153132 | 1730.16 | 23.82 | 23192 MiB | 103 s | <think>  </think>  AYA-160K-p95-K950-Z9 [end of text] |
| 160K | p95 | q8_0/turbo4 | ok | yes | 153132 | 1723.25 | 21.32 | 21830 MiB | 103 s | <think>  </think>  AYA-160K-p95-K950-Z9 [end of text] |
| 192K | p05 | q8_0/q8_0 | timeout | no | n/a | n/a | n/a | 24122 MiB | 605 s |  |
| 192K | p05 | q8_0/turbo4 | ok | yes | 183732 | 1589.20 | 19.19 | 22902 MiB | 134 s | <think>  </think>  AYA-192K-p05-K050-Z9 [end of text] |
| 192K | p05 | turbo4/turbo4 | ok | yes | 183732 | 1584.55 | 19.23 | 22902 MiB | 133 s | <think>  </think>  AYA-192K-p05-K050-Z9 [end of text] |
| 192K | p25 | q8_0/q8_0 | timeout | no | n/a | n/a | n/a | 24122 MiB | 605 s |  |
| 192K | p25 | q8_0/turbo4 | ok | yes | 183732 | 1593.28 | 19.11 | 22902 MiB | 134 s | <think>  </think>  AYA-192K-p25-K250-Z9 [end of text] |
| 192K | p25 | turbo4/turbo4 | ok | yes | 183732 | 1586.05 | 18.91 | 22902 MiB | 133 s | <think>  </think>  AYA-192K-p25-K250-Z9 [end of text] |
| 192K | p50 | q8_0/q8_0 | timeout | no | n/a | n/a | n/a | 24122 MiB | 605 s |  |
| 192K | p50 | q8_0/turbo4 | ok | yes | 183732 | 1593.86 | 18.67 | 22902 MiB | 133 s | <think>  </think>  AYA-192K-p50-K500-Z9 [end of text] |
| 192K | p50 | turbo4/turbo4 | ok | yes | 183732 | 1582.57 | 19.11 | 22880 MiB | 133 s | <think>  </think>  AYA-192K-p50-K500-Z9 [end of text] |
| 192K | p75 | q8_0/q8_0 | timeout | no | n/a | n/a | n/a | 24122 MiB | 606 s |  |
| 192K | p75 | q8_0/turbo4 | ok | yes | 183732 | 1594.82 | 18.86 | 22902 MiB | 133 s | <think>  </think>  AYA-192K-p75-K750-Z9 [end of text] |
| 192K | p75 | turbo4/turbo4 | ok | yes | 183732 | 1582.59 | 18.91 | 22902 MiB | 133 s | <think>  </think>  AYA-192K-p75-K750-Z9 [end of text] |
| 192K | p95 | q8_0/q8_0 | timeout | no | n/a | n/a | n/a | 24122 MiB | 606 s |  |
| 192K | p95 | q8_0/turbo4 | ok | yes | 183732 | 1591.14 | 18.94 | 22902 MiB | 133 s | <think>  </think>  AYA-192K-p95-K950-Z9 [end of text] |
| 192K | p95 | turbo4/turbo4 | ok | yes | 183732 | 1584.77 | 19.05 | 22880 MiB | 133 s | <think>  </think>  AYA-192K-p95-K950-Z9 [end of text] |

## Readout

- 128K and 160K retrieval succeeded for all tested positions in both `q8_0/q8_0` and `q8_0/turbo4`.
- 192K `q8_0/q8_0` timed out in all five positions, matching the earlier fit boundary.
- 192K `q8_0/turbo4` succeeded in all five positions.
- 192K `turbo4/turbo4` succeeded in all five positions.
- This is the first private end-to-end signal that the 192K TurboQuant configuration does not merely allocate. It can retrieve a simple hidden needle across the prompt.

## Caveats

- Synthetic single-needle task. This does not prove broad reasoning quality.
- The hit criterion is exact-string retrieval, not multi-hop reasoning.
- Prompt generation uses repetitive filler, so this is easier than messy real documents.
- Still private. Do not post publicly from this without a cleaner writeup and approval.

## Next step

Use `q8_0/turbo4 @ 192K` as the stable base for a `longctx-svc` test: feed a corpus larger than the raw context, let longctx select chunks, and measure whether the answer remains correct while sending less than the full corpus to the model.

## Artifacts

- `summary.jsonl`: runner records.
- `summary.parsed.json`: normalized records with parsed perf.
- `raw/*.stdout.log`: generated answers.
- `raw/*.stderr.log`: llama.cpp logs and perf.
- `samples/*.vram.csv`: GPU memory samples.
- `prompts/*.txt`: generated synthetic prompts.
