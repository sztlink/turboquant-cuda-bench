# Boring Receipt — `<id>`

> Send branch + command shape. We return boring receipts.

| field | value |
|---|---|
| **status** | pass / fail / inconclusive |
| **node** | e.g. AYA-3090 |
| **date** | YYYY-MM-DD |
| **requested by** | handle / PR / issue |

## Target

| field | value |
|---|---|
| engine | llama.cpp / vllm / sglang / tensorrt-llm |
| regime | single-stream / serving (concurrency) |
| project | mainline / turboquant / TriAttention / MTP |
| repo | |
| branch | |
| commit | |
| build | tag / build string |
| build flags | or "official prebuilt release" |

## Environment

| field | value |
|---|---|
| OS | |
| driver | |
| CUDA | |
| GPU | |
| VRAM total | |

## Model

| field | value |
|---|---|
| name | |
| quant | |
| size | |
| params | |
| context | |
| source | HF repo / URL |

## Command

```
<exact command line>
```

## Results

**Single-stream (llama.cpp):**

| metric | value |
|---|---|
| pp (prompt) tok/s | ± stddev |
| tg (generation) tok/s | ± stddev |

**Serving (vllm / sglang / trt-llm):**

| metric | value |
|---|---|
| concurrency | |
| input / output len | |
| output tok/s (total) | |
| requests/s | |
| ITL (median) | ms |

**Common:**

| metric | value |
|---|---|
| TTFT | ms |
| VRAM peak | MiB |
| power avg / peak | W / W |
| temp peak | °C |
| reps / duration | |

## Quality gate (invariant, not an axis)

A diff here is an **alarm**, not a variation. State it explicitly so the bar is
legible and contestable (see `AXES.md`).

| field | value |
|---|---|
| gate version | which gate definition |
| signal | smoke / ppl-delta / needle-hit / kvfidelity |
| criterion | the explicit bar (e.g. "PPL delta < 1%") |
| passed | true / false / n/a |

## Evidence

```
<stdout excerpt>
```

Full logs: `<path in repo>`

## Caveats

<honest limits: shared box, thermal throttle, prebuilt vs source build, etc.>

## Next step

<what would sharpen this receipt>
