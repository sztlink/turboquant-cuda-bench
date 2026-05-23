# Entity-Hop Confidence-Gated Answer Rerank

total: 500

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.018 | 0.032 | 0.037 |
| strong | 0.172 | 0.288 | 0.285 |
| path_prompt | 0.216 | 0.306 | 0.324 |
| rerank | 0.212 | 0.308 | 0.322 |
| gated_rerank | 0.216 | 0.304 | 0.323 |

## Gate

```txt
default: keep entity-hop path prompt
override: verifier confidence high AND verifier/path outputs do not overlap
```

## Win/loss

```json
{
  "gated_wins_vs_path": 2,
  "gated_losses_vs_path": 2,
  "gated_wins_vs_bge": 101,
  "gated_losses_vs_bge": 2,
  "overrides": 20
}
```

## Overrides

| idx | gold | path | verifier | gated |
|---:|---|---|---|---|
| 94 | 10 May 1912 | `20 April 1805` | `20 April 1767` | `20 April 1767` |
| 100 | British | `British` | `French` | `French` |
| 112 | Belfast | `Place of birth` | `Kenneth Branagh` | `Kenneth Branagh` |
| 128 | Hollywood | `Not specified` | `Oslo` | `Oslo` |
| 175 | Ashgabat | `Saparmurat Niyazov died in 2006.` | `21 December 2006` | `21 December 2006` |
| 183 | Hugh de Stafford, 2nd Earl of Stafford | `Hugh Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` |
| 204 | Christ's College, Cambridge | `Not mentioned in the passages.` | `Christ's College, Cambridge` | `Christ's College, Cambridge` |
| 299 | Prince Yi Kang | `Herodes Atticus` | `Prince Yi Seok` | `Prince Yi Seok` |
| 316 | Christian August of Holstein-Gottorp, Prince of Eutin | `Charles, Duke of Vendôme` | `Charles de Bourbon` | `Charles de Bourbon` |
| 324 | Iyasu I | `Tekle Giyorgis I` | `Yohannes II` | `Yohannes II` |
| 337 | Bakersfield | `Place of origin` | `Place of birth` | `Place of birth` |
| 368 | Sir Paul Gore, 1st Baronet | `Sir Paul Gore, 1st Baronet` | `Sir Ralph Gore, 2nd Baronet` | `Sir Ralph Gore, 2nd Baronet` |
| 370 | Jean Harlow | `Mary Sweeney` | `Paul Bern` | `Paul Bern` |
| 381 | 14 September 1964 | `1847` | `15 April 1526` | `15 April 1526` |
| 384 | British | `Uncertain` | `American` | `American` |
| 407 | New York | `Russian Civil War` | `Paris` | `Paris` |
| 415 | Bronx | `Place of birth` | `Manhattan` | `Manhattan` |
| 425 | Japan | `Japanese` | `British` | `British` |
| 448 | Joan of Acre | `Eleanor de Braose` | `Elizabeth de Clare` | `Elizabeth de Clare` |
| 488 | Ariane Ascaride | `Martha De Laurentiis` | `Robert Guédiguian` | `Robert Guédiguian` |
