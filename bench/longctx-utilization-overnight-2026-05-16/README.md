# Longctx utilization overnight — 2026-05-16

Sanitized promotion of the overnight long-context decoy/utilization reruns from AYA2 → 4090.

## Scope

This package preserves the **sanitized summaries** of two runs:

1. `project-a-isolation`: rerun of the 8-handle decoy isolation fixture.
2. `project-b-resolution`: targeted 4-handle resolution run with reranker/query rewrite/policy splice.

The raw request/response JSON, retrieve dumps, and debug dumps remain local staging under `/home/aya/implante/tmp/` unless reviewed for promotion. This package is safe to use for methodology notes because it contains only synthetic fixture handles/answers and aggregate summaries.

## Runtime

```txt
Host path: AYA2 nohup -> ssh 4090 Windows
Server: C:\turbo-build\build-head3\bin\llama-server.exe
Model: C:\models\q36_27b_new.gguf
Context: 196608
ctk: q8_0
ctv: turbo3
flash-attn: on
longctx-svc: local proxy on AYA2
```

The 4090 production `LlamaServer-AutoStart` service was restored after both jobs.

## Entry points

```txt
RESULTS.md
sanitized-overnight-summary.json
sanitized-resolution-summary.json
project-a-isolation/summary.parsed.json
project-b-resolution/summary.parsed.json
```

## Privacy boundary

No Discord-derived chunks are included here. This is the synthetic longctx decoy fixture, not the Tecnofagia Discord fixture.

No public claim should be broader than:

```txt
On this fixture, retrieval reached context while answer closure failed; evidence elevation by filtered splice, oracle, or reranker closed the gap.
```
