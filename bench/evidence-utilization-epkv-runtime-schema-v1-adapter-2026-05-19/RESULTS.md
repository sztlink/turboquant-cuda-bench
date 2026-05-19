# EPKV runtime schema-v1 adapter smoke — 2026-05-19

> Default-off source adapter smoke: patched `runtime_hook.py` can emit `epkv.runtime.telemetry.v1` directly in dry-run mode. No serving mutation.

## Boundary

```txt
runtime source patch: local repo + standalone copied module for offline test
live vLLM service patch: no
serving mutation: no
model inference: no
real request: no
mode: dry-run only
legacy format default: yes
```

## Artifacts

```txt
07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py
07-scripts/evidence-utilization/epkv-runtime-schema-v1-adapter-v06.py
bench/evidence-utilization-epkv-runtime-schema-v1-adapter-2026-05-19/events.jsonl
bench/evidence-utilization-epkv-runtime-schema-v1-adapter-2026-05-19/summary.json
bench/evidence-utilization-epkv-runtime-schema-v1-adapter-2026-05-19/validation-report.json
```

## Adapter flag

```txt
VLLM_EPKV_RUNTIME_SCHEMA_V1=1
```

Effect:

```txt
when dry-run is enabled: emit epkv.runtime.telemetry.v1 directly
when unset/default: preserve legacy event format
```

## Validation

```txt
events: 4
schema: epkv.runtime.telemetry.v1
validator: PASS
validator errors: 0
modes: ["dry-run"]
reason_codes: ["dry_run_telemetry_only"]
seq_lens: 817, 1041, 1139, 1549
runtime selected positions sampled: 3584
```

## Timing receipt

```txt
CUDA total p50: ~1.741 ms
CUDA total p90/max: ~51.885 ms
wall total p50: ~1.654 ms
wall total p90/max: ~47.689 ms
```

The high max/p90 comes from one of four smoke events and is treated as harness/cache/shape sensitivity. This receipt validates direct schema emission, not latency.

## Decision

```txt
Default-off runtime schema-v1 adapter is source-ready and smoke-tested offline.
Do not deploy into live vLLM yet.
Do not run real-prompt hook-on.
Next: either source-level tests for legacy-vs-schema mode preservation, or answer-classification bridge over existing evidence-utilization fixtures.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not answer-quality evidence.
- Not evidence-utilization improvement evidence.
- Selected positions are geometry, not model attention.
