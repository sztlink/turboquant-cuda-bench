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

## Current next target

Build evidence-derived policy harness:

```txt
terminal support span / triple object -> candidate token ids -> early decode bias
```

Compare:

```txt
baseline
KV-only
logit-policy-only
KV + logit-policy
```
