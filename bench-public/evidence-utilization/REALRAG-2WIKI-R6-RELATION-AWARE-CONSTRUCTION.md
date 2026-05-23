# RealRAG 2Wiki R6 — relation-aware evidence construction

Status: completed local gate
Primary artifact: `bench/evidence-utilization-realrag-2wiki-r6-relation-aware-construction-2026-05-21/`

## Boundary

```txt
non-gold relation-aware evidence construction
answer-side closure only
not evidence-use proof
not human-eval gated
not serving benchmark
no runtime intervention
```

## Why R6 exists

R3I/R3J showed that 2Wiki does not behave like HotpotQA under the same natural-retrieval ladder:

```txt
paragraph rank alone is not enough
gold triples are a strong upper bound
naive lexical sentence compression hurts globally
```

R6 moves human evaluation out of the critical path and tests a non-gold construction step:

```txt
question → entities / relation terms → compact evidence packet → answer closure
```

## Variants

```txt
context_bge_typeaware                paragraph BGE baseline
sentence_bge_top10_typeaware         lexical sentence compression baseline
relation_entity_packet_typeaware     non-gold entity/relation packet
relation_bridge_packet_typeaware     non-gold bridge/relation packet
support_sentences_gold_typeaware     gold support sentence upper bound
evidence_triples_gold_direct         gold triple upper bound
no_support_typeaware                 no-support leakage floor
```

Run shape:

```txt
questions: 80
records: 560
dataset: 2Wiki dev
sample: R3I selected IDs prefix
```

## Result

| variant | n | closure | sentence recall | support-title recall |
|---|---:|---:|---:|---:|
| context_bge_typeaware | 80 | 21.3% | n/a | 100.0% |
| sentence_bge_top10_typeaware | 80 | 15.0% | 59.4% | 100.0% |
| relation_entity_packet_typeaware | 80 | 16.3% | 69.4% | 100.0% |
| relation_bridge_packet_typeaware | 80 | 16.3% | 66.3% | 100.0% |
| support_sentences_gold_typeaware | 80 | 40.0% | 100.0% | 100.0% |
| evidence_triples_gold_direct | 80 | 82.5% | n/a | 0.0% |
| no_support_typeaware | 80 | 2.5% | n/a | 0.0% |

Pairwise readout:

```txt
relation packets beat lexical sentence compression by +1.3 pp
relation packets trail paragraph BGE by -5.0 pp
gold support sentences beat relation packet by +23.8 pp
gold triples beat relation packet by +66.3 pp
relation packet beats no-support by +13.8 pp
```

## Interpretation

The relation-aware packet improved support-sentence recall over lexical sentence compression, but did not beat full paragraph BGE. This is useful falsification:

```txt
more support-sentence recall is not enough
compressing relation evidence can remove context needed for closure
2Wiki needs relation/schema construction closer to triples, not just entity-linked sentences
```

The strongest signal remains the gap:

```txt
paragraph BGE:        21.3%
relation packet:      16.3%
gold support sentence 40.0%
gold triples:         82.5%
```

So the next non-human path is not “review more labels”. It is to build a **non-gold triple-like constructor** and test whether it closes part of the gold-triple gap.

## Source artifacts

```txt
bench/evidence-utilization-realrag-2wiki-r6-relation-aware-construction-2026-05-21/records.jsonl
bench/evidence-utilization-realrag-2wiki-r6-relation-aware-construction-2026-05-21/summary.json
bench/evidence-utilization-realrag-2wiki-r6-relation-aware-construction-2026-05-21/RESULTS.md
bench/evidence-utilization-realrag-2wiki-r6-relation-aware-construction-2026-05-21/selected-ids.json
```
