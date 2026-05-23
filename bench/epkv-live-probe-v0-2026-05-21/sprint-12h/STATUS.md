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

## Auto policy selector

Implemented `epkv-auto-decode-policy.py`.

Results:

```txt
adv2   -> direct bias +3 -> Víctor Bó
multi2 -> prefill/entity-slot bias -> England... / alias of English
multi3 -> prefill/entity-slot bias -> Víctor Bó...
multi1 -> failed after 10 attempts
```

## Integrated runner

Implemented:

```txt
epkv-integrated-evidence-policy-runner.py
epkv-integrated-batch.py
```

4-case integrated result:

```txt
adv2   -> state_aware_decode_policy -> Víctor Bó
multi1 -> relation_path_then_decode  -> Johanna Magdalena of Saxe-Altenburg
multi2 -> state_aware_decode_policy -> England... / English alias
multi3 -> state_aware_decode_policy -> Víctor Bó...
```

Batch sanity run:

```txt
first 6 2Wiki compact evidence cases -> 6/6 closed
4 via state-aware decode policy
2 via relation-path fallback
```

## Internal sampler hook

Patched active vLLM sampler path:

```txt
vllm/v1/sample/sampler.py
```

Local patch script:

```txt
07-scripts/vllm-hook/patch-vllm-v1-sampler-logit-policy.py
```

Live test without API `logit_bias`:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=53,647,36125
VLLM_EPKV_LOGIT_BIAS=3
adv2 output -> Víctor Bó
telemetry hook -> epkv.v1.sample.sampler.logit_policy.v0
```

Restored:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=
VLLM_EPKV_LOGIT_BIAS=0
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
baseline -> Armando Bo
```

## Dynamic internal policy file

Added dynamic file-controlled sampler policy:

```txt
patch-vllm-v1-sampler-logit-policy-file.py
VLLM_EPKV_LOGIT_POLICY_FILE=/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json
```

No restart needed between policy toggles:

```txt
policy disabled -> Armando Bo
policy enabled  -> Víctor Bó
policy disabled -> Armando Bo
```

Final restored state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

## Internal sampler bias-map

Extended dynamic policy file to support per-token `bias_map`:

```txt
patch-vllm-v1-sampler-logit-policy-bias-map.py
```

Live multi3 verbose, no API `logit_bias`:

```txt
candidate ids +3; scaffold ids -10
output -> Víctor Bó is the child of the director of film La Leona
hook -> epkv.v1.sample.sampler.logit_policy.v2.bias_map
```

Final restored state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

## Automatic policy builder

Implemented:

```txt
epkv-build-logit-policy-file.py
```

It builds dynamic sampler `bias_map` JSON from span maps:

```txt
candidate ids + positive bias
optional scaffold ids + negative bias
EPKV provenance carried in policy JSON
```

Live internal sampler test, no API `logit_bias`:

```txt
span-map-3 -> auto candidate Víctor Bó
policy builder -> bias_map JSON
output -> Víctor Bó is the child of the director of film La Leona
```

Restored:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```

## Integrated batch 24 offset6

Watcher completed:

```txt
closed: 24/24
elapsed: 699.33 sec
state_aware_decode_policy: 23/23
relation_path_then_decode: 1/1
```

Cumulative integrated batches:

```txt
30/30 automatic closure
27 state-aware decode
3 relation-path fallback
```

Caveat: automatic string/alias closure, not human factual adjudication.

Post-batch service state:

```txt
policy file: {"enabled":false,"tag":"default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

## Internal sampler live runner

Implemented:

```txt
epkv-internal-sampler-policy-live.py
```

This runner writes generated policy JSON to the 4090 dynamic policy file, sends a normal request without API `logit_bias`, then restores policy off.

Smoke:

```txt
adv2   -> Víctor Bó
multi3 -> Víctor Bó is the child of the director of film La Leona
```

Restored after each smoke:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```

## Internal sampler batch smoke

Implemented:

```txt
epkv-internal-sampler-policy-batch.py
```

Smoke on original 3 2Wiki span maps, no API `logit_bias`:

```txt
closed: 2/3
multi2 -> England / English alias
multi3 -> Víctor Bó
multi1 -> fails, as expected, because it needs relation-path fallback
```

Restored:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```

## Steps 1–7 completion

Completed requested autonomous steps through comparison.

Artifacts:

```txt
STEPS-1-7-COMPLETE.md
internal-sampler-batch-30/
policy-stack-comparison/
```

Results:

```txt
internal sampler + relation fallback smoke: 3/3
internal sampler batch 30: 30/30
  internal_sampler_policy: 16
  relation_path_then_decode: 14
comparison original 3:
  baseline: 0/3
  KV-only artifact: 1/3
  API logit_bias: 2/3
  internal sampler policy: 2/3
  relation path then decode: 3/3
```

New scripts:

```txt
epkv-summarize-policy-results.py
epkv-compare-policy-stack.py
patch-vllm-v1-sampler-epkv-policy.py
```

Final service state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

## Quality proof 100

Completed pragmatic quality gate before Triton:

```txt
QUALITY-PROOF-100.md
quality-proof-100/
```

Results:

```txt
baseline:                         EM 0.300 | contains 0.700 | F1 0.395
internal sampler + relation path: EM 0.910 | contains 0.980 | F1 0.931
```

Delta:

```txt
EM +0.610
contains +0.280
F1 +0.536
```

Closure split:

```txt
98/100 closed
internal_sampler_policy: 78/80
relation_path_then_decode: 20/20
```

Post-run state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

## Current next target

Quality gate cleared. Next valid move is either scale to 300 for robustness or kernelize the now-validated sampler policy path.

## Quality proof 300

300-case robustness run completed:

```txt
QUALITY-PROOF-300.md
quality-proof-300/
```

Closure:

```txt
296/300 closed
internal_sampler_policy: 235/239
relation_path_then_decode: 61/61
```

Quality:

```txt
baseline:                         EM 0.327 | contains 0.720 | F1 0.428
internal sampler + relation path: EM 0.907 | contains 0.987 | F1 0.934
```

Counts:

```txt
baseline EM: 98/300
policy EM: 272/300
wins: 176
losses: 2
```

Service state verified:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```

## RAG reality check 100

Completed retrieval/rerank/prompt reality check:

```txt
RAG-REALITY-CHECK-100.md
rag-reality-check-100/
```

Natural retrieval over 56,687 2Wiki context docs:

```txt
BM25 basic:              EM 0.000 | contains 0.040 | F1 0.031
BM25 strong prompt:      EM 0.070 | contains 0.130 | F1 0.150
BM25→BGE rerank strong:  EM 0.090 | contains 0.160 | F1 0.185
```

Retrieval stats:

```txt
BM25 support recall: 0.493
BGE support recall:  0.512
BGE answer present:  0.400
BGE full support:    14/100
```

Compared to oracle evidence ECD:

```txt
quality-proof-100 ECD: EM 0.910 | F1 0.931
quality-proof-300 ECD: EM 0.907 | F1 0.934
```

Conclusion:

```txt
retrieval is the dominant full-RAG bottleneck here.
ECD is validated as oracle-evidence/control-plane, not full retrieval proof yet.
```

## Current next target

Build the missing bridge:

```txt
retrieved docs -> relation/path extraction -> ECD policy
```

Then retest against BM25/BGE prompt baselines.

## Retrieved relation-path ECD 100

Completed bridge test:

```txt
RETRIEVED-RELATION-ECD-100.md
retrieved-relation-ecd-100/
```

Results:

```txt
BGE rerank strong:      EM 0.090 | contains 0.160 | F1 0.185
relation extraction:    EM 0.070 | contains 0.080 | F1 0.120
retrieved relation ECD: EM 0.070 | contains 0.080 | F1 0.105
```

Status split:

```txt
FOUND: 43
MISSING: 56
parse/empty: 1
```

Conclusion:

```txt
naive retrieved-doc relation extraction does not bridge the gap.
It is worse than BGE strong prompt.
```

## Entity-hop retrieval + path prompt 100

Completed positive bridge test:

```txt
ENTITY-HOP-LLM-100.md
entity-hop-grid-100/
entity-hop-llm-100/
```

Retrieval grid best vs BGE baseline:

```txt
BGE support recall:       0.512
BGE full support:         0.140
BGE answer present:       0.400

Entity-hop support:       0.708
Entity-hop full support:  0.460
Entity-hop answer present:0.780
```

100-case answer quality:

```txt
BGE rerank strong:        EM 0.090 | contains 0.160 | F1 0.185
Entity-hop strong:        EM 0.190 | contains 0.310 | F1 0.290
Entity-hop path prompt:   EM 0.250 | contains 0.340 | F1 0.330
```

Win/loss vs BGE:

```txt
BGE EM:          9/100
path prompt EM: 25/100
path wins:      19
path losses:    3
```

## Entity-hop extractor + ECD 100

Completed follow-up:

```txt
ENTITY-HOP-ECD-100.md
entity-hop-ecd-100/
```

Results:

```txt
BGE rerank strong:              EM 0.090 | contains 0.160 | F1 0.185
Entity-hop strong:              EM 0.180 | contains 0.300 | F1 0.275
Entity-hop path prompt:         EM 0.260 | contains 0.340 | F1 0.320
Entity-hop path extractor:      EM 0.110 | contains 0.200 | F1 0.158
Entity-hop extractor + ECD:     EM 0.130 | contains 0.200 | F1 0.172
```

Extractor status:

```txt
FOUND: 44
MISSING: 56
```

Conclusion:

```txt
single-candidate extractor+ECD underperforms direct entity-hop path prompt.
ECD is not the problem; brittle candidate extraction is.
```

## Current next target

Do not force single-candidate ECD. Use soft/multi-candidate evidence control:

```txt
entity-hop docs -> N answer/path candidates -> multi-candidate sampler bias -> fallback to direct path prompt when extractor is missing
```

## Public reproducibility receipt

The current RealRAG bridge is now mirrored as a Boring Receipts Lab research sibling card:

```txt
https://github.com/sztlink/boring-receipts/blob/main/receipts/2026-05-23-4090-vllm-realrag-entity-hop-path.md
```

## Entity-hop soft multi-candidate sweep

Completed autonomous sweep:

```txt
ENTITY-HOP-SOFT-POLICY-SWEEP-10H.md
entity-hop-soft-policy-sweep-10h/
```

Best result:

```txt
path-c12-b1.0
soft EM 0.230 | F1 0.324
path EM 0.250 | F1 0.330
wins vs path: 1
losses vs path: 3
```

Conclusion:

```txt
soft/multi-candidate policy improves over strict extractor+ECD but still does not beat direct path prompt.
```

Current next target:

```txt
confidence-gated fallback / answer rerank on top of entity-hop path prompt,
not more unconditional first-token bias sweeps.
```

## Entity-hop confidence-gated answer rerank 100

Completed:

```txt
ENTITY-HOP-ANSWER-RERANK-100.md
entity-hop-answer-rerank-100/
entity-hop-answer-rerank-gated-100/
```

Results:

```txt
BM25→BGE strong:              EM 0.090 | contains 0.160 | F1 0.185
Entity-hop path prompt:       EM 0.250 | contains 0.340 | F1 0.330
Raw answer rerank:            EM 0.240 | contains 0.350 | F1 0.325
Confidence-gated rerank:      EM 0.270 | contains 0.360 | F1 0.345
```

Win/loss vs path:

```txt
wins: 2
losses: 0
overrides: 3
```

Current next target:

```txt
scale gated rerank to 300 cases and add stricter exact-span preference / abstention rules.
```
