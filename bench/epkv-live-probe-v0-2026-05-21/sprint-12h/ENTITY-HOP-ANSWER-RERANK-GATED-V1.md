# Entity-Hop Confidence-Gated Answer Rerank v1

Next step after the 300-case v0 gate failed to scale cleanly.

v0 rule:

```txt
default path prompt
override when verifier confidence=high and path/verifier strings do not overlap
```

v1 keeps that default and adds two abstention guards:

```txt
1. UNKNOWN-over-concrete-path guard
   If verifier selected UNKNOWN and path output is a concrete answer, keep path.

2. relation-owner guard
   If rationale says "<verifier answer>'s mother/father/..." while the question
   asks for that relation target, keep path.
```

No new LLM calls: this is a deterministic postprocess over the existing 100/300 rerank outputs.

Artifacts:

```txt
07-scripts/vllm-hook/epkv-summarize-answer-rerank-gated-v1.py
entity-hop-answer-rerank-gated-v1-100/
entity-hop-answer-rerank-gated-v1-300/
```

## 300-case result

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| BM25→BGE ref | 0.030 | 0.053 | 0.062 |
| entity-hop strong | 0.177 | 0.310 | 0.311 |
| entity-hop path prompt | 0.220 | 0.317 | 0.333 |
| raw answer rerank | 0.223 | 0.327 | 0.338 |
| gated rerank v0 | 0.223 | 0.320 | 0.333 |
| gated rerank v1 | **0.230** | **0.327** | **0.340** |

Win/loss vs path:

| gate | wins | losses | overrides |
|---|---:|---:|---:|
| v0 | 3 | 2 | 10 |
| v1 | 3 | 0 | 8 |

v1 rule counts:

```json
{
  "not_high_confidence": 250,
  "overlap_preserve_path": 40,
  "high_confidence_no_overlap_v1": 8,
  "unknown_selected_preserve_concrete_path": 1,
  "relation_owner_preserve_path": 1
}
```

The two v0 losses were removed:

| idx | gold | path | v0 verifier | v1 guard |
|---:|---|---|---|---|
| 53 | Homs | Homs | Syria | UNKNOWN-over-concrete-path |
| 137 | Agrippina the Elder | Agrippina the Elder | Nero | relation-owner rationale |

## 100-case compatibility

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| entity-hop path prompt | 0.250 | 0.340 | 0.330 |
| gated rerank v0 | 0.270 | 0.360 | 0.345 |
| gated rerank v1 | 0.270 | 0.360 | 0.345 |

v1 preserves the 100-case gain and improves the 300-case result from mixed to a small but clean gain.

## Interpretation

This is not a large RealRAG jump. It is a control-plane finding:

```txt
The useful unit is not "verifier confidence".
The useful unit is an override policy that knows when to abstain.
```

Current best non-oracle 300-case result:

```txt
entity-hop path prompt: EM 0.220 | F1 0.333
gated rerank v1:        EM 0.230 | F1 0.340 | wins 3 / losses 0
```

## Next step

Learn/select the override policy rather than hand-writing more rules:

```txt
features:
- verifier confidence
- selected candidate id / UNKNOWN
- path/verifier overlap and token-F1
- question relation/type
- verifier rationale relation-owner pattern
- whether path/verifier appears in candidate graph / selected docs

target:
- override only if path likely wrong and verifier likely right
- optimize wins with zero/near-zero losses
```

Run on held-out slices before publishing any stronger public receipt.
