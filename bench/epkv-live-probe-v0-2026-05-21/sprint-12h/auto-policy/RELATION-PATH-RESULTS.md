# EPKV relation-path repair

Hard case:

```txt
qid: 1c7395fa0bb011ebab90acde48001122
question: Who is Johanna Magdalene Of Saxe-Weissenfels's paternal grandmother?
```

State-aware decode policy failed because the model had the wrong relation path / refused to infer.

Repair:

```txt
07-scripts/vllm-hook/epkv-relation-path-prompt.py
```

It builds an explicit compact chain from 2Wiki triples:

```txt
Johanna Magdalene of Saxe-Weissenfels -- father --> Johann Georg, Duke of Saxe-Weissenfels.
Johann Georg, Duke of Saxe-Weissenfels -- mother --> Johanna Magdalena of Saxe-Altenburg.
```

Prompt:

```txt
Answer with only the final entity at the end of the relation chain.
```

Result:

| condition | output |
|---|---|
| relation path, no bias | `Johanna Magdalena of Saxe-Altenburg` |
| relation path + bias3 | `Johanna Magdalena of Saxe-Altenburg` |

Interpretation:

```txt
multi1 was not a decode-policy failure.
It was an evidence/relation construction failure.
```

So the architecture now has three layers:

```txt
1. relation/path construction from evidence
2. evidence-derived candidate token nomination
3. state-aware decode policy at sampler/LM-head
```
