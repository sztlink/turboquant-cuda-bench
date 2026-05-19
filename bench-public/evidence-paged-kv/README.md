# Evidence-Paged KV

Public entry for the 2026-05-18 CUDA kernel receipts.

Start with [`RESULTS.md`](RESULTS.md).

Supporting decision docs:

- [`VERSION-TAXONOMY.md`](VERSION-TAXONOMY.md) — frozen v1→v8 taxonomy.
- [`VLLM-HOOK-PLAN.md`](VLLM-HOOK-PLAN.md) — preparation plan and runtime receipts for a guarded v4/v5-style vLLM hook.
- [`RUNTIME-GATE-REDESIGN.md`](RUNTIME-GATE-REDESIGN.md) — post-Track A absolute telemetry gate replacing the failed synthetic ratio gate.
- [`../../AUDIT-EVIDENCE-PAGED-KV-v1-v8.md`](../../AUDIT-EVIDENCE-PAGED-KV-v1-v8.md) — consolidated audit and v8 stop/continue criteria.

Visual summary:

![Evidence-Paged KV kernel receipts](../assets/evidence-paged-kv-kernel-receipts.svg)

Boundary: these are RTX 4090 CUDA microbenchmarks, not vLLM integration and not production attention kernels.
