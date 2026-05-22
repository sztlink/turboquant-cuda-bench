# EPKV Live Probe v0 — 2Wiki multi-record boost vs guard

Three real 2Wiki records were mapped from support sentence spans to KV pages and run on the live 4090 vLLM service.

Runtime hook: `evidence_paged_kv.runtime.phase2a.v0`

Modes:

```txt
boost4:   VLLM_EPKV_EVIDENCE_GUARD=1, VLLM_EPKV_EVIDENCE_BOOST=4.0
guardk8:  VLLM_EPKV_EVIDENCE_MIN_K=8, reservation_backend=triton_score_split_triton_topk
```

All multi-record runs were dry-run telemetry: original serving output was returned while Phase2a selected-position geometry was traced.

## Cases

| case | qid | type | gold | pages |
|---:|---|---|---|---|
| 1 | `1c7395fa0bb011ebab90acde48001122` | inference | Johanna Magdalena of Saxe-Altenburg | 2-7 |
| 2 | `008af56e0bdc11eba7f7acde48001122` | compositional | English | 2-6 |
| 3 | `c3c94d0a0bdc11eba7f7acde48001122` | compositional | Víctor Bó | 2-5 |

## Results

| case | mode | events | evidence hit avg | min | max | closure |
|---:|---|---:|---:|---:|---:|---:|
| 1 | boost4 | 8 | 64.73% | 55.69% | 70.31% | no |
| 1 | guardk8 | 8 | 25.00% | 25.00% | 25.00% | no |
| 2 | boost4 | 8 | 65.97% | 61.61% | 70.98% | no |
| 2 | guardk8 | 8 | 25.00% | 25.00% | 25.00% | no |
| 3 | boost4 | 8 | 71.65% | 64.29% | 80.80% | yes |
| 3 | guardk8 | 8 | 25.00% | 25.00% | 25.00% | yes |

Aggregate:

```txt
boost4 evidence hit avg: 67.45%
guardk8 evidence hit avg: 25.00%
boost4 closure: 1/3
guardk8 closure: 1/3
```

## Interpretation

`boost4` aggressively pulls selected positions toward evidence pages, but it is uncontrolled: hit-rate varies per decode step/head and can over-bias broad evidence pages.

`guardk8` now executes through Triton score split + Triton selected-position top-k. It gives a stable reservation of exactly 8 evidence rows out of K=32 per head: 25% evidence selection. This confirms the reserved path is material and deterministic.

The two modes currently have the same answer closure on this tiny set. The important runtime result is not quality yet; it is that the live hook can now compare soft score bias vs hard evidence reservation using real support-span page masks.

## Service restoration

After the live batch, the service was restored to:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
```

and `/health` was revalidated.
