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

## Evidence-derived policy follow-up

The night runner promoted candidate extraction from gold labels to terminal support triples:

```txt
terminal support triple object -> candidate string -> token ids -> bias sweep
```

Result summary:

| case | evidence-derived candidate | useful effect |
|---|---|---|
| adv1 | `English` | already correct |
| adv2 | `Víctor Bó` | bias >=3 flips `Armando Bo` -> `Víctor Bó` |
| multi1 | `Johanna Magdalena of Saxe-Altenburg` | first token remains scaffold `Based`; answer bias does not help answer-not-first prompt |
| multi2 | `English` | first token remains scaffold `Based` |
| multi3 | `Víctor Bó` | first token remains scaffold `The`, but answer object appears later |

This separates two regimes:

```txt
answer-only prompts: evidence-derived first-token bias is effective.
verbose/scaffold prompts: first decision is discourse style, so answer-token bias must be delayed or paired with scaffold suppression.
```

## Next design

Implement step-aware policy:

```txt
if answer-only prompt -> first-token candidate bias
if verbose prompt -> wait until after scaffold / apply candidate bias at entity slot
```

The next runtime target is generated-token-state-aware bias, not a blanket first-token bias.

## Service restoration

After this sweep:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
```
