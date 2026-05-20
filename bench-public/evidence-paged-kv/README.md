# Evidence-Paged KV

Public entry for the Evidence-Paged KV CUDA/kernel and runtime-observability receipts.

Read this as:

```txt
v4 = clean public end-to-end kernel receipt
v7 = architecture direction
v1.9 evidence-path ledger = offline observability milestone
not production attention
not live vLLM integration
not serving speedup
```

Start with [`RESULTS.md`](RESULTS.md).

Supporting decision docs:

- [`VERSION-TAXONOMY.md`](VERSION-TAXONOMY.md) — frozen v1→v8 taxonomy.
- [`VLLM-HOOK-PLAN.md`](VLLM-HOOK-PLAN.md) — preparation plan and runtime receipts for a guarded v4/v5-style vLLM hook; live hook-on remains paused.
- [`RUNTIME-GATE-REDESIGN.md`](RUNTIME-GATE-REDESIGN.md) — post-Track A absolute telemetry gate replacing the failed synthetic ratio gate.
- [`RUNTIME-INTEGRATION-DESIGN.md`](RUNTIME-INTEGRATION-DESIGN.md) — paused runtime contract for compact fallback states, telemetry, kill switches, and non-claims.
- [`../../AUDIT-EVIDENCE-PAGED-KV-v1-v8.md`](../../AUDIT-EVIDENCE-PAGED-KV-v1-v8.md) — consolidated audit and v8 stop/continue criteria.

Visual summary:

![Evidence-Paged KV kernel receipts](../assets/evidence-paged-kv-kernel-receipts.svg)

Boundary: these are RTX 4090 CUDA microbenchmarks and offline telemetry/ledger receipts, not vLLM integration, not production attention kernels, not evidence-use proof, and not serving readiness.
