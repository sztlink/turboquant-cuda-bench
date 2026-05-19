# Evidence-Paged KV Phase 2a — runtime benchmark — Track A

> Offline benchmark of the guarded runtime hook function. No serving mutation, no HTTP requests, no real prompts.

## Boundary

```txt
baseline: original TurboQuant decode over synthetic packed KV cache
hook: runtime_hook.maybe_decode -> Triton scores -> torch.topk/softmax -> Triton value
layout: turboquant_k8v4, FP8-K + 4-bit-V, slot_size=196, block_size=16, Hq=28, Hk=4, D=128
```

## Environment

```json
{
  "cuda_device": "NVIDIA GeForce RTX 4090",
  "cuda_home": "/home/felipe/vllm-lab/venv-tq-fresh-20260515/lib/python3.12/site-packages/nvidia/cu13",
  "host": "DESKTOP-CTAHC6D",
  "layout": {
    "B": 1,
    "D": 128,
    "Hk": 4,
    "Hq": 28,
    "block_size": 16,
    "key_fp8": true,
    "key_packed_size": 128,
    "kv_cache_dtype": "turboquant_k8v4",
    "kv_group": 7,
    "max_M": 8192,
    "max_blocks": 512,
    "slot_size": 196,
    "val_data_bytes": 64,
    "value_quant_bits": 4
  },
  "nvidia_smi_end": "NVIDIA GeForce RTX 4090, 595.79, 22327 MiB, 24564 MiB, 54 %, 40",
  "nvidia_smi_start": "NVIDIA GeForce RTX 4090, 595.79, 21840 MiB, 24564 MiB, 0 %, 40",
  "python": "3.12.3",
  "seq_lens": [
    64,
    512,
    2048,
    8192
  ],
  "steady_n": 30,
  "topks": [
    32,
    128
  ],
  "torch": "2.11.0+cu130",
  "trace_selection": true,
  "trace_top_n": 32,
  "warmup_n": 4
}
```

## Timings

| mode | M rows | K | first compile ms | steady p50 ms | steady p90 ms | steady max ms | p90 hook / original | temp scores MiB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| original_turboquant_decode | 64 |  | 168.5092 | 0.1063 | 0.1137 | 0.1276 |  | 0.00 |
| epkv_runtime_hook_phase2a | 64 | 32 | 461.7569 | 0.9127 | 0.9860 | 1.0553 | 8.674 | 0.01 |
| epkv_runtime_hook_phase2a | 64 | 128 | 1390.8562 | 1.0653 | 1.1752 | 2.7379 | 10.339 | 0.01 |
| original_turboquant_decode | 512 |  | 3.0188 | 0.1074 | 0.1361 | 0.1403 |  | 0.00 |
| epkv_runtime_hook_phase2a | 512 | 32 | 29.4856 | 0.9602 | 1.0540 | 1.2358 | 7.746 | 0.05 |
| epkv_runtime_hook_phase2a | 512 | 128 | 7248.1284 | 2.9684 | 3.1360 | 5.1978 | 23.048 | 0.05 |
| original_turboquant_decode | 2048 |  | 0.2990 | 0.2662 | 0.2744 | 0.7077 |  | 0.00 |
| epkv_runtime_hook_phase2a | 2048 | 32 | 31.4032 | 2.4726 | 2.6235 | 2.6927 | 9.560 | 0.22 |
| epkv_runtime_hook_phase2a | 2048 | 128 | 3.4541 | 3.1804 | 3.4129 | 5.9109 | 12.436 | 0.22 |
| original_turboquant_decode | 8192 |  | 0.5642 | 0.6185 | 0.6277 | 0.9940 |  | 0.00 |
| epkv_runtime_hook_phase2a | 8192 | 32 | 30.8929 | 3.0638 | 3.4814 | 3.6851 | 5.546 | 0.88 |
| epkv_runtime_hook_phase2a | 8192 | 128 | 3.0344 | 2.8554 | 2.9382 | 2.9414 | 4.681 | 0.88 |

## Gate readout

Track A completed while the vLLM service stayed healthy. It validates the hook/telemetry substrate but **does not pass the original cost-ratio bridge gate**.

- telemetry completeness: **pass** — 272/272 events include selected-position summaries and required timing fields;
- stability: **mostly pass** — no extreme steady-state outlier in the trace run; K=128 at M=64 and M=512 has visible max spikes but not the earlier 28 ms class;
- cost-ratio gate: **fail** — `p90_hook / p90_original_tq` is >2.5 for M ∈ {64,512,2048};
- interpretation: this is a viable receipt for selected-position telemetry, not yet a green light for real-prompt bridge serving runs under the original threshold.

Conservative decision: do not proceed to hook-on real-prompt bridge yet. Use this receipt to either (a) run metadata/offline bridge, or (b) redesign the gate around absolute telemetry budget rather than ratio to a very small synthetic TurboQuant baseline.

## Event log

Raw runtime hook events: `/home/felipe/vllm-lab/evidence-paged-kv-runtime-benchmark-2026-05-19-trace/events.jsonl`

## Telemetry validation

```json
{
  "decisions": {
    "returned_phase2a_output": 272
  },
  "events": 272,
  "events_with_selection": 272,
  "missing_required_fields": {},
  "require_selection": true,
  "tags": {
    "track-a-M2048-K128": 34,
    "track-a-M2048-K32": 34,
    "track-a-M512-K128": 34,
    "track-a-M512-K32": 34,
    "track-a-M64-K128": 34,
    "track-a-M64-K32": 34,
    "track-a-M8192-K128": 34,
    "track-a-M8192-K32": 34
  }
}
```

## Supplementary no-trace run

A second offline run disabled selection tracing to isolate trace overhead. Files live in [`notrace/`](notrace/). It is faster in absolute terms, but still fails the original ratio gate because the synthetic original TurboQuant baseline is extremely small.

| M rows | K | steady p50 ms | steady p90 ms | steady max ms | p90 hook / original | temp scores MiB |
|---:|---:|---:|---:|---:|---:|---:|
| 64 | 32 | 0.5936 | 0.6332 | 0.7172 | 4.042 | 0.01 |
| 64 | 128 | 0.5867 | 0.6269 | 0.6328 | 4.001 | 0.01 |
| 512 | 32 | 0.5933 | 0.6667 | 0.7668 | 5.816 | 0.05 |
| 512 | 128 | 0.5601 | 0.6210 | 0.8137 | 5.418 | 0.05 |
| 2048 | 32 | 0.5859 | 0.7231 | 0.7431 | 4.674 | 0.22 |
| 2048 | 128 | 0.5578 | 0.6077 | 0.6599 | 3.928 | 0.22 |
| 8192 | 32 | 0.5817 | 0.6034 | 0.6306 | 5.169 | 0.88 |
| 8192 | 128 | 0.5852 | 0.6023 | 0.6269 | 5.160 | 0.88 |

## Service health after run

```txt
/health -> HTTP 200
chat smoke: 13 * 37 -> 481
4090 monitor: OK, GPU idle after run, vLLM VRAM returned to ~21.8 GiB
```

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality or evidence-utilization improvement claim.
- Not a PagedAttention/FlashAttention comparison.
