# R3J analysis — non-gold sentence compression

## Key pairwise deltas

| comparison | delta | 95% CI |
|---|---:|---:|
| sentence_bge_top6_direct - context_bge_direct | -8.0 pp | -13.0 to -3.3 pp |
| sentence_bge_top6_typeaware - context_bge_direct | -12.8 pp | -18.0 to -7.5 pp |
| sentence_bge_top10_typeaware - context_bge_direct | -10.3 pp | -15.5 to -5.3 pp |
| support_sentences_gold_typeaware - context_bge_direct | 8.3 pp | 3.0 to 13.5 pp |
| evidence_triples_gold_direct - context_bge_direct | 43.5 pp | 38.0 to 48.5 pp |
| support_sentences_gold_typeaware - sentence_bge_top6_typeaware | 21.0 pp | 16.5 to 25.5 pp |
| evidence_triples_gold_direct - support_sentences_gold_typeaware | 35.3 pp | 29.3 to 40.8 pp |

## Interpretation

Simple lexical sentence compression over BGE-ranked paragraphs does not recover the R3I support-sentence/triple gains. It hurts global closure despite capturing many gold support sentences. The exception is comparison questions, where sentence compression improves closure. This means compression must be relation/schema-aware, not merely shorter.
