# longctx-svc proxy smoke, 4090 Qwen3.6 27B @ 192K turbo4

Date: 2026-05-10.

Purpose: first end-to-end test of TheTom `longctx-svc` in proxy mode in front of `llama-server`, using the stable TurboQuant base from the prior benches: Qwen3.6 27B dense, ctx 192K, `q8_0/turbo4`, RTX 4090.

## Setup

- Upstream: `llama-server.exe -m C:\models\q36_27b_new.gguf -ngl 99 -fa 1 -ctk q8_0 -ctv turbo4 -c 196608 -np 1 --host 127.0.0.1 --port 18080 --no-warmup --reasoning off --reasoning-budget 0` on 4090.
- Proxy: local `longctx-svc serve --upstream http://127.0.0.1:18081`, with SSH tunnel to the 4090 server.
- Corpus: synthetic local project under `corpus/longctx-lab`, 900 markdown shards plus sentinel `package.json`, larger than 272K tokens by construction.
- Task: ask for secret values by natural lookup target. The user prompt mentions only the project path and target handle, not the secret value.
- Direct-upstream controls: first 3 targets sent straight to `llama-server` without longctx retrieval.

## Aggregate

| mode | hits/runs | errors | mean chunks used |
|---|---:|---:|---:|
| direct-upstream | 0/3 | 0 | 0.0 |
| longctx-proxy | 10/10 | 0 | 8.0 |

## Rows

| idx | mode | handle | hit | chunks | elapsed | answer excerpt |
|---:|---|---|---:|---:|---:|---|
| 1 | direct-upstream | aurora-blue-compass | no |  | 3.6 s | The provided project path and file (`/home/aya/implante/research/turboquant-cuda-bench/bench/longctx-proxy-2026-05-10/co |
| 2 | direct-upstream | brass-river-index | no |  | 0.3 s | brass-river-index |
| 3 | direct-upstream | ceramic-lantern-field | no |  | 2.3 s | The provided project path and file (`/home/aya/implante/research/turboquant-cuda-bench/bench/longctx-proxy-2026-05-10/co |
| 4 | longctx-proxy | aurora-blue-compass | yes | 8 | 1.9 s | AYA-LONGCTX-AURORA-BLUE-050-Z9 |
| 5 | longctx-proxy | brass-river-index | yes | 8 | 2.0 s | AYA-LONGCTX-BRASS-RIVER-150-Z9 |
| 6 | longctx-proxy | ceramic-lantern-field | yes | 8 | 2.0 s | AYA-LONGCTX-CERAMIC-LANTERN-250-Z9 |
| 7 | longctx-proxy | delta-archive-needle | yes | 8 | 2.0 s | AYA-LONGCTX-DELTA-ARCHIVE-350-Z9 |
| 8 | longctx-proxy | ember-signal-route | yes | 8 | 1.9 s | AYA-LONGCTX-EMBER-SIGNAL-450-Z9 |
| 9 | longctx-proxy | feldspar-memory-gate | yes | 8 | 2.0 s | AYA-LONGCTX-FELDSPAR-MEMORY-550-Z9 |
| 10 | longctx-proxy | glass-orchid-vector | yes | 8 | 2.0 s | AYA-LONGCTX-GLASS-ORCHID-650-Z9 |
| 11 | longctx-proxy | harbor-saffron-node | yes | 8 | 2.0 s | AYA-LONGCTX-HARBOR-SAFFRON-750-Z9 |
| 12 | longctx-proxy | indigo-theater-key | yes | 8 | 1.9 s | AYA-LONGCTX-INDIGO-THEATER-850-Z9 |
| 13 | longctx-proxy | jade-winter-circuit | yes | 8 | 1.9 s | AYA-LONGCTX-JADE-WINTER-950-Z9 |

## Readout

- This checks the actual longctx proxy path: scope detection, indexing, retrieval, request rewrite, llama-server response.
- Direct controls should not know the hidden values unless the model guesses. Longctx proxy should surface retrieved chunks and allow exact answers.
- Treat as a smoke, not a final benchmark. The corpus is synthetic and easy compared with a messy codebase.

## Artifacts

- `summary.jsonl` and `summary.parsed.json`: normalized result records.
- `raw/*.json`: request/response captures.
- `debug-dump/*.json`: longctx rewritten upstream requests.
- `longctx-svc.*.log`, `llama-server.*.log`, `ssh-tunnel.log`: service logs.
- `corpus/longctx-lab`: generated corpus.
