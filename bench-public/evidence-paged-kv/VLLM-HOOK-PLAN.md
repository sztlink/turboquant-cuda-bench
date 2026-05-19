# vLLM hook preparation — Evidence-Paged KV v4/v5

> Goal: prepare a runtime contact experiment, not a production integration.

## Why v4/v5, not v7 first?

- **v4** is the clearest end-to-end attention-like receipt: score → top-k/softmax → value.
- **v5** is the best current custom `K=32` path in microbenchmarks.
- **v7** is cleaner architecturally but still loses to v5 at larger M.

The first vLLM hook should test whether the practical v4/v5 shape survives runtime overheads.

## Hook hypothesis

```txt
A selected-evidence KV path can be inserted experimentally around vLLM attention/KV handling and produce measurable runtime behavior without claiming production speedup.
```

## Non-goals

- Production attention replacement.
- PagedAttention/FlashAttention comparison.
- Serving speedup claim.
- Model-quality or answer-quality claim.
- Full Evidence-Paged architecture.

## Minimal experiment shape

1. Identify a narrow vLLM-side insertion point where selected row/page metadata can be passed to an experimental attention path.
2. Use a v4/v5-style materialized score path first.
3. Restrict to a controlled decode/prefill micro-workload, not arbitrary serving.
4. Measure:
   - latency p50/p90;
   - temporary allocations;
   - overhead of metadata preparation;
   - correctness against standard attention on the selected subset;
   - failure modes when selected pages are sparse vs contiguous.

## Candidate implementation order

### Phase 0 — static hook scout

- Locate the vLLM attention backend used by current 4090 service.
- Identify whether an out-of-tree extension can be loaded without rebuilding the full server.
- Identify the tensors available at the hook boundary: Q, K/V cache layout, block tables, sequence metadata.

Prepared and applied observe-only scout:

- [`../../07-scripts/vllm-hook/README.md`](../../07-scripts/vllm-hook/README.md)
- [`../../bench/evidence-paged-kv-vllm-hook-scout-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-vllm-hook-scout-2026-05-19/RESULTS.md)

Phase 0 result:

```txt
/health -> HTTP 200
chat smoke: 17 * 23 -> 391
captured events: 64
boundary: query [1,28,128], kv_cache [15442,16,4,196], block_table [1,4096]
layout: turboquant_k8v4 = FP8-K + 4-bit-V packed slot_size=196
```

### Phase 1 — offline harness near vLLM layout

- Reproduce v4/v5 benchmark using tensors shaped closer to vLLM KV cache/block tables.
- Keep outside production vLLM server.
- Compare with current receipt numbers.

Phase 1 receipt:

- [`../../bench/evidence-paged-kv-vllm-layout-harness-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-vllm-layout-harness-2026-05-19/RESULTS.md)

Phase 1 result:

```txt
layout validated: FP8-K + 4-bit-V packed slot_size=196
correctness: dequant+full-softmax vs original TurboQuant decode max abs ~1e-4
boundary usable: block_table + packed TQ slots can represent selected evidence pages offline
caveat: current top-k rows are Python/Torch-loop reference paths, not final kernels
```

### Phase 2 — experimental hook

- Add a guarded experimental path behind an env flag.
- Run only on synthetic selected-evidence workloads.
- Validate health restoration after every run.

### Phase 3 — evidence-utilization bridge

- Only after runtime viability: connect selected evidence pages to retrieval/answer-closure fixtures.
- Measure whether runtime-selected pages correspond to answer-closure behavior.

## Stop criteria

Stop or downgrade if:

- metadata preparation dominates runtime;
- vLLM KV layout makes selected evidence access too invasive;
- correctness against selected-subset baseline is unstable;
- hook requires broad production-path changes before any signal.

## Output expected

The first hook milestone should produce:

```txt
bench/evidence-paged-kv-vllm-hook-scout-YYYY-MM-DD/RESULTS.md
```

with:

- hook boundary diagram;
- tensors observed;
- insertion feasibility;
- next experiment decision: proceed / redesign / stop.
