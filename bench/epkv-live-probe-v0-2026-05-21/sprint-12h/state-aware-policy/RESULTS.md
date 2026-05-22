# EPKV 12h sprint — state-aware decode policy

This phase tested the boundary discovered by logprobs:

```txt
KV/value-only can deform output but does not cross the answer decision boundary.
LM-head/sampler bias can cross it.
```

The new harness:

```txt
07-scripts/vllm-hook/epkv-state-aware-decode-policy.py
```

implements three API-level diagnostics:

1. baseline decode;
2. direct evidence-derived candidate bias;
3. assistant-prefill/entity-slot continuation when the baseline scaffold contains the candidate later.

It also supports scaffold suppression:

```txt
--suppress-scaffold
--scaffold-bias -10
```

This applies negative bias to common discourse openers like `Based`, `The`, `According`, `From`, while positively biasing the evidence-derived candidate token ids.

## Key results

### Adversarial answer-only case

```txt
candidate: Víctor Bó
baseline: Armando Bo
direct bias +3: Víctor Bó
```

### Natural verbose case: La Leona

Original behavior starts with scaffold:

```txt
baseline: The child of the director of film La Leona (Film) is Víctor Bó...
```

State-aware/entity-slot behavior:

```txt
prefix: The child of the director of film La Leona (Film) is
prefill + bias: Víctor Bó. Armando Bo is the director of La Leona
```

Scaffold suppression works even without prefill:

```txt
--suppress-scaffold --bias 3
output: Víctor Bó is the child of the director of film La Leona
```

### Natural verbose case: James / Margaret Tudor

Baseline starts with scaffold and verbalizes dataset label as `England`:

```txt
baseline: Based on the evidence provided... Margaret Tudor was from England...
candidate label: English
matched alias for slot detection: England
```

Entity-slot continuation:

```txt
prefix: ... Margaret Tudor was from
prefill + bias10: English, as she was the daughter of Henry VII of England...
```

Scaffold suppression works directly:

```txt
--suppress-scaffold --bias 10
output: Margaret Tudor's country of origin is English, as evidenced by E1
```

### Hard case: Johanna grandmother

Manual slot prefix did not repair:

```txt
prefix: The paternal grandmother was
candidate: Johanna Magdalena of Saxe-Altenburg
output: Fredericka Elisabeth of Saxe-Eisenach...
```

This case likely needs relation/path repair, not just decode-policy steering.

## Interpretation

Two useful regimes now exist:

```txt
answer-only prompt      -> first-token evidence-candidate bias
verbose/scaffold prompt -> suppress scaffold or delay bias until entity slot
```

The mechanism is no longer gold-only: candidates can come from terminal support objects or answer occurrences in evidence spans.

## Next runtime target

Make the policy automatic:

```txt
1. derive candidate from terminal evidence span
2. detect prompt style / scaffold tendency from first-token logprobs
3. if scaffold dominates, suppress scaffold tokens or delay candidate bias
4. combine with EPKV trace as candidate provenance
```
