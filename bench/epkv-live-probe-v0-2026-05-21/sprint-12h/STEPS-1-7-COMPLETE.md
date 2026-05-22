# EPKV sprint — steps 1–7 complete

Scope requested: continue autonomously through step 7.

## 1. Internal sampler + relation fallback integrated

Updated:

```txt
07-scripts/vllm-hook/epkv-internal-sampler-policy-batch.py
```

Behavior:

```txt
try internal sampler policy
if not closed -> relation-path fallback from 2Wiki triples
```

Smoke on original 3 span maps:

```txt
closed: 3/3
internal_sampler_policy: 2/2
relation_path_then_decode: 1/1
```

## 2. Internal path scaled

Ran internal sampler batch over 30 span maps:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/internal-sampler-batch-30/
closed: 30/30
elapsed: 335.11 sec
internal_sampler_policy: 16/16
relation_path_then_decode: 14/14
```

Interpretation: on the internal sampler path, relation fallback is materially important; surface steering alone closes about half this compact 30-case set.

## 3. Telemetry added

Updated:

```txt
07-scripts/vllm-hook/epkv-internal-sampler-policy-live.py
```

Now captures matching hook events from the remote JSONL log by policy tag:

```txt
hook_event_count
hook_events[].bias_map
hook_events[].token_ids
hook_events[].sampled_token_ids
hook_events[].before_top / after_top
```

Telemetry smoke:

```txt
multi3 -> Víctor Bó is the child of the director of film La Leona
hook_event_count: 87
first sampled token id: 53
hook: epkv.v1.sample.sampler.logit_policy.v2.bias_map
```

## 4. Failure/repair metrics separated

Added:

```txt
07-scripts/vllm-hook/epkv-summarize-policy-results.py
```

30-case internal metrics:

```txt
surface_decode_exact: 16
relation_path_repair: 14
unresolved: 0
```

## 5. EPKV -> sampler loop closed

End-to-end live loop now exists:

```txt
span map / EPKV provenance
-> candidate/path extraction
-> dynamic sampler policy JSON
-> 4090 VLLM_EPKV_LOGIT_POLICY_FILE
-> active vLLM sampler hook
-> telemetry JSONL
-> restore policy off
```

The policy JSON carries:

```txt
qid
answer/evidence page specs
answer/evidence token ranges
candidate ids
scaffold ids
bias_map
```

## 6. Canonical sampler patch consolidated

Added one-shot canonical patch:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-epkv-policy.py
```

This supersedes the incremental patch scripts for future fresh trees:

```txt
patch-vllm-v1-sampler-logit-policy.py
patch-vllm-v1-sampler-logit-policy-file.py
patch-vllm-v1-sampler-logit-policy-bias-map.py
```

It targets the active path:

```txt
vllm/v1/sample/sampler.py
```

and adds:

```txt
VLLM_EPKV_LOGIT_POLICY_FILE
bias_map
JSONL telemetry
default-off behavior
env fallback
```

## 7. Clear stack comparison run

Added:

```txt
07-scripts/vllm-hook/epkv-compare-policy-stack.py
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/policy-stack-comparison/
```

Comparison over original 3 span maps:

| layer | closed |
|---|---:|
| baseline | 0/3 |
| KV-only artifact | 1/3 |
| API logit_bias | 2/3 |
| internal sampler policy | 2/3 |
| relation path then decode | 3/3 |

Case split:

| case | baseline | KV-only | API logit_bias | internal sampler | relation path |
|---|---:|---:|---:|---:|---:|
| multi1 Johanna | 0 | 0 | 0 | 0 | 1 |
| multi2 English | 0 | 0 | 1 | 1 | 1 |
| multi3 Víctor | 0 | 1 | 1 | 1 | 1 |

Conclusion:

```txt
KV-only can sometimes surface the answer but is not sufficient.
LM-head/sampler policy repairs surface-decode failures.
Relation/path construction is required for path-confusion failures.
```

## Final service state

Verified after all live runs:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
