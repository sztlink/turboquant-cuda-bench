# Tecnofagia Discord decoy results — 2026-05-15

Status: **success for the two narrow cells run**.

The sanitized `auto` cell ran successfully on the RTX 4090. After rebuilding the custom TurboQuant vLLM fork in a fresh venv, the sanitized `turboquant_k8v4` cell also ran successfully.

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

Post-run check initially exposed that the earlier low-risk `C:\temp` cleanup had removed `C:\temp\server-watchdog.bat`, causing `LlamaServer-AutoStart` to exit with result `1`. The watchdog was recreated with the previous task intent (`q8_0` K + `turbo3` V, 65K context, port 11435), and final health check returned HTTP 200 with VRAM back at ~21.7 GiB.

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

## Result: turboquant_k8v4

The first attempt failed before model load due a mutated custom vLLM environment. A second attempt rebuilt from a fresh venv following the local build guide:

```txt
bench/vllm-smoke-2026-05-10/BUILD-CUDA.md
```

Fresh build anchor:

```txt
venv: /home/felipe/vllm-lab/venv-tq-fresh-20260515
source: /home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
commit: 36fc048
torch: 2.11.0+cu130
vllm: 0.1.dev1+g36fc04825
import smoke: TQ_IMPORT_OK
```

Sanitized result:

```txt
model: Qwen/Qwen2.5-7B-Instruct
vllm_version: 0.1.dev1+g36fc04825
kv_cache_dtype: turboquant_k8v4
max_model_len: 16384
n_prompts: 5
n_hits: 5/5
privacy: sanitized: no prompts, no Discord chunks, no model answers
```

| handle | hit | prompt_tok | out_tok | gen_time_s | answer_chars |
|---|---:|---:|---:|---:|---:|
| `aurora-blue-compass` | true | 10210 | 17 | 4.05 | 27 |
| `ceramic-lantern-field` | true | 9670 | 18 | 1.18 | 31 |
| `delta-archive-needle` | true | 5942 | 17 | 0.78 | 29 |
| `ember-signal-route` | true | 11888 | 15 | 1.35 | 28 |
| `feldspar-memory-gate` | true | 9678 | 17 | 1.15 | 29 |

Engine init notes from the log:

```txt
Using TURBOQUANT attention backend
KV cache size: 197,104 tokens
Maximum concurrency for 16,384 tokens/request: 12.03x
Available KV cache memory: 4.96 GiB
```

Interpretation:

```txt
The same 5/5 hit-class invariant survived real Discord/Waffle decoys under TurboQuant K8V4 in this narrow sanitized fixture. This is not a broad quality/performance claim and is not evidence about the three original failure handles.
```

## Canonical sanitized artifact

```txt
bench/tecnofagia-discord-2026-05-14/sanitized-results-auto-20260515-015428.json
bench/tecnofagia-discord-2026-05-14/sanitized-results-turboquant_k8v4-20260515-090744.json
```

Local-only raw/operational files:

```txt
/home/aya/implante/tmp/tecnofagia-overnight-2026-05-15.log
/home/aya/implante/tmp/tecnofagia-overnight-2026-05-15/results-auto-20260515-015428.json
/home/aya/implante/tmp/fresh-tq-venv-tecnofagia-2026-05-15.log
/home/aya/implante/tmp/fresh-tq-venv-tecnofagia-2026-05-15/results-turboquant_k8v4-20260515-090744.json
```

## Next step

Do not expand this into a public claim. If this front continues, the next useful step is a paired internal note around the retrieval-utilization gap and a larger controlled fixture, with raw Discord-derived material still kept local/ignored.
