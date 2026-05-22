# EPKV 12h sprint — decode policy / logprob harness

Sprint start: `2026-05-21T23:34:36-03:00`

Goal: move beyond KV/value mixing and inspect the sampler/LM-head layer where `Armando` beats `Víctor`.

## API-level logprobs

vLLM's OpenAI-compatible endpoint supports:

```json
{"logprobs": true, "top_logprobs": 10}
```

Target adversarial case:

```txt
qid: c3c94d0a0bdc11eba7f7acde48001122
gold/candidate: Víctor Bó
baseline output: Armando Bo
```

Baseline first-token distribution:

| token | logprob |
|---|---:|
| `Ar` | -0.0520 |
| `V` | -3.0520 |
| `Vict` | -5.6770 |

Interpretation:

```txt
The correct answer is not absent from decode policy.
It is visible as the #2 first-token candidate, about 3 logprob points behind `Ar`.
```

## Diagnostic logit bias sweep

The harness derived candidate token ids for `Víctor Bó`:

```txt
[53, 647, 36125]
```

Bias sweep:

| bias | output | first token |
|---:|---|---|
| 0 | `Armando Bo` | `Ar` |
| 1 | `Armando Bo` | `Ar` |
| 2 | `Armando Bo` | `Ar` |
| 3 | `Víctor Bó` | `V` |
| 4 | `Víctor Bó` | `V` |
| 6 | `Víctor Bó` | `V` |

This is the first strong success of the sprint:

```txt
A small LM-head-facing diagnostic policy flips the adversarial case back to the correct answer.
```

It also explains why KV/value interventions failed: the answer object was close in decode space, but local attention/value edits kept the sampler on the subject-token path.

## Control cases

Adversarial case 1:

```txt
gold: English
baseline: English
candidate already top token; bias unnecessary
```

Original 2Wiki sentence case 2:

```txt
gold: English
prompt asks for reasoning and baseline starts with `Based on...`
first-token answer bias does not help because answer-only decode policy is not active.
```

Conclusion:

```txt
LM-head policy works when prompt expects answer-only output.
For verbose prompts, the first decision is style/scaffold, not answer entity.
```

## Internal sampler patch scout

A default-off sampler patch was authored:

```txt
07-scripts/vllm-hook/patch-vllm-sampler-logit-policy.py
```

It adds env vars:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS
VLLM_EPKV_LOGIT_BIAS
VLLM_EPKV_LOGIT_LOG
VLLM_EPKV_LOGIT_MAX_EVENTS
VLLM_EPKV_LOGIT_TAG
```

The first remote attempt did not activate telemetry/output, likely because this deployment path is not hitting the patched sampler module or uses another sampling path. The API-level `logit_bias` path is confirmed and sufficient for the next evidence-derived policy harness.

## Next step

Do not return to KV-only mixing. Build an evidence-derived candidate policy:

```txt
support span / triple object -> token ids -> small early decode bias
```

Then compare:

```txt
baseline
KV-only
logit-policy-only
KV + logit-policy
```

on answer-only prompts and then on natural prompts with scaffold suppression.
