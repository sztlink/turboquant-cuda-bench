# EPKV bridge path B1.1 — serving synthetic dry-run with warmup separation

> Status: synthetic serving dry-run. Hook expected ON with DRY_RUN=1; warmup and steady phases separated.

## Boundary

```txt
base_url: http://192.168.15.133:11435/v1
model: local-vllm
expected env: VLLM_EPKV_RUNTIME_HOOK=1, DRY_RUN=1, TRACE_SELECTION=1, K=32, MAX_EVENTS=4096
prompts: synthetic benchmark contexts
remote_event_log: /home/felipe/vllm-lab/evidence-utilization-epkv-serving-dryrun-b11-2026-05-19/events.jsonl
```

## Steady summary by target prompt length

| target prompt tokens | runs | mean actual prompt tokens | elapsed p50 ms | elapsed p90 ms | p50 ms/completion token | p90 ms/completion token |
|---:|---:|---:|---:|---:|---:|---:|
| 512 | 4 | 479.0 | 442.4 | 1117.9 | 49.16 | 124.21 |
| 1024 | 4 | 896.0 | 437.4 | 769.4 | 48.60 | 85.48 |
| 1536 | 4 | 1312.0 | 441.9 | 772.3 | 49.10 | 85.82 |
| 2048 | 4 | 1728.0 | 440.8 | 761.3 | 48.98 | 84.59 |

## Event summary

```txt
steady events copied: 3232
max event cap hit: false
selected_positions_sample: 3232/3232
decision: telemetry_only_fallback_to_original_tq
seq_len observed: 480..1737
post-warmup event drop: first 50 events ignored for event timing summary
sync p50/p90 after drop: ~0.479 / ~0.595 ms
wall p50/p90 after drop: ~0.687 / ~0.868 ms
```

## Gate note

B1.1 fixed the B1 event-cap problem and covered all prompt bands, but serving latency still shows first-request-per-band warmup/autotune effects:

```txt
steady p50 per completion token: ~48–49 ms for most bands
steady p90 per completion token: ~84–86 ms for 1024–2048 bands, 124 ms for 512 due to first measured request
```

This is a usable synthetic contact/telemetry receipt, not a green light for real prompts. If continuing, either repeat with deeper warmup per band or move back offline to real KV replay.

## Service health

```txt
/health start latest phase: 200
/health end latest phase: 200
```

## Non-claims

- no real prompts
- no quality result
- no serving speedup claim
- no production attention claim
- no comparison to PagedAttention/FlashAttention
