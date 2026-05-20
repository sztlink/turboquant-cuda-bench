# Public visual assets

Static SVG cards and charts for the public entry layer. These are generated from the numbers summarized in `README.md`, `KEY-FINDINGS.md`, and `bench-public/*`.

Regenerate legacy metric cards from the repo root:

```bash
node 07-scripts/generate-public-assets.mjs
```

Regenerate the GitHub-native light editorial layer:

```bash
node 07-scripts/generate-github-visual-system.mjs
```

## Files

| File | Use |
|---|---|
| `github-hero-evidence-path.svg` | GitHub README hero using the light editorial evidence-path system. |
| `evidence-path-ledger-v19.svg` | Validator-first process diagram: 178 → 16 → 13 + 3 → 22. |
| `github-entry-map.svg` | Three-path repo reading map. |
| `boundary-seal-v19.svg` | Offline milestone boundary seal. |
| `claims-and-constraints-v19.svg` | Honesty plate separating claims from non-claims. |
| `provenance-card-v19.svg` | Provenance closure PASS plate. |
| `milestone-seal-inline-v19.svg` | Small inline milestone seal for README/status rows. |
| `hero-retrieved-not-used.svg` | Legacy social/card image for the repo thesis. |
| `evidence-rank-closure.svg` | Closure by canonical rank in the distractor taxonomy sweep. |
| `distractor-taxonomy.svg` | Closure by distractor type. |
| `needle-192k-vs-decoys.svg` | Needle retrieval vs decoy answer-closure split. |
| `decoy-vs-policy-splice.svg` | Cross-stack decoy replay and policy-splice recovery. |
| `cask-bridge-fidelity.svg` | CASK x KVFidelity action/target/rank split. |
| `kvfidelity-trace-drift.svg` | Early paired trace drift diagnostic. |
| `evidence-paged-kv-kernel-receipts.svg` | Evidence-Paged KV kernel receipts v1→v7: public receipt, throughput path, and architecture direction. |

Boundary: these are public-facing summaries, not raw evidence.
