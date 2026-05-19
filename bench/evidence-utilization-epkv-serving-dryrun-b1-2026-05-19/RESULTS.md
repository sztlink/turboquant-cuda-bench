# EPKV bridge path B1 — serving synthetic dry-run trace

> Status: synthetic serving dry-run. Hook expected ON with DRY_RUN=1; answers fall back to original TurboQuant.

## Boundary

```txt
base_url: http://192.168.15.133:11435/v1
model: local-vllm
expected env: VLLM_EPKV_RUNTIME_HOOK=1, DRY_RUN=1, TRACE_SELECTION=1, K=32
prompts: synthetic benchmark contexts
remote_event_log: /home/felipe/vllm-lab/evidence-utilization-epkv-serving-dryrun-b1-2026-05-19/events.jsonl
```

## Summary by target prompt length

| target prompt tokens | runs | mean actual prompt tokens | elapsed p50 ms | elapsed p90 ms | p50 ms/completion token | p90 ms/completion token |
|---:|---:|---:|---:|---:|---:|---:|
| 512 | 3 | 433.0 | 266.9 | 1916.6 | 44.49 | 319.44 |
| 1024 | 3 | 816.0 | 122.4 | 358.0 | 20.40 | 59.67 |
| 1536 | 3 | 1195.0 | 123.9 | 167.6 | 20.66 | 27.93 |
| 2048 | 3 | 1576.0 | 124.7 | 164.8 | 20.79 | 27.46 |

## Event validation

```txt
events captured: 512/512 cap hit
decision: telemetry_only_fallback_to_original_tq
selected_positions_sample: 512/512
seq_len observed in events: 434..820
post-warmup event sync p50/p90: ~0.43 / ~0.48 ms
post-warmup event wall p50/p90: ~0.64 / ~0.70 ms
```

The event cap was reached before all prompt bands were represented in telemetry. This is a **serving contact receipt**, not a full latency characterization across all context lengths.

## Gate note

B1 passed the contact/safety checks:

```txt
synthetic answers: 12/12 DRYRUN-OK
health start/end: 200/200
service restored afterward to VLLM_EPKV_RUNTIME_HOOK=0
```

Latency readout is mixed:

```txt
first B1 request includes Triton compile/warmup: 1916.6 ms
B1 steady rep>0 p90 per completion token: ~44.49 ms
B0 steady rep>0 p90 per completion token: ~22.25 ms
```

Do not proceed to real prompts. If continuing, repeat B1 with explicit warmup separated and a higher event cap, still synthetic-only.

## Service health

```txt
/health start: 200
/health end: 200
```

## Non-claims

- no real prompts
- no quality result
- no serving speedup claim
- no production attention claim
- no comparison to PagedAttention/FlashAttention
