# KVFidelity order-sensitivity soak protocol

Date: 2026-05-08  
Status: frozen before unattended run

## Purpose

The TC-31 follow-up showed that the same scenario can change behavior when run alone versus embedded in a batch/order. This soak treats **scenario order** as a first-class experimental axis.

Question:

```text
With the frozen hold-out N=20 and fixed runtime settings, which action traces remain stable when scenario order is permuted, and which traces are sensitive to order/runtime context under different V-cache formats?
```

This is an order-sensitivity map, not a public headline benchmark.

## Fixed runtime

Same 4090 build used in the reviewed KVFidelity runs:

```text
C:\turbo-build\llama-cpp-turboquant-fix-unpad\build\bin\llama-server.exe
branch: fix/turbo-v-unpad-gate-merge
HEAD: a1bcb34a1
model: C:\models\q36_35b.gguf
```

Harness settings:

```text
temperature: 0
seed: 42
ctx: 18000
max_turns: 12
parallel: 1
no_think: true
prompt scaffold: original only
```

Each run restarts `llama-server`. Within a run, the selected hold-out scenarios execute in the specified order.

## Local harness patch

`tool-eval-bench` currently filters `--scenarios` through the benchmark's default scenario list, which loses user-specified order. For this soak only, use a temporary local copy that preserves CLI scenario order when `--scenarios` is provided.

Temporary copy:

```text
/home/aya/implante/tmp/tool-eval-bench-order-soak-2026-05-08/
```

This patch is not an upstream change and should not be interpreted as a benchmark modification beyond order control.

## Scenario set

Frozen hold-out N=20:

```text
TC-16 TC-17 TC-18 TC-19 TC-20 TC-21
TC-28 TC-29 TC-30 TC-31 TC-32 TC-33 TC-34
TC-37 TC-38
TC-57 TC-58 TC-59 TC-60
TC-69
```

## Orders

```text
order-00: canonical hold-out order
order-01..order-24: deterministic random permutations, generated with seed 20260508
```

Total orders: 25.

## Config matrix

K cache fixed at `q8_0`. V cache varies:

| Label | ctk | ctv |
|---|---|---|
| q8q8 | q8_0 | q8_0 |
| q8turbo4 | q8_0 | turbo4 |
| q8turbo3 | q8_0 | turbo3 |
| q8turbo2 | q8_0 | turbo2 |

Replicates:

```text
2 per order/config
```

Total planned runs:

```text
25 orders × 4 configs × 2 replicates = 200 runs
200 runs × 20 scenarios = 4000 scenario traces
```

## Comparisons

For each order:

```text
control q8q8-a vs q8q8-b
control q8turbo4-a vs q8turbo4-b
control q8turbo3-a vs q8turbo3-b
control q8turbo2-a vs q8turbo2-b
A/B q8q8-a vs q8turbo4-a
A/B q8q8-a vs q8turbo3-a
A/B q8q8-a vs q8turbo2-a
```

Primary maps:

- same-config stability by order/config;
- drift frequency by scenario;
- drift frequency by config;
- TC-31 state distribution:
  - tools-first resolution;
  - clarification-only/pass;
  - clarification-only/fail;
  - other;
- scenarios whose pass/fail or tool path changes across orders.

## Interpretation

If q8/q8 remains stable across permutations:

```text
The baseline action traces are robust to order under this runtime.
```

If cross-KV drift concentrates in a few scenarios:

```text
Those scenarios are priority review targets for Action-Trace Fidelity.
```

If drift changes substantially across order permutations:

```text
KVFidelity must report order/runtime context, not just isolated scenario behavior.
```

If TC-31 remains the dominant order-sensitive case:

```text
TC-31 is a useful paradigmatic probe, but not necessarily a general failure mode.
```

## Guardrails

- No posting/publication from this run.
- No deploy/delete/install.
- Raw aggregate counts are review queues, not public claims.
- If the same operation fails three times, stop and mark `SOAK_FAILED`.
- A watcher must monitor the log and wake the session on `SOAK_DONE` or `SOAK_FAILED`.
