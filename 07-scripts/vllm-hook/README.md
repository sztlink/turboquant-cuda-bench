# Evidence-Paged KV vLLM hook scaffold

This is the first, deliberately conservative vLLM hook for Evidence-Paged KV.

## Status

- Mode: **observe-only runtime boundary hook**.
- Target backend: `vllm/v1/attention/backends/turboquant_attn.py`.
- Insertion point: start of `TurboQuantAttentionImpl._decode_attention(...)`.
- Behavior: records tensor shapes / metadata, then delegates to the original TurboQuant decode path.

It does **not** replace attention, does **not** claim serving speedup, and does **not** implement production Evidence-Paged KV.

## Why observe-only first?

The v4/v5 microbench path used synthetic tensors. The first real vLLM question is whether the runtime boundary exposes the needed tensors without invasive changes:

- `query`: `[B, Hq, D]`
- `kv_cache`: `[num_blocks, block_size, Hk, slot_size]`
- `block_table`
- `seq_lens`
- `slot_mapping`
- optional TriAttention validity mask

## Install command inside a vLLM checkout

This modifies the vLLM source tree and should only be run after infra confirmation.

```bash
python /path/to/turboquant-cuda-bench/07-scripts/vllm-hook/patch-turboquant-attn.py \
  --vllm-root /home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
```

## Runtime env

```bash
export VLLM_EPKV_HOOK=1
export VLLM_EPKV_HOOK_LOG=/home/felipe/vllm-lab/evidence-paged-kv-hook/events.jsonl
export VLLM_EPKV_HOOK_MAX_EVENTS=64
export VLLM_EPKV_HOOK_TAG=phase0-scout
```

Then start vLLM normally. The hook will log at most `MAX_EVENTS` decode-boundary events and continue through original TurboQuant attention.

## Expected output

JSONL events containing:

- query shape/dtype/stride/device;
- KV-cache shape/dtype/stride/device;
- block table / sequence metadata shapes;
- head count, KV head count, head dimension, KV group;
- TurboQuant layout fields such as key packed size and value quant bits.

## Next step after observe-only

If the boundary is stable, build the offline vLLM-layout harness:

```txt
vLLM block_table + TQ slot layout -> selected evidence rows/pages -> v4/v5-style score/top-k/value path
```
