# 12h sprint live status

## Started

```txt
2026-05-21T23:34:36-03:00
```

## Phase 0

- boot snapshot written to `logs/boot.log`
- remote start script confirmed default-off:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
```

## Phase 1 / 2 breakthrough

Found that API-level logprobs are available and enough to see the failure:

```txt
baseline first token: Ar    logprob -0.052
candidate first token: V    logprob -3.052
candidate variant: Vict     logprob -5.677
```

Diagnostic logit bias flips the answer:

```txt
bias 0 -> Armando Bo
bias 1 -> Armando Bo
bias 2 -> Armando Bo
bias 3 -> Víctor Bó
bias 4 -> Víctor Bó
bias 6 -> Víctor Bó
```

This is the first strong success:

```txt
The correct answer was already near the LM-head decision boundary.
KV/value edits failed because they did not cross that boundary.
```

## Runtime patch status

Authored internal sampler patch:

```txt
07-scripts/vllm-hook/patch-vllm-sampler-logit-policy.py
```

Remote test did not activate, likely alternate sampler path/import. Service was restored.

## Decode policy sweep

Completed comparison on adversarial `Víctor Bó` case:

```txt
baseline                          -> Armando Bo
KV answer-token value/guard        -> Armando Bo
API logit_bias +3                  -> Víctor Bó
KV answer-token replace + bias +3  -> Víctor Bó
```

EPKV token hit in combined run: `15.625%`.

Conclusion:

```txt
KV trace should nominate evidence/candidate tokens.
LM-head/sampler policy must do the early steering.
```

## Evidence-derived candidate sweep

Night runner completed 5-case sweep using terminal support object extraction.

Key results:

```txt
adv2 candidate from evidence: Víctor Bó
bias >=3: Armando Bo -> Víctor Bó
```

For natural verbose prompts, first token remains scaffold:

```txt
Based / The
```

so answer-token bias must be step-aware, not first-token global.

## State-aware policy phase

Implemented `epkv-state-aware-decode-policy.py`.

Confirmed:

```txt
answer-only adv2: direct candidate bias +3 -> Víctor Bó
verbose multi3: suppress scaffold + bias3 -> Víctor Bó is the child...
verbose multi2: suppress scaffold + bias10 -> Margaret Tudor's country of origin is English...
```

Manual slot/prefix for multi1 still fails, selecting Fredericka Elisabeth instead of Johanna Magdalena. This is a relation/path failure.

## Auto policy selector

Implemented `epkv-auto-decode-policy.py`.

Results:

```txt
adv2   -> direct bias +3 -> Víctor Bó
multi2 -> prefill/entity-slot bias -> England... / alias of English
multi3 -> prefill/entity-slot bias -> Víctor Bó...
multi1 -> failed after 10 attempts
```

## Integrated runner

Implemented:

```txt
epkv-integrated-evidence-policy-runner.py
epkv-integrated-batch.py
```

4-case integrated result:

```txt
adv2   -> state_aware_decode_policy -> Víctor Bó
multi1 -> relation_path_then_decode  -> Johanna Magdalena of Saxe-Altenburg
multi2 -> state_aware_decode_policy -> England... / English alias
multi3 -> state_aware_decode_policy -> Víctor Bó...
```

Batch sanity run:

```txt
first 6 2Wiki compact evidence cases -> 6/6 closed
4 via state-aware decode policy
2 via relation-path fallback
```

## Internal sampler hook

Patched active vLLM sampler path:

```txt
vllm/v1/sample/sampler.py
```

Local patch script:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy.py
```

Live test without API `logit_bias`:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=53,647,36125
VLLM_EPKV_LOGIT_BIAS=3
adv2 output -> Víctor Bó
telemetry hook -> epkv.v1.sample.sampler.logit_policy.v0
```

Restored:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=
VLLM_EPKV_LOGIT_BIAS=0
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
baseline -> Armando Bo
```

## Dynamic internal policy file

Added dynamic file-controlled sampler policy:

```txt
patch-vllm-v1-sampler-logit-policy-file.py
VLLM_EPKV_LOGIT_POLICY_FILE=/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json
```

No restart needed between policy toggles:

```txt
policy disabled -> Armando Bo
policy enabled  -> Víctor Bó
policy disabled -> Armando Bo
```

Final restored state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

## Current next target

Make integrated runner write `logit-policy.json` for live internal sampler steering instead of API `logit_bias`, then scale batch.
