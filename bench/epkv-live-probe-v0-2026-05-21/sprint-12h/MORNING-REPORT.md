# EPKV 12h sprint — morning report draft

## What changed

New runtime/diagnostic tools:

```txt
07-scripts/vllm-hook/epkv-decode-policy-harness.py
07-scripts/vllm-hook/epkv-state-aware-decode-policy.py
07-scripts/vllm-hook/epkv-auto-decode-policy.py
07-scripts/vllm-hook/patch-vllm-sampler-logit-policy.py
```

## Core finding

The `Víctor Bó` failure was not because the answer token was absent.
It was a near-boundary sampler decision:

```txt
Ar    -0.052
V     -3.052
Vict  -5.677
```

A small logit-policy diagnostic flips it:

```txt
bias >=3 on [53, 647, 36125] -> Víctor Bó
```

## Architecture conclusion

```txt
KV trace/selection should nominate evidence-derived candidate tokens.
LM-head/sampler policy must do the early steering.
```

KV/value-only interventions were live but insufficient.

## Evidence-derived result

Without using gold labels, terminal triple object extraction gets:

```txt
Armando Bó -- child --> Víctor Bó
candidate: Víctor Bó
```

and flips the answer with bias >=3.

## State-aware result

For verbose prompts, first-token answer bias is not enough because the model starts with discourse scaffolds:

```txt
Based...
The...
```

Two working strategies:

```txt
1. assistant/entity-slot prefill -> bias candidate at the slot
2. scaffold suppression -> negative bias on Based/The/According/From + positive candidate bias
```

Examples:

```txt
multi3: suppress scaffold + bias3 -> Víctor Bó is the child...
multi2: suppress scaffold + bias10 -> Margaret Tudor's country of origin is English...
```

## Auto policy sweep

| case | result |
|---|---|
| adv2 | direct bias +3 -> `Víctor Bó` |
| multi2 | entity-slot/prefill bias -> `England...` / alias of English |
| multi3 | entity-slot/prefill bias -> `Víctor Bó...` |
| multi1 | failed |

## Remaining hard case

`multi1` / Johanna grandmother still fails. It selects/confuses path with Fredericka Elisabeth / cannot-determine. This is not merely decode surface selection; it is relation/path construction failure.

Next target:

```txt
relation-aware candidate/path extraction before decode policy
```

For this hard case, the system must represent:

```txt
Johanna Magdalene -> father -> Johann Georg -> mother -> Johanna Magdalena
```

not just bias an answer token after a confused path.

## Service state

```txt
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
```
