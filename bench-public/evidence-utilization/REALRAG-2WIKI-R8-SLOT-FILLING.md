# RealRAG 2Wiki R8 — structured decomposition + slot filling

Status: completed local gate
Primary artifact: `bench/evidence-utilization-realrag-2wiki-r8-slot-filling-2026-05-21/`

## Boundary

```txt
non-gold structured decomposition and slot filling
answer-side closure only
constructor uses retrieved evidence + question, not gold answer
gold triples are upper bound only
human evaluation not on critical path
no runtime intervention
```

## Why R8 exists

R7 falsified naive generated triples: asking the model to extract free triples from retrieved context trailed paragraph BGE badly.

R8 tests a stronger route:

```txt
question → decomposition → required slots → filled slot packet → answer
```

This keeps the human-eval spreadsheet out of the critical path and asks whether a structured packet can improve closure over direct paragraph answering.

## Variants

```txt
context_bge_typeaware           paragraph BGE baseline
slot_packet_bge_typeaware       slot packet built from BGE paragraphs
slot_packet_relation_typeaware  slot packet built from R6 relation packet
evidence_triples_gold_direct    gold triple upper bound
no_support_typeaware            no-support floor
```

Run shape:

```txt
questions: 80
answer records: 400
slot-packet records: 160
dataset: 2Wiki dev
sample: R3I selected IDs prefix
```

## Result

| variant | n | closure | slots |
|---|---:|---:|---:|
| context_bge_typeaware | 80 | 21.3% | n/a |
| slot_packet_bge_typeaware | 80 | 30.0% | 1.7 |
| slot_packet_relation_typeaware | 80 | 17.5% | 1.7 |
| evidence_triples_gold_direct | 80 | 71.3% | n/a |
| no_support_typeaware | 80 | 1.3% | n/a |

Pairwise readout:

```txt
slot_packet_bge beats paragraph BGE by +8.8 pp
slot_packet_relation trails paragraph BGE by -3.8 pp
slot_packet_bge beats no-support by +28.7 pp
gold triples still beat slot_packet_bge by +41.3 pp
```

By type, the useful gains concentrate in comparison/compositional questions:

```txt
comparison:    paragraph BGE 46.7% → slot_packet_bge 73.3%
compositional: paragraph BGE 40.0% → slot_packet_bge 44.0%
bridge_comp:   paragraph BGE  0.0% → slot_packet_bge 10.5%
inference:     remains 0.0%
```

## Interpretation

R8 is the first non-human 2Wiki construction gate in this sequence that beats paragraph BGE on the same sample.

```txt
naive generated triples failed
free relation packets failed
structured decomposition + slot filling helped
```

The result is still far below gold triples, so this is not solved. But it changes the next move:

```txt
stop optimizing generic compression
start optimizing slot schema by question type
```

Immediate next targets:

```txt
comparison slot schema: candidate A / candidate B / property A / property B / comparator
compositional slot schema: intermediate entity / relation / final entity
bridge-comparison schema: candidate bridge facts + compared attribute
```

## Source artifacts

```txt
bench/evidence-utilization-realrag-2wiki-r8-slot-filling-2026-05-21/records.jsonl
bench/evidence-utilization-realrag-2wiki-r8-slot-filling-2026-05-21/slot-packets.jsonl
bench/evidence-utilization-realrag-2wiki-r8-slot-filling-2026-05-21/summary.json
bench/evidence-utilization-realrag-2wiki-r8-slot-filling-2026-05-21/RESULTS.md
bench/evidence-utilization-realrag-2wiki-r8-slot-filling-2026-05-21/selected-ids.json
```
