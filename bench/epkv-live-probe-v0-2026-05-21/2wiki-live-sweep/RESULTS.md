# EPKV Live Probe v0 — 2Wiki span-page sweep

Case: `1c7395fa0bb011ebab90acde48001122`

Question:

```txt
Who is Johanna Magdalene Of Saxe-Weissenfels's paternal grandmother?
```

Gold:

```txt
Johanna Magdalena of Saxe-Altenburg
```

## Span map

Source:

```txt
../2wiki-span-map.json
```

```txt
total prompt tokens: 408
evidence tokens: 91
evidence pages: 2-7
E1 token range: 34..79  -> pages 2,3,4
E2 token range: 80..124 -> pages 5,6,7
```

## Dry-run boost sweep

All dry-run rows preserve original TurboQuant output while changing selected-position geometry inside the hook.

| boost | guard | events | evidence hit avg | min | max | output closure |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0 | 8 | 15.81% | 10.04% | 20.31% | 0/2 |
| 1 | 1 | 8 | 27.26% | 23.21% | 30.92% | 0/2 |
| 2 | 1 | 8 | 40.30% | 36.27% | 47.10% | 0/2 |
| 4 | 1 | 8 | 64.73% | 55.69% | 70.31% | 0/2 |

The boost sweep changed evidence-page selection geometry monotonically:

```txt
boost 0 → 4: +48.92 pp evidence hit-rate
```

## Live intervention

One non-dry-run pass was executed with:

```txt
VLLM_EPKV_RUNTIME_DRY_RUN=0
VLLM_EPKV_EVIDENCE_GUARD=1
VLLM_EPKV_EVIDENCE_BOOST=4.0
```

Result:

```txt
decision: returned_phase2a_output
events: 8
evidence hit avg: 62.36%
evidence hit min/max: 52.46% / 68.97%
```

Output:

```txt
Based on the evidence provided, we cannot determine who Johanna Magdalene Of Saxe-Weissenfels's
```

Interpretation:

```txt
The intervention changed real decode output path and selected KV geometry.
It did not repair this answer.
The next kernel step should not be bigger boost; it should enforce or reserve evidence rows more precisely per head/layer, and fix prompt/evidence formulation for the target relation.
```

## Service restoration

After the sweep, the start script was restored to:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
```

and `/health` was revalidated.
