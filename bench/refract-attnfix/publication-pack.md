# Publication pack — REFRACT attn-fix final

**Status:** ready for Felipe review. No publication has been performed.

## Artifacts

- Final chart PNG: `/home/aya/implante/tmp/refract-attnfix-final-chart.png`
- Final table/analysis: `/home/aya/implante/tmp/refract-attnfix-final/refract-attnfix-final.md`
- Final CSV: `/home/aya/implante/tmp/refract-attnfix-final/refract-attnfix-final.csv`
- JSON copies: `/home/aya/implante/tmp/refract-attnfix-jsons/`

## Note on metric naming

For public posts, use **Axis A score** when comparing `GTM` vs `Trajectory`:

- GTM run: Axis A = GTM score.
- Trajectory run: Axis A = trajectory/path-preservation score, stored in the report as `composite_detail.gtm_score` because of current schema naming.
- Composite can be higher when KLD is high; for the sign-inversion argument, Axis A is the clearer number.

## Discord #benchmarks draft

```text
REFRACT attn-fix rerun complete on CUDA: 27B + 32B, SM86 + SM89, clean build with the attention fix (llama.cpp turboquant branch, commit 69d8e4be4).

Main finding: GTM and Trajectory diverge sharply when V-cache uses turbo3.

Axis A scores (higher is better):

27B Qwen3.6 Q4_K_M — 4090 SM89 / 3090 SM86 are stable within ~0.5 pts:
  q8/q8:         GTM 95.6–96.0  / Trajectory 83.5–84.4
  q8/turbo3:     GTM 91.0–91.3  / Trajectory 57.3–57.9
  turbo3/turbo3: GTM 89.2–89.7  / Trajectory 57.3–57.9

32B Qwen3 Q4_K_M — 3090 SM86:
  q8/q8:         GTM 93.9 / Trajectory 59.3
  q8/turbo3:     GTM 88.8 / Trajectory 25.0
  turbo3/turbo3: GTM 81.9 / Trajectory 25.0

KLD stays high for q8/turbo3 even when Trajectory fails (32B: KLD 97.54), so distribution closeness alone is not enough. KLD also starts to move at 32B turbo3/turbo3 (86.45).

Takeaway: GTM alone is permissive. Trajectory catches generation-path drift that token-match / scalar closeness can miss. The effect amplifies at scale: 32B q8/turbo3 is PASS under GTM but FAIL under Trajectory.

Hardware: RTX 4090 (SM89, CUDA 12.8) + RTX 3090 (SM86, CUDA 11.8)
Models: Qwen3.6-27B Q4_K_M + Qwen3-32B Q4_K_M
REFRACT v0.3.2.3, trajectory v0.1.4

Chart attached. JSONs/tables available if useful.
```

## GitHub discussion #20969 draft

```markdown
### REFRACT attn-fix rerun: 27B + 32B, SM86 + SM89

I reran the REFRACT GTM/Trajectory comparison after the attention fix, using a clean build from the turboquant branch (`69d8e4be4`).

**Hardware**
- RTX 4090 / SM89 / CUDA 12.8
- RTX 3090 / SM86 / CUDA 11.8

**Models**
- Qwen3.6-27B Q4_K_M
- Qwen3-32B Q4_K_M

The 27B result is stable cross-GPU: 4090 vs 3090 differs by <~0.5 pts in comparable cases.

#### Axis A scores: GTM vs Trajectory

| Model / GPU | Candidate | GTM | Trajectory | KLD in trajectory run |
|---|---:|---:|---:|---:|
| 27B / 4090 | q8/q8 | 95.65 | 84.39 | 99.61 |
| 27B / 4090 | q8/turbo3 | 90.99 | 57.93 | 98.87 |
| 27B / 4090 | turbo3/turbo3 | 89.16 | 57.93 | 98.28 |
| 27B / 3090 | q8/q8 | 95.96 | 83.49 | 99.58 |
| 27B / 3090 | q8/turbo3 | 91.27 | 57.33 | 99.05 |
| 27B / 3090 | turbo3/turbo3 | 89.68 | 57.33 | 98.29 |
| 32B / 3090 | q8/q8 | 93.87 | 59.32 | 99.44 |
| 32B / 3090 | q8/turbo3 | 88.83 | 24.95 | 97.54 |
| 32B / 3090 | turbo3/turbo3 | 81.88 | 24.95 | 86.45 |

The important part: **ctv=turbo3 preserves high GTM but collapses Trajectory**, and the effect gets much stronger at 32B.

- 27B q8/turbo3: GTM ~91, Trajectory ~58
- 32B q8/turbo3: GTM 88.83, Trajectory 24.95

KLD remains high for 32B q8/turbo3 (97.54), so distribution-level closeness does not imply path preservation. This supports the sign-inversion hypothesis: scalar closeness can look good while generation trajectory drifts.

Chart: attached.
```

## X reply draft

```text
Ran your sign-inversion hypothesis on CUDA after the attn fix.

27B: q8/turbo3 = GTM ~91, Traj ~58
32B: q8/turbo3 = GTM 88.8, Traj 25.0

KLD still 97.5 on 32B q8/turbo3, so scalar/distribution closeness is not enough.

Trajectory is the signal. GTM alone is permissive.
```

## Short X thread option

```text
1/ REFRACT attn-fix rerun complete on CUDA.

27B is stable cross-GPU (4090 SM89 vs 3090 SM86 within ~0.5 pts).

The important signal: GTM and Trajectory disagree hard when V-cache uses turbo3.
```

```text
2/ Axis A scores:

27B q8/turbo3: GTM ~91, Traj ~58
32B q8/turbo3: GTM 88.8, Traj 25.0

So GTM says pass/near-excellent while trajectory says degraded/fail.
```

```text
3/ KLD stays high for 32B q8/turbo3 (97.5), so distribution closeness alone is not enough.

Trajectory is catching path-preservation failure. The effect amplifies at scale.
```
