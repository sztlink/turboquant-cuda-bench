# EPKV value-mix sprint — answer-token residual experiments

Target case:

```txt
qid: c3c94d0a0bdc11eba7f7acde48001122
gold: Víctor Bó
baseline output: Armando Bo -> Víctor Bó
```

The previous selected-position interventions collapsed the answer to first-hop `Armando Bo`. This sprint moved below top-k selection and changed the value path.

## Runtime changes

New env vars:

```txt
VLLM_EPKV_EVIDENCE_VALUE_MIX=<float>
VLLM_EPKV_EVIDENCE_VALUE_MODE=residual|lerp|replace
VLLM_EPKV_EVIDENCE_SELECT_MODE=topscore|tail
VLLM_EPKV_RUNTIME_START_CALL=<int>
```

New behavior:

- When reserved evidence rows exist, the hook computes a separate evidence-only value accumulator.
- It can mix that accumulator back into the normal Phase2a output:
  - `residual`: `out + alpha * evidence_out`
  - `lerp`: `(1-alpha)*out + alpha*evidence_out`
  - `replace`: `evidence_out`
- `tail` selection reserves the latest rows in a token range rather than the highest-score rows.
- `START_CALL` delays non-dry intervention to later hook calls/layers.

## Non-dry results

All rows below used exact answer-token or terminal-token masks and returned Phase2a output to the endpoint.

| key | token hit | value mode | alpha | output |
|---|---:|---|---:|---|
| answer-value-residual-0.5 | 15.63% | residual | 0.5 | `Armando Bo` |
| answer-value-residual-1.0 | 15.63% | residual | 1.0 | `Armando Bo` |
| answer-value-residual-2.0 | 15.63% | residual | 2.0 | `Armö Bo` |
| answer-value-lerp-0.5 | 15.63% | lerp | 0.5 | `Armando Bo` |
| answer-value-lerp-1.0 | 15.63% | lerp | 1.0 | `Armando Bo` |
| answer-value-replace-1.0 | 15.63% | replace | 1.0 | `Armando Bo` |
| terminal-value-residual-1.0 | 25.00% | residual | 1.0 | `Armando Bo` |
| terminal-value-residual-2.0 | 25.00% | residual | 2.0 | `Armando Bo` |
| terminal-value-replace-1.0 | 25.00% | replace | 1.0 | `Armando Bo` |
| answer-start16-replace-rerun | 15.63% | replace | 1.0 | `Arbmando Bo` |
| answer-start24-replace | — | replace | 1.0 | `Armando` |

## Interpretation

The negative result is now stronger:

```txt
Even replacing the value output with exact answer-token rows does not make the model emit the answer object.
```

The intervention can deform the surface (`Armö`, `Arbmando`, truncation), so the value path is definitely live. But it is not steering semantic closure toward `Víctor Bó`.

This points to a deeper target:

```txt
The answer relation is not recoverable by naive K/V row selection or value-vector mixing alone.
The query/residual stream has already committed to the subject path before these local value edits can redirect it.
```

## Next runtime target

Move from value-vector mixing to **decode policy / logits-facing evidence control**:

```txt
1. Capture output logits/token ids around the first generated token.
2. Detect when EPKV intervention suppresses gold object tokens.
3. Apply evidence-token-aware logit or hidden-state residual after attention, closer to LM head.
```

Still runtime/KV-adjacent, but no longer pretending selection alone is enough.

## Service restoration

After the sprint:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
```
