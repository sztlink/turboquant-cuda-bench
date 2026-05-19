# Evidence-Paged KV Phase 2a guarded runtime hook — 2026-05-19

## Status

Guarded Phase 2a runtime hook was installed into the 4090 vLLM TurboQuant checkout, tested with the flag temporarily enabled, then restored to default-off.

This is **runtime contact**, not a production serving path.

## Production target

```txt
host: 4090 render server / WSL Ubuntu-24.04
vLLM checkout: /home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
backend patched: vllm/v1/attention/backends/turboquant_attn.py
hook module: vllm/v1/attention/evidence_paged_kv/runtime_hook.py
service: VLLM-AutoStart
model: Qwen/Qwen2.5-7B-Instruct
kv_cache_dtype: turboquant_k8v4
```

## Guard env

Default service state after test:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_RUNTIME_SYNC_TIMING=0
VLLM_EPKV_RUNTIME_TAG=phase2a-runtime-default-off
```

Temporary test state:

```txt
VLLM_EPKV_RUNTIME_HOOK=1
VLLM_EPKV_RUNTIME_LOG=/home/felipe/vllm-lab/evidence-paged-kv-runtime/events.jsonl
VLLM_EPKV_RUNTIME_K=32
VLLM_EPKV_RUNTIME_MAX_SEQ=256
VLLM_EPKV_RUNTIME_MAX_EVENTS=64
VLLM_EPKV_RUNTIME_SYNC_TIMING=1
VLLM_EPKV_RUNTIME_TAG=phase2a-runtime-temporary-on-2026-05-19
```

## Runtime behavior

The hook is called inside `TurboQuantAttentionImpl._decode_attention(...)` before the original TurboQuant decode path.

When enabled and compatible:

```txt
query + block_table + packed FP8-K slots -> Triton scores [M,Hq]
torch.topk + torch.softmax
packed 4-bit-V slots + top positions/weights -> Triton output [B,Hq,D]
return Phase 2a output
```

When disabled, incompatible, over max events, or on exception:

```txt
delegate to original TurboQuant decode
```

## Smoke tests

Default-off after install:

```txt
/health -> HTTP 200
chat smoke: 13 * 37 -> 481
runtime events: 0
```

Temporary-on test:

```txt
/health -> HTTP 200
chat smoke: 7 * 8 -> 56
runtime events: 64
```

Restored default-off:

```txt
/health -> HTTP 200
chat smoke: 23 * 31 -> 713
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_RUNTIME_SYNC_TIMING=0
```

Final GPU state:

```txt
RTX 4090, 21839 MiB / 24564 MiB, 0%, 42 C
```

## Captured runtime events

Summary:

```txt
events: 64
hook: evidence_paged_kv.runtime.phase2a.v0
tag: phase2a-runtime-temporary-on-2026-05-19
seq_lens: 43, 44, 45
K: 32
query_shape: [1, 28, 128]
kv_cache_shape: [15442, 16, 4, 196]
temp_scores_bytes first event: 4816
```

Sync timing:

```txt
first compile/warmup event: 774.369 ms
steady events: 63
steady min: 0.1587 ms
steady p50: 0.1938 ms
steady p90: 0.3329 ms
steady max: 28.0577 ms
```

The large first event is Triton compile/warmup. The max steady outlier should be treated as runtime noise until repeated under a dedicated benchmark harness.

## Artifacts

```txt
events.jsonl
summary.json
```

## Readout

- Phase 2a can be installed as a guarded vLLM runtime hook.
- The flag can be turned on and off through the startup environment.
- The service survives install, temporary-on run, and restoration.
- The hook produced actual runtime decode outputs for a controlled short prompt.
- The hook is not left enabled in the default service.

## Decision implication

This passes the runtime-contact gate.

Next meaningful step is **not** 2b/v8. It is one of:

1. build a dedicated controlled runtime benchmark for Phase 2a with repeated short/medium contexts; or
2. bridge Phase 2a metadata to an evidence-utilization fixture, still guarded and non-production.

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality improvement claim.
- Not an evidence-utilization improvement claim.
- Not a PagedAttention/FlashAttention comparison.
