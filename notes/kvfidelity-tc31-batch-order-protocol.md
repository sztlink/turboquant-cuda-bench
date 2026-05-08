# KVFidelity TC-31 batch/order protocol

Date: 2026-05-08  
Status: frozen before run

## Purpose

After the isolated TC-31 prompt-steering ablation, `q8/turbo4` reproduced a stable TC-31 failure under the original scaffold, while the earlier hold-out `q8/turbo2` TC-31 failure did not reproduce in isolation.

This protocol tests whether the TC-31 behavior depends on scenario order / batch context / server state rather than only on the local TC-31 prompt.

## Fixed runtime

Same fresh 4090 build:

```text
C:\turbo-build\llama-cpp-turboquant-fix-unpad\build\bin\llama-server.exe
branch: fix/turbo-v-unpad-gate-merge
HEAD: a1bcb34a1
```

Model:

```text
C:\models\q36_35b.gguf
```

Harness parameters:

```text
temperature: 0
seed: 42
ctx: 18000
max_turns: 12
parallel: 1
no_think: true
prompt scaffold: original only
```

## Config matrix

K cache fixed at `q8_0`. V cache varies:

| Label | ctk | ctv | Replicates |
|---|---|---|---:|
| q8q8 | q8_0 | q8_0 | 2 |
| q8turbo4 | q8_0 | turbo4 | 2 |
| q8turbo2 | q8_0 | turbo2 | 2 |

## Scenario order conditions

### A — isolated TC-31

```text
TC-31
```

This repeats the isolated condition from the prompt-steering ablation under the original scaffold only.

### B — local mini-batch around TC-31

```text
TC-28 TC-29 TC-30 TC-31 TC-32 TC-33
```

This checks whether neighboring ambiguity / planning / tool-selection scenarios change TC-31 behavior.

### C — full hold-out order

```text
TC-16 TC-17 TC-18 TC-19 TC-20 TC-21
TC-28 TC-29 TC-30 TC-31 TC-32 TC-33 TC-34
TC-37 TC-38
TC-57 TC-58 TC-59 TC-60
TC-69
```

This recreates the hold-out order, but interpretation focuses on TC-31.

## Comparisons

For each order condition:

```text
control-q8q8-a-vs-b
control-q8turbo4-a-vs-b
control-q8turbo2-a-vs-b
ab-q8q8-vs-q8turbo4
ab-q8q8-vs-q8turbo2
```

Review focus:

- TC-31 status and summary;
- TC-31 tool path;
- whether raw comparator category is a real regression or benign order/path variation;
- whether controls are stable for TC-31.

## Interpretation

If `q8/turbo2` fails only in batch/full hold-out:

```text
TC-31 is sensitive to scenario order / batch context / server state under this runtime.
```

If `q8/turbo2` does not fail again:

```text
The prior q8/turbo2 hold-out TC-31 failure is not reproduced by this follow-up and should not be used as public evidence.
```

If `q8/turbo4` fails in isolated and batch/full order:

```text
The q8/turbo4 TC-31 original-scaffold failure is reproducible across order conditions.
```

If `q8/turbo4` changes by order condition:

```text
The TC-31 signal is scaffold/order-sensitive and should be communicated as behavioral drift, not a deterministic safety failure.
```

## Publication rule

Do not publish aggregate raw counts. Public wording must separate:

- benchmark pass/fail;
- action-trace fidelity;
- scenario order / runtime-state sensitivity;
- reviewed trace evidence.
