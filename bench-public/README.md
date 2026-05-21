# Public benchmark packages

This directory is the public entry layer for `turboquant-cuda-bench`.

It contains only public-safe summaries, aggregate tables, sanitized JSON, and copied notes. Raw logs, private traces, operational scripts, and lab materials remain in their original folders.

This is a public index of receipts, **not a roadmap**.

<p>
  <img src="assets/github-entry-map.svg" alt="three public reading paths" width="860">
</p>

## Choose a question

| If you want to know... | Start here |
|---|---|
| What Phase 0 concludes about evidence placement | [`evidence-utilization/REALRAG-PHASE0-CLOSURE.md`](evidence-utilization/REALRAG-PHASE0-CLOSURE.md) |
| How Phase 1 starts without live intervention | [`telemetry index`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md) / [`v0`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md) / [`v0.1`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md) / [`v0.2`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md) / [`v0.3`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md) / [`v0.4`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md) / [`v0.5`](evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.5.md) |
| Why retrieved evidence still fails to close an answer | [`evidence-utilization/`](evidence-utilization/) |
| Whether the offline evidence-path layer is sealed and auditable | [`evidence-utilization/OFFLINE-MILESTONE-v1.9.md`](evidence-utilization/OFFLINE-MILESTONE-v1.9.md) |
| How KV/cache changes can preserve action while losing target identity | [`cask-kvfidelity-bridge/`](cask-kvfidelity-bridge/) |
| What the Evidence-Paged KV CUDA receipts do and do not claim | [`evidence-paged-kv/`](evidence-paged-kv/) |
| Whether the same decoy failures reproduce across stacks | [`vllm-cross-stack/`](vllm-cross-stack/) |

## Packages

| Package | What it shows | Start here |
|---|---|---|
| `evidence-utilization/` | Phase 0 public-dataset closure plus Phase 1 default-off telemetry replay bridge. | [`REALRAG-PHASE0-CLOSURE.md`](evidence-utilization/REALRAG-PHASE0-CLOSURE.md) |
| `vllm-cross-stack/` | vLLM vs llama.cpp cross-stack replay: 192K needles pass, decoy failures replicate, policy splice recovers. | [`decoy-replay-results.md`](vllm-cross-stack/decoy-replay-results.md) |
| `cask-kvfidelity-bridge/` | Action/target/source-rank split under FullKV, CASK, and TriAttention. | [`RESULTS.md`](cask-kvfidelity-bridge/RESULTS.md) |
| `kvfidelity/` | Paired action-trace evaluation for KV/cache changes, including v2 comparator, hold-out, and order-sensitivity notes. | [`kvfidelity-2026-05-07-summary.md`](kvfidelity/kvfidelity-2026-05-07-summary.md) |
| `evidence-paged-kv/` | CUDA kernel receipts v1→v7 for evidence-aware KV page access. v4 is the public receipt; v7 is the architecture direction. | [`RESULTS.md`](evidence-paged-kv/RESULTS.md) |
| `dashboard.html` | Static visual dashboard for the main numbers. | [`dashboard.html`](dashboard.html) |
| `assets/` | SVG cards/charts that GitHub can render directly in the README. | [`assets/`](assets/) |

## Visual assets

<p>
  <img src="assets/evidence-path-ledger-v19.svg" alt="evidence path ledger v1.9" width="860">
</p>

<p>
  <img src="assets/provenance-card-v19.svg" alt="provenance closure pass for v1.9" width="860">
</p>

| Chart | File |
|---|---|
| Rank closure | [`assets/evidence-rank-closure.svg`](assets/evidence-rank-closure.svg) |
| Distractor taxonomy | [`assets/distractor-taxonomy.svg`](assets/distractor-taxonomy.svg) |
| Needle 192K vs decoys | [`assets/needle-192k-vs-decoys.svg`](assets/needle-192k-vs-decoys.svg) |
| Decoy vs policy splice | [`assets/decoy-vs-policy-splice.svg`](assets/decoy-vs-policy-splice.svg) |
| CASK bridge fidelity | [`assets/cask-bridge-fidelity.svg`](assets/cask-bridge-fidelity.svg) |
| KVFidelity trace drift | [`assets/kvfidelity-trace-drift.svg`](assets/kvfidelity-trace-drift.svg) |
| Evidence-Paged KV kernel receipts | [`assets/evidence-paged-kv-kernel-receipts.svg`](assets/evidence-paged-kv-kernel-receipts.svg) |

## Boundary

This directory is not a leaderboard. It is a public index of receipts.

Use these files to understand the result shape, then follow links back to the full repo for protocols, scripts, caveats, and raw/lab provenance where appropriate.
