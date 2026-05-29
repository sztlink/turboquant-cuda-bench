# REFRACT trajectory receipt: token match and KLD can miss path drift

> Public receipt for the dense-model REFRACT attn-fix rerun. This is a trajectory-level validation receipt, not a global KV-cache ranking.

## Claim

KV-cache compression claims measured only by KLD, BLEU, or token match are under-specified.

In this dense-model CUDA run, V-cache `turbo3` preserves high token-match style scores while the stricter REFRACT Trajectory path score collapses, especially at 32B. KLD remains high in the clearest failure case.

## Source method

REFRACT is Tom Turney's trajectory lens. Credit the metric/method to `@no_stp_on_snek`.

This repo's contribution here is independent CUDA validation and public synthesis of the metric split across:

```txt
GPU:      RTX 4090 SM89 and RTX 3090 SM86
Models:   Qwen3.6-27B Q4_K_M and Qwen3-32B Q4_K_M
Build:    llama.cpp turboquant branch with attention fix, commit 69d8e4be4
Lens:     REFRACT v0.3.2.3, trajectory v0.1.4
Source:   ../../bench/refract-attnfix/results.md
```

## Why the numbers below use two trajectory columns

REFRACT reports both:

- **GTM axis score:** permissive token-match style score.
- **Trajectory path score:** stricter generation-path preservation score.
- **Trajectory composite:** blended score that can be lifted by high KLD.

For public discussion of path drift, use **Trajectory path score**, not only the composite.

## Primary table

| model / GPU | KV candidate | GTM axis score | Trajectory path score | Trajectory composite | KLD in trajectory run | readout |
|---|---|---:|---:|---:|---:|---|
| 27B / 4090 | q8/q8 | 95.65 | 84.39 | 91.37 | 99.61 | reference stays excellent |
| 27B / 4090 | q8/turbo3 | 90.99 | 57.93 | 73.06 | 98.87 | token match high, path degraded |
| 27B / 4090 | turbo3/turbo3 | 89.16 | 57.93 | 72.89 | 98.28 | token match high, path degraded |
| 27B / 3090 | q8/q8 | 95.96 | 83.49 | 90.83 | 99.58 | reference stays excellent |
| 27B / 3090 | q8/turbo3 | 91.27 | 57.33 | 72.63 | 99.05 | token match high, path degraded |
| 27B / 3090 | turbo3/turbo3 | 89.68 | 57.33 | 72.42 | 98.29 | token match high, path degraded |
| 32B / 3090 | q8/q8 | 93.87 | 59.32 | 74.31 | 99.44 | reference itself becomes harder |
| 32B / 3090 | q8/turbo3 | 88.83 | 24.95 | 39.73 | 97.54 | high token match, path failure |
| 32B / 3090 | turbo3/turbo3 | 81.88 | 24.95 | 38.72 | 86.45 | token match lower, path failure |

## Short readout

The clearest public example is 32B / 3090 / `q8/turbo3`:

```txt
GTM token-match axis:        88.83
Trajectory path score:       24.95
Trajectory composite:        39.73
KLD in trajectory run:       97.54
```

So the honest post wording is:

```txt
GTM 88.8 -> Trajectory path 25.0, while KLD stays 97.5.
```

If using the trajectory composite instead, say:

```txt
GTM 88.8 -> Trajectory composite 39.7, with path score 25.0 and KLD 97.5.
```

Do not collapse these into a single unnamed `trajectory` number.

## Cross-GPU sanity

The 27B case was rerun on both 4090 SM89 and 3090 SM86. Comparable scores are stable within about half a point:

```txt
27B q8/turbo3
4090: GTM 90.99, Trajectory path 57.93, composite 73.06, KLD 98.87
3090: GTM 91.27, Trajectory path 57.33, composite 72.63, KLD 99.05
```

This supports reading the metric split as a model/runtime behavior, not a single-GPU artifact.

## What this supports

```txt
1. KLD and token-match can remain high while generation path preservation fails.
2. `ctv=turbo3` is the suspicious axis in this dense-model REFRACT run.
3. The effect is stronger at 32B than at 27B in this receipt.
4. REFRACT Trajectory adds useful coverage beyond KLD and GTM/token match.
```

## What this does not claim

```txt
- Not a universal rule for all dense models.
- Not a claim that turbo3 is globally bad.
- Not a claim that REFRACT Trajectory bands equal downstream task accuracy.
- Not a claim about hybrid/MoE q4_0 behavior. That run has a different fragile-axis shape.
- Not a production serving benchmark.
- Not a claim that KLD is useless. The claim is that KLD alone is incomplete.
```

## Good X wording

```txt
Dense 32B, RTX 3090, q8 K / turbo3 V:

GTM token-match: 88.8
Trajectory path: 25.0
KLD: 97.5

KLD/token-match can miss path drift. "Lossless" needs a trajectory axis.
```

Boundary to include in the same thread:

```txt
This is not a universal rule for all dense models. The fragile axis depends on architecture, quant scheme, and metric family.
```

## Pointers

- Full source artifact: [`../../bench/refract-attnfix/results.md`](../../bench/refract-attnfix/results.md)
- Technical map: [`../../TECHNICAL-FINDINGS.md`](../../TECHNICAL-FINDINGS.md)
- Artifact status map: [`../../bench/MANIFEST.md`](../../bench/MANIFEST.md)
