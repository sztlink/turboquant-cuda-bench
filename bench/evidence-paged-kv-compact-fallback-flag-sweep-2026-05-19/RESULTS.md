# Evidence-Paged KV Phase 2c.9 — compact fallback flag-rate sweep — 2026-05-19

> Offline partial-head crossover sweep for compact fallback policy. No serving mutation.

## Boundary

```txt
M: 65536
probe_local_top: 8
fallback_local_top: 32
global_k: 32
fixture: first N query heads get concentrated top-32 keys; remaining heads random
serving: no
```

## Results

| requested flagged heads | observed flagged heads | flag rate | max abs err | compact p50 ms | exact p50 ms | compact/exact p50 |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0 | 0.000 | 0.000153 | 0.3420 | 0.9708 | 0.352 |
| 1 | 4 | 0.143 | 0.000145 | 0.4577 | 0.9513 | 0.481 |
| 2 | 5 | 0.179 | 0.000145 | 0.4874 | 0.9492 | 0.513 |
| 4 | 7 | 0.250 | 0.000129 | 0.5816 | 0.9615 | 0.605 |
| 7 | 7 | 0.250 | 0.000160 | 0.5509 | 0.9503 | 0.580 |
| 14 | 14 | 0.500 | 0.000130 | 0.7741 | 0.9257 | 0.836 |
| 21 | 21 | 0.750 | 0.000145 | 0.9214 | 0.8896 | 1.036 |
| 28 | 28 | 1.000 | 0.000160 | 1.1299 | 0.8847 | 1.277 |

## Readout

- compact faster-than-exact cases: 6/8
- compact slower/equal cases: 2/8
- last faster observed flag count: 14/28 (ratio 0.836)
- first slower/equal observed flag count: 21/28 (ratio 1.036)
- This sweep measures offline policy crossover only; the fixture is synthetic and not prompt/model behavior.

Decision:

```txt
For this shape/fixture, compact fallback remains favorable through observed 14/28 flagged heads (~50%).
At observed 21/28 flagged heads (~75%), exact-only becomes slightly faster.
Candidate policy: if flagged_head_rate >= ~0.75, use exact-only; otherwise use compact fallback.
Before serving integration, validate this threshold on more shapes and sequence lengths.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
