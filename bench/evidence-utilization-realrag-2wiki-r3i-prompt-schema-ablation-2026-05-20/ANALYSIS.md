# R3I analysis — 2Wiki prompt/schema ablation

## Key pairwise deltas

| comparison | delta | 95% CI |
|---|---:|---:|
| context_bge_typeaware - context_bge_direct | 0.0 pp | -4.5 to 4.5 pp |
| context_oracle_typeaware - context_bge_direct | 1.3 pp | -3.8 to 6.3 pp |
| support_sentences_typeaware - context_bge_direct | 23.3 pp | 17.5 to 29.0 pp |
| evidence_triples_direct - context_bge_direct | 43.8 pp | 38.5 to 49.0 pp |
| evidence_triples_typeaware - context_bge_direct | 31.3 pp | 25.3 to 37.5 pp |
| support_sentences_typeaware - no_support_typeaware | 49.5 pp | 44.5 to 54.3 pp |
| evidence_triples_direct - no_support_typeaware | 70.0 pp | 65.3 to 74.8 pp |
| evidence_triples_direct - support_sentences_typeaware | 20.5 pp | 14.8 to 26.3 pp |
| evidence_triples_typeaware - evidence_triples_direct | -12.5 pp | -18.3 to -7.0 pp |

## Interpretation

Type-aware paragraph prompts do not materially improve the BGE paragraph context baseline. Oracle/type-aware is also close to baseline. Support-only sentences and gold evidence triples produce large gains, showing that 2Wiki failures are strongly schema/compression sensitive rather than simple support absence. Evidence triples are a gold-structured upper bound, not a retrieval claim.
