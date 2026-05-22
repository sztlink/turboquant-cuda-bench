# EPKV internal sampler live runner

Added live runner:

```txt
07-scripts/vllm-hook/epkv-internal-sampler-policy-live.py
```

This is the first end-to-end path that does all of the following:

```txt
span map -> generated dynamic policy JSON -> copy to 4090 policy file -> normal API request without logit_bias -> restore policy off
```

It exercises the internal vLLM sampler hook instead of OpenAI API `logit_bias`.

Smoke results:

| case | policy | output | restored |
|---|---|---|---|
| adv2 | candidate ids +3 | `Víctor Bó` | yes |
| multi3 | candidate ids +3, scaffold ids -10 | `Víctor Bó is the child of the director of film La Leona` | yes |

Post-smoke service state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```

This closes the loop between EPKV span provenance and live sampler-facing decode control without requiring API-level logit bias.
