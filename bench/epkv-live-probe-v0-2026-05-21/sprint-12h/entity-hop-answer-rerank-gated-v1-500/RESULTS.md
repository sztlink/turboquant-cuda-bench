# Entity-Hop Confidence-Gated Answer Rerank v1

total: 500

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.018 | 0.032 | 0.037 |
| strong | 0.172 | 0.288 | 0.285 |
| path_prompt | 0.216 | 0.306 | 0.324 |
| rerank | 0.212 | 0.308 | 0.322 |
| gated_rerank_v1 | 0.216 | 0.304 | 0.323 |

## Gate

```txt
default: keep entity-hop path prompt
override: confidence high + no overlap + not UNKNOWN-over-concrete-path + not relation-owner rationale
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

## Rule counts

```json
{
  "not_high_confidence": 403,
  "overlap_preserve_path": 77,
  "high_confidence_no_overlap_v1": 20
}
```

## Overrides

| idx | gold | question | path | verifier | gated |
|---:|---|---|---|---|---|
| 94 | 10 May 1912 | What is the date of death of Henry St John, 18Th Baron St John Of Bletso's father? | `20 April 1805` | `20 April 1767` | `20 April 1767` |
| 100 | British | What nationality is the director of film Madeleine (1950 Film)? | `British` | `French` | `French` |
| 112 | Belfast | What is the place of birth of the director of film Peter'S Friends? | `Place of birth` | `Kenneth Branagh` | `Kenneth Branagh` |
| 128 | Hollywood | Where was the place of death of the composer of song How Long Has This Been Going On?? | `Not specified` | `Oslo` | `Oslo` |
| 175 | Ashgabat | Where did Muza Niyazova's husband die? | `Saparmurat Niyazov died in 2006.` | `21 December 2006` | `21 December 2006` |
| 183 | Hugh de Stafford, 2nd Earl of Stafford | Who is Thomas Stafford, 3Rd Earl Of Stafford's father? | `Hugh Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` | `Hugh de Stafford, 2nd Earl of Stafford` |
| 204 | Christ's College, Cambridge | Where did George Lane-Fox (Mp)'s father study? | `Not mentioned in the passages.` | `Christ's College, Cambridge` | `Christ's College, Cambridge` |
| 299 | Prince Yi Kang | Who is the paternal grandfather of Yi Hong? | `Herodes Atticus` | `Prince Yi Seok` | `Prince Yi Seok` |
| 316 | Christian August of Holstein-Gottorp, Prince of Eutin | Who is Charles Xiii Of Sweden's paternal grandfather? | `Charles, Duke of Vendôme` | `Charles de Bourbon` | `Charles de Bourbon` |
| 324 | Iyasu I | Who is Tekle Haymanot Ii's paternal grandfather? | `Tekle Giyorgis I` | `Yohannes II` | `Yohannes II` |
| 337 | Bakersfield | What is the place of birth of the performer of song If You Want To Be My Woman? | `Place of origin` | `Place of birth` | `Place of birth` |
| 368 | Sir Paul Gore, 1st Baronet | Who is Sir William Gore, 3Rd Baronet's paternal grandfather? | `Sir Paul Gore, 1st Baronet` | `Sir Ralph Gore, 2nd Baronet` | `Sir Ralph Gore, 2nd Baronet` |
| 370 | Jean Harlow | Who is the spouse of the director of film Worldly Goods? | `Mary Sweeney` | `Paul Bern` | `Paul Bern` |
| 381 | 14 September 1964 | What is the date of death of Fitzroy Somerset, 5Th Baron Raglan's father? | `1847` | `15 April 1526` | `15 April 1526` |
| 384 | British | What nationality is the director of film Detachment (Film)? | `Uncertain` | `American` | `American` |
| 407 | New York | Where did Oleg Kerensky's father die? | `Russian Civil War` | `Paris` | `Paris` |
| 415 | Bronx | What is the place of birth of the performer of song Thru Your Phone? | `Place of birth` | `Manhattan` | `Manhattan` |
| 425 | Japan | What nationality is the singer of Pre (Band)? | `Japanese` | `British` | `British` |
| 448 | Joan of Acre | Who is the maternal grandmother of Isabel De Verdun, Baroness Ferrers Of Groby? | `Eleanor de Braose` | `Elizabeth de Clare` | `Elizabeth de Clare` |
| 488 | Ariane Ascaride | Who is the spouse of the director of film Marie-Jo And Her Two Lovers? | `Martha De Laurentiis` | `Robert Guédiguian` | `Robert Guédiguian` |
