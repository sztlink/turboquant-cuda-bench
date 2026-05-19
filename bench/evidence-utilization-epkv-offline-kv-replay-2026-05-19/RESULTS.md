# Evidence-utilization ↔ Evidence-Paged KV bridge — offline KV replay v0.3

> Status: offline tensor/topK replay. Synthetic Q/K tensors, real dot-product topK selection, no serving, no model inference.

## Boundary

```txt
bridge_version: v0.3-offline-kv-replay
runtime_replay.mode: real_offline_synthetic_kv_topk_replay
policy: aggregate_proxy_query_mix_over_span_labeled_synthetic_keys
Hq/Hk/D/K: 28/4/64/32
block_size: 16
```

## Readout

- records: 16
- selected-position samples: 16/16
- selected positions total: 14336
- seq_len range: 817..1549
- dominant regions: {"neither":6,"decoy":6,"canonical":4}
- proxy dominant answer classes: {"canonical":8,"decoy":8}
- probe alignment with proxy class: 62.5% (16/16 alignable)
- mean query-label region consistency, heads: 100.0%
- mean query-label region consistency, positions: 100.0%

The query-label consistency is expected from the synthetic tensor construction: query-head labels are derived from aggregate proxy rates and key regions are span-labeled. The proxy-class alignment is only a probe readout, not behavioral evidence.

## What this validates

- token/page bridge records can construct synthetic Q/K tensors;
- Phase-2a-like score + topK selection emits `selected_positions_sample`-shaped data;
- selected token positions can be compared against canonical/decoy token spans and page ranges;
- serving is not required to test this bridge schema path.

## What this does not validate

- not model attention;
- not answer behavior;
- not serving latency;
- not EPKV quality or speedup;
- not a real vLLM scheduler allocation or real KV cache from a prompt.

## Output files

```txt
records.jsonl
summary.json
RESULTS.md
```

## Next step

Either stop here and publish no claims, or build a narrower offline harness that invokes the actual Python runtime score/topK function with synthetic packed TurboQuant-shaped cache tensors. Real-prompt hook-on remains paused.

## Non-claims

- no serving claim
- no model-quality claim
- no model attention claim
- no real prompt hook-on trace
- no production attention claim
- no evidence that EPKV fixes retrieved-not-used
- probe alignment is induced by synthetic tensor construction, not behavioral evidence
