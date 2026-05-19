# Evidence-Paged KV Phase 2c.7 — GPU-side mask/control proof — 2026-05-19

> Offline proof that fallback choice can stay GPU-side via per-head mask. This computes both branches and is not an optimized conditional path.

## Boundary

```txt
probe_local_top: 8
fallback_local_top: 32
global_k: 32
control: GPU detector flags + Triton per-head output select
serving: no
```

## Results

| scenario | M rows | mode | flag heads | max abs err | probe+flags p50 | exact p50 | select p50 | dual mask path p50 |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| random | 8192 | accept_probe_all_heads | 0 | 0.000141 | 0.2028 | 0.1987 | 0.0799 | 0.3683 |
| random | 65536 | accept_probe_all_heads | 0 | 0.000178 | 0.3109 | 0.9471 | 0.0481 | 1.2267 |
| one_chunk_32 | 8192 | fallback_some_heads | 28 | 0.000099 | 0.1987 | 0.1997 | 0.0787 | 0.3594 |
| one_chunk_32 | 65536 | fallback_some_heads | 28 | 0.000107 | 0.3400 | 0.9563 | 0.0808 | 1.2411 |
| two_chunks_16_16 | 8192 | fallback_some_heads | 28 | 0.000115 | 0.1976 | 0.1966 | 0.0809 | 0.3644 |
| two_chunks_16_16 | 65536 | fallback_some_heads | 28 | 0.000122 | 0.3103 | 0.9462 | 0.0791 | 1.1714 |
| spread_32_chunks | 8192 | accept_probe_all_heads | 0 | 0.000128 | 0.1997 | 0.1874 | 0.0788 | 0.3564 |
| spread_32_chunks | 65536 | accept_probe_all_heads | 0 | 0.000115 | 0.3154 | 0.9189 | 0.0800 | 1.1581 |

## Readout

- GPU-side mask/control preserves exact-reference output in tested cases;
- output select kernel is tiny relative to candidate paths;
- because both branches are computed, this is an implementation-form proof, not a latency optimization;
- a true optimized path would need GPU-side conditional scheduling or a compact fallback subpath for flagged heads/chunks.

Decision:

```txt
GPU-side mask/control is feasible but branchless dual-path is not the performance path.
The next useful design is compact fallback: reuse probe for unflagged heads and compute exact LOCAL_TOP=32 only for flagged heads/chunks.
Do not install into serving.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
