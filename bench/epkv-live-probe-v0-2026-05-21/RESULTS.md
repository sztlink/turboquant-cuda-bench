# Evidence-KV Live Probe v0

This is the pivot back to runtime/KV/kernel work.

## What changed

Patched the experimental vLLM TurboQuant runtime hook:

```txt
07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py
```

New live probe env vars:

```txt
VLLM_EPKV_EVIDENCE_PAGES="2,5-6"   # evidence KV pages / page ranges
VLLM_EPKV_EVIDENCE_GUARD=1          # enable intervention, not just probe
VLLM_EPKV_EVIDENCE_BOOST=4.0        # add score boost before top-k
```

Behavior inside decode hook:

```txt
scores = Q · K over KV slots
if evidence pages are configured:
  build evidence_page_mask on device
  Triton kernel adds BOOST to scores whose row belongs to evidence page
topk(scores) selects KV positions
telemetry emits evidence hit/miss rate over selected positions
value kernel gathers selected KV as before
```

New Triton kernel:

```txt
_epkv_evidence_boost_scores_kernel
```

New local harness:

```txt
07-scripts/vllm-hook/epkv-live-probe-v0-harness.py
```

## Smoke result

Command:

```bash
python3 07-scripts/vllm-hook/epkv-live-probe-v0-harness.py \
  --out bench/epkv-live-probe-v0-2026-05-21/harness-smoke.json
```

Result on CPU fallback:

```txt
baseline evidence hit rate: 2.73%
boosted evidence hit rate: 98.05%
delta: +95.31 pp
```

This does not claim quality improvement. It proves the probe/intervention path changes selected-position geometry before the value gather.

## Live 4090 dry-run

After `[CONFIRMAR:INFRA]`, the patched hook was deployed to the 4090 vLLM tree and vLLM was restarted temporarily with:

```txt
VLLM_EPKV_RUNTIME_HOOK=1
VLLM_EPKV_RUNTIME_DRY_RUN=1
VLLM_EPKV_RUNTIME_TRACE_SELECTION=1
VLLM_EPKV_EVIDENCE_PAGES=0-2
VLLM_EPKV_EVIDENCE_GUARD=1
VLLM_EPKV_EVIDENCE_BOOST=4.0
VLLM_EPKV_RUNTIME_MAX_EVENTS=8
```

A short prompt was sent through the real LAN endpoint. The hook returned original TurboQuant outputs because dry-run was enabled, but the runtime score geometry used the evidence-page boost before top-k selection.

Live summary:

```txt
events: 8
seq_len: 64
K: 32
evidence pages: 0,1,2
decision: telemetry_only_fallback_to_original_tq
mode: evidence_page_score_boost
evidence hit rate avg: 91.09%
evidence hit rate min: 84.49%
evidence hit rate max: 94.64%
```

Artifacts:

```txt
live-events-raw.jsonl
live-summary.json
```

The start script was restored to `VLLM_EPKV_RUNTIME_HOOK=0` and vLLM health was revalidated after restart.

## Span → token → KV page bridge

Added:

```txt
07-scripts/vllm-hook/epkv-span-to-page-map.py
```

For a chat-template prompt with two evidence lines, the mapper produced:

```txt
total tokens: 105
evidence tokens: 22
evidence pages: 2-3
E1 token range: 34..44 → page 2
E2 token range: 45..55 → pages 2,3
```

Artifact:

```txt
span-map.json
```

## Live 4090 span-page sweep

The manual `0-2` mask was replaced by the computed evidence page mask `2-3` and two dry-run live passes were executed:

```txt
baseline: guard=0 boost=0.0
boost4:   guard=1 boost=4.0
```

Both used the real vLLM endpoint and dry-run fallback to preserve original TurboQuant outputs.

Summary:

```txt
baseline events: 8
baseline evidence hit rate avg: 26.69%
baseline min/max: 20.31% / 33.93%

boost4 events: 8
boost4 evidence hit rate avg: 73.24%
boost4 min/max: 62.72% / 79.46%

delta avg: +46.55 pp
seq_len: 106
K: 32
evidence pages: 2,3
```

Artifacts:

```txt
live-span-baseline-events.jsonl
live-span-boost4-events.jsonl
live-span-sweep-summary.json
```

The start script was restored again to `VLLM_EPKV_RUNTIME_HOOK=0` and `/health` was revalidated.

## Real 2Wiki record sweep

A real 2Wiki case was mapped and run:

```txt
qid: 1c7395fa0bb011ebab90acde48001122
question: Who is Johanna Magdalene Of Saxe-Weissenfels's paternal grandmother?
gold: Johanna Magdalena of Saxe-Altenburg
evidence pages: 2-7
```

Dry-run sweep:

```txt
boost 0: 15.81% evidence hit avg
boost 1: 27.26%
boost 2: 40.30%
boost 4: 64.73%
```

A non-dry live intervention was also run at boost 4:

```txt
decision: returned_phase2a_output
evidence hit avg: 62.36%
output: failed to close answer
```

Then `evidence_guard_topk_reserved` was added to the hook and run in dry-run:

```txt
VLLM_EPKV_EVIDENCE_MIN_K=8
mode: evidence_guard_topk_reserved
applied_evidence_k: 8
evidence hit avg: 25.00%
```

The guard path was then moved from torch-side mask splitting into a Triton score-partition primitive, and then from `torch.topk` into a per-head Triton selected-position kernel:

```txt
reservation_backend: triton_score_split_triton_topk
evidence hit avg: 25.00%
applied_evidence_k: 8
```

Artifacts:

```txt
2wiki-case-inference-grandmother.json
2wiki-span-map.json
2wiki-live-sweep/
```

## Multi-record boost vs guard

A 3-record 2Wiki batch compared soft boost against hard reservation:

```txt
boost4 evidence hit avg: 67.45%
guardk8 evidence hit avg: 25.00%
boost4 closure: 1/3
guardk8 closure: 1/3
```

`guardk8` used the Triton split + Triton top-k backend:

```txt
reservation_backend: triton_score_split_triton_topk
applied_evidence_k: 8
```

Artifacts:

```txt
2wiki-multirecord/
```

## Non-dry + token-range targeting

Non-dry runs showed that Phase2a output really changes the endpoint response, but page-level reservation can degrade answer extraction:

```txt
case 2 baseline: Armando Bo -> Víctor Bó
page/guard/boost interventions: Armando Bo
```

The hook was extended beyond page masks:

```txt
VLLM_EPKV_EVIDENCE_TOKEN_RANGES=START-END
evidence_source=token_ranges
```

The span mapper now emits:

```txt
terminal_evidence_pages_spec
terminal_evidence_token_range_spec
```

Adversarial-layout case 2 token targeting activated correctly:

```txt
terminal token range: 115-130
token-boost4 token hit avg: 35.38%
token-guardk8 token hit avg: 25.00%
```

The span mapper was then extended to locate the exact gold answer occurrence inside the evidence:

```txt
answer_token_range_spec: 125-129  # Víctor Bó
answer-token-guard token hit avg: 15.63%
```

But output still collapsed to first-hop `Armando Bo`, meaning:

```txt
more evidence selection != better terminal relation preservation
```

Artifacts:

```txt
non-dry-triton-guard/
adversarial-layout/
```

## Value-mix sprint

The hook was pushed below selected positions into the value path:

```txt
VLLM_EPKV_EVIDENCE_VALUE_MIX=<float>
VLLM_EPKV_EVIDENCE_VALUE_MODE=residual|lerp|replace
VLLM_EPKV_EVIDENCE_SELECT_MODE=topscore|tail
VLLM_EPKV_RUNTIME_START_CALL=<int>
```

Non-dry answer-token experiments on the `Víctor Bó` case:

```txt
answer token range: 125-129
answer-value-residual-0.5 -> Armando Bo
answer-value-residual-1.0 -> Armando Bo
answer-value-residual-2.0 -> Armö Bo
answer-value-lerp-1.0 -> Armando Bo
answer-value-replace-1.0 -> Armando Bo
start_call=16 + replace -> Arbmando Bo
start_call=24 + replace -> Armando
```

Conclusion:

```txt
value path is live enough to deform output,
but naive answer-token value mixing still cannot steer semantic closure to Víctor Bó.
```

Artifacts:

```txt
value-mix/
```

## 12h sprint — first decode-policy breakthrough

The sprint moved to LM-head/sampler-facing diagnostics. vLLM API logprobs exposed the failure directly on the adversarial `Víctor Bó` case:

```txt
baseline first token: Ar    logprob -0.052
candidate first token: V    logprob -3.052
candidate variant: Vict     logprob -5.677
```

So the correct answer object is not absent; it is close but loses the first-token race.

A diagnostic logit-bias sweep over candidate ids `[53, 647, 36125]` flipped the case:

```txt
bias 0 -> Armando Bo
bias 1 -> Armando Bo
bias 2 -> Armando Bo
bias 3 -> Víctor Bó
bias 4 -> Víctor Bó
bias 6 -> Víctor Bó
```

This explains why KV/value-only edits failed: they deformed the surface but did not cross the LM-head decision boundary.

Artifacts:

```txt
sprint-12h/
07-scripts/vllm-hook/epkv-decode-policy-harness.py
07-scripts/vllm-hook/patch-vllm-sampler-logit-policy.py
```

## Decode policy sweep result

A controlled sweep compared the actual intervention layers:

```txt
baseline                          -> Armando Bo
KV answer-token value/guard        -> Armando Bo
API logit_bias +3                  -> Víctor Bó
KV answer-token replace + bias +3  -> Víctor Bó
```

This is the clearest architecture result:

```txt
KV trace/selection should nominate evidence-derived candidate tokens.
Sampler/LM-head policy must do the early steering.
```

The combined KV+decode-policy run was non-dry and restored cleanly.

## Next live step

Promote from gold-token diagnostic to evidence-derived candidate extraction:

```txt
terminal support triple object -> candidate string -> token ids -> small early decode bias
```
