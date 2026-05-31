# Answer-from-selected-chain smoke - offset1500 N=100

## Boundary

```txt
4090/vLLM answer smoke
no serving mutation
no kernel change
explicit path candidates selected before answer generation
gold is eval-only metadata and is not included in prompts
```

## Macro

| condition | EM | contains | F1 | refusal/missing |
|---|---:|---:|---:|---:|
| answer_from_chain | 0.300 | 0.370 | 0.350 | 0.510 |
| candidate_direct | 0.440 | 0.540 | 0.527 | 0.280 |
| config0_path_prompt | 0.180 | 0.260 | 0.288 | 0.020 |
| current_path_prompt | 0.140 | 0.200 | 0.248 | 0.020 |

## Pairwise EM movement

```txt
vs config0 path prompt: 14 wins / 2 losses / 84 ties
vs current path prompt: 19 wins / 3 losses / 78 ties
vs direct candidate string: 0 wins / 14 losses / 86 ties
```

## Readout

The smoke improved over config0 path prompt on EM/F1, but failed the full gate.
The blocker is not wins/losses:

```txt
F1 delta vs config0: +0.062
EM movement vs config0: 14 wins / 2 losses / 84 ties
```

The blocker is refusal behavior:

```txt
answer_from_chain refusal rate: 0.510
config0 path_prompt refusal rate: 0.020
refusal delta: +0.490
```

The model often refused even when the explicit candidate path had a correct answer.
The direct candidate object remains stronger than asking the model to re-answer from
that object.

Decision:

```txt
no runtime mapping yet
no megakernel yet
revise answer interface / path object before any further GPU run
```

## Gate decision

```json
{
  "gate": "fail_or_mixed",
  "f1_delta_vs_config0": 0.06187301587301585,
  "em_wins_vs_config0": 14,
  "em_losses_vs_config0": 2,
  "refusal_delta_vs_config0": 0.49,
  "next": "revise_path_candidates_no_runtime"
}
```

## Non-claims

- This is not a megakernel run.
- This is not a serving speedup claim.
- This is not an EPKV runtime intervention.
- It tests whether explicit path candidates improve answer generation over unstructured path prompting on this held-out slice.

