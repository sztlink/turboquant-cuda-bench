# Evidence-utilization ↔ Evidence-Paged KV bridge — tokenized offline v0.1

> Status: offline tokenized bridge. Tokenizer only; no model inference, no serving, no real EPKV selection.

## Boundary

```txt
bridge_version: v0.1-tokenized
runtime mode: offline_metadata_tokenized
tokenizer: local Qwen tokenizer via offset_mapping
chat template: manual Qwen2.5 im_start/im_end template
block_size: 16
```

## Readout

- records: 16
- mean chat prompt tokens: 1222.4
- canonical page span min/max pages: 3 / 4
- max decoy spans per record: 15

## What changed from v0

- v0 had exact char spans and heuristic token spans (`chars_per_token=3.6`).
- v0.1 keeps the same fixture ids and adds exact tokenizer offset spans.
- each record now has `canonical_token_span_exact`, `canonical_page_range`, and decoy `page_range` fields.

## Caveats

- page ranges are derived from tokenizer positions and `block_size=16`; they are not observed vLLM scheduler allocations.
- manual Qwen2.5 chat template is used because the local tokenizer config does not expose `chat_template`.
- still no answer observation and no real selected-position trace.

## Output files

```txt
records.jsonl
summary.json
RESULTS.md
```

## Non-claims

- no serving claim
- no model-quality claim
- no real EPKV selection trace
- no real vLLM KV cache allocation claim
- no leaderboard score

## Next step

Use these token/page ranges as the frozen alignment target for an offline selected-position replay or for a later dry-run serving trace only after the absolute telemetry gate and serving baseline are accepted.
