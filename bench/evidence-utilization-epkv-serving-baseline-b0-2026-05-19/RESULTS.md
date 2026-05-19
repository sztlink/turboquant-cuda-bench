# EPKV bridge path B0 — serving baseline hook-off

> Status: synthetic serving baseline. Existing vLLM service only; no hook-on, no dry-run, no service restart.

## Boundary

```txt
base_url: http://192.168.15.133:11435/v1
model: local-vllm
VLLM_EPKV_RUNTIME_HOOK: not enabled by this script
prompts: synthetic benchmark contexts
```

## Why this exists

Track A showed the synthetic micro-kernel ratio gate was structurally mismatched. B0 measures the real serving latency scale with hook OFF so any future dry-run trace can be budgeted against serving latency, not against a tiny micro-kernel baseline.

## Summary by target prompt length

| target prompt tokens | runs | mean actual prompt tokens | elapsed p50 ms | elapsed p90 ms | p50 ms/completion token | p90 ms/completion token |
|---:|---:|---:|---:|---:|---:|---:|
| 512 | 3 | 409.0 | 106.5 | 296.8 | 21.30 | 59.35 |
| 1024 | 3 | 772.0 | 107.2 | 167.1 | 21.43 | 33.41 |
| 1536 | 3 | 1132.0 | 111.2 | 155.5 | 22.25 | 31.10 |
| 2048 | 3 | 1492.0 | 108.4 | 157.7 | 21.68 | 31.54 |

## Gate implication

If future hook-on dry-run uses a 15% per-completion-token overhead budget, the current B0 p90 gives ~5.01 ms. Compare this against Track A trace overhead before any hook-on serving probe.

Track A K=32 trace overhead was below this B0-derived budget in the tested bands. This makes a **synthetic hook-on dry-run probe** plausible, but it does not authorize real-prompt hook-on serving. The next step still needs explicit infra confirmation because it would temporarily enable the hook in the serving process.

## Service health after run

```txt
/health start: 200
/health end: 200
4090 monitor after run: OK; GPU idle; vLLM VRAM ~21.9 GiB
```

## Non-claims

- no EPKV hook-on result
- no quality result
- no serving speedup claim
- no production attention claim
- no comparison to PagedAttention/FlashAttention
