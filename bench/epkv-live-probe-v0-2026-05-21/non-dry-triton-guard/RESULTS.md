# EPKV non-dry Triton guard runs

Two sentence-evidence 2Wiki cases were run with `VLLM_EPKV_RUNTIME_DRY_RUN=0`, so Phase2a output was returned to the OpenAI endpoint.

Modes:

```txt
boost4:        evidence-page score boost, boost=4.0
guardk8:       hard reservation, min evidence K=8
guardk8boost4: hard reservation + boost=4.0
```

## Results

| case | mode | evidence hit avg | closure | output effect |
|---:|---|---:|---:|---|
| 1 | boost4 | 59.87% | no | still cannot determine grandmother |
| 1 | guardk8 | 25.00% | no | still cannot determine grandmother |
| 1 | guardk8boost4 | 25.00% | no | still cannot determine grandmother |
| 2 | boost4 | 61.68% | no | says England, but not exact `English` |
| 2 | guardk8 | 25.00% | no | drifts to Scotland/James IV path |
| 2 | guardk8boost4 | 25.00% | no | drifts to Scotland/James IV path |

## Diagnosis

Non-dry intervention is live and changes the returned decode path. But page-level hard reservation can over-preserve first-hop evidence and degrade final-hop answer extraction.

This led directly to the next patch: token-range evidence masks, so the hook can target answer-bearing rows instead of whole KV pages.
