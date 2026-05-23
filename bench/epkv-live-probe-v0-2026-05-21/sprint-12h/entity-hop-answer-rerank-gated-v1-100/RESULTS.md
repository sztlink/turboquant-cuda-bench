# Entity-Hop Confidence-Gated Answer Rerank v1

total: 100

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.090 | 0.160 | 0.185 |
| strong | 0.190 | 0.310 | 0.290 |
| path_prompt | 0.250 | 0.340 | 0.330 |
| rerank | 0.240 | 0.350 | 0.325 |
| gated_rerank_v1 | 0.270 | 0.360 | 0.345 |

## Gate

```txt
default: keep entity-hop path prompt
override: confidence high + no overlap + not UNKNOWN-over-concrete-path + not relation-owner rationale
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

## Rule counts

```json
{
  "not_high_confidence": 83,
  "overlap_preserve_path": 14,
  "high_confidence_no_overlap_v1": 3
}
```

## Overrides

| idx | gold | question | path | verifier | gated |
|---:|---|---|---|---|---|
| 14 | Catherine Robbe-Grillet | Who is the spouse of the director of film Eden And After? | `Martha De Laurentiis` | `Catherine Robbe-Grillet` | `Catherine Robbe-Grillet` |
| 18 | Rukn al-Dawla | Who is the paternal grandfather of Taj Al-Dawla? | `'Adud al-Dawla` | `Rukn al-Dawla` | `Rukn al-Dawla` |
| 33 | Jeanne d'Albret | Who is Gaston, Duke Of Orléans's paternal grandmother? | `Eleanor of Navarre` | `Marie de' Medici` | `Marie de' Medici` |
