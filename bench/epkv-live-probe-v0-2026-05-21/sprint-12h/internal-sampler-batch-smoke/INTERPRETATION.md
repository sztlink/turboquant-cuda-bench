# Internal sampler batch smoke

Script:

```txt
07-scripts/vllm-hook/epkv-internal-sampler-policy-batch.py
```

This runs the live internal sampler policy path over existing span maps:

```txt
span map -> generated dynamic policy file -> vLLM sampler hook -> normal request without API logit_bias -> restore off
```

Smoke on the original 3 2Wiki span maps:

```txt
closed: 2/3
```

| qid | candidate | output | closed |
|---|---|---|---:|
| 1c7395... | Johanna Magdalena of Saxe-Altenburg | `We cannot determine Johanna Magdalene of Saxe-Weissenfels` | 0 |
| 008af5... | English | `Margaret Tudor's country of origin is England, as evidenced by E1` | 1 |
| c3c94... | Víctor Bó | `Víctor Bó is the child of the director of film La Leona` | 1 |

Interpretation:

```txt
Internal sampler policy reproduces the surface-decode wins without API logit_bias.
The Johanna case remains a relation/path construction failure and needs relation-path fallback before sampler policy.
```

Post-smoke state:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```
