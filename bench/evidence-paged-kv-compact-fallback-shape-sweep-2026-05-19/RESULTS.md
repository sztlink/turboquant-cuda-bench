# Evidence-Paged KV Phase 2c.10 — compact fallback shape sweep — 2026-05-19

> Offline multi-shape validation of tentative flag-rate policy. No serving mutation.

## Boundary

```txt
M values: [8192, 16384, 32768, 65536]
probe_local_top: 8
fallback_local_top: 32
global_k: 32
policy under test: exact-only if flagged_head_rate >= 0.75
fixture: first N query heads get concentrated top-32 keys; remaining heads random
serving: no
```

## Results

| M | observed flags | flag rate | max abs err | compact p50 ms | exact p50 ms | compact/exact | policy | p50 best | match |
|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| 8192 | 0 | 0.000 | 0.000145 | 0.2911 | 0.1987 | 1.465 | compact_fallback | exact_only | no |
| 8192 | 7 | 0.250 | 0.000137 | 0.1679 | 0.2017 | 0.832 | compact_fallback | compact_fallback | yes |
| 8192 | 14 | 0.500 | 0.000152 | 0.1731 | 0.1718 | 1.007 | compact_fallback | exact_only | no |
| 8192 | 21 | 0.750 | 0.000129 | 0.1883 | 0.1710 | 1.101 | exact_only | exact_only | yes |
| 8192 | 28 | 1.000 | 0.000175 | 0.2263 | 0.1763 | 1.284 | exact_only | exact_only | yes |
| 16384 | 0 | 0.000 | 0.000145 | 0.1482 | 0.2781 | 0.533 | compact_fallback | compact_fallback | yes |
| 16384 | 7 | 0.250 | 0.000145 | 0.1884 | 0.2784 | 0.677 | compact_fallback | compact_fallback | yes |
| 16384 | 14 | 0.500 | 0.000160 | 0.2540 | 0.2772 | 0.916 | compact_fallback | compact_fallback | yes |
| 16384 | 21 | 0.750 | 0.000161 | 0.3101 | 0.2754 | 1.126 | exact_only | exact_only | yes |
| 16384 | 28 | 1.000 | 0.000137 | 0.3571 | 0.2765 | 1.292 | exact_only | exact_only | yes |
| 32768 | 0 | 0.000 | 0.000137 | 0.3973 | 0.8991 | 0.442 | compact_fallback | compact_fallback | yes |
| 32768 | 7 | 0.250 | 0.000137 | 0.5917 | 0.8960 | 0.660 | compact_fallback | compact_fallback | yes |
| 32768 | 14 | 0.500 | 0.000130 | 0.7803 | 0.9011 | 0.866 | compact_fallback | compact_fallback | yes |
| 32768 | 21 | 0.750 | 0.000145 | 0.7025 | 0.6245 | 1.125 | exact_only | exact_only | yes |
| 32768 | 28 | 1.000 | 0.000138 | 0.8079 | 0.6246 | 1.293 | exact_only | exact_only | yes |
| 65536 | 0 | 0.000 | 0.000145 | 0.4413 | 1.1776 | 0.375 | compact_fallback | compact_fallback | yes |
| 65536 | 7 | 0.250 | 0.000122 | 0.5149 | 0.8878 | 0.580 | compact_fallback | compact_fallback | yes |
| 65536 | 14 | 0.500 | 0.000145 | 0.7241 | 0.8868 | 0.817 | compact_fallback | compact_fallback | yes |
| 65536 | 21 | 0.750 | 0.000129 | 0.9257 | 0.8858 | 1.045 | exact_only | exact_only | yes |
| 65536 | 28 | 1.000 | 0.000130 | 1.1260 | 0.8854 | 1.272 | exact_only | exact_only | yes |

## Readout

- threshold policy matches p50 best in 18/20 synthetic cases;
- compact path remains favorable for low/mid flag rates;
- exact-only wins when most/all heads are flagged, especially at larger M;
- this validates the threshold direction, not a final serving policy;
- short-context case `M=8192` is noisier/shape-sensitive: exact-only won at 0 flags and was effectively tied at 14 flags.

Decision:

```txt
The 0.75 flag-rate exact-only threshold generalizes directionally across M=16K..65K in this synthetic sweep.
For small M (~8K), compact overhead can erase benefits; policy likely needs a sequence-length guard in addition to flag-rate.
Candidate policy v0:
  if M <= 8192: exact-only or measured fallback disabled
  else if flagged_head_rate >= 0.75: exact-only
  else: compact fallback
Do not install into serving before a broader grid and runtime integration plan.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
