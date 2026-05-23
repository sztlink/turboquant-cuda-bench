# Entity-Hop Confidence-Gated Answer Rerank 100

This follows the soft-policy sweep conclusion: stop unconditional first-token bias and add a conservative verifier only when the two direct prompts disagree.

Pipeline:

```txt
entity-hop docs
-> strong prompt answer
-> graph/path prompt answer
-> if outputs agree: keep path prompt
-> if outputs disagree: verifier chooses among candidates using same evidence
-> gate override only if verifier confidence=high and verifier/path outputs do not overlap
```

Artifacts:

```txt
07-scripts/vllm-hook/epkv-entity-hop-answer-rerank.py
07-scripts/vllm-hook/epkv-summarize-answer-rerank-gated.py
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-answer-rerank-100/
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-answer-rerank-gated-100/
```

## Results

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BM25→BGE strong baseline | 0.090 | 0.160 | 0.185 |
| entity-hop strong prompt | 0.190 | 0.310 | 0.290 |
| entity-hop graph/path prompt | 0.250 | 0.340 | 0.330 |
| raw answer rerank | 0.240 | 0.350 | 0.325 |
| confidence-gated answer rerank | **0.270** | **0.360** | **0.345** |

Win/loss for gated rerank vs path prompt:

```txt
wins:      2
losses:    0
overrides: 3
```

Compared to BGE:

```txt
gated wins vs BGE:   20
gated losses vs BGE:  2
```

## Gate rule

```txt
default: keep entity-hop graph/path prompt
run verifier only on strong/path disagreement
override only if:
  verifier confidence == high
  verifier output does not contain path output
  path output does not contain verifier output
```

The overlap guard protects exact-answer cases where the verifier chooses a more specific span:

```txt
path:     1969
verifier: December 1969
keep:     1969

path:     United Nations
verifier: United Nations High Commissioner for Refugees
keep:     United Nations
```

## Successful overrides

| idx | gold | path output | verifier output | result |
|---:|---|---|---|---|
| 14 | Catherine Robbe-Grillet | Martha De Laurentiis | Catherine Robbe-Grillet | win |
| 18 | Rukn al-Dawla | 'Adud al-Dawla | Rukn al-Dawla | win |
| 33 | Jeanne d'Albret | Eleanor of Navarre | Marie de' Medici | neutral/wrong→wrong |

No path-correct cases were lost by the gated policy.

## Interpretation

This is the new best non-oracle RealRAG result in this sprint:

```txt
BM25→BGE strong:              EM 0.090 | F1 0.185
entity-hop path prompt:       EM 0.250 | F1 0.330
soft multi-candidate policy:  EM 0.230 | F1 0.324
confidence-gated rerank:      EM 0.270 | F1 0.345
oracle compact-evidence ECD:  EM 0.907–0.910 | F1 0.931–0.934
```

The key shift is control placement:

```txt
unconditional decoder control loses cases
confidence-gated answer control adds wins without losses
```

This does not invalidate ECD; it says ECD must be conditional on uncertainty/candidate confidence, not applied blindly.

## Next step

Scale and harden the gated verifier:

```txt
1. add structured confidence features without gold
2. test on 300 cases
3. add abstention / exact-span preference rules
4. only then revisit sampler-side policy as a conditional intervention
```

## Service state

No sampler policy changes in rerank. Final validation:

```txt
policy file: {"enabled": false, "tag": "default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
