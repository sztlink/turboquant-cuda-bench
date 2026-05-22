# EPKV policy stack comparison

| case | candidate | baseline | KV-only | API logit_bias | internal sampler | relation path |
|---|---|---:|---:|---:|---:|---:|
| multi1-johanna | Johanna Magdalena of Saxe-Altenburg | 0 | 0 | 0 | 0 | 1 |
| multi2-english | English | 0 | 0 | 1 | 1 | 1 |
| multi3-victor | Víctor Bó | 0 | 1 | 1 | 1 | 1 |

## Outputs

### multi1-johanna — Johanna Magdalena of Saxe-Altenburg
- **baseline** (0): `Based on the provided evidence, we cannot determine Johanna Magdalene of S`
- **kv_only** (0): `Based on the provided evidence, we cannot determine Johanna Magdalene of Saxe-Weissenfels's paternal`
- **api_logit_bias** (0): `There is not enough evidence provided to determine Johanna Magdalene of Saxe`
- **internal_sampler_policy** (0): `There is not enough evidence provided to determine Johanna Magdalene of Saxe`
- **relation_path_then_decode** (1): `Johanna Magdalena of Saxe-Altenburg`

### multi2-english — English
- **baseline** (0): `Based on the evidence provided, James, Duke of Rothesay (born `
- **kv_only** (0): `Based on the evidence provided, James, Duke of Rothesay (born 1507) was the eldest`
- **api_logit_bias** (1): `Margaret Tudor's country of origin is England, as evidenced by E1`
- **internal_sampler_policy** (1): `Margaret Tudor's country of origin is England, as evidenced by E1`
- **relation_path_then_decode** (1): `English`

### multi3-victor — Víctor Bó
- **baseline** (0): `The child of the director of film La Leona (1964)`
- **kv_only** (1): `The child of the director of film La Leona (Film) is Víctor Bó, who is Armando`
- **api_logit_bias** (1): `Víctor Bó is the child of the director of film La Leona`
- **internal_sampler_policy** (1): `Víctor Bó is the child of the director of film La Leona`
- **relation_path_then_decode** (1): `Víctor Bó`

