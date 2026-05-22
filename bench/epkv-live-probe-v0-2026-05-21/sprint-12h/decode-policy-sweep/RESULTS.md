# EPKV 12h sprint — decode policy sweep

Target:

```txt
qid: c3c94d0a0bdc11eba7f7acde48001122
gold: Víctor Bó
```

## Conditions

| condition | output |
|---|---|
| baseline | `Armando Bo` |
| KV answer-token value/guard | `Armando Bo` |
| API logit_bias +3 on candidate ids | `Víctor Bó` |
| KV answer-token value replace + API logit_bias +3 | `Víctor Bó` |

Candidate ids:

```txt
[53, 647, 36125]
```

KV+logit condition:

```txt
VLLM_EPKV_EVIDENCE_TOKEN_RANGES=125-129
VLLM_EPKV_EVIDENCE_MIN_K=8
VLLM_EPKV_EVIDENCE_VALUE_MODE=replace
VLLM_EPKV_EVIDENCE_VALUE_MIX=1.0
API logit_bias: {53:3, 647:3, 36125:3}
```

EPKV token hit in the combined condition:

```txt
15.625%
```

## Interpretation

This is the strongest result so far:

```txt
KV/value-only cannot flip the adversarial case.
Logit-policy-only flips it.
KV/value + logit-policy also flips it.
```

So the immediate useful mechanism is not “select more evidence rows”; it is:

```txt
evidence-derived candidate tokens must influence the early decode policy.
```

KV tracing still matters because it tells us which evidence span/candidate should be promoted. But the actual steering needs to occur closer to the sampler/LM head.

## Next design

Implement candidate extraction from evidence spans without gold labels:

```txt
terminal support triple object -> candidate string -> token ids -> small first-token bias
```

Then make it conditional on evidence/KV trace rather than hardcoded gold answer.

## Service restoration

After this sweep:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
```
