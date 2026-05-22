# Internal sampler bias-map policy

Added per-token `bias_map` support to the dynamic policy-file hook.

Patch script:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy-bias-map.py
```

Policy format:

```json
{
  "enabled": true,
  "bias_map": {
    "53": 3,
    "647": 3,
    "36125": 3,
    "785": -10,
    "576": -10,
    "28715": -10,
    "20205": -10,
    "11190": -10
  },
  "max_events": 16,
  "tag": "bias-map-multi3-scaffold"
}
```

This supports state-aware policy inside the live sampler:

```txt
positive candidate bias + negative scaffold suppression
```

Live multi3 verbose test without API `logit_bias`:

```txt
output: Víctor Bó is the child of the director of film La Leona
hook: epkv.v1.sample.sampler.logit_policy.v2.bias_map
```

Final restored state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
