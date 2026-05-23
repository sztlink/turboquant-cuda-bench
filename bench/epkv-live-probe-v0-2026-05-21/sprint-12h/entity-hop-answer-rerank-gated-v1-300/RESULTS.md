# Entity-Hop Confidence-Gated Answer Rerank v1

total: 300

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.030 | 0.053 | 0.062 |
| strong | 0.177 | 0.310 | 0.311 |
| path_prompt | 0.220 | 0.317 | 0.333 |
| rerank | 0.223 | 0.327 | 0.338 |
| gated_rerank_v1 | 0.230 | 0.327 | 0.340 |

## Gate

```txt
default: keep entity-hop path prompt
override: confidence high + no overlap + not UNKNOWN-over-concrete-path + not relation-owner rationale
```

## Win/loss

```json
{
  "gated_wins_vs_path": 3,
  "gated_losses_vs_path": 0,
  "gated_wins_vs_bge": 62,
  "gated_losses_vs_bge": 2,
  "overrides": 8
}
```

## Rule counts

```json
{
  "not_high_confidence": 250,
  "overlap_preserve_path": 40,
  "high_confidence_no_overlap_v1": 8,
  "unknown_selected_preserve_concrete_path": 1,
  "relation_owner_preserve_path": 1
}
```

## Overrides

| idx | gold | question | path | verifier | gated |
|---:|---|---|---|---|---|
| 51 | London | What is the place of birth of Clara Novello's father? | `Place of origin` | `London` | `London` |
| 75 | Sochi | What is the place of birth of Zhanna Nemtsova's father? | `Place of origin` | `Hong Kong` | `Hong Kong` |
| 94 | 10 May 1912 | What is the date of death of Henry St John, 18Th Baron St John Of Bletso's father? | `20 April 1805` | `20 April 1767` | `20 April 1767` |
| 152 | Nine Network | Where does Chris Warren (Rugby League)'s father work at? | `Morning` | `Nine Network` | `Nine Network` |
| 175 | Ashgabat | Where did Muza Niyazova's husband die? | `Saparmurat Niyazov died in 2006.` | `21 December 2006` | `21 December 2006` |
| 183 | Hugh de Stafford, 2nd Earl of Stafford | Who is Thomas Stafford, 3Rd Earl Of Stafford's father? | `Hugh Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` |
| 225 | Elizabeth the Cuman | Who is Constantine Palaiologos (Son Of Andronikos Ii)'s maternal grandmother? | `Anna of Hungary` | `Maria Laskarina` | `Maria Laskarina` |
| 252 | Prostějov | What is the place of birth of the director of film Tři Chlapi V Chalupě? | `Place of birth` | `Prague` | `Prague` |
