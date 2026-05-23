# Entity-Hop Retrieval

total: 10
corpus_docs: 56687

## Retrieval

| metric | value |
|---|---:|
| support_title_recall | 0.817 |
| full_support_recall | 0.600 |
| answer_string_present_rate | 0.800 |

## Answer quality

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.000 | 0.100 | 0.104 |
| entity_hop_path_prompt | 0.500 | 0.600 | 0.577 |
| entity_hop_strong | 0.300 | 0.400 | 0.425 |

## Rows

| qid | gold | support | answer in docs | bge | hop strong | path | extract | ecd |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 8813f87c0bdd11eba7f7acde48001122 | Małgorzata Braunek | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e2a3bf2a0bdd11eba7f7acde48001122 | 12 June 1516 | 0.67 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 0cd3bdea0bde11eba7f7acde48001122 | Myanmar Motion Picture Academy Awards | 1.00 | 1 | 0/0.00 | 0/0.45 | 0/0.77 |  |  |
| f9dcb4a60bda11eba7f7acde48001122 | Missoula, Montana | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8981e1ce0bb011ebab90acde48001122 | Charles Armand René de La Trémoille | 1.00 | 1 | 0/0.60 | 0/0.40 | 1/1.00 |  |  |
| 019bed300bde11eba7f7acde48001122 | Galați | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 2ec440560bb011ebab90acde48001122 | Ptolemy IX Lathyros | 0.33 | 0 | 0/0.33 | 0/0.40 | 0/0.00 |  |  |
| 464cfa460bd911eba7f7acde48001122 | Brooklyn | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c05e16a40bdd11eba7f7acde48001122 | stroke | 1.00 | 1 | 0/0.11 | 0/0.00 | 0/0.00 |  |  |
| 2935f1640bda11eba7f7acde48001122 | Nice | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
