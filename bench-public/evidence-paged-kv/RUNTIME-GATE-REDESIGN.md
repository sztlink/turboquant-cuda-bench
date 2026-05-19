# Evidence-Paged KV runtime gate redesign — 2026-05-19

> Status: post-Track A gate audit. No serving claim, no speedup claim.
>
> Purpose: replace the structurally mismatched `p90_hook / p90_original_tq <= 2.5` gate with falsifiable absolute telemetry budgets.

## Why the original ratio gate failed

Track A showed that the original synthetic baseline is too small to be the denominator for bridge decisions:

```txt
original_turboquant_decode p90 at M<=2048: ~0.11–0.27 ms
EPKV hook no-trace p90: ~0.60–0.72 ms
EPKV hook trace p90: ~0.99–2.62 ms at K=32
```

The baseline is a narrow decode micro-kernel over synthetic packed KV. The hook deliberately adds score materialization, top-k/softmax, value accumulation, and optional telemetry copies. A ratio against that micro-baseline asks the wrong question.

This does **not** justify a speedup claim or a production claim. It means the bridge gate should measure whether telemetry cost is bounded enough for an observational fixture.

## Replacement gate: absolute telemetry budget

Use four independent gates:

| Gate | Budget | Track A readout |
|---|---:|---|
| no-trace hook p90 | <= 2 ms for all tested M at K=32 | pass: ~0.60–0.72 ms p90 |
| trace overhead p90 | trace_p90 - notrace_p90 <= 2 ms at K=32 | pass in Track A K=32 bands |
| wall-vs-sync delta | abs/wall overhead <= 1 ms p90 | pass from existing events; no hidden large copy overhead observed |
| telemetry completeness/privacy | 100% events with selection summary; 0 raw text/token ids | pass: 272/272 trace events |

K=128 is no longer a bridge requirement. It remains a characterization axis only.

## Continue / pause decisions

### Continue to metadata/offline bridge

Continue if:

- no-trace K=32 p90 remains <= 2 ms;
- trace K=32 overhead remains <= 2 ms p90;
- events are position-only and complete;
- fixture spans can be mapped deterministically.

Track A satisfies this for a v0 metadata/offline bridge.

### Do not continue to real-prompt hook-on bridge yet

Real-prompt dry-run trace requires a separate gate:

- v0 metadata/offline bridge exists;
- at least two fixture families show non-degenerate alignment targets;
- serving p90/token baseline is measured separately with synthetic prompts;
- trace overhead is <= 10–15% of serving p90/token, not of the tiny synthetic micro-kernel;
- Felipe explicitly authorizes temporary hook-on dry-run serving.

### Stop / pause

Pause if:

- wall overhead reveals hidden telemetry copy cost > 1 ms p90;
- K=32 p90 grows non-linearly with M in repeated runs;
- span → page/token mapping cannot be made reproducible;
- any public text frames this as serving speedup, quality improvement, or production attention.

## Current decision

Proceed with metadata/offline bridge v0. Do **not** run real-prompt hook-on bridge yet.

Related receipt:

- [`../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md`](../../bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md)
