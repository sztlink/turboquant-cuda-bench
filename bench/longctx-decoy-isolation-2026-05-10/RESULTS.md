# longctx decoy isolation, 4090 Qwen3.6 27B @ 192K turbo4

Date: 2026-05-10.

Purpose: isolate the hard-run failure mode where top_k=16 retrieval found the correct chunk 8/8 but answer accuracy was 5/8.

## Arms

- `baseline_proxy`: same proxy presentation as the hard run, top_k=16.
- `anti_decoy_proxy`: same proxy path, stronger instruction to ignore DECOY and use only `SECRET VALUE`.
- `filtered_splice`: call `/retrieve`, then reorder/drop chunks with a simple SECRET_VALUE/non-DECOY heuristic before sending to upstream.
- `oracle`: send only the known canonical shard to upstream.

## Aggregate

| arm | hits/runs | retrieval hits | errors | mean elapsed | mean prefill tok/s | mean decode tok/s |
|---|---:|---:|---:|---:|---:|---:|
| baseline_proxy | 5/8 | 8/8 | 0 | 3.0 s | 2741.7 | 44.5 |
| anti_decoy_proxy | 5/8 | 8/8 | 0 | 1.8 s | 1969.4 | 44.7 |
| filtered_splice | 8/8 | 8/8 | 0 | 1.8 s | 2810.7 | 45.1 |
| oracle | 8/8 | 8/8 | 0 | 0.9 s | 2244.2 | 46.2 |

## Rows

| arm | handle | hit | retrieval | elapsed | answer excerpt |
|---|---|---:|---:|---:|---|
| baseline_proxy | aurora-blue-compass | yes | yes | 2.3 s | AYA-HARD-AURORA-BLUE-050-Z9 |
| anti_decoy_proxy | aurora-blue-compass | yes | yes | 1.0 s | AYA-HARD-AURORA-BLUE-050-Z9 |
| filtered_splice | aurora-blue-compass | yes | yes | 1.9 s | AYA-HARD-AURORA-BLUE-050-Z9 |
| oracle | aurora-blue-compass | yes | yes | 1.0 s | AYA-HARD-AURORA-BLUE-050-Z9 |
| baseline_proxy | brass-river-index | no | yes | 4.5 s | The provided text snippets explicitly state that the "brass river indexing note" is a **DECOY LOOKUP** and contains **INVALID VALUE**s (e.g. |
| anti_decoy_proxy | brass-river-index | no | yes | 3.3 s | The provided context contains multiple shards (0616, 0405, 1038, 1671) that explicitly label the "brass river indexing note" and "river cata |
| filtered_splice | brass-river-index | yes | yes | 1.7 s | AYA-HARD-BRASS-RIVER-180-Z9 |
| oracle | brass-river-index | yes | yes | 0.9 s | AYA-HARD-BRASS-RIVER-180-Z9 |
| baseline_proxy | ceramic-lantern-field | yes | yes | 2.1 s | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| anti_decoy_proxy | ceramic-lantern-field | yes | yes | 0.9 s | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| filtered_splice | ceramic-lantern-field | yes | yes | 1.9 s | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| oracle | ceramic-lantern-field | yes | yes | 1.0 s | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| baseline_proxy | delta-archive-needle | yes | yes | 2.0 s | AYA-HARD-DELTA-ARCHIVE-440-Z9 |
| anti_decoy_proxy | delta-archive-needle | yes | yes | 0.9 s | AYA-HARD-DELTA-ARCHIVE-440-Z9 |
| filtered_splice | delta-archive-needle | yes | yes | 1.9 s | AYA-HARD-DELTA-ARCHIVE-440-Z9 |
| oracle | delta-archive-needle | yes | yes | 0.9 s | AYA-HARD-DELTA-ARCHIVE-440-Z9 |
| baseline_proxy | ember-signal-route | yes | yes | 2.0 s | AYA-HARD-EMBER-SIGNAL-570-Z9 |
| anti_decoy_proxy | ember-signal-route | yes | yes | 1.0 s | AYA-HARD-EMBER-SIGNAL-570-Z9 |
| filtered_splice | ember-signal-route | yes | yes | 1.9 s | AYA-HARD-EMBER-SIGNAL-570-Z9 |
| oracle | ember-signal-route | yes | yes | 0.9 s | AYA-HARD-EMBER-SIGNAL-570-Z9 |
| baseline_proxy | feldspar-memory-gate | yes | yes | 2.2 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| anti_decoy_proxy | feldspar-memory-gate | yes | yes | 0.9 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| filtered_splice | feldspar-memory-gate | yes | yes | 1.9 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| oracle | feldspar-memory-gate | yes | yes | 1.0 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| baseline_proxy | glass-orchid-vector | no | yes | 4.6 s | The provided context snippets (shards 0742, 1375, 1164, 1586) explicitly state that the "glass orchid vector sheet" lookup is a **DECOY** an |
| anti_decoy_proxy | glass-orchid-vector | no | yes | 3.4 s | The provided context does not contain a valid SECRET VALUE for the "glass orchid vector sheet". All retrieved shards (0742, 1375, 1164, 1586 |
| filtered_splice | glass-orchid-vector | yes | yes | 1.7 s | AYA-HARD-GLASS-ORCHID-830-Z9 |
| oracle | glass-orchid-vector | yes | yes | 1.0 s | AYA-HARD-GLASS-ORCHID-830-Z9 |
| baseline_proxy | jade-winter-circuit | no | yes | 4.4 s | The provided context snippets (shards 0725, 1147, 1358, 0936) explicitly state that the "jade winter circuit card" lookup is a **DECOY** and |
| anti_decoy_proxy | jade-winter-circuit | no | yes | 3.4 s | The provided context does not contain a valid SECRET VALUE for the "jade winter circuit card". All retrieved shards (0725, 1147, 1358, 0936) |
| filtered_splice | jade-winter-circuit | yes | yes | 1.6 s | AYA-HARD-JADE-WINTER-960-Z9 |
| oracle | jade-winter-circuit | yes | yes | 0.9 s | AYA-HARD-JADE-WINTER-960-Z9 |

## Readout

- If `oracle` is 8/8, the model can answer when the right shard is isolated.
- If `filtered_splice` improves over `baseline_proxy`, the issue is presentation/ranking/splice, not model inability.
- If `anti_decoy_proxy` improves, prompt wording alone mitigates the decoy contamination.
- This remains synthetic/private and is meant as an actionable diagnostic for TheTom, not a public claim.

## Artifacts

- `summary.jsonl`, `summary.parsed.json`, `raw/*.json`, `retrieve/*.json`.
- `llama-server.combined.log`, `longctx-svc.*.log`, `debug-dump/*.json`.
