# EPKV adversarial layout — non-dry page vs token targeting

Built two 2Wiki adversarial-layout prompts where distractors appear before trusted evidence.

Span mapper extension:

```txt
layout: distractors_first
instruction: custom lines
terminal_evidence_pages_spec
terminal_evidence_token_range_spec
```

Runtime hook extension:

```txt
VLLM_EPKV_EVIDENCE_TOKEN_RANGES=START-END
```

When token ranges are present, they override page masks for boost/split/reservation while page masks remain in telemetry.

## Cases

| case | qid | gold | evidence pages | terminal pages | terminal token range |
|---:|---|---|---|---|---|
| 1 | `008af56e0bdc11eba7f7acde48001122` | English | 5-7 | 7 | 113-125 |
| 2 | `c3c94d0a0bdc11eba7f7acde48001122` | Víctor Bó | 6-8 | 7-8 | 115-130 |

## Non-dry results

| case | mode | source | evidence hit | token hit | closure | output |
|---:|---|---|---:|---:|---:|---|
| 1 | baseline | none | — | — | yes | `English` |
| 1 | boost4 | pages 5-7 | 75.14% | — | yes | `English` |
| 1 | guardk8 | pages 5-7 | 25.00% | — | yes | `English` |
| 1 | terminal-boost4 | page 7 | 39.94% | — | yes | `English` |
| 1 | terminal-guardk8 | page 7 | 25.00% | — | yes | `English` |
| 2 | baseline | none | — | — | yes | `Armando Bo -> Víctor Bó` |
| 2 | boost4 | pages 6-8 | 80.87% | — | no | `Armando Bo` |
| 2 | guardk8 | pages 6-8 | 25.00% | — | no | `Armando Bo` |
| 2 | terminal-boost4 | pages 7-8 | 71.68% | — | no | `Armando Bo` |
| 2 | terminal-guardk8 | pages 7-8 | 25.00% | — | no | `Armando Bo` |
| 2 | token-boost4 | rows 115-130 | 51.60% page | 35.38% | no | `Armando Bo` |
| 2 | token-guardk8 | rows 115-130 | 47.39% page | 25.00% | no | `Armando Bo` |
| 2 | token-guardk8boost4 | rows 115-130 | 44.67% page | 25.00% | no | `Armando Bo` |

## Interpretation

The useful discovery is negative and material:

```txt
Increasing evidence selection is not equivalent to preserving the answer-bearing relation.
```

For case 2, baseline returns the full relation `Armando Bo -> Víctor Bó`; every non-dry intervention collapses to first-hop `Armando Bo`. Token-range masks successfully activate (`evidence_source=token_ranges`) and trace token-level hit rates, but the value path still over-amplifies the wrong part of the relation.

Next runtime step:

```txt
Do not only select more evidence rows.
Change value aggregation policy: preserve terminal-span rows later in K order or add answer-span-biased value weighting instead of uniform top-k reservation.
```
