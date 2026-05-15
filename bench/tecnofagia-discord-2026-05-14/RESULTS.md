# Tecnofagia Discord decoy results — 2026-05-15

Status: **partial success**.

The sanitized `auto` cell ran successfully on the RTX 4090. The `turboquant_k8v4` cell did **not** produce a result because the custom TurboQuant vLLM environment failed before model load.

No prompts, Discord chunks, raw model answers, or full logs are committed here.

## Inputs

```txt
repo_commit: 6b802f2
mapping_sha256: 8982858944b1e7fc9e38ea7d1e433f4c52b3507b2e92391c11f07a1132941736
mapping_size_bytes: 95025
fixture: 5 hit-class handles, canonical chunk preserved, decoys replaced by Discord/Waffle chunks
```

Raw local-only fixture, intentionally ignored:

```txt
bench/tecnofagia-discord-2026-05-14/tecnofagia-mapping.json
```

## 4090 operational note

Preflight showed the 4090 idle in compute but occupied in VRAM by `llama-server.exe`:

```txt
before: 21757 MiB / 24564 MiB
free step: disabled/ended LlamaServer-AutoStart
run state: 215 MiB / 24564 MiB before vLLM
restore: LlamaServer-AutoStart re-enabled and run
```

Post-run check confirmed `llama-server.exe` was restored.

## Result: vLLM auto

```txt
model: Qwen/Qwen2.5-7B-Instruct
vllm_version: 0.20.2
kv_cache_dtype: auto
max_model_len: 16384
n_prompts: 5
n_hits: 5/5
privacy: sanitized: no prompts, no Discord chunks, no model answers
```

| handle | hit | prompt_tok | out_tok | gen_time_s | answer_chars |
|---|---:|---:|---:|---:|---:|
| `aurora-blue-compass` | true | 10210 | 17 | 3.4 | 27 |
| `ceramic-lantern-field` | true | 9670 | 18 | 1.14 | 31 |
| `delta-archive-needle` | true | 5942 | 17 | 0.76 | 29 |
| `ember-signal-route` | true | 11888 | 15 | 1.33 | 28 |
| `feldspar-memory-gate` | true | 9678 | 17 | 1.13 | 29 |

Interpretation:

```txt
The 5/5 hit-class invariant survived replacement of synthetic decoys with real Discord/Waffle decoys under vLLM auto/BF16.
```

This is a long-context/retrieval-utilization result. It is **not** a CASK/AIME/KVFidelity benchmark result.

## Attempted result: turboquant_k8v4

No valid `turboquant_k8v4` result was produced.

The custom TurboQuant vLLM environment failed during import before model load. The unattended log captured:

```txt
ImportError: libcudart.so.13: cannot open shared object file: No such file or directory
```

A prior manual probe with CUDA library paths exposed also indicated custom extension / torch ABI mismatch. Therefore this result should be recorded as:

```txt
turboquant_k8v4: not measured — environment failure before run
```

Do not compare `auto 5/5` against TurboQuant from this cell.

## Canonical sanitized artifact

```txt
bench/tecnofagia-discord-2026-05-14/sanitized-results-auto-20260515-015428.json
```

Local-only raw/operational files:

```txt
/home/aya/implante/tmp/tecnofagia-overnight-2026-05-15.log
/home/aya/implante/tmp/tecnofagia-overnight-2026-05-15/results-auto-20260515-015428.json
```

## Next step

Before rerunning TurboQuant:

1. repair or rebuild the custom vLLM TurboQuant environment;
2. smoke-test `from vllm import LLM` and a tiny `kv_cache_dtype=turboquant_k8v4` model init;
3. only then rerun this same sanitized fixture.
