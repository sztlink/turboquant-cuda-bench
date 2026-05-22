# Internal vLLM v1 sampler logit hook

Previous patch targeted:

```txt
vllm/v1/worker/gpu/sample/sampler.py
```

but live serving did not route through that hook. The active path is:

```txt
vllm/v1/sample/sampler.py
```

Added patch script:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy.py
```

Hook point:

```txt
after apply_logits_processors(...)
before self.sample(...)
```

Env controls:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS
VLLM_EPKV_LOGIT_BIAS
VLLM_EPKV_LOGIT_LOG
VLLM_EPKV_LOGIT_MAX_EVENTS
VLLM_EPKV_LOGIT_TAG
```

Live test on adversarial `Víctor Bó` case, without API `logit_bias`:

```txt
start-script env:
  VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=53,647,36125
  VLLM_EPKV_LOGIT_BIAS=3

output:
  Víctor Bó

telemetry hook:
  epkv.v1.sample.sampler.logit_policy.v0
```

After restore:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=
VLLM_EPKV_LOGIT_BIAS=0
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
baseline output: Armando Bo
```

Interpretation:

```txt
The state-aware policy is now proven inside the live vLLM sampler path,
not only via OpenAI API logit_bias.
```
