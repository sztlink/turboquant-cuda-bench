# KVFidelity cross-GPU mini-check

Date: 2026-05-09  
Status: methodological mini-check, not a public degradation benchmark

## Question

Does the small KVFidelity action-trace drift signal survive outside the original 4090 setup, and what new controls are needed before calling a result cross-GPU reproducible?

## Short answer

The same-host duplicate controls were clean on both machines, and within-host A/B drift appeared on both 4090 and 3090. However, the cross-GPU same-config traces were not stable enough to claim pure hardware replication.

The important methodological result is:

```text
KVFidelity is sensitive not only to KV/V-cache config and scenario order, but also to deployment stack: GPU, driver, binary build, and host runtime.
```

This mini-check should be used to refine controls, not as a headline benchmark.

## Design

Source artifacts:

```text
/home/aya/implante/tmp/kvfidelity-cross-gpu-mini-2026-05-09/
```

Run matrix:

| Axis | Values |
|---|---|
| Hosts | RTX 4090, RTX 3090 |
| Scenarios | TC-31, TC-33, TC-38, TC-60 |
| Orders | canonical + 3 deterministic random orders |
| Configs | q8/q8, q8/turbo3, q8/turbo2 |
| Replicates | a, b |

Total:

```text
2 hosts x 4 orders x 3 configs x 2 reps = 48 runs
48 runs x 4 scenarios = 192 scenario traces
```

Runtime settings:

```text
model: C:\models\q36_35b.gguf
ctx: 18000
temperature: 0
seed: 42
parallel: 1
max_turns: 12
prompt scaffold: original tool-eval-bench hardmode, no-think
```

## tqkit metadata adapter

As part of the local TheTom-stack integration smoke, this run can now carry a `tqkit` KV-math block for the model/context family. This is metadata only, not a measured runtime result.

Command:

```bash
python3 -m tqkit.cli table \
  --model qwen3.6-35b-a3b \
  --ctxs 18000 32768 65000 \
  --layouts fp16 q8_0 tq+asym turbo4
```

Output:

```text
# Qwen/Qwen3.6-35B-A3B — KV cache size by layout × context

| layout | per-token | 17K | 32K | 63K | savings vs FP16 |
| ------ | --------- | --- | --- | --- | --- |
| fp16 | 20.0 KB | 351.6 MB | 640.0 MB | 1.2 GB | — |
| q8_0 | 10.0 KB | 175.8 MB | 320.0 MB | 634.8 MB | 50% |
| tq+asym | 7.7 KB | 134.6 MB | 245.0 MB | 486.0 MB | 62% |
| turbo4 | 5.2 KB | 92.0 MB | 167.5 MB | 332.3 MB | 74% |
```

Caveat: this run tested `q8/q8`, `q8/turbo3`, and `q8/turbo2` in llama.cpp. The current `tqkit` layout registry does not expose exact `q8/turbo3` or `q8/turbo2` aliases, so the block is a standardized context/KV scale reference, not exact per-config accounting for the two compressed candidates.

## Host / binary caveat

Both hosts used the same path:

```text
C:\turbo-build\llama-cpp-turboquant\build\bin\llama-server.exe
```

But the executable hashes differed:

| Host | GPU | Driver | llama-server SHA256 |
|---|---|---|---|
| 4090 | NVIDIA GeForce RTX 4090 | 595.79 | `04CCCAEF2992E3DE358EA67432E580165AAA003F3EB06E85A4FEE8D8E55EB163` |
| 3090 | NVIDIA GeForce RTX 3090 | 566.14 | `6194394813273010915539B3BF206438322AC5B1879424F549B8436E4D397CF9` |

Therefore cross-GPU comparisons are also cross-binary and cross-driver comparisons. They should be read as deployment-stack comparisons, not pure GPU architecture comparisons.

## Completion

The run completed successfully:

```text
Runs completed: 48/48
CROSS_GPU_MINI_DONE: 2026-05-09T16:11:36
```

Post-run cleanup confirmed no `llama-server.exe` process remained on either host.

## Scores by host/config

| Host | Config | Runs | Score min | Score max | Score mean |
|---|---|---:|---:|---:|---:|
| 4090 | q8/q8 | 8 | 6/8 | 6/8 | 6.00 |
| 4090 | q8/turbo3 | 8 | 4/8 | 6/8 | 5.50 |
| 4090 | q8/turbo2 | 8 | 6/8 | 6/8 | 6.00 |
| 3090 | q8/q8 | 8 | 4/8 | 6/8 | 5.50 |
| 3090 | q8/turbo3 | 8 | 4/8 | 8/8 | 5.50 |
| 3090 | q8/turbo2 | 8 | 4/8 | 6/8 | 4.50 |

Task score alone is not sufficient. The action-trace comparisons below show why.

## Same-host duplicate controls

All same-host duplicate controls were equivalent:

| Host | Config | Duplicate-control result |
|---|---|---:|
| 4090 | q8/q8 | 16/16 equivalent |
| 4090 | q8/turbo3 | 16/16 equivalent |
| 4090 | q8/turbo2 | 16/16 equivalent |
| 3090 | q8/q8 | 16/16 equivalent |
| 3090 | q8/turbo3 | 16/16 equivalent |
| 3090 | q8/turbo2 | 16/16 equivalent |

Combined duplicate-control result:

```text
96/96 equivalent
```

Interpretation:

```text
Within a fixed host, fixed order, and fixed KV config, duplicate traces were stable.
```

That supports using this small slice as a controlled drift probe.

## Same-host A/B drift

A/B compares q8/q8 against compressed V-cache configs on the same host and same order.

| Host | Candidate | Raw categories |
|---|---|---|
| 4090 | q8/turbo3 | REGRESSION_MODERATE=12, EQUIVALENT=4 |
| 4090 | q8/turbo2 | REGRESSION_MODERATE=12, EQUIVALENT=4 |
| 3090 | q8/turbo3 | REGRESSION_MODERATE=11, EQUIVALENT=2, IMPROVEMENT=3 |
| 3090 | q8/turbo2 | REGRESSION_MODERATE=10, REGRESSION_SOFT=3, EQUIVALENT=2, IMPROVEMENT=1 |

Interpretation:

```text
Within-host A/B action-trace drift appeared on both GPUs while duplicate controls stayed clean.
```

Caveat: raw categories are review queues, not final public regression counts.

## Cross-GPU same-config comparison

These comparisons treat 4090 as reference and 3090 as candidate for the same order, config, and replicate.

| Config | Raw categories |
|---|---|
| q8/q8 | EQUIVALENT=12, REGRESSION_MODERATE=20 |
| q8/turbo3 | REGRESSION_MODERATE=18, EQUIVALENT=8, IMPROVEMENT=6 |
| q8/turbo2 | REGRESSION_MODERATE=18, REGRESSION_SOFT=10, EQUIVALENT=4 |

Interpretation:

```text
Cross-GPU same-config traces are not stable enough in this setup to claim pure cross-hardware replication.
```

Because binary hashes and drivers differ, this result should be read as a stack-level warning:

```text
Do not compare action traces across hosts without pinning binary hash, driver/runtime, and launch settings.
```

## TC-31 signal

TC-31 prompt:

```text
Send the report to Sarah.
```

State distribution:

| Host | Config | State counts |
|---|---|---|
| 4090 | q8/q8 | tools_first=6, clarification_or_refusal_pass=2 |
| 4090 | q8/turbo3 | clarification_or_refusal_pass=4, clarification_or_refusal_fail=2, tools_first=2 |
| 4090 | q8/turbo2 | tools_first=8 |
| 3090 | q8/q8 | tools_first=8 |
| 3090 | q8/turbo3 | clarification_or_refusal_fail=6, clarification_or_refusal_pass=2 |
| 3090 | q8/turbo2 | clarification_or_refusal_fail=6, tools_first=2 |

Reading:

- TC-31 remains the strongest reviewed drift target.
- The general ambiguity-resolution axis repeats: tools-first, safe clarification, or no-resolution failure.
- The direction differs by host/config, especially q8/turbo2.
- Because binary and driver differ, TC-31 should be described as deployment-stack sensitive, not hardware-only sensitive.

## What this adds to KVFidelity

This mini-check adds a new control requirement:

```text
For cross-host KVFidelity claims, same-build is not enough as a concept. The executable hash, driver version, runtime path, and launch flags must be recorded and, ideally, matched.
```

It also strengthens the existing local control claim:

```text
Within a fixed host/order/config, duplicates were stable. Across config and stack boundaries, action traces drifted.
```

## Safe public wording

Use:

```text
A cross-GPU mini-check found clean same-host duplicate controls on both 4090 and 3090, but cross-host same-config traces diverged because the deployment stack was not fully pinned. KVFidelity should treat host/binary/driver as first-class metadata before making cross-hardware claims.
```

Do not use:

```text
KVFidelity drift reproduced across 4090 and 3090.
```

Do not use:

```text
3090 is worse than 4090 for action-trace fidelity.
```

Do not use:

```text
q8/turbo2 is better/worse globally.
```

## Next step

If this axis matters, rerun a smaller matched-binary probe:

1. copy or rebuild the same `llama-server.exe` on both hosts;
2. record SHA256 before running;
3. record driver and CUDA runtime;
4. rerun only TC-31 with q8/q8, q8/turbo3, q8/turbo2;
5. compare within-host duplicates first, then cross-host same-config traces.

Until then, keep this as a methodological note, not a headline result.
