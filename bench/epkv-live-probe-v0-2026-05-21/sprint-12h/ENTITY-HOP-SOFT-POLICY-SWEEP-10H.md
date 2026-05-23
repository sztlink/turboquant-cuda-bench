# Entity-Hop Soft Multi-Candidate Policy Sweep

Long autonomous sweep over soft/multi-candidate Evidence-Controlled Decoding after the positive entity-hop path-prompt bridge.

Runner:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/epkv-10h-autonomous-runner.sh
```

Artifacts:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-soft-policy-sweep-10h/
```

## Question

Can sampler-side soft bias over multiple non-oracle candidate entities beat the direct entity-hop graph/path prompt?

Baseline to beat:

```txt
entity-hop path prompt: EM 0.250 | F1 0.330
```

## Sweep

Variants:

```txt
with path-prompt output candidate:
  max candidates: 8, 12, 16
  bias: 0.5, 1.0, 2.0, 3.0

without path-prompt output candidate:
  max candidates: 8, 12, 16
  bias: 1.0, 2.0, 3.0
```

Each variant ran 100 cases.

## Best result

```txt
variant: path-c12-b1.0
soft EM: 0.230
soft F1: 0.324
path EM: 0.250
path F1: 0.330
soft wins vs path: 1
soft losses vs path: 3
soft wins vs BGE: 17
soft losses vs BGE: 3
```

Top tied/near-tied variants:

| variant | soft EM | soft F1 | path EM | path F1 | wins vs path | losses vs path |
|---|---:|---:|---:|---:|---:|---:|
| path-c12-b1.0 | 0.230 | 0.324 | 0.250 | 0.330 | 1 | 3 |
| path-c12-b2.0 | 0.230 | 0.324 | 0.250 | 0.330 | 1 | 3 |
| path-c16-b1.0 | 0.230 | 0.324 | 0.250 | 0.330 | 1 | 3 |
| path-c16-b2.0 | 0.230 | 0.324 | 0.250 | 0.330 | 1 | 3 |
| path-c8-b1.0 | 0.230 | 0.324 | 0.250 | 0.330 | 1 | 3 |
| path-c8-b2.0 | 0.230 | 0.324 | 0.250 | 0.330 | 1 | 3 |

Without the path-prompt output as candidate, best soft policy drops further:

```txt
nopath-c8-b1.0: EM 0.200 | F1 0.292 | wins 2 | losses 7
```

## Comparison ladder

| condition | EM | F1 | interpretation |
|---|---:|---:|---|
| BM25→BGE strong | 0.090 | 0.185 | natural retrieval baseline |
| retrieved-doc relation ECD | 0.070 | 0.105 | BGE-doc extractor failure |
| entity-hop path prompt | **0.250** | **0.330** | best non-oracle RealRAG bridge |
| strict extractor + ECD | 0.130 | 0.172 | brittle candidate bottleneck |
| soft multi-candidate policy best | 0.230 | 0.324 | close, but still below direct path prompt |
| oracle compact-evidence ECD | 0.907–0.910 | 0.931–0.934 | control-plane upper bound, not retrieval proof |

## Interpretation

Soft/multi-candidate policy is better than strict single-candidate ECD, but it still does **not** beat direct entity-hop graph/path prompting.

The sweep reinforces the current thesis:

```txt
The best non-oracle RealRAG mechanism is still evidence construction + graph/path prompting.
Sampler bias is useful only when candidate control is extremely reliable.
```

Observed pattern:

- Including the direct path-prompt output as one candidate is necessary to stay close to baseline.
- Removing it increases wins in a few cases but adds more losses.
- Increasing bias beyond ~1.0 does not improve EM and can increase losses.
- Candidate-count variations 8/12/16 do not materially change the best region; first-token overlap likely collapses many candidates into similar bias maps.

## Decision

No Boring Receipts update needed: there is no gain over the published RS1 path-prompt result.

Next productive direction is not more first-token bias sweeping. It is:

```txt
entity-hop path prompt -> candidate set with confidence -> answer rerank / fallback logic
```

or a decoder intervention that is conditional, not always-on:

```txt
if path-prompt answer is high-confidence: leave it alone
if path-prompt uncertain or scaffolded: apply candidate bias
```

## Service state

Verified after run:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
