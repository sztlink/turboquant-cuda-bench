# EPKV Megakernel Readiness v0 - plan

## Trigger

Felipe said:

```txt
Megakernels
```

This plan interprets that as a request to prepare the megakernel lane without
violating the current research boundary.

## Current boundary

From `STATE.md`:

```txt
No more prompt-guard wording tweaks for RealRAG.
No more sampler/Triton/kernel work until a quality delta exists.
Next work should be explicit path-candidate review, path normalization, and then a small answer-from-selected-chain smoke only after infra authorization.
```

Therefore this pass is documentation/interface work only.

## Why a full megakernel is not next

A full transformer megakernel would fuse too much before the behavior is known.
It would entangle:

```txt
model architecture
vLLM scheduler
PagedAttention/block tables
TurboQuant KV formats
path/evidence selection
fallback policy
quality measurement
```

That is not an honest next step because the repo does not yet have a natural
quality result that justifies mutating the serving runtime.

## What is a valid megakernel target here

A valid target is narrower:

```txt
EPKV micro-megakernel = selected evidence rows/pages + candidate selection + fallback + value accumulation
```

The shape should be:

```txt
path candidate object
  -> row/page selection map
  -> local candidate probe
  -> overflow detector
  -> compact fallback or exact-only policy
  -> global top-k/softmax
  -> value accumulation
  -> fail-open to original attention
```

This preserves the existing lesson from the v1-v7 kernel audit:

```txt
candidate handling and fallback policy are the real boundary
```

## Existing receipts to reuse

| artifact | useful lesson |
|---|---|
| `bench/evidence-paged-kv-kernel-v4-2026-05-18/RESULTS.md` | clearest public attention-like score -> top-k/softmax -> value receipt |
| `bench/evidence-paged-kv-kernel-v5-2026-05-18/RESULTS.md` | strongest current custom K=32 path, but K=128 collapses |
| `bench/evidence-paged-kv-kernel-v7-2026-05-18/RESULTS.md` | no-full-score materialization architecture, slower at larger M |
| `bench/evidence-paged-kv-compact-fallback-2026-05-19/RESULTS.md` | GPU-side compact fallback is plausible when few heads are flagged |
| `bench/evidence-paged-kv-compact-fallback-policy-grid-2026-05-19/RESULTS.md` | policy shape exists, but remains fixture-specific |
| `bench/realrag-path-candidates-v2-2026-05-31/NO-LLM-PASS1.md` | path candidates are promising upstream objects, not runtime proof |

## Readiness gates

### Gate 0 - no-LLM path object

Already partially passed:

```txt
fresh offset1500 N=100
explicit path candidate posthoc EM/F1: 0.400 / 0.495
config0 path prompt EM/F1: 0.180 / 0.288
pairwise vs config0: 25 wins / 3 losses / 72 ties
```

Still required:

```txt
manual review of the 3 losses
place granularity normalization
institution truncation fix
award/composer extraction
country/nationality normalization
ambiguous path ranking review
```

### Gate 1 - row/page selection map

Missing.

The path-candidate object currently names titles and snippets. A runtime kernel
needs concrete row/page references:

```txt
request_id
sequence_id
layer_id
head_group
block_id
block_offset
row_index
source_title
path_step_id
support_role
```

### Gate 2 - answer-from-selected-chain smoke

Not run.

Requires explicit infra authorization because it uses vLLM/4090.

Minimum gate if run later:

```txt
F1 delta >= +0.05 vs unstructured path_prompt
EM wins > losses
UNKNOWN/refusal rate <= path_prompt + 0.05
```

### Gate 3 - hook safety

A future runtime path must fail open:

```txt
if path map missing -> original attention
if candidate confidence missing -> original attention
if detector flags invalid -> original attention
if kernel error -> original attention
if latency watchdog trips -> original attention
```

### Gate 4 - kernel receipt

Only after Gates 0-3:

```txt
correctness vs reference
p50/p90 latency
temporary memory
fallback distribution
flagged head/chunk rate
quality side-by-side
```

## Concrete no-infra next steps

1. Extend path candidates with stable `path_step_id` and `evidence_title` mapping.
2. Add a row/page map schema without touching vLLM runtime.
3. Build synthetic row-map fixtures from existing selected titles.
4. Add an offline dispatcher simulator that chooses:

```txt
original_attention
probe_only
compact_fallback
exact_only
```

5. Re-run no-LLM path candidates after manual review fixes.

## Stop rules

Stop the megakernel lane if:

```txt
path candidates do not survive manual review
answer-from-chain smoke fails the quality gate
row/page mapping is too lossy
fallback policy cannot fail open cleanly
any result requires claiming serving speedup before quality proof
```

## Current decision

```txt
megakernel lane = mapped, not executed
next action = path candidate review and row/page map schema
```
