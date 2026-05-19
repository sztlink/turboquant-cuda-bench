# Evidence-Paged KV Phase 2c.6 — single adaptive offline path — 2026-05-19

> Offline integrated policy path: probe LOCAL_TOP=8, GPU detector, conditional exact fallback. No serving mutation.

## Boundary

```txt
probe_local_top: 8
fallback_local_top: 32
global_k: 32
branch: Python reads GPU detector flag in this harness
serving: no
```

## Results

| scenario | M rows | mode | recall@32 | max abs err | probe p50 ms | exact p50 ms | adaptive wall p50 ms |
|---|---:|---|---:|---:|---:|---:|---:|
| random | 8192 | accept_probe | 1.000 | 0.000141 | 0.1653 | 0.1984 | 0.2779 |
| random | 65536 | accept_probe | 1.000 | 0.000178 | 0.3274 | 0.9708 | 0.4771 |
| one_chunk_32 | 8192 | fallback_exact | 1.000 | 0.000099 | 0.1556 | 0.1987 | 0.3749 |
| one_chunk_32 | 65536 | fallback_exact | 1.000 | 0.000107 | 0.3011 | 0.9493 | 1.2263 |
| two_chunks_16_16 | 8192 | fallback_exact | 1.000 | 0.000115 | 0.1564 | 0.1976 | 0.3719 |
| two_chunks_16_16 | 65536 | fallback_exact | 1.000 | 0.000122 | 0.3029 | 0.9667 | 1.3010 |
| spread_32_chunks | 8192 | accept_probe | 1.000 | 0.000128 | 0.1065 | 0.1699 | 0.1925 |
| spread_32_chunks | 65536 | accept_probe | 1.000 | 0.000115 | 0.3078 | 0.9134 | 0.4776 |

## Readout

- accepted probe cases: 4/8
- fallback exact cases: 4/8
- recall@32 stayed 1.0 across the tested random/spread/adversarial fixtures;
- adversarial concentrated fixtures triggered exact fallback;
- random/spread fixtures used the cheaper probe path;
- adaptive wall timing includes Python CPU flag read/branch, so it is a policy-path receipt, not final fused-kernel timing.

Decision:

```txt
The adaptive policy path is coherent offline: cheap probe for spread/random, exact fallback for concentrated adversarial cases.
The next blocker is implementation form, not policy: remove Python branch/CPU read and express fallback decision as GPU-side mask/control.
Do not install into serving yet.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
