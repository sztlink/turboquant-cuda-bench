# Evidence-Paged KV Phase 2c.5 — GPU overflow detector — 2026-05-19

> Offline GPU detector for adaptive local-overflow fallback. No serving mutation.

## Boundary

```txt
probe_local_top: 8
fallback_local_top: 32
global_k: 32
detector: Triton per-head local-tail-vs-global-threshold flag
serving: no
```

## Results

| scenario | M rows | overflow | flag heads | probe recall | adaptive recall | probe max err | adaptive max err | detector p50 ms | probe full p50 | exact full p50 | adaptive est p50 |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 8192 | False | 0 | 1.000 | 1.000 | 0.000141 | 0.000141 | 0.0307 | 0.1014 | 0.1759 | 0.1321 |
| random | 65536 | False | 0 | 1.000 | 1.000 | 0.000178 | 0.000178 | 0.0317 | 0.2980 | 0.9759 | 0.3297 |
| one_chunk_32 | 8192 | True | 28 | 0.250 | 1.000 | 0.757046 | 0.000099 | 0.0352 | 0.1055 | 0.1904 | 0.2256 |
| one_chunk_32 | 65536 | True | 28 | 0.250 | 1.000 | 0.716724 | 0.000107 | 0.0326 | 0.2949 | 0.9442 | 0.9767 |
| two_chunks_16_16 | 8192 | True | 28 | 0.500 | 1.000 | 0.571648 | 0.000115 | 0.0307 | 0.1052 | 0.1700 | 0.2007 |
| two_chunks_16_16 | 65536 | True | 28 | 0.500 | 1.000 | 0.461250 | 0.000122 | 0.0225 | 0.2970 | 0.9444 | 0.9669 |
| spread_32_chunks | 8192 | False | 0 | 1.000 | 1.000 | 0.000128 | 0.000128 | 0.0307 | 0.1052 | 0.2036 | 0.1360 |
| spread_32_chunks | 65536 | False | 0 | 1.000 | 1.000 | 0.000115 | 0.000115 | 0.0225 | 0.2980 | 0.9479 | 0.3205 |

## Readout

- accepted probe cases: 4/8
- fallback exact cases: 4/8
- GPU detector replaces the previous Torch/CPU policy detector for this fixture;
- adversarial concentrated cases are flagged and recovered via fallback;
- random/spread cases are accepted when no local tail threatens the threshold.

Detector timing:

```txt
Triton detector p50: ~0.0225–0.0352 ms
previous Torch/CPU detector wall: ~0.39–0.42 ms
```

The detector is now cheap enough to be plausible as part of an offline fused path. It still emits a coarse per-head fallback flag, not a final production scheduling policy.

Decision:

```txt
GPU overflow detector is a viable next building block.
Next step is a single adaptive harness path: probe -> detector -> conditional exact fallback, still offline.
Do not install into serving.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
