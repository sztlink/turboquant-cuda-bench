# Evidence-Paged KV vLLM hook scout — 2026-05-19

## Status

Observe-only hook was applied to the 4090 vLLM TurboQuant checkout and the service was restarted successfully.

This is **runtime contact**, not a production attention replacement.

## Production target

```txt
host: 4090 render server / WSL Ubuntu-24.04
vLLM checkout: /home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
vLLM commit: 36fc048
backend: vllm/v1/attention/backends/turboquant_attn.py
service: VLLM-AutoStart
endpoint: http://192.168.15.133:11435/v1
model: Qwen/Qwen2.5-7B-Instruct
served names: local-vllm, qwen2.5-7b-tq
kv_cache_dtype: turboquant_k8v4
```

## Applied hook

Local scaffold:

```txt
07-scripts/vllm-hook/evidence_paged_kv/hook.py
07-scripts/vllm-hook/patch-turboquant-attn.py
```

Remote patch:

```txt
vllm/v1/attention/evidence_paged_kv/hook.py
vllm/v1/attention/backends/turboquant_attn.py
```

Startup env block added to:

```txt
/home/felipe/vllm-lab/start-vllm-11435.sh
```

Env:

```txt
VLLM_EPKV_HOOK=1
VLLM_EPKV_HOOK_LOG=/home/felipe/vllm-lab/evidence-paged-kv-hook/events.jsonl
VLLM_EPKV_HOOK_MAX_EVENTS=64
VLLM_EPKV_HOOK_TAG=phase0-scout-2026-05-19
```

## Smoke test

After restart:

```txt
/health -> HTTP 200
chat smoke: 17 * 23 -> 391
```

## Observed decode boundary

Captured from `events.jsonl` after smoke:

```txt
events: 64
hook: evidence_paged_kv.decode.observe.v0
mode: observe_only
decision: delegate_to_original_turboquant_decode
```

First observed tensor boundary:

```txt
query.shape: [1, 28, 128]
query.dtype: torch.bfloat16
query.stride: [3584, 128, 1]

kv_cache.shape: [15442, 16, 4, 196]
kv_cache.dtype: torch.uint8
kv_cache.stride: [12544, 784, 196, 1]
block_size: 16
num_kv_heads: 4
slot_size: 196

block_table.shape: [1, 4096]
seq_lens.shape: [1]
slot_mapping.shape: [1]
query_start_loc.shape: [2]
triatt_valid_mask.shape: [1, 45]
```

TurboQuant layout at boundary:

```txt
kv_cache_dtype: turboquant_k8v4
num_heads: 28
num_kv_heads: 4
kv_group: 7
head_size: 128
scale: 0.08838834764831845
key_fp8: true
key_mse_bits: 0
key_packed_size: 128
value_quant_bits: 4
value_centroid: false
rotate_values: false
```

## Interpretation

The hook boundary is viable:

- query is available in `[B,Hq,D]` form;
- compressed TurboQuant KV cache is available as packed `uint8` slots;
- block table and sequence metadata are available;
- TriAttention validity mask is available;
- original TurboQuant decode remains untouched.

Important correction for the next phase:

```txt
The current production path is FP8-K + 4-bit-V inside a packed slot_size=196 layout.
```

So the v4/v5 offline harness must move from the synthetic receipt layout toward the actual vLLM TurboQuant slot layout.

## Artifacts

```txt
summary.json
events.jsonl
```

## Non-claims

- Not a production attention kernel.
- Not a serving speedup claim.
- Not a quality or answer-closure improvement claim.
- Not a comparison against PagedAttention/FlashAttention.
- Not yet selected-evidence execution.

## Next step

Phase 1 should build an offline harness against vLLM-like layout:

```txt
block_table + seq_lens + packed TQ slot layout
→ selected evidence rows/pages
→ v4/v5-style score/top-k/value path
→ compare against original TurboQuant decode on selected subset
```
