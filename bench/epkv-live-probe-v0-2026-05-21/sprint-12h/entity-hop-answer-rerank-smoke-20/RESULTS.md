# Entity-Hop Answer Rerank

total: 20

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.050 | 0.150 | 0.122 |
| strong | 0.300 | 0.450 | 0.409 |
| path_prompt | 0.300 | 0.450 | 0.414 |
| rerank | 0.400 | 0.550 | 0.484 |

## Win/loss

```json
{
  "rerank_wins_vs_path": 2,
  "rerank_losses_vs_path": 0,
  "rerank_wins_vs_bge": 7,
  "rerank_losses_vs_bge": 0,
  "disagreements": 13
}
```

## Rows

| idx | gold | path | strong | rerank | selected | output |
|---:|---|---:|---:|---:|---|---|
| 0 | Małgorzata Braunek | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Małgorzata Braunek` |
| 1 | 12 June 1516 | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `12 June 1516` |
| 2 | Myanmar Motion Picture Academy Awards | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Myanmar Motion Picture Academy Awards` |
| 3 | Missoula, Montana | 0/0.00 | 0/0.00 | 0/0.00 | C6 | `Bakersfield, California` |
| 4 | Charles Armand René de La Trémoille | 1/1.00 | 0/0.40 | 1/1.00 | C1 | `Charles Armand René de La Trémoille` |
| 5 | Galați | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Galați` |
| 6 | Ptolemy IX Lathyros | 0/0.33 | 0/0.40 | 0/0.33 | PATH_FALLBACK | `Antiochus IX Cyzicenus` |
| 7 | Brooklyn | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `1953` |
| 8 | stroke | 0/0.00 | 0/0.00 | 0/0.00 | C1|C9 | `Princess Victoria Melita of Saxe-Coburg and Gotha died on 2 March 1936` |
| 9 | Nice | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Nice` |
| 10 | 1983 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `2004` |
| 11 | United States | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 12 | Rupert | 0/0.50 | 0/0.40 | 0/0.40 | UNKNOWN | `Rupert III of the Palatinate` |
| 13 | Marie Leszczyńska | 0/0.00 | 0/0.11 | 0/0.00 | PATH_FALLBACK | `Margaret of Artois` |
| 14 | Catherine Robbe-Grillet | 0/0.00 | 1/1.00 | 1/1.00 | C3|C1 | `Catherine Robbe-Grillet` |
| 15 | Hilandar | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Sirmium` |
| 16 | Pompey | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Julia (daughter of Cornelia and mother of Caesar's child-in-law)` |
| 17 | tuberculosis | 0/0.29 | 0/0.20 | 0/0.29 | C2 | `Katherine Mansfield died of extrapulmonary tuberculosis` |
| 18 | Rukn al-Dawla | 0/0.50 | 1/1.00 | 1/1.00 | C2 | `Rukn al-Dawla` |
| 19 | Xi'an | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Xi'an, Shaanxi` |
