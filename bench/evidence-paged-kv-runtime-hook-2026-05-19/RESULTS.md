# Evidence-Paged KV Phase 2a guarded runtime hook — planned

Status: hook code prepared. Runtime application/test pending in this receipt.

## Hook

```txt
07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py
07-scripts/vllm-hook/patch-turboquant-runtime-hook.py
```

## Guard env

```txt
VLLM_EPKV_RUNTIME_HOOK=1
VLLM_EPKV_RUNTIME_LOG=/home/felipe/vllm-lab/evidence-paged-kv-runtime/events.jsonl
VLLM_EPKV_RUNTIME_K=32
VLLM_EPKV_RUNTIME_MAX_SEQ=256
VLLM_EPKV_RUNTIME_MAX_EVENTS=64
VLLM_EPKV_RUNTIME_SYNC_TIMING=1
```

Default service should keep `VLLM_EPKV_RUNTIME_HOOK=0`.

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a quality/evidence-utilization claim.
- Not a PagedAttention/FlashAttention comparison.
