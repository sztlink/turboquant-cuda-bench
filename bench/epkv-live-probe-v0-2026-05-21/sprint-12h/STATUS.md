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

## Current next target

Automatic policy selector:

```txt
first-token logprobs show scaffold? -> suppress scaffold
candidate already near top? -> direct bias
relation/path confusion? -> build relation-aware candidate/path prompt or evidence rewrite
```
