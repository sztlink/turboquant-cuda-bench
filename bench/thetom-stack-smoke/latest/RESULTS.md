# TheTom stack smoke receipt

Date: 2026-05-09T22:27:57.482Z

## Scope

No public claim. This is a local adapter smoke for three public TheTom surfaces:

- tqkit: KV-cache math and backend receipt surface.
- longctx-svc: local retrieval sidecar / proxy.
- REFRACT: reference-anchored quality audit reports.

## Paths

- tqkit: ok - `/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/tqkit-clone`
- turboquantPlus: ok - `/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/turboquant_plus-clone`
- longctx: ok - `/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/longctx-clone`
- longctxDeps: ok - `/home/aya/implante/tmp/python-deps/longctx-svc-smoke`

## tqkit

### backends

Command: `python3 -m tqkit.cli backends`

```text
backend        available  version                        notes
--------------------------------------------------------------------------------
llama.cpp      no         -                              install from TheTom/llama.cpp@feature/turboquant-kv-cache
vllm           no         -                              pip install vllm (or use TheTom/vllm forks for TQ+)
mlx            no         -                              pip install mlx (or build TheTom/mlx@feature/turboquant-plus)
vllm-swift     no         -                              brew install thetom/vllm-swift
```

### reportQwen14b32k

Command: `python3 -m tqkit.cli report --model qwen2.5-14b-instruct-1m --ctx 32K --layout tq+asym`

```text
[KV cache] model: Qwen/Qwen2.5-14B-Instruct-1M
[KV cache] arch: layers=48 kv_heads=8 head_dim=128
[KV cache] layout: tq+asym
[KV cache] per-token: 73.5 KB (vs 192.0 KB FP16)
[KV cache] total @ 32K ctx: 2.3 GB (vs 6.0 GB FP16, 61.7% savings)
```

### strategiesQwen14b128k

Command: `python3 -m tqkit.cli compare-strategies --model qwen2.5-14b-instruct-1m --ctx 128K`

```text
# Qwen/Qwen2.5-14B-Instruct-1M — KV cache savings strategies @ 128K ctx
# (assuming retrieval keeps 3,000 tokens)

| strategy | KV cache | savings vs baseline | notes |
| -------- | -------- | ------------------- | ----- |
| baseline (FP16, full ctx) | 24.0 GB | — | no compression, no retrieval |
| TQ+ asym (compress, full ctx) | 9.2 GB | 61.72% | K=FP8, V=4bit + metadata |
| longctx (FP16, top-K only) | 562.5 MB | 97.71% | retrieve relevant chunks, no compression |
| longctx + TQ+ asym (combined) | 215.3 MB | 99.12% | the most efficient KV cache is the one you never allocate |
```

### tableQwen35b

Command: `python3 -m tqkit.cli table --model qwen3.6-35b-a3b --ctxs 18000 32768 65000 1M --layouts fp16 q8_0 tq+asym turbo4`

```text
# Qwen/Qwen3.6-35B-A3B — KV cache size by layout × context

| layout | per-token | 17K | 32K | 63K | 1M | savings vs FP16 |
| ------ | --------- | --- | --- | --- | --- | --- |
| fp16 | 20.0 KB | 351.6 MB | 640.0 MB | 1.2 GB | 20.0 GB | — |
| q8_0 | 10.0 KB | 175.8 MB | 320.0 MB | 634.8 MB | 10.0 GB | 50% |
| tq+asym | 7.7 KB | 134.6 MB | 245.0 MB | 486.0 MB | 7.7 GB | 62% |
| turbo4 | 5.2 KB | 92.0 MB | 167.5 MB | 332.3 MB | 5.2 GB | 74% |
```

### tableQwen27b

Command: `python3 -m tqkit.cli table --model qwen3.6-27b --ctxs 32768 65000 128K 1M --layouts fp16 q8_0 tq+asym turbo4`

```text
# Qwen/Qwen3.6-27B — KV cache size by layout × context

| layout | per-token | 32K | 63K | 128K | 1M | savings vs FP16 |
| ------ | --------- | --- | --- | --- | --- | --- |
| fp16 | 64.0 KB | 2.0 GB | 4.0 GB | 8.0 GB | 64.0 GB | — |
| q8_0 | 32.0 KB | 1.0 GB | 2.0 GB | 4.0 GB | 32.0 GB | 50% |
| tq+asym | 24.5 KB | 784.0 MB | 1.5 GB | 3.1 GB | 24.5 GB | 62% |
| turbo4 | 16.8 KB | 536.0 MB | 1.0 GB | 2.1 GB | 16.8 GB | 74% |
```

## REFRACT

Command: `python3 -m refract.cli compare refract/examples/catastrophic-symturbo.json refract/examples/clean-q8q8-mistral24b.json refract/examples/degraded-qwen7b.json refract/examples/distribution-broken-gemma26b.json`

```text
Report                              Comp Band          Traj     KLD  R-NIAH    PLAD
--------------------------------------------------------------------------------
catastrophic-symturbo              11.03 FAIL          3.93   11.84  100.00   72.21
clean-q8q8-mistral24b              90.86 EXCELLENT    76.65   99.71  100.00   91.34
degraded-qwen7b                    77.98 DEGRADED     55.13   98.75  100.00   76.73
distribution-broken-gemma26b       29.12 FAIL         17.32   17.59  100.00   78.40
```

## longctx-svc

### dependency probe

```json
{
  "fastapi": "ok",
  "httpx": "ok",
  "pathspec": "ok",
  "pydantic": "ok",
  "rank_bm25": "ok",
  "sentence_transformers": "ModuleNotFoundError",
  "uvicorn": "ok",
  "watchdog": "ok"
}
```

### version

Command: `python3 -m longctx_svc.cli version`

```text
0.3.0a3
```

### healthz

Command: `bash -lc "set -e\nrm -f /tmp/thetom-longctx-smoke.log /tmp/thetom-longctx-health.json /tmp/thetom-longctx-status.txt\nPYTHONPATH=\"/home/aya/implante/tmp/python-deps/longctx-svc-smoke:/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/longctx-clone/services/longctx-svc:/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/longctx-clone\" LONGCTX_NO_JANITOR=1 timeout 12s python3 -m longctx_svc.cli serve --host 127.0.0.1 --port 8876 > /tmp/thetom-longctx-smoke.log 2>&1 &\npid=$!\nfor i in $(seq 1 50); do\n  if curl -fsS http://127.0.0.1:8876/healthz > /tmp/thetom-longctx-health.json 2>/tmp/thetom-longctx-curl.err; then\n    curl -fsS -H 'Accept: text/plain' http://127.0.0.1:8876/longctx/status > /tmp/thetom-longctx-status.txt 2>/tmp/thetom-longctx-status.err || true\n    kill $pid 2>/dev/null || true\n    wait $pid 2>/dev/null || true\n    echo 'healthz:'\n    cat /tmp/thetom-longctx-health.json\n    echo '\nstatus:'\n    cat /tmp/thetom-longctx-status.txt || true\n    echo '\nlog:'\n    sed -n '1,80p' /tmp/thetom-longctx-smoke.log\n    exit 0\n  fi\n  sleep 0.2\ndone\necho 'healthz failed'\nsed -n '1,160p' /tmp/thetom-longctx-smoke.log || true\nkill $pid 2>/dev/null || true\nwait $pid 2>/dev/null || true\nexit 1"`

```text
healthz:
{"status":"ok","version":"0.3.0a3"}
status:
[longctx] mode: local-only
[longctx] memory: 0 scopes loaded, 0.0 MB total
[longctx] disk cache: /home/aya/.longctx, 0 scopes, 0.0 MB
log:
INFO:     Started server process [3102332]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8876 (Press CTRL+C to quit)
longctx-svc serving on http://127.0.0.1:8876 (local-only)
INFO:     127.0.0.1:55318 - "GET /healthz HTTP/1.1" 200 OK
INFO:     127.0.0.1:55326 - "GET /longctx/status HTTP/1.1" 200 OK
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Finished server process [3102332]
```

## Interpretation

- tqkit is immediately usable as a metadata/receipt adapter for CUDA bench notes.
- REFRACT examples can be parsed now; live scores still require model files and backend binaries.
- longctx-svc boots locally when minimal web dependencies are supplied via PYTHONPATH. Retrieval requires sentence-transformers or a configured embedder path.
