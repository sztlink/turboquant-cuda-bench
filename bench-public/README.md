# Public benchmark packages

This directory is the public entry layer for `turboquant-cuda-bench`.

It contains only public-safe summaries, aggregate tables, sanitized JSON, and copied notes. Raw logs, private traces, operational scripts, and lab materials remain in their original folders.

## Packages

| Package | What it shows | Start here |
|---|---|---|
| `evidence-utilization/` | Retrieved evidence can fail to become the final answer. Rank, decoys-before, and distractor type dominate closure. | [`RESULTS.md`](evidence-utilization/RESULTS.md) |
| `vllm-cross-stack/` | vLLM vs llama.cpp cross-stack replay: 192K needles pass, decoy failures replicate, policy splice recovers. | [`decoy-replay-results.md`](vllm-cross-stack/decoy-replay-results.md) |
| `cask-kvfidelity-bridge/` | Action/target/source-rank split under FullKV, CASK, and TriAttention. | [`RESULTS.md`](cask-kvfidelity-bridge/RESULTS.md) |
| `kvfidelity/` | Paired action-trace evaluation for KV/cache changes, including v2 comparator, hold-out, and order-sensitivity notes. | [`kvfidelity-2026-05-07-summary.md`](kvfidelity/kvfidelity-2026-05-07-summary.md) |
| `dashboard.html` | Static visual dashboard for the main numbers. | [`dashboard.html`](dashboard.html) |

## Boundary

This directory is not a leaderboard. It is a public index of receipts.

Use these files to understand the result shape, then follow links back to the full repo for protocols, scripts, caveats, and raw/lab provenance where appropriate.
