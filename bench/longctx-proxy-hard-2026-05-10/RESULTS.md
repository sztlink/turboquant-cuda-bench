# longctx-svc hard proxy sweep, 4090 Qwen3.6 27B @ 192K turbo4

Date: 2026-05-10.

Purpose: harder follow-up to the first longctx proxy smoke. This uses a larger synthetic project, decoys, natural alias queries, and a top_k sweep to test whether longctx retrieves the correct shard before forwarding to Qwen 27B on the 4090.

## Setup

- Upstream: `llama-server.exe`, Qwen3.6 27B dense, ctx 192K, `q8_0/turbo4`, `-np 1`, reasoning off.
- Proxy: local `longctx-svc` with `LONGCTX_MAX_HOT=5000`, multiquery on, reranker disabled.
- Corpus: `corpus/longctx-hard-lab`, 1800 markdown shards plus decoys and sentinel `package.json`.
- Queries: natural alias plus clue, no file name and no code in the prompt.
- Controls: 4 direct upstream requests without longctx.

## Aggregate

| mode | top_k | answer hits/runs | retrieval hits | errors | mean chunks | mean elapsed | mean prefill tok/s | mean decode tok/s |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| direct-upstream | 0 | 0/4 | 0/4 | 0 | n/a | 0.4 s | 742.4 | 48.4 |
| longctx-proxy | 16 | 5/8 | 8/8 | 0 | 16.0 | 1.5 s | 79.0 | 45.1 |
| longctx-proxy | 2 | 1/8 | 1/8 | 0 | 2.0 | 2.1 s | 2687.9 | 45.2 |
| longctx-proxy | 4 | 5/8 | 3/8 | 0 | 4.0 | 2.2 s | 2574.8 | 45.0 |
| longctx-proxy | 8 | 5/8 | 7/8 | 0 | 8.0 | 1.5 s | 71.2 | 45.0 |

## Rows

| idx | mode | k | handle | retrieval | answer hit | chunks | elapsed | answer excerpt |
|---:|---|---:|---|---:|---:|---:|---:|---|
| 1 | direct-upstream | 0 | aurora-blue-compass |  | no |  | 0.7 s | blue_compass_calibration_secret_value |
| 2 | direct-upstream | 0 | brass-river-index |  | no |  | 0.4 s | brass_river_index_2026 |
| 3 | direct-upstream | 0 | ceramic-lantern-field |  | no |  | 0.3 s | clay_lantern_field_marker |
| 4 | direct-upstream | 0 | delta-archive-needle |  | no |  | 0.3 s | delta_archive_locator_secret_value |
| 5 | longctx-proxy | 2 | aurora-blue-compass | no | no | 2 | 1.4 s | DECOY-1688-0 |
| 6 | longctx-proxy | 2 | brass-river-index | no | no | 2 | 1.4 s | DECOY-0616-1 |
| 7 | longctx-proxy | 2 | ceramic-lantern-field | yes | no | 2 | 2.4 s | The provided context contains only decoy records (shard 1232 and shard 1021) which explicitly state they are **not** the |
| 8 | longctx-proxy | 2 | delta-archive-needle | no | no | 2 | 1.4 s | DECOY-1004-3 |
| 9 | longctx-proxy | 2 | ember-signal-route | no | no | 2 | 1.4 s | DECOY-0565-4 |
| 10 | longctx-proxy | 2 | feldspar-memory-gate | no | yes | 2 | 1.6 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| 11 | longctx-proxy | 2 | glass-orchid-vector | no | no | 2 | 3.9 s | The provided text explicitly states that the "glass orchid vector sheet" is a **DECOY LOOKUP** and that the values assoc |
| 12 | longctx-proxy | 2 | jade-winter-circuit | no | no | 2 | 3.8 s | The provided text snippets (shard 0725 and shard 1147) explicitly state that the mention of "jade winter circuit card" a |
| 13 | longctx-proxy | 4 | aurora-blue-compass | no | yes | 4 | 1.5 s | AYA-HARD-AURORA-BLUE-050-Z9 |
| 14 | longctx-proxy | 4 | brass-river-index | no | no | 4 | 1.5 s | DECOY-0616-1 |
| 15 | longctx-proxy | 4 | ceramic-lantern-field | yes | yes | 4 | 1.6 s | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| 16 | longctx-proxy | 4 | delta-archive-needle | no | yes | 4 | 1.6 s | AYA-HARD-DELTA-ARCHIVE-440-Z9 |
| 17 | longctx-proxy | 4 | ember-signal-route | yes | yes | 4 | 1.6 s | AYA-HARD-EMBER-SIGNAL-570-Z9 |
| 18 | longctx-proxy | 4 | feldspar-memory-gate | yes | yes | 4 | 1.6 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| 19 | longctx-proxy | 4 | glass-orchid-vector | no | no | 4 | 4.0 s | The provided context snippets (shards 0742, 1375, 1164, 1586) explicitly state that the "glass orchid vector sheet" look |
| 20 | longctx-proxy | 4 | jade-winter-circuit | no | no | 4 | 4.0 s | The provided context snippets (shards 0725, 1147, 1358, 0936) explicitly state that the "jade winter circuit card" looku |
| 21 | longctx-proxy | 8 | aurora-blue-compass | yes | yes | 8 | 0.9 s | AYA-HARD-AURORA-BLUE-050-Z9 |
| 22 | longctx-proxy | 8 | brass-river-index | yes | no | 8 | 0.8 s | DECOY-0616-1 |
| 23 | longctx-proxy | 8 | ceramic-lantern-field | yes | yes | 8 | 1.0 s | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| 24 | longctx-proxy | 8 | delta-archive-needle | yes | yes | 8 | 0.9 s | AYA-HARD-DELTA-ARCHIVE-440-Z9 |
| 25 | longctx-proxy | 8 | ember-signal-route | yes | yes | 8 | 0.8 s | AYA-HARD-EMBER-SIGNAL-570-Z9 |
| 26 | longctx-proxy | 8 | feldspar-memory-gate | yes | yes | 8 | 1.0 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| 27 | longctx-proxy | 8 | glass-orchid-vector | yes | no | 8 | 3.3 s | The provided context snippets (shards 0742, 1375, 1164, 1586) explicitly state that the "glass orchid vector sheet" look |
| 28 | longctx-proxy | 8 | jade-winter-circuit | no | no | 8 | 3.4 s | The provided context snippets (shards 0725, 1147, 1358, 0936) explicitly state that the "jade winter circuit card" looku |
| 29 | longctx-proxy | 16 | aurora-blue-compass | yes | yes | 16 | 0.9 s | AYA-HARD-AURORA-BLUE-050-Z9 |
| 30 | longctx-proxy | 16 | brass-river-index | yes | no | 16 | 0.8 s | DECOY-0616-1 |
| 31 | longctx-proxy | 16 | ceramic-lantern-field | yes | yes | 16 | 0.9 s | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| 32 | longctx-proxy | 16 | delta-archive-needle | yes | yes | 16 | 0.8 s | AYA-HARD-DELTA-ARCHIVE-440-Z9 |
| 33 | longctx-proxy | 16 | ember-signal-route | yes | yes | 16 | 0.8 s | AYA-HARD-EMBER-SIGNAL-570-Z9 |
| 34 | longctx-proxy | 16 | feldspar-memory-gate | yes | yes | 16 | 0.9 s | AYA-HARD-FELDSPAR-GATE-700-Z9 |
| 35 | longctx-proxy | 16 | glass-orchid-vector | yes | no | 16 | 3.3 s | The provided context snippets (shards 0742, 1375, 1164, 1586) explicitly state that the "glass orchid vector sheet" look |
| 36 | longctx-proxy | 16 | jade-winter-circuit | yes | no | 16 | 3.3 s | The provided context snippets (shards 0725, 1147, 1358, 0936) explicitly state that the "jade winter circuit card" looku |

## Readout

- This is a proxy-path test, not only `/retrieve`: scope detect, index, retrieve, splice, forward, and answer are all exercised.
- Direct controls should fail because the upstream model cannot read the local corpus without longctx.
- The top_k sweep shows how much retrieval budget is needed for exact-answer recall on this synthetic corpus.
- Still private and synthetic. Use this to choose the next real-codebase test, not as a public claim.

## Artifacts

- `summary.jsonl`, `summary.parsed.json`, `raw/*.json`, `retrieve/*.json`, `debug-dump/*.json`.
- `longctx-svc.*.log`, `llama-server.combined.log`, `ssh-tunnel.log`.
- `corpus/longctx-hard-lab`: generated corpus.
