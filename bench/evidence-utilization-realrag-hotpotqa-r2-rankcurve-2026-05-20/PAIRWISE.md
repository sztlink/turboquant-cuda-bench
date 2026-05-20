# Pairwise closure deltas — RealRAG HotpotQA R2 rank curve

Boundary: paired closure deltas over the same HotpotQA question IDs. Closure is EM/contains/F1-derived answer closure, not proof of evidence use.

| comparison | n | delta | 95% bootstrap CI | A only | B only | both correct | both wrong |
|---|---:|---:|---:|---:|---:|---:|---:|
| rank_1 - rank_3 | 7384 | 11.0 pp | 10.0 to 12.0 pp | 1140 | 328 | 2654 | 3262 |
| rank_1 - rank_5 | 7384 | 12.8 pp | 11.8 to 13.9 pp | 1265 | 318 | 2529 | 3272 |
| rank_1 - rank_8 | 7384 | 12.7 pp | 11.6 to 13.7 pp | 1289 | 353 | 2505 | 3237 |
| rank_1 - rank_last | 7384 | 9.0 pp | 8.0 to 10.1 pp | 1128 | 463 | 2666 | 3127 |
| rank_1 - no_support | 7384 | 44.5 pp | 43.4 to 45.7 pp | 3334 | 48 | 460 | 3542 |
| rank_3 - rank_5 | 7384 | 1.8 pp | 1.0 to 2.7 pp | 544 | 409 | 2438 | 3993 |
| rank_3 - rank_8 | 7384 | 1.7 pp | 0.8 to 2.6 pp | 615 | 491 | 2367 | 3911 |
| rank_3 - rank_last | 7384 | -2.0 pp | -2.9 to -1.0 pp | 542 | 689 | 2440 | 3713 |
| rank_last - rank_5 | 7384 | 3.8 pp | 3.0 to 4.6 pp | 658 | 376 | 2471 | 3879 |
| rank_last - rank_8 | 7384 | 3.7 pp | 2.9 to 4.4 pp | 543 | 272 | 2586 | 3983 |
| rank_5 - no_support | 7384 | 31.7 pp | 30.6 to 32.8 pp | 2392 | 53 | 455 | 4484 |
| rank_last - no_support | 7384 | 35.5 pp | 34.4 to 36.6 pp | 2670 | 49 | 459 | 4206 |

## Rank curve interpretation

The R2 full run shows a strong position effect, but not a simple monotonic rank curve. `rank_1` is best. `rank_3`, `rank_5`, and `rank_8` collapse into a lower middle-burial band. `rank_last` partially recovers, consistent with a recency effect. `no_support` remains low.

Observed closure order:

```txt
rank_1  > rank_last > rank_3 > rank_8 ≈ rank_5 >> no_support
```

This strengthens the public-dataset claim that answer closure is sensitive to evidence placement even when gold evidence is present, while falsifying the stronger/simple claim that closure decreases monotonically with rank.
