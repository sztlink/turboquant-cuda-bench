# RealRAG Machine-Only Reality Check

> Automatic exact-answer benchmark only. No human adjudication.

total: 500

## Results

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.018 | 0.032 | 0.037 |
| strong | 0.172 | 0.288 | 0.285 |
| path_prompt | 0.216 | 0.306 | 0.324 |
| rerank | 0.212 | 0.308 | 0.322 |
| gated_rerank_v1 | 0.216 | 0.304 | 0.323 |

## Paired test: `gated_rerank_v1` vs `path_prompt`

```json
{
  "base": "path_prompt",
  "test": "gated_rerank_v1",
  "wins": 2,
  "losses": 2,
  "ties": 496,
  "discordant": 4,
  "binom_p_two_sided": 1.0
}
```

## Bootstrap 95% CI for metric deltas

| metric | mean delta | 95% CI |
|---|---:|---:|
| em | 0.000 | [-0.008, 0.008] |
| contains | -0.002 | [-0.012, 0.006] |
| f1 | -0.000 | [-0.007, 0.007] |

## Interpretation boundary

This report can support a machine-only quality delta claim on this slice. It cannot support human acceptability, general RAG dominance, or production readiness.
