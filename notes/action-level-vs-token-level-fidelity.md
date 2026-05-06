# Action-level vs token-level fidelity

_Date: 2026-05-06_

## Thesis

A degraded token-level trajectory does not automatically imply a collapsed action-level behavior.

The current CUDA evidence splits the problem into two layers:

1. **Token / distribution trajectory** — measured by REFRACT.
2. **Agentic action trajectory** — measured by the Agentic Context Fidelity smoke harness.

The distinction matters because KV-cache compression can perturb the token path while preserving the higher-level decision path for some tasks.

## Anchor result: REFRACT q4 hybrid

For Qwen3.6-35B-A3B on CUDA, `q4_0/q4_0` looked excellent under distribution closeness but degraded under REFRACT trajectory preservation:

| KV config | KLD score | REFRACT trajectory path |
|---|---:|---:|
| `q4_0/q4_0` | 98.81 | 65.70 |

Interpretation from the q4 hybrid note:

```text
Better reconstruction does not guarantee trajectory preservation.
```

That result is token/path-level. It does not by itself answer whether a downstream agentic behavior changes.

## Agentic Context Fidelity smoke

A small A/B harness was added to test a narrower behavioral question:

```text
same model / same task / same scaffold / same decoding setup
reference KV/context mechanism vs candidate KV/context mechanism
→ did the agentic trajectory remain behaviorally equivalent?
```

Reference:

```text
q8_0/q8_0
```

Candidate:

```text
q4_0/q4_0
```

Model / runtime:

```text
Qwen3.6-35B-A3B Q4_K_M
llama.cpp / llama-completion.exe
--no-conversation --single-turn -j {}
n_predict=512
no-think prompt prefill
RTX 3090
```

## v1 smoke summary

V1 used five synthetic task families:

1. instruction persistence;
2. delayed dependency;
3. correction uptake;
4. low-frequency dependency;
5. tool-loop stability.

Contexts run:

```text
2k, 4k, 8k, 16k, 32k
```

Result:

```text
hard-behavior equivalent: 5/5 at each context
tool delta: 0 on tool task
```

## v2 smoke summary

V2 made the task set harder and smaller:

1. multi-hop mutable state;
2. tool observation stability with noisy timestamp metadata;
3. priority conflict resolution under late override pressure.

Contexts run:

```text
16k, 32k
```

Result:

```text
hard-behavior equivalent: 3/3 at each context
tool delta: 0 on tool task
```

Representative final answers at 32k:

| Task | q8/q8 | q4/q4 |
|---|---|---|
| multi-hop mutable state | `Route C` | `Route C` |
| tool observation stability | stable `ROUTE-9F2`; stop after two calls | stable `ROUTE-9F2`; stop after two calls |
| priority conflict resolution | `SAFETY-REVIEW` | `SAFETY-REVIEW` |

## Interpretation

This is not evidence that `q4_0/q4_0` is globally equivalent to `q8_0/q8_0`.

A precise reading is:

```text
On these synthetic agentic smoke tasks, Qwen3.6-35B-A3B preserved action-level behavior under q4_0/q4_0 KV through 32k, despite earlier REFRACT evidence of degraded token-level trajectory preservation.
```

The useful finding is dimensional:

```text
token-level drift ≠ automatic action-level collapse
```

The inverse is also true:

```text
action-level pass ≠ token-level fidelity
```

Both metrics are needed.

## Limitations

1. The task set is synthetic and still small.
2. The model is strong; weaker models may reveal whether the tasks are discriminative.
3. Text divergence is currently classified as `soft_text` using exact hashes, so semantically equivalent wording still appears as a divergence.
4. Tool/action divergence is the more reliable hard signal in the current scorer.
5. No 64k action-level smoke has been run yet.

## Next calibration

Before running 64k on the 35B, run the v2 32k task set on a smaller/weaker local model.

If the smaller model fails, the v2 tasks are discriminative and the 35B result is meaningful robustness.

If the smaller model also passes, the task set is probably still too easy and the next work should be v3 multi-turn/action-state tasks, not more context length.

## Claim boundary

Do not claim:

```text
q4_0/q4_0 is behaviorally equivalent to q8_0/q8_0.
```

Claim only:

```text
In this ACF smoke suite, q4_0/q4_0 preserved the measured action-level behavior through 32k on Qwen3.6-35B-A3B, while REFRACT still shows token-level trajectory degradation.
```
