# Overnight plan — TurboQuant / KVFidelity — 2026-05-15

Context: Felipe offered an 8h unattended window and suggested using the 4090 if idle.

Auditors consulted: Casey Reas + Giselle Beiguelman.

## Live preflight

4090 monitor status at start:

```txt
GPU util: 0%
VRAM: 21807/24564 MB (88.8%)
Disk C: 863.08/930.66 GB (92.7%)
```

Read-only `nvidia-smi`/tasklist showed `llama-server.exe` still resident:

```txt
C:\turbo-build\build-head3\bin\llama-server.exe PID 10940
```

Therefore the 4090 is computationally idle but **not VRAM-free**.

## Casey audit — operational shape

Casey’s core warning: the risk is not lack of benchmark volume; it is confusing a promising trace with a validated claim.

Order recommended for an 8h window:

1. CPU/read-only: audit KVFidelity labels for `idx 0,7,9,11,12,24,26`.
2. CPU/read-only: prepare retrieval-utilization / tokens-to-correct appendix from existing JSONs if source files are present.
3. GPU only after preflight/confirmation: run Tecnofagia minimal cell, not a broad sweep.
4. Synthesize one internal receipt, not a public post.

Do not do:

- no new CASK/AIME overnight before manual audit;
- no public CASK performance claim;
- no broad sweep;
- no publishing raw Discord mapping/logs.

## Giselle audit — archive/privacy shape

Giselle’s core warning: the raw Tecnofagia mapping/logs can leak Discord-derived content indirectly.

Preserve publicly/canonically:

- mapping SHA256;
- mapping size;
- commit hash;
- model/version/dtype;
- handles;
- hit/miss by handle;
- token/timing summary;
- sanitized result table.

Keep local/ignored until review:

- `tecnofagia-mapping.json`;
- raw logs;
- full model answers;
- system prompts/messages containing Discord chunks.

## Best overnight target

If infra is confirmed and VRAM is freed:

```txt
Tecnofagia vLLM Qwen2.5-7B, kv_cache_dtype=auto
```

Optional second cell only if the first finishes cleanly and enough time remains:

```txt
Tecnofagia vLLM Qwen2.5-7B, kv_cache_dtype=turboquant_k8v4
```

Do not expand to more dtype/model sweeps tonight.

## Required infra confirmation

Freeing the 4090 requires stopping/restoring resident services/processes. This is infra mutation.

Required explicit confirmation:

```txt
[CONFIRMAR:INFRA] liberar VRAM da 4090, rodar Tecnofagia auto/turboquant_k8v4 com watcher, e restaurar llama-server ao final.
```

Without that confirmation, safe work is limited to CPU/read-only audit and documentation.

## Expected artifact after successful GPU run

Create sanitized, commit-safe result:

```txt
bench/tecnofagia-discord-2026-05-14/RESULTS.md
```

Do not commit raw:

```txt
bench/tecnofagia-discord-2026-05-14/tecnofagia-mapping.json
bench/tecnofagia-discord-2026-05-14/*.log
bench/tecnofagia-discord-2026-05-14/results-*.json
```
