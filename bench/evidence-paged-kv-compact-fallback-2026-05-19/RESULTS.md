# Evidence-Paged KV Phase 2c.8 — compact fallback candidate proof — 2026-05-19

> Offline GPU-side compact fallback: reuse probe for unflagged heads, compute TOP=32 only for flagged heads inside the candidate merge kernel.

## Boundary

```txt
probe_local_top: 8
fallback_local_top: 32
global_k: 32
control: GPU detector flags consumed by Triton compact candidate merge
serving: no
```

## Results

| scenario | M rows | mode | flag heads | max abs err | probe+flags p50 | compact candidates p50 | compact full p50 | exact full p50 |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| random | 8192 | probe_only_all_heads | 0 | 0.000141 | 0.0758 | 0.1048 | 0.1348 | 0.1700 |
| random | 65536 | probe_only_all_heads | 0 | 0.000178 | 0.2980 | 0.3221 | 0.3418 | 0.9583 |
| one_chunk_32 | 8192 | fallback_flagged_heads | 28 | 0.000099 | 0.0744 | 0.2006 | 0.2171 | 0.1710 |
| one_chunk_32 | 65536 | fallback_flagged_heads | 28 | 0.000107 | 0.2916 | 1.1848 | 1.2052 | 0.9554 |
| two_chunks_16_16 | 8192 | fallback_flagged_heads | 28 | 0.000115 | 0.0748 | 0.2017 | 0.2202 | 0.1691 |
| two_chunks_16_16 | 65536 | fallback_flagged_heads | 28 | 0.000122 | 0.2937 | 1.1817 | 1.2052 | 0.9510 |
| spread_32_chunks | 8192 | probe_only_all_heads | 0 | 0.000128 | 0.0737 | 0.0869 | 0.1341 | 0.1731 |
| spread_32_chunks | 65536 | probe_only_all_heads | 0 | 0.000115 | 0.2946 | 0.3348 | 0.3389 | 0.9595 |

## Readout

- compact fallback preserves exact-reference output in tested cases;
- random/spread cases avoid TOP=32 score loop and copy probe candidates into a TOP=32-compatible buffer;
- concentrated adversarial cases trigger flagged-head TOP=32 fallback;
- this is still offline and shape-specific, but it is closer to the intended adaptive implementation than dual-path mask/control.

Decision:

```txt
Compact fallback is useful when no heads or few heads are flagged: random/spread 65K compact full p50 ~0.34 ms vs exact full ~0.96 ms.
When all heads are flagged, compact fallback is slower than exact-only because it pays probe + fallback overhead: adversarial 65K compact full ~1.21 ms vs exact full ~0.95 ms.
Next useful benchmark: partial-head flag-rate sweep to find the crossover point and decide whether policy should fall back exact-only when many heads are flagged.
Do not install into serving.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
