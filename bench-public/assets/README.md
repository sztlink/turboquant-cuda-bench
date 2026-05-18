# Public visual assets

Static SVG cards and charts for the public entry layer. These are generated from the numbers summarized in `README.md`, `KEY-FINDINGS.md`, and `bench-public/*`.

Regenerate from the repo root:

```bash
node 07-scripts/generate-public-assets.mjs
```

## Files

| File | Use |
|---|---|
| `hero-retrieved-not-used.svg` | Social/card image for the repo thesis. |
| `evidence-rank-closure.svg` | Closure by canonical rank in the distractor taxonomy sweep. |
| `distractor-taxonomy.svg` | Closure by distractor type. |
| `needle-192k-vs-decoys.svg` | Needle retrieval vs decoy answer-closure split. |
| `decoy-vs-policy-splice.svg` | Cross-stack decoy replay and policy-splice recovery. |
| `cask-bridge-fidelity.svg` | CASK x KVFidelity action/target/rank split. |
| `kvfidelity-trace-drift.svg` | Early paired trace drift diagnostic. |

Boundary: these are public-facing summaries, not raw evidence.
