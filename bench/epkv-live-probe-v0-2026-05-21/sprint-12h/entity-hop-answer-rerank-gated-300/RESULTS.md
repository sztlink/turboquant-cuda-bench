# Entity-Hop Confidence-Gated Answer Rerank

total: 300

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.030 | 0.053 | 0.062 |
| strong | 0.177 | 0.310 | 0.311 |
| path_prompt | 0.220 | 0.317 | 0.333 |
| rerank | 0.223 | 0.327 | 0.338 |
| gated_rerank | 0.223 | 0.320 | 0.333 |

## Gate

```txt
default: keep entity-hop path prompt
override: verifier confidence high AND verifier/path outputs do not overlap
```

## Win/loss

```json
{
  "gated_wins_vs_path": 3,
  "gated_losses_vs_path": 2,
  "gated_wins_vs_bge": 60,
  "gated_losses_vs_bge": 2,
  "overrides": 10
}
```

## Overrides

| idx | gold | path | verifier | gated |
|---:|---|---|---|---|
| 51 | London | `Place of origin` | `London` | `London` |
| 53 | Homs | `Homs` | `Syria` | `Syria` |
| 75 | Sochi | `Place of origin` | `Hong Kong` | `Hong Kong` |
| 94 | 10 May 1912 | `20 April 1805` | `20 April 1767` | `20 April 1767` |
| 137 | Agrippina the Elder | `Agrippina the Elder` | `Nero` | `Nero` |
| 152 | Nine Network | `Morning` | `Nine Network` | `Nine Network` |
| 175 | Ashgabat | `Saparmurat Niyazov died in 2006.` | `21 December 2006` | `21 December 2006` |
| 183 | Hugh de Stafford, 2nd Earl of Stafford | `Hugh Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` |
| 225 | Elizabeth the Cuman | `Anna of Hungary` | `Maria Laskarina` | `Maria Laskarina` |
| 252 | Prostějov | `Place of birth` | `Prague` | `Prague` |
