# EPKV integrated batch — 24 cases offset 6

Batch completed successfully.

```txt
out: bench/epkv-live-probe-v0-2026-05-21/sprint-12h/integrated-batch-24-offset6/
log: /home/aya/implante/tmp/epkv-integrated-batch-24-offset6.log
elapsed: 699.33 sec
closed: 24/24
```

Layer split:

| layer | closed | total |
|---|---:|---:|
| state_aware_decode_policy | 23 | 23 |
| relation_path_then_decode | 1 | 1 |

Type/layer split:

| type + layer | closed | total |
|---|---:|---:|
| compositional + state-aware decode | 16 | 16 |
| inference + state-aware decode | 7 | 7 |
| inference + relation-path fallback | 1 | 1 |

Cumulative with previous 6-case sanity batch:

```txt
closed: 30/30
state_aware_decode_policy: 27/27
relation_path_then_decode: 3/3
```

Important caveat:

```txt
`closed` here is automatic string/alias closure from the runner, not human factual adjudication.
```

But it is the right runtime signal for this sprint: the integrated stack can force the answer surface to contain the evidence-derived terminal candidate or a known alias, while preserving a clean split between decode-surface failures and relation/path construction failures.

Architecture reinforced:

```txt
EPKV span provenance -> relation/candidate extraction -> LM-head/sampler-facing policy
```

Representative outputs:

| idx | layer | answer | output |
|---:|---|---|---|
| 6 | state-aware | Ptolemy IX Lathyros | `Ptolemy IX Lathyros is the maternal grandfather of Antioch` |
| 20 | state-aware | German | `Germany...` |
| 23 | state-aware | Víctor Bó | `Víctor Bó is the child of the director of the film La Le...` |
| 24 | relation-path | Urraca of Castile | `Urraca of Castile` |
| 29 | state-aware | Winnipeg, Manitoba | `Winnipeg, Manitoba.` |

Service/default-off state verified after batch:

```txt
policy file: {"enabled":false,"tag":"default-off"}
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS=0
/health OK
```
