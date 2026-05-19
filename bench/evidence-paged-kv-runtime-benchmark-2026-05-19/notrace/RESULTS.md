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
  "nvidia_smi_end": "NVIDIA GeForce RTX 4090, 595.79, 22327 MiB, 24564 MiB, 7 %, 41",
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
  "trace_selection": false,
  "trace_top_n": 32,
  "warmup_n": 4
}
```

## Timings

| mode | M rows | K | first compile ms | steady p50 ms | steady p90 ms | steady max ms | p90 hook / original | temp scores MiB |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| original_turboquant_decode | 64 |  | 9.0716 | 0.1069 | 0.1567 | 0.3374 |  | 0.00 |
| epkv_runtime_hook_phase2a | 64 | 32 | 46.1179 | 0.5936 | 0.6332 | 0.7172 | 4.042 | 0.01 |
| epkv_runtime_hook_phase2a | 64 | 128 | 4.8587 | 0.5867 | 0.6269 | 0.6328 | 4.001 | 0.01 |
| original_turboquant_decode | 512 |  | 2.5037 | 0.1063 | 0.1146 | 0.1331 |  | 0.00 |
| epkv_runtime_hook_phase2a | 512 | 32 | 2.3770 | 0.5933 | 0.6667 | 0.7668 | 5.816 | 0.05 |
| epkv_runtime_hook_phase2a | 512 | 128 | 5.7116 | 0.5601 | 0.6210 | 0.8137 | 5.418 | 0.05 |
| original_turboquant_decode | 2048 |  | 0.1455 | 0.1174 | 0.1547 | 0.1567 |  | 0.00 |
| epkv_runtime_hook_phase2a | 2048 | 32 | 2.3589 | 0.5859 | 0.7231 | 0.7431 | 4.674 | 0.22 |
| epkv_runtime_hook_phase2a | 2048 | 128 | 0.6423 | 0.5578 | 0.6077 | 0.6599 | 3.928 | 0.22 |
| original_turboquant_decode | 8192 |  | 0.1331 | 0.1089 | 0.1167 | 0.1596 |  | 0.00 |
| epkv_runtime_hook_phase2a | 8192 | 32 | 2.3231 | 0.5817 | 0.6034 | 0.6306 | 5.169 | 0.88 |
| epkv_runtime_hook_phase2a | 8192 | 128 | 0.6433 | 0.5852 | 0.6023 | 0.6269 | 5.160 | 0.88 |

## Gate readout template

Proceed to the evidence-utilization bridge only if:

- steady `p90_hook / p90_original_tq <= 2.5` for M in {64, 512, 2048};
- per-bucket steady max is <= 5x steady p50, or outlier bands are explicitly repeated/excluded;
- telemetry events include seq_len, K, temp_scores_bytes, elapsed_ms_sync_timing;
- any later serving-path probe is separately confirmed and restored.

## Event log

Raw runtime hook events: `/home/felipe/vllm-lab/evidence-paged-kv-runtime-benchmark-2026-05-19-notrace/events.jsonl`

## Telemetry validation

```json
{
  "decisions": {
    "returned_phase2a_output": 272
  },
  "events": 272,
  "events_with_selection": 0,
  "missing_required_fields": {},
  "require_selection": false,
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

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality or evidence-utilization improvement claim.
- Not a PagedAttention/FlashAttention comparison.
