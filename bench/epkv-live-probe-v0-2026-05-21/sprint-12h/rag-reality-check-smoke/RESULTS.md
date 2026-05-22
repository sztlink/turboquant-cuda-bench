# RAG Reality Check

total: 5
corpus_docs: 56687

| condition | n | EM | contains | F1 | support recall | answer in docs | latency s |
|---|---:|---:|---:|---:|---:|---:|---:|
| bge_rerank_strong | 5 | 0.000 | 0.000 | 0.120 | 0.533 | 0.200 | 0.55 |
| bm25_basic | 5 | 0.000 | 0.000 | 0.074 | 0.533 | 0.200 | 0.96 |
| bm25_strong | 5 | 0.000 | 0.000 | 0.133 | 0.533 | 0.200 | 0.54 |

## Rows

| qid | gold | bm25_basic | bm25_strong | bge_rerank_strong |
|---|---|---|---|---|
| 8813f87c0bdd11eba7f7acde48001122 | Małgorzata Braunek | 0/0.00: `The passage provided does not contain any information about the director of the ` | 0/0.00: `Dorota Masłowska` | 0/0.00: `Dorota Masłowska` |
| e2a3bf2a0bdd11eba7f7acde48001122 | 12 June 1516 | 0/0.00: `The passage does not provide any information about when John V, Prince of Anhalt` | 0/0.00: `The passage does not provide the death year of John V's father, Ernest I, Prince` | 0/0.00: `The passage does not provide the death year of John V's father, Ernest I, Prince` |
| 0cd3bdea0bde11eba7f7acde48001122 | Myanmar Motion Picture Academy Awards | 0/0.00: `Based on the information provided in Passage P1, the film "Wearing Velvet Slippe` | 0/0.00: `Maung Wunna won the BAFTA Award for Best British Film for his directorial debut ` | 0/0.00: `Maung Wunna won the Golden Globe Award for Best Director with his film "Slumdog ` |
| f9dcb4a60bda11eba7f7acde48001122 | Missoula, Montana | 0/0.00: `The passage does not provide information about the birthplace of the director of` | 0/0.00: `The question is based on a fictional or unfinished film project called "Ronnie R` | 0/0.00: `David Lynch was the director of the film project Ronnie Rocket, and the passage ` |
| 8981e1ce0bb011ebab90acde48001122 | Charles Armand René de La Trémoille | 0/0.37: `Based on the information provided in the passages, Charles Bretagne Marie de La ` | 0/0.67: `Charles Belgique Hollande de La Trémoille` | 0/0.60: `Henry de La Trémoille` |
