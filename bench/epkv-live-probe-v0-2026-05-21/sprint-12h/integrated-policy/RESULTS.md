# EPKV integrated evidence-policy runner

| case | layer | closed | candidate | output | EPKV pages | EPKV tokens |
|---|---|---:|---|---|---|---|
| adv2 | state_aware_decode_policy | 1 | Víctor Bó | `Víctor Bó` | 7-8 | 125-129 |
| multi1 | relation_path_then_decode | 1 | Johanna Magdalena of Saxe-Altenburg | `Johanna Magdalena of Saxe-Altenburg` | 7 | 113-123 |
| multi2 | state_aware_decode_policy | 1 | English | `England, as evidenced by the fact that she became regent for their son James` | 5 | 83-83 |
| multi3 | state_aware_decode_policy | 1 | Víctor Bó | `Víctor Bó. Armando Bo is the director of La Leona` | 5 | 82-86 |

The runner now carries EPKV provenance from span maps into the final policy decision. Decode-surface failures close through state-aware LM-head policy; relation/path failures fall back to explicit evidence-chain construction.
