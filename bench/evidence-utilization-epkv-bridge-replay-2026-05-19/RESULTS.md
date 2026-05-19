# Evidence-utilization ↔ Evidence-Paged KV bridge — synthetic replay v0.2

> Status: deterministic offline selected-position replay. No model, no vLLM, no real EPKV selection.

## Boundary

```txt
bridge_version: v0.2-synthetic-replay
runtime_replay.mode: synthetic_offline_selected_position_replay
policy: aggregate_proxy_biased_schema_replay
Hq: 28
K: 32
```

## Readout

- records: 16
- dominant regions: {"canonical":8,"decoy":8}
- proxy dominant answer classes: {"canonical":8,"decoy":8}
- synthetic alignment rate: 100.0% (16/16 alignable)

This alignment rate is expected by construction because the replay policy is aggregate-proxy-biased. It validates schema plumbing only; it is not a behavioral result.

## What this validates

- the record schema can carry `selected_positions_sample`-shaped data;
- token/page evidence spans can be compared against selected positions;
- per-record overlap fields can be computed: canonical heads, decoy heads, dominant region, alignment flag.

## What this does not validate

- not model attention;
- not actual EPKV scoring;
- not vLLM scheduler allocation;
- not answer quality or serving behavior.

## Output files

```txt
records.jsonl
summary.json
RESULTS.md
```

## Next step

If this schema is accepted, the next non-serving step is a real offline KV replay: construct synthetic Q/KV tensors for these token/page ranges and run the Phase 2a selected-page path, still without serving prompts through the hook.

## Non-claims

- no serving claim
- no model-quality claim
- no real EPKV selection trace
- no model attention claim
- synthetic alignment is not evidence of causal behavior
- no leaderboard score
