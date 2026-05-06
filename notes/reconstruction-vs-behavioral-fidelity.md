# Reconstruction metrics vs behavioral fidelity in KV-cache compression

> Working note for TurboQuant / KV-cache benchmarks.  
> Thesis: **better reconstruction does not guarantee trajectory preservation.**

## Why this note exists

KV-cache compression results are easy to compare incorrectly because different metrics answer different questions.

A method can look good under a local reconstruction metric and still change the model's generation path. Conversely, a method can preserve the broad output distribution while drifting away from the exact token trajectory that a reference run would have followed.

This note proposes a small vocabulary for comparing KV-cache results without collapsing all signals into a single word like “lossless”, “pass”, or “quality”.

## Attribution

REFRACT is Tom Turney / TheTom's methodology and tool for measuring LLM generation fidelity:

- repo: <https://github.com/TheTom/turboquant_plus/tree/main/refract>
- package: `refract-llm`

The `@sztlink` contribution here is independent CUDA validation and public synthesis using REFRACT as the behavioral-fidelity lens.

## Metric families

### 1. Reconstruction metrics

**Question:** how close is the compressed representation to the uncompressed/reference representation?

Examples:

- MSE / MAE between tensors;
- centroid/codebook reconstruction error;
- perplexity deltas when measured as an aggregate model score.

These are useful because they are cheap, local, and often predictive. But they do not directly say whether the model will follow the same generation path over time.

### 2. Distribution metrics

**Question:** are the next-token distributions still similar?

Examples:

- KL divergence / KLD;
- top-k distribution overlap;
- probability mass shift.

Distribution metrics are closer to decoding behavior than raw reconstruction error, but they can still miss compounding path drift. A small difference at one step may send the generation into a different prefix, after which later distributions are being compared along different histories.

### 3. Trajectory / path metrics

**Question:** does the compressed run preserve the same generation trajectory as the reference run?

Examples:

- exact token-path preservation;
- prefix length before divergence;
- full-sequence match rate;
- REFRACT Trajectory / path-preservation style scores.

Trajectory metrics are stricter. They are especially useful when the claim is not only “the model remains plausible”, but “this compression does not materially change the generation path under a controlled harness.”

### 4. Task / long-context metrics

**Question:** does the compressed system still solve the task people care about?

Examples:

- R-NIAH / needle retrieval;
- long-context QA;
- agentic instruction persistence;
- multi-turn tool-use stability;
- benchmark-specific success/failure.

Task metrics are closest to product behavior, but they can be noisy and harder to attribute. When a task fails, it may be unclear whether the cause is reconstruction error, distribution drift, path drift, prompt sensitivity, context depth, or harness design.

## Storage-only vs decode-path compression

Another distinction matters before comparing numbers:

- **storage-only compression:** compressed KV is stored compactly but dequantized or recovered before the critical decode path;
- **decode-path compression:** compressed/quantized values remain active inside attention or recurrent decode computation.

The same nominal bit-width can have different behavioral consequences depending on where the compressed representation enters the computation.

For KV-cache experiments, the K/V split also matters. A configuration can keep K relatively stable while V-cache compression changes the generated path, or vice versa. Results should report K and V separately when possible, e.g. `ctk=q8_0`, `ctv=turbo3`.

## A small REFRACT example

In the May 2026 CUDA attn-fix rerun, using TheTom's REFRACT as the lens, the interesting signal was not just that one configuration scored lower. It was that metric families disagreed.

On the 32B dense model, `q8/turbo3` looked acceptable under GTM-style scoring but failed under Trajectory/path preservation:

| Model / GPU | KV config | GTM axis | Trajectory composite | Trajectory path score | KLD |
|---|---:|---:|---:|---:|---:|
| 3090 / 32B | `q8/q8` | 93.87 | 74.31 | 59.32 | 99.44 |
| 3090 / 32B | `q8/turbo3` | 88.83 | 39.73 | 24.95 | 97.54 |
| 3090 / 32B | `turbo3/turbo3` | 81.88 | 38.72 | 24.95 | 86.45 |

The important reading is narrow:

- KLD can remain high even when path preservation fails;
- V-cache `turbo3` is the suspicious axis in this run;
- larger/different models can amplify drift that looks tolerable on a smaller case;
- this is evidence for metric separation, not a universal verdict on any method.

Full result table: [`bench/refract-attnfix/`](../bench/refract-attnfix/)

## How to compare future KV-cache claims

Before saying two methods are better/worse, align at least:

1. model and weight quantization;
2. backend and hardware;
3. context length and prompt harness;
4. K-cache format and V-cache format;
5. whether compression is storage-only or active in the decode path;
6. metric family: reconstruction, distribution, trajectory, or task;
7. whether the score is an aggregate composite or a specific axis score.

A compact way to state a claim:

```txt
On <model>, <backend/hardware>, <ctx/harness>, <ctk>/<ctv> preserves <metric family> under <metric>, but does/does not preserve <other metric family>.
```

Example:

```txt
On 32B dense CUDA/SM86 under REFRACT, q8/turbo3 remains close under KLD but does not preserve the reference generation trajectory.
```

## Practical takeaway

Do not treat reconstruction, distribution, trajectory, and task fidelity as interchangeable.

For KV-cache compression, a useful result should say which layer of fidelity it preserves — and which layer it has not yet proven to preserve.
