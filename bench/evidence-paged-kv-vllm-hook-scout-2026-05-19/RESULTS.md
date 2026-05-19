# Evidence-Paged KV vLLM hook scout — 2026-05-19

## Status

Phase 0/1 scaffold prepared. No production vLLM source was modified and the 4090 service was not restarted.

## Read-only scout

Current production vLLM checkout on the 4090:

```txt
/home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
commit: 36fc048
backend: vllm/v1/attention/backends/turboquant_attn.py
```

Relevant decode boundary:

```txt
TurboQuantAttentionImpl._decode_attention(
    query: [B, Hq, D],
    kv_cache: [num_blocks, block_size, Hk, slot_size],
    attn_metadata: TurboQuantMetadata,
    Pi,
    centroids,
    PiT,
    layer,
)
```

Metadata available at boundary:

```txt
attn_metadata.block_table
attn_metadata.seq_lens
attn_metadata.slot_mapping
attn_metadata.query_start_loc
attn_metadata.max_seq_len
attn_metadata.triatt_valid_mask
```

## Hook scaffold

Created local, not applied to production:

```txt
07-scripts/vllm-hook/evidence_paged_kv/hook.py
07-scripts/vllm-hook/patch-turboquant-attn.py
07-scripts/vllm-hook/README.md
```

The hook is observe-only:

```txt
VLLM_EPKV_HOOK=1 -> log decode-boundary metadata -> delegate to original TurboQuant decode
```

It does not replace attention and does not claim speedup.

## Why this insertion point

This is the narrowest current point where v4/v5 needs can meet vLLM runtime data:

- query vector is available;
- compressed TQ KV cache is available;
- vLLM block table is available;
- sequence lengths and optional TriAttention validity mask are available;
- original TurboQuant decode can remain unchanged.

## Next action requires infra confirmation

To apply and test on the 4090, run the patch in the vLLM checkout, enable env vars in the startup script or a one-shot shell, restart vLLM, perform a tiny decode smoke, collect JSONL events, then restore/validate `/health`.

Required confirmation:

```txt
CONFIRMAR:INFRA aplicar hook observe-only Evidence-Paged KV no vLLM da 4090 e reiniciar serviço
```

## Non-claims

- Not production attention.
- Not a vLLM integration claim yet.
- Not a serving speedup claim.
- Not a quality/evidence-utilization claim.
- Not a comparison against PagedAttention/FlashAttention.
