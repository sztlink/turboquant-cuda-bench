# REFRACT attn-fix final — 27B + 32B GTM vs Trajectory

- Captured: 2026-05-05T23:24:23.865Z
- 3090 source: `felipe-pc:C:\turbo-build\attnfix-*.json`
- 4090 source: `4090:C:\turbo-build\4090-*.json`
- Local JSON copies: `/home/aya/implante/tmp/refract-attnfix-jsons/`

## Readout

The attn-fix rerun is complete. The 27B result is stable across 3090 and 4090 (all comparable composites within ~0.5 pts). The 32B result confirms the important behavior: **GTM is permissive; Trajectory is much stricter and exposes TurboQuant drift, especially when V-cache uses turbo3.**

On 32B, q8/q8 is still EXCELLENT under GTM (93.87) but drops to DEGRADED under Trajectory (74.31 composite; 59.32 path score). q8/turbo3 and turbo3/turbo3 are PASS under GTM (88.83 / 81.88) but FAIL under Trajectory (39.73 / 38.72 composite; 24.95 path score for both).

Note on score wording: the tables below report REFRACT composite scores plus component columns. Public summaries may cite the stricter Trajectory path score (the path-preservation score inside the Trajectory composite) when discussing path preservation, because the composite can be lifted by high KLD even after the generated path has diverged.

## Primary scores — 3090 27B + 32B

| System | Axis | Quant | Composite | Band | GTM | KLD | Full match | Median divergence | Mean prefix |
|---|---|---:|---:|---|---:|---:|---:|---:|---:|
| 3090 27B | GTM | q8/q8 | 95.96 | EXCELLENT | 95.96 | — | 80.0% | 245.5 | 285.1 |
| 3090 27B | Trajectory | q8/q8 | 90.83 | EXCELLENT | 83.49 | 99.58 | 73.3% | 44 | 86.7 |
| 3090 27B | GTM | q8/turbo3 | 91.27 | EXCELLENT | 91.27 | — | 63.3% | 248 | 271.8 |
| 3090 27B | Trajectory | q8/turbo3 | 72.63 | DEGRADED | 57.33 | 99.05 | 36.7% | 49 | 60.6 |
| 3090 27B | GTM | turbo3/turbo3 | 89.68 | PASS | 89.68 | — | 50.0% | 243 | 266.5 |
| 3090 27B | Trajectory | turbo3/turbo3 | 72.42 | DEGRADED | 57.33 | 98.29 | 36.7% | 49 | 60.6 |
| 3090 32B | GTM | q8/q8 | 93.87 | EXCELLENT | 93.87 | — | 73.3% | 239 | 257.8 |
| 3090 32B | Trajectory | q8/q8 | 74.31 | DEGRADED | 59.32 | 99.44 | 40.0% | 33.5 | 75.9 |
| 3090 32B | GTM | q8/turbo3 | 88.83 | PASS | 88.83 | — | 40.0% | 221 | 245.3 |
| 3090 32B | Trajectory | q8/turbo3 | 39.73 | FAIL | 24.95 | 97.54 | 3.3% | 22 | 31.3 |
| 3090 32B | GTM | turbo3/turbo3 | 81.88 | PASS | 81.88 | — | 26.7% | 219.5 | 220.7 |
| 3090 32B | Trajectory | turbo3/turbo3 | 38.72 | FAIL | 24.95 | 86.45 | 3.3% | 22 | 31.3 |

## Cross-GPU sanity — 4090 27B included

| System | Axis | Quant | Composite | Band | GTM | KLD | Full match | Median divergence | Mean prefix |
|---|---|---:|---:|---|---:|---:|---:|---:|---:|
| 3090 27B | GTM | q8/q8 | 95.96 | EXCELLENT | 95.96 | — | 80.0% | 245.5 | 285.1 |
| 3090 27B | Trajectory | q8/q8 | 90.83 | EXCELLENT | 83.49 | 99.58 | 73.3% | 44 | 86.7 |
| 3090 27B | GTM | q8/turbo3 | 91.27 | EXCELLENT | 91.27 | — | 63.3% | 248 | 271.8 |
| 3090 27B | Trajectory | q8/turbo3 | 72.63 | DEGRADED | 57.33 | 99.05 | 36.7% | 49 | 60.6 |
| 3090 27B | GTM | turbo3/turbo3 | 89.68 | PASS | 89.68 | — | 50.0% | 243 | 266.5 |
| 3090 27B | Trajectory | turbo3/turbo3 | 72.42 | DEGRADED | 57.33 | 98.29 | 36.7% | 49 | 60.6 |
| 4090 27B | GTM | q8/q8 | 95.65 | EXCELLENT | 95.65 | — | 83.3% | 227 | 283.9 |
| 4090 27B | Trajectory | q8/q8 | 91.37 | EXCELLENT | 84.39 | 99.61 | 73.3% | 63.5 | 87.4 |
| 4090 27B | GTM | q8/turbo3 | 90.99 | EXCELLENT | 90.99 | — | 50.0% | 252 | 270.6 |
| 4090 27B | Trajectory | q8/turbo3 | 73.06 | DEGRADED | 57.93 | 98.87 | 46.7% | 23 | 60.0 |
| 4090 27B | GTM | turbo3/turbo3 | 89.16 | PASS | 89.16 | — | 40.0% | 252.5 | 265.7 |
| 4090 27B | Trajectory | turbo3/turbo3 | 72.89 | DEGRADED | 57.93 | 98.28 | 46.7% | 23 | 60.0 |
| 3090 32B | GTM | q8/q8 | 93.87 | EXCELLENT | 93.87 | — | 73.3% | 239 | 257.8 |
| 3090 32B | Trajectory | q8/q8 | 74.31 | DEGRADED | 59.32 | 99.44 | 40.0% | 33.5 | 75.9 |
| 3090 32B | GTM | q8/turbo3 | 88.83 | PASS | 88.83 | — | 40.0% | 221 | 245.3 |
| 3090 32B | Trajectory | q8/turbo3 | 39.73 | FAIL | 24.95 | 97.54 | 3.3% | 22 | 31.3 |
| 3090 32B | GTM | turbo3/turbo3 | 81.88 | PASS | 81.88 | — | 26.7% | 219.5 | 220.7 |
| 3090 32B | Trajectory | turbo3/turbo3 | 38.72 | FAIL | 24.95 | 86.45 | 3.3% | 22 | 31.3 |

## GTM → Trajectory gap

- 3090 27B q8/q8: GTM 95.96 → Trajectory 90.83 (-5.13 pts)
- 3090 27B q8/turbo3: GTM 91.27 → Trajectory 72.63 (-18.64 pts)
- 3090 27B turbo3/turbo3: GTM 89.68 → Trajectory 72.42 (-17.26 pts)
- 3090 32B q8/q8: GTM 93.87 → Trajectory 74.31 (-19.56 pts)
- 3090 32B q8/turbo3: GTM 88.83 → Trajectory 39.73 (-49.10 pts)
- 3090 32B turbo3/turbo3: GTM 81.88 → Trajectory 38.72 (-43.16 pts)

## 27B → 32B Trajectory scaling

- Trajectory q8/q8: 27B 90.83 → 32B 74.31 (-16.52 pts)
- Trajectory q8/turbo3: 27B 72.63 → 32B 39.73 (-32.89 pts)
- Trajectory turbo3/turbo3: 27B 72.42 → 32B 38.72 (-33.70 pts)

## Interpretation

- The attn-fix stabilized/reproduced the benchmark; this is not a flaky hardware artifact.
- KLD stays high for q8/turbo3 even when Trajectory fails, so distribution similarity alone is not enough.
- V-cache turbo3 remains the suspicious axis: trajectory collapses when ctv=turbo3, and 32B amplifies the failure.
- REFRACT Trajectory is the useful detector: it catches generation-path drift that GTM/KLD can understate.

## Artifact paths

- Markdown: `/home/aya/implante/tmp/refract-attnfix-final/refract-attnfix-final.md`
- CSV: `/home/aya/implante/tmp/refract-attnfix-final/refract-attnfix-final.csv`
- SVG chart: `/home/aya/implante/tmp/refract-attnfix-final/refract-attnfix-final.svg`
- Waffle House draft: `/home/aya/implante/tmp/refract-attnfix-final/waffle-house-post.md`
