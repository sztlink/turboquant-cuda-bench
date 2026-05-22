# Dynamic internal sampler policy file

The env-only internal sampler hook worked, but env changes require restarting vLLM.
This phase added a dynamic policy-file layer to the active vLLM sampler hook.

Patch script:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy-file.py
```

Start-script default:

```txt
VLLM_EPKV_LOGIT_POLICY_FILE=/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=
VLLM_EPKV_LOGIT_BIAS=0
```

Default policy file:

```json
{"enabled": false, "tag": "default-off"}
```

Dynamic enabled policy, written without restarting vLLM:

```json
{"enabled": true, "token_ids": [53, 647, 36125], "bias": 3, "max_events": 16, "tag": "policy-file-adv2"}
```

Live test on adversarial case without API `logit_bias` and without service restart between on/off:

| policy file | output |
|---|---|
| disabled | `Armando Bo` |
| enabled | `Víctor Bó` |
| disabled again | `Armando Bo` |

Telemetry:

```txt
hook: epkv.v1.sample.sampler.logit_policy.v1.file
policy_enabled: true
policy_file: /home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json
```

Final restored state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

Interpretation:

```txt
The integrated runner can now steer the live sampler by writing a small policy
file, without using OpenAI API logit_bias and without restarting vLLM.
```
