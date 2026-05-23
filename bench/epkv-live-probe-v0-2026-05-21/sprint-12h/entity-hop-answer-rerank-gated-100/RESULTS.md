# Entity-Hop Confidence-Gated Answer Rerank

total: 100

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.090 | 0.160 | 0.185 |
| strong | 0.190 | 0.310 | 0.290 |
| path_prompt | 0.250 | 0.340 | 0.330 |
| rerank | 0.240 | 0.350 | 0.325 |
| gated_rerank | 0.270 | 0.360 | 0.345 |

## Gate

```txt
default: keep entity-hop path prompt
override: verifier confidence high AND verifier/path outputs do not overlap
```

## Win/loss

```json
{
  "gated_wins_vs_path": 2,
  "gated_losses_vs_path": 0,
  "gated_wins_vs_bge": 20,
  "gated_losses_vs_bge": 2,
  "overrides": 3
}
```

## Overrides

| idx | gold | path | verifier | gated |
|---:|---|---|---|---|
| 14 | Catherine Robbe-Grillet | `Martha De Laurentiis` | `Catherine Robbe-Grillet` | `Catherine Robbe-Grillet` |
| 18 | Rukn al-Dawla | `'Adud al-Dawla` | `Rukn al-Dawla` | `Rukn al-Dawla` |
| 33 | Jeanne d'Albret | `Eleanor of Navarre` | `Marie de' Medici` | `Marie de' Medici` |
