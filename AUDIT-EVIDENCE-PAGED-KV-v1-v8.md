# AUDIT — Evidence-Paged KV v1→v8

> Consolidated audit after Casey Reas, Vilém Flusser, and Zygmunt Bauman passes.
>
> Status: **v1→v7 are receipts. v8 is not a receipt yet; it is a conditional hypothesis.**

## Executive readout

The Evidence-Paged KV series should stop being read as “version N+1 is always progress.”

The honest taxonomy is:

| Role | Version | Why |
|---|---|---|
| Best public receipt | **v4** | First clear attention-like path: score → top-k/softmax → value. Hybrid, but legible and strong. |
| Best current implementation path | **v5** | Best current custom `K=32` throughput path in these microbenches. |
| Best architectural expression | **v7** | No full `[M,H]` score materialization; page-local top-k with warp-per-row scoring. |
| Conditional future hypothesis | **v8** | Only justified if it attacks candidate handling / `K=128` / temporary memory. |

The next technical step is not “make v8.”

The next technical step is:

```txt
prepare a vLLM experimental hook around a v4/v5-style path
```

v8 should only resume if there is a falsifiable hypothesis.

## What v1→v7 actually materialized

### v1 — fused overhead control

**Form:** gather/page + uint8 dequant + scalar dot.

**Materialized:** removing PyTorch materialization overhead is real and measurable.

**Still simulated:** attention. This is scalar dot, not an attention-shaped path.

### v2 — page as execution geometry

**Form:** `page × head × row-tile`.

**Materialized:** pages can become CUDA execution geometry, not just metadata.

**Still simulated:** final attention use; the receipt remains scalar.

### v3 — attention-shaped scores

**Form:** score tiles shaped `[selected_rows, heads]`.

**Materialized:** one row/head score as the computational unit.

**Still missing:** value path and selection.

### v4 — first complete public receipt

**Form:** score tiles → top-k/softmax → value accumulation.

**Materialized:** an end-to-end attention-like path over selected evidence rows.

**Boundary:** hybrid. `torch.topk` / `torch.softmax` remain in the middle.

**Public role:** strongest current communication artifact.

### v5 — custom boundary

**Form:** custom staged top-k/softmax + custom value accumulation.

**Materialized:** a full custom CUDA boundary exists for `K=32`.

**Revealed:** candidate selection/top-k is now the real bottleneck. `K=128` collapses.

**Implementation role:** strongest current performance path for a vLLM hook candidate.

### v6 — no full score materialization

**Form:** per-page scoring + local top-k → global merge/softmax → value accumulation.

**Materialized:** the architecture can avoid full `[M,H]` score materialization.

**Revealed:** serial-over-D row scoring destroys throughput.

### v7 — warp-scored no-full-score architecture

**Form:** page-local top-k with warp-per-row scoring.

**Materialized:** best architectural expression so far: pages organize score, selection, and value.

**Revealed:** the local-top-k + merge overhead still usually loses to v5 at larger M.

## What the apparatus may be making us miss

Flusser’s warning: CUDA microbenches can make every question look like a kernel variant.

The false question is:

```txt
how do we make v8 faster?
```

The better question is:

```txt
what material boundary has not yet been crossed?
```

The boundary not yet crossed is **runtime contact**:

- no vLLM hook;
- no serving path;
- no model-quality measurement;
- no evidence-use metric wired into runtime behavior.

Bauman’s warning: the series has enough form to crystallize. More numbered variants risk becoming liquid acceleration unless v8 changes the environment, not just the kernel.

## Frozen version taxonomy

| Version | Category | One-line description | Use now? |
|---|---|---|---|
| v1 | Control | Fused dequant/dot; overhead removal. | Historical/control only. |
| v2 | Geometry | Page × head × tile scalar path. | Cite for page-as-execution geometry. |
| v3 | Score shape | Emits `[selected_rows, heads]` scores. | Cite for attention-shaped transition. |
| v4 | Public receipt | Hybrid score → top-k/softmax → value. | **Yes: public-facing artifact.** |
| v5 | Hook candidate | Custom staged top-k/value; best `K=32` path. | **Yes: vLLM hook candidate.** |
| v6 | Architecture proof | No full score materialization, but serial scoring. | Historical architecture proof. |
| v7 | Architecture direction | No full score materialization + warp scoring. | **Yes: future direction, not current hook default.** |
| v8 | Conditional hypothesis | Better candidate handling for `K=32/K=128` + memory metrics. | **No until hypothesis exists.** |

## Current non-claims

Do not claim:

- vLLM integration;
- serving throughput or latency improvement;
- production attention kernel;
- model-quality improvement;
- better retrieval, better answer closure, or better evidence utilization;
- superiority over PagedAttention or FlashAttention;
- custom top-k generally beats Torch;
- page layout always beats flat gather;
- avoiding score materialization has already won.

## vLLM hook preparation target

The hook should begin with the **v4/v5-style path**, not v7.

Rationale:

- v4 has the clearest end-to-end shape.
- v5 has the strongest current custom `K=32` throughput.
- v7 is architecturally cleaner but not yet faster at larger M.

Initial hook goal:

```txt
prove whether the microbench shape survives contact with vLLM runtime boundaries
```

Not:

```txt
ship a production attention kernel
```

## v8 criteria of existence

v8 should only exist if all four are true:

1. It directly attacks **page-local candidate handling**.
2. It includes **K=32 and K=128**.
3. It measures **temporary memory materialization**, not only p50 time.
4. It compares directly against **v5 and v7**.

### Suggested v8 success criteria

- `K=32`: v8 must match or beat v5 for `M >= 32768`, or clearly reduce memory enough to justify slower time.
- `K=128`: v8 must not collapse like v5’s naive staged custom top-k.
- Memory: v8 must demonstrate a meaningful reduction in full-score materialization or temporary allocation.
- If it fails these, stop the v8 line and prioritize vLLM integration / external corpus work.

## Decision

Frozen decision as of 2026-05-19:

```txt
1. v1→v7 taxonomy is frozen.
2. v4 remains the public receipt.
3. v5 is the vLLM hook candidate.
4. v7 is the architecture direction.
5. v8 is paused until a candidate-handling hypothesis exists.
```

## Links

Public package:

- [`bench-public/evidence-paged-kv/RESULTS.md`](bench-public/evidence-paged-kv/RESULTS.md)

Raw receipts:

- [`v1`](bench/evidence-paged-kv-kernel-2026-05-18/RESULTS.md)
- [`v2`](bench/evidence-paged-kv-kernel-v2-2026-05-18/RESULTS.md)
- [`v3`](bench/evidence-paged-kv-kernel-v3-2026-05-18/RESULTS.md)
- [`v4`](bench/evidence-paged-kv-kernel-v4-2026-05-18/RESULTS.md)
- [`v5`](bench/evidence-paged-kv-kernel-v5-2026-05-18/RESULTS.md)
- [`v6`](bench/evidence-paged-kv-kernel-v6-2026-05-18/RESULTS.md)
- [`v7`](bench/evidence-paged-kv-kernel-v7-2026-05-18/RESULTS.md)
