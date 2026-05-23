# Entity-Hop Soft Multi-Candidate Policy

total: 10

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.000 | 0.100 | 0.104 |
| path_prompt | 0.600 | 0.600 | 0.633 |
| soft_policy | 0.500 | 0.600 | 0.613 |

## Win/loss

```json
{
  "soft_wins_vs_path": 0,
  "soft_losses_vs_path": 1,
  "soft_wins_vs_bge": 5,
  "soft_losses_vs_bge": 0
}
```

## Rows

| idx | gold | path | soft | candidates | soft output |
|---:|---|---:|---:|---:|---|
| 0 | Małgorzata Braunek | 1/1.00 | 1/1.00 | 12 | `Małgorzata Braunek` |
| 1 | 12 June 1516 | 1/1.00 | 1/1.00 | 10 | `12 June 1516` |
| 2 | Myanmar Motion Picture Academy Awards | 1/1.00 | 0/0.80 | 12 | `Myanmar Motion Picture Academy Awards-winning` |
| 3 | Missoula, Montana | 0/0.00 | 0/0.00 | 12 | `The question cannot be answered based on the given passages and candidate entity graph.` |
| 4 | Charles Armand René de La Trémoille | 1/1.00 | 1/1.00 | 8 | `Charles Armand René de La Trémoille` |
| 5 | Galați | 1/1.00 | 1/1.00 | 12 | `Galați` |
| 6 | Ptolemy IX Lathyros | 0/0.33 | 0/0.33 | 12 | `Antiochus IX Cyzicenus` |
| 7 | Brooklyn | 0/0.00 | 0/0.00 | 12 | `Ken Burns was born in 1953.` |
| 8 | stroke | 0/0.00 | 0/0.00 | 12 | `Princess Victoria Melita of Saxe-Coburg and Gotha died on 2 March 1936` |
| 9 | Nice | 1/1.00 | 1/1.00 | 12 | `Nice` |
