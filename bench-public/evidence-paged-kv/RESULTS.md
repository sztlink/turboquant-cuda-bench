# Evidence-Paged KV kernel receipts — v1 to v7

> **Architectural receipt, not production attention.** These are CUDA microbenchmarks on an RTX 4090 exploring one question: can evidence-aware KV access be shaped around useful evidence pages instead of only sequence position?

## One-line readout

**v4 is the best public receipt today. v7 is the best expression of the architecture. v5 is the fastest custom path in the current microbench.**

- **Public receipt:** v4 — score → top-k/softmax → value accumulation, clear end-to-end attention-like path.
- **Best current throughput path:** v5-style materialized warp scores + custom top-k/value, especially `K=32`.
- **Best architectural shape:** v7 — page-local top-k without full `[M,H]` score materialization, with warp-per-row scoring.

## What changed across v1–v7

| Version | What changed | Best use of the receipt | Honest readout |
|---|---|---|---|
| v1 | Fused gather/page + uint8 dequant + scalar dot. | Overhead/control receipt. | Removes PyTorch materialization overhead, but still a scalar microbench. |
| v2 | Page × head × row-tile mapping. | First page-as-execution-geometry receipt. | Strong for scalar path: page-tiled beats gather at some budgets. |
| v3 | Emits attention-like score tiles `[selected_rows, heads]`. | First attention-shaped score receipt. | No scalar global atomic; still no value path. |
| v4 | Score tiles → `torch.topk`/`torch.softmax` → custom value accumulation. | **Best public receipt now.** | End-to-end attention-like path; hybrid by design. |
| v5 | Replaces Torch top-k/softmax with staged custom CUDA top-k/softmax. | Custom boundary receipt; best current `K=32` path. | Wins for `K=32`; loses badly for naive `K=128`. |
| v6 | Fuses per-page score generation + local top-k; avoids full score materialization. | Architectural proof of no-full-score materialization. | Correct shape, but slow because row scoring is serial over D. |
| v7 | Keeps v6 shape but uses warp-per-row page-local scoring. | Best expression of Evidence-Paged KV. | Better than v6; still usually slower than v5 at larger M. |

## Key numbers

### v4: first end-to-end attention-like receipt

Hybrid path: custom score kernels + `torch.topk`/`torch.softmax` + custom value accumulation.

| M rows | K | PyTorch top-k/value | kernel pages score→top-k→value | Readout |
|---:|---:|---:|---:|---|
| 8,192 | 32 | 1.3494 ms | 0.1485 ms | ~9.1× faster |
| 32,768 | 32 | 1.3711 ms | 0.3277 ms | ~4.2× faster |
| 131,072 | 128 | 2.9051 ms | 0.2660 ms | ~10.9× faster |

Source: [`bench/evidence-paged-kv-kernel-v4-2026-05-18/RESULTS.md`](../../bench/evidence-paged-kv-kernel-v4-2026-05-18/RESULTS.md)

### v5: custom top-k boundary

Custom staged top-k/softmax, no Torch top-k/softmax in the kernel pipeline.

| M rows | K | PyTorch top-k/value | pages custom top-k/value | Readout |
|---:|---:|---:|---:|---|
| 8,192 | 32 | 1.4172 ms | 0.3338 ms | custom wins |
| 131,072 | 32 | 2.9286 ms | 0.6540 ms | custom wins |
| 8,192 | 128 | 0.5652 ms | 2.5272 ms | naive custom loses |
| 131,072 | 128 | 2.9020 ms | 3.8840 ms | naive custom loses |

Source: [`bench/evidence-paged-kv-kernel-v5-2026-05-18/RESULTS.md`](../../bench/evidence-paged-kv-kernel-v5-2026-05-18/RESULTS.md)

### v7: best architectural shape so far

No full `[M,H]` score materialization; page-local warp-scored top-k candidates.

| M rows | v5 materialized-score path | v7 fused page-warp top-k | Readout |
|---:|---:|---:|---|
| 8,192 | 0.3348 ms | 0.3185 ms | v7 slightly wins |
| 32,768 | 0.4178 ms | 0.5059 ms | v5 wins |
| 131,072 | 0.7076 ms | 1.2446 ms | v5 wins |
| 262,144 | 1.1112 ms | 1.8698 ms | v5 wins |

Source: [`bench/evidence-paged-kv-kernel-v7-2026-05-18/RESULTS.md`](../../bench/evidence-paged-kv-kernel-v7-2026-05-18/RESULTS.md)

## Claims

What these receipts support:

- Evidence pages can be represented as a CUDA execution shape, not only as a retrieval/indexing concept.
- An attention-like path can be built around selected evidence rows: scores → select → values.
- A custom CUDA path can beat materialized PyTorch baselines in these synthetic microbenches.
- Avoiding full score materialization is architecturally plausible, but not yet the fastest implementation at large M.

## Non-claims

Do **not** read this as claiming:

- vLLM integration.
- Serving throughput or latency improvement in a real model.
- Better retrieval quality, answer quality, or evidence utilization by the model.
- Superiority over PagedAttention, FlashAttention, or production attention kernels.
- A fully fused production-ready kernel.
- That custom top-k is generally better than Torch top-k.
- That page layout always beats flat gather.

## Next steps

1. **Public communication:** use v4 as the main receipt and v7 as the research direction.
2. **Technical hook:** test a v4/v5-style path behind a vLLM experimental hook before inventing more microbench variants.
3. **If v8 happens:** target page-local top-k candidate handling, `K=32` and `K=128`, and report temporary memory materialization as well as time.

## Links to raw receipts

- [`v1`](../../bench/evidence-paged-kv-kernel-2026-05-18/RESULTS.md)
- [`v2`](../../bench/evidence-paged-kv-kernel-v2-2026-05-18/RESULTS.md)
- [`v3`](../../bench/evidence-paged-kv-kernel-v3-2026-05-18/RESULTS.md)
- [`v4`](../../bench/evidence-paged-kv-kernel-v4-2026-05-18/RESULTS.md)
- [`v5`](../../bench/evidence-paged-kv-kernel-v5-2026-05-18/RESULTS.md)
- [`v6`](../../bench/evidence-paged-kv-kernel-v6-2026-05-18/RESULTS.md)
- [`v7`](../../bench/evidence-paged-kv-kernel-v7-2026-05-18/RESULTS.md)
