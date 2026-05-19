# Evidence-Paged KV Phase 2c.4 — adaptive local-overflow guard — 2026-05-19

> Offline policy validation: probe LOCAL_TOP=8, detect local overflow risk, fall back to exact LOCAL_TOP=32 when needed.

## Boundary

```txt
global_k: 32
probe_local_top: 8
fallback_local_top: 32
chunk_rows: 512
detector: Torch policy validation over candidate values, not final fused kernel
serving: no
```

## Results

| scenario | M rows | mode | overflow flags | flag heads | flag chunks | probe recall | adaptive recall | probe max err | adaptive max err | probe full p50 | exact full p50 | adaptive est p50 |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random | 8192 | accept_probe | 0 | 0 | 0 | 1.000 | 1.000 | 0.000141 | 0.000141 | 0.1545 | 0.1976 | 0.5487 |
| random | 65536 | accept_probe | 0 | 0 | 0 | 1.000 | 1.000 | 0.000178 | 0.000178 | 0.3040 | 0.9550 | 0.7097 |
| one_chunk_32 | 8192 | fallback_exact | 28 | 28 | 1 | 0.250 | 1.000 | 0.757046 | 0.000099 | 0.1556 | 0.1997 | 0.7171 |
| one_chunk_32 | 65536 | fallback_exact | 28 | 28 | 1 | 0.250 | 1.000 | 0.716724 | 0.000107 | 0.3030 | 0.9880 | 1.6805 |
| two_chunks_16_16 | 8192 | fallback_exact | 56 | 28 | 2 | 0.500 | 1.000 | 0.571648 | 0.000115 | 0.1593 | 0.1987 | 0.6882 |
| two_chunks_16_16 | 65536 | fallback_exact | 56 | 28 | 2 | 0.500 | 1.000 | 0.461250 | 0.000122 | 0.3287 | 0.9665 | 1.6772 |
| spread_32_chunks | 8192 | accept_probe | 0 | 0 | 0 | 1.000 | 1.000 | 0.000128 | 0.000128 | 0.1523 | 0.1987 | 0.5413 |
| spread_32_chunks | 65536 | accept_probe | 0 | 0 | 0 | 1.000 | 1.000 | 0.000115 | 0.000115 | 0.3314 | 0.9605 | 0.7169 |

## Readout

- accepted probe cases: 4/8
- fallback exact cases: 4/8
- the guard caught the adversarial one/two-chunk failures and preserved exact recall via fallback;
- random and spread cases can accept the cheap probe when no local tail threatens the global threshold;
- this is still a policy proof, not a production fused implementation.

Important timing caveat:

```txt
adaptive est p50 includes a Torch/CPU detector (~0.39–0.42 ms wall in this harness)
```

So the current adaptive timing is **not** a kernel performance result. The useful result is the guard condition: local-tail-vs-global-threshold catches concentrated-topK failures and accepts spread/random cases.

Decision:

```txt
Adaptive overflow guard is conceptually valid.
Next implementation step would be a tiny GPU detector that emits a fallback flag/mask without Torch/CPU synchronization.
Do not install into serving yet.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
- Torch detector is policy validation, not final fused kernel.
