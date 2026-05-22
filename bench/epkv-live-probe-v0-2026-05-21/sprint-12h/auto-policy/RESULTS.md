# EPKV auto decode policy

| case | chosen policy | bias | candidate | output | attempts |
|---|---|---:|---|---|---:|
| adv2 | direct_bias | 3 | Víctor Bó | `Víctor Bó` | 3 |
| multi1 | FAILED |  |  | `` | 10 |
| multi2 | prefill_bias | 1 | English | `England, as evidenced by the fact that she became regent for their son James` | 1 |
| multi3 | prefill_bias | 1 | Víctor Bó | `Víctor Bó. Armando Bo is the director of La Leona` | 1 |

## Interpretation

Auto policy can resolve answer-only and entity-slot cases when a candidate appears in baseline or is near the first-token boundary. It still fails on the Johanna grandmother case, which is relation/path confusion rather than decode surface selection.
