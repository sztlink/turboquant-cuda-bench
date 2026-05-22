# Evidence-KV Live Probe v0

This is the pivot back to runtime/KV/kernel work.

## What changed

Patched the experimental vLLM TurboQuant runtime hook:

```txt
07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py
```

New live probe env vars:

```txt
VLLM_EPKV_EVIDENCE_PAGES="2,5-6"   # evidence KV pages / page ranges
VLLM_EPKV_EVIDENCE_GUARD=1          # enable intervention, not just probe
VLLM_EPKV_EVIDENCE_BOOST=4.0        # add score boost before top-k
```

Behavior inside decode hook:

```txt
scores = Q · K over KV slots
if evidence pages are configured:
  build evidence_page_mask on device
  Triton kernel adds BOOST to scores whose row belongs to evidence page
topk(scores) selects KV positions
telemetry emits evidence hit/miss rate over selected positions
value kernel gathers selected KV as before
```

New Triton kernel:

```txt
_epkv_evidence_boost_scores_kernel
```

New local harness:

```txt
07-scripts/vllm-hook/epkv-live-probe-v0-harness.py
```

## Smoke result

Command:

```bash
python3 07-scripts/vllm-hook/epkv-live-probe-v0-harness.py \
  --out bench/epkv-live-probe-v0-2026-05-21/harness-smoke.json
```

Result on CPU fallback:

```txt
baseline evidence hit rate: 2.73%
boosted evidence hit rate: 98.05%
delta: +95.31 pp
```

This does not claim quality improvement. It proves the probe/intervention path changes selected-position geometry before the value gather.

## Live 4090 dry-run

After `[CONFIRMAR:INFRA]`, the patched hook was deployed to the 4090 vLLM tree and vLLM was restarted temporarily with:

```txt
VLLM_EPKV_RUNTIME_HOOK=1
VLLM_EPKV_RUNTIME_DRY_RUN=1
VLLM_EPKV_RUNTIME_TRACE_SELECTION=1
VLLM_EPKV_EVIDENCE_PAGES=0-2
VLLM_EPKV_EVIDENCE_GUARD=1
VLLM_EPKV_EVIDENCE_BOOST=4.0
VLLM_EPKV_RUNTIME_MAX_EVENTS=8
```

A short prompt was sent through the real LAN endpoint. The hook returned original TurboQuant outputs because dry-run was enabled, but the runtime score geometry used the evidence-page boost before top-k selection.

Live summary:

```txt
events: 8
seq_len: 64
K: 32
evidence pages: 0,1,2
decision: telemetry_only_fallback_to_original_tq
mode: evidence_page_score_boost
evidence hit rate avg: 91.09%
evidence hit rate min: 84.49%
evidence hit rate max: 94.64%
```

Artifacts:

```txt
live-events-raw.jsonl
live-summary.json
```

The start script was restored to `VLLM_EPKV_RUNTIME_HOOK=0` and vLLM health was revalidated after restart.

## Span → token → KV page bridge

Added:

```txt
07-scripts/vllm-hook/epkv-span-to-page-map.py
```

For a chat-template prompt with two evidence lines, the mapper produced:

```txt
total tokens: 105
evidence tokens: 22
evidence pages: 2-3
E1 token range: 34..44 → page 2
E2 token range: 45..55 → pages 2,3
```

Artifact:

```txt
span-map.json
```

## Live 4090 span-page sweep

The manual `0-2` mask was replaced by the computed evidence page mask `2-3` and two dry-run live passes were executed:

```txt
baseline: guard=0 boost=0.0
boost4:   guard=1 boost=4.0
```

Both used the real vLLM endpoint and dry-run fallback to preserve original TurboQuant outputs.

Summary:

```txt
baseline events: 8
baseline evidence hit rate avg: 26.69%
baseline min/max: 20.31% / 33.93%

boost4 events: 8
boost4 evidence hit rate avg: 73.24%
boost4 min/max: 62.72% / 79.46%

delta avg: +46.55 pp
seq_len: 106
K: 32
evidence pages: 2,3
```

Artifacts:

```txt
live-span-baseline-events.jsonl
live-span-boost4-events.jsonl
live-span-sweep-summary.json
```

The start script was restored again to `VLLM_EPKV_RUNTIME_HOOK=0` and `/health` was revalidated.

## Real 2Wiki record sweep

A real 2Wiki case was mapped and run:

```txt
qid: 1c7395fa0bb011ebab90acde48001122
question: Who is Johanna Magdalene Of Saxe-Weissenfels's paternal grandmother?
gold: Johanna Magdalena of Saxe-Altenburg
evidence pages: 2-7
```

Dry-run sweep:

```txt
boost 0: 15.81% evidence hit avg
boost 1: 27.26%
boost 2: 40.30%
boost 4: 64.73%
```

A non-dry live intervention was also run at boost 4:

```txt
decision: returned_phase2a_output
evidence hit avg: 62.36%
output: failed to close answer
```

Then `evidence_guard_topk_reserved` was added to the hook and run in dry-run:

```txt
VLLM_EPKV_EVIDENCE_MIN_K=8
mode: evidence_guard_topk_reserved
applied_evidence_k: 8
evidence hit avg: 25.00%
```

The guard path was then moved from torch-side mask splitting into a Triton score-partition primitive, and then from `torch.topk` into a per-head Triton selected-position kernel:

```txt
reservation_backend: triton_score_split_triton_topk
evidence hit avg: 25.00%
applied_evidence_k: 8
```

Artifacts:

```txt
2wiki-case-inference-grandmother.json
2wiki-span-map.json
2wiki-live-sweep/
```

## Next live step

Run boost vs reserved-selection across multiple records, then fuse score/split/top-k into fewer kernels.
