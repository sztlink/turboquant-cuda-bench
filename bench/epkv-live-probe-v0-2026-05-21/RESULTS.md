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

## Evidence-derived candidate extraction

The decode-policy harness now supports:

```txt
--candidate-source terminal-object
```

This extracts the object of the terminal support triple without using the gold label.

Night sweep:

```txt
adv2 evidence-derived candidate: Víctor Bó
bias >=3: Armando Bo -> Víctor Bó
```

Natural verbose prompts exposed the next boundary:

```txt
multi1/multi2 first token: Based
multi3 first token: The
```

So first-token answer bias works for answer-only prompts but not for verbose prompts where the first token is discourse scaffolding.

## State-aware decode policy

A new harness implements generated-token-state-aware diagnostics:

```txt
07-scripts/vllm-hook/epkv-state-aware-decode-policy.py
```

It supports:

```txt
assistant prefill/entity-slot continuation
--suppress-scaffold
--scaffold-bias -10
```

Results:

```txt
adv2 answer-only:
  candidate Víctor Bó
  direct bias +3 -> Víctor Bó

multi3 verbose La Leona:
  baseline starts with The...
  suppress scaffold + candidate bias -> Víctor Bó is the child...

multi2 verbose Margaret Tudor:
  baseline starts with Based...
  suppress scaffold + candidate bias10 -> Margaret Tudor's country of origin is English...
```

Hard case remains:

```txt
multi1 Johanna grandmother still fails; needs relation/path repair, not just decode-policy steering.
```

## Auto decode policy selector

Added:

```txt
07-scripts/vllm-hook/epkv-auto-decode-policy.py
```

It tries a small policy grid:

```txt
direct candidate bias
entity-slot/prefill bias
scaffold suppression + candidate bias
```

Auto-policy results:

```txt
adv2   -> direct bias +3 -> Víctor Bó
multi2 -> prefill/entity-slot bias -> England...  (alias of English)
multi3 -> prefill/entity-slot bias -> Víctor Bó...
multi1 -> failed
```

This cleanly separates:

```txt
surface decode failures -> solved by state-aware decode policy
relation/path failures  -> need relation-aware evidence construction before decode
```

## Relation-path repair

For failed `multi1`, decode policy was not enough. A compact relation-chain prompt from 2Wiki triples repaired it:

```txt
Johanna Magdalene of Saxe-Weissenfels -- father --> Johann Georg, Duke of Saxe-Weissenfels.
Johann Georg, Duke of Saxe-Weissenfels -- mother --> Johanna Magdalena of Saxe-Altenburg.
```

Result:

```txt
relation path, no bias -> Johanna Magdalena of Saxe-Altenburg
relation path + bias3  -> Johanna Magdalena of Saxe-Altenburg
```

Added:

```txt
07-scripts/vllm-hook/epkv-relation-path-prompt.py
```

Final architecture emerging:

```txt
1. relation/path construction from evidence
2. evidence-derived candidate token nomination
3. state-aware decode policy at sampler/LM-head
```

## Integrated runner

Added:

```txt
07-scripts/vllm-hook/epkv-integrated-evidence-policy-runner.py
07-scripts/vllm-hook/epkv-integrated-batch.py
```

The integrated runner now carries EPKV provenance forward:

```txt
answer/evidence pages
answer/evidence token ranges
terminal evidence span
selected policy layer
final output
```

4-case integrated result:

```txt
adv2   -> state_aware_decode_policy -> Víctor Bó
multi1 -> relation_path_then_decode  -> Johanna Magdalena of Saxe-Altenburg
multi2 -> state_aware_decode_policy -> England... / English alias
multi3 -> state_aware_decode_policy -> Víctor Bó...
```

Batch sanity run on first 6 2Wiki cases using compact evidence triples:

```txt
closed: 6/6
state_aware_decode_policy: 4
relation_path_then_decode: 2
```

## Internal vLLM sampler hook

The earlier internal patch targeted a non-active worker sampler path. The live serving path is:

```txt
vllm/v1/sample/sampler.py
```

Added:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy.py
```

Hook point:

```txt
after apply_logits_processors(...)
before self.sample(...)
```

Live test without API `logit_bias`:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=53,647,36125
VLLM_EPKV_LOGIT_BIAS=3
output -> Víctor Bó
telemetry -> epkv.v1.sample.sampler.logit_policy.v0
```

Restored default-off:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=
VLLM_EPKV_LOGIT_BIAS=0
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
baseline -> Armando Bo
```

## Dynamic sampler policy file

Env-only hook required a vLLM restart to change policy. Added dynamic policy file support:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy-file.py
VLLM_EPKV_LOGIT_POLICY_FILE=/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json
```

Policy on/off test without API `logit_bias` and without service restart between toggles:

```txt
policy disabled -> Armando Bo
policy enabled  -> Víctor Bó
policy disabled -> Armando Bo
```

Telemetry:

```txt
hook: epkv.v1.sample.sampler.logit_policy.v1.file
policy_enabled: true
```

Final restored state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
```

## Internal sampler bias-map policy

Extended dynamic policy file with per-token `bias_map`:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy-bias-map.py
```

This enables positive candidate bias plus negative scaffold suppression inside the live sampler.

Live multi3 verbose test without API `logit_bias`:

```txt
bias_map: Víctor token ids +3, scaffold ids -10
output: Víctor Bó is the child of the director of film La Leona
hook: epkv.v1.sample.sampler.logit_policy.v2.bias_map
```

Restored:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
```

## Automatic policy builder

Added:

```txt
07-scripts/vllm-hook/epkv-build-logit-policy-file.py
```

It builds dynamic internal sampler policies from span maps:

```txt
span map -> evidence-derived candidate -> candidate token ids -> scaffold ids -> bias_map JSON
```

Live internal sampler test, no API `logit_bias`:

```txt
span-map-3 candidate: Víctor Bó
output: Víctor Bó is the child of the director of film La Leona
```

Restored:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```
