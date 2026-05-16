# Longctx utilization expanded n=24 — synthetic staging confirmation

Date: 2026-05-16
Status: material canon / synthetic staging evidence

This package extends the 2026-05-16 retrieval-utilization confirmation from n=8 to a 24-target synthetic fixture.

It intentionally excludes raw retrieved chunks, raw debug dumps, and full chat-completion payloads. Those remain local staging only.

## Scope

Runtime:

```txt
host: 4090 via AYA2-anchored ssh
server: C:\turbo-build\buun\build-may1\bin\llama-server.exe
model: C:\models\q36_27b_new.gguf
ctx: 196608
ctk: q8_0
ctv: turbo3
longctx-svc: proxy mode, no rerank
fixture: synthetic, 24 target handles, decoy-heavy corpus
```

Arms:

```txt
baseline_proxy
anti_decoy_proxy
filtered_splice
```

`rerank_proxy` was deliberately skipped in this package. A separate smoke showed the rerank path can hang `longctx-svc`; it should be fixed as a separate structural issue before being mixed into this benchmark.

## Result

See [`RESULTS.md`](RESULTS.md).

Short read:

```txt
baseline_proxy:   9/24 answer hits, 19/24 retrieval hits
anti_decoy_proxy: 9/24 answer hits, 19/24 retrieval hits
filtered_splice:  19/24 answer hits, 19/24 retrieval hits
```

Interpretation:

```txt
When canonical evidence was retrieved, filtered splice closed 19/19.
Prompting alone did not improve baseline closure.
The measured gap remains retrieval-utilization, not merely retrieval.
```

## Structural infra note

Before this run, the 4090 watchdog path was repaired after Windows Device Guard / Application Control blocked several prior `llama-server.exe` builds. The canonical production server path for this run was changed to:

```txt
C:\turbo-build\buun\build-may1\bin\llama-server.exe
version: 9304 (aecbbd5da)
```

A required preflight now lives on the 4090 host:

```txt
C:\ops\llama-server-preflight.ps1
C:\ops\llama-server-preflight-last.json
```

Rule: do not disable `LlamaServer-AutoStart` or kill the service before validating that the benchmark binary is runnable on the 4090 host.

## Files

```txt
README.md
RESULTS.md
sanitized-summary.json
summary.parsed.json
remote-llama-server-preflight.json
run.log
SHA256SUMS.txt
```

`summary.parsed.json` contains row-level synthetic summaries only. Raw request/response payloads, retrieval dumps, and debug dumps are not promoted.
