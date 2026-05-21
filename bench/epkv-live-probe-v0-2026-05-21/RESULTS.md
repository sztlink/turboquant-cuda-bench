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

## Next live step

Map real HotpotQA/2Wiki evidence spans to tokenizer positions and then KV pages, replacing the manual `0-2` page mask. Then sweep small boosts in dry-run first:

```txt
VLLM_EPKV_EVIDENCE_BOOST=0.5,1,2,4
```
