# KVFidelity hold-out protocol — same-build V-cache sweep

Date: 2026-05-07  
Status: frozen protocol before hold-out run

## Purpose

Check whether Action-Trace / KVFidelity drift appears outside the N=28 subset used to refine comparator v2.

This is a hold-out sanity check, not a broad benchmark claim and not a model/runtime quality ranking.

## Frozen comparator state

Use the comparator after:

```text
48d6ce4 Add trace-bound KVFidelity review overrides
```

Do not change comparator rules during this hold-out run. If a bug is found, record it and rerun later under a new protocol.

## Runtime / model

Same fresh 4090 build used in the severity sweep:

```text
C:\turbo-build\llama-cpp-turboquant-fix-unpad\build\bin\llama-server.exe
branch: fix/turbo-v-unpad-gate-merge
HEAD: a1bcb34a1
```

Model:

```text
C:\models\q36_35b.gguf
```

Decoding / harness:

```text
temperature: 0
seed: 42
parallel: 1
max_turns: 12
ctx: 18000
no_think: true
backend: llamacpp/openai-compatible server
```

## Config matrix

K cache fixed at `q8_0`. V cache varies:

| Label | ctk | ctv | Replicates |
|---|---|---|---:|
| q8q8 | q8_0 | q8_0 | 2 |
| q8turbo4 | q8_0 | turbo4 | 2 |
| q8turbo3 | q8_0 | turbo3 | 2 |
| q8turbo2 | q8_0 | turbo2 | 2 |

`turbo4v2` and `turbo8v4` are not exposed by this build.

## Hold-out scenario set

These scenarios were not part of the prior N=28 same-build severity sweep.

```text
TC-16 TC-17 TC-18 TC-19 TC-20 TC-21
TC-28 TC-29 TC-30 TC-31 TC-32 TC-33 TC-34
TC-37 TC-38
TC-57 TC-58 TC-59 TC-60
TC-69
```

Rationale:

- covers extended multilingual/routing/data-validation scenarios (`TC-16`–`TC-21`);
- covers held-out agentic/code/safety scenarios (`TC-28`–`TC-34`);
- includes large-toolset pressure (`TC-37`, `TC-38`);
- includes adversarial boundary scenarios (`TC-57`–`TC-60`);
- includes one complex structured multi-tool scenario (`TC-69`).

Excluded from this hold-out:

- prior N=28 scenarios: `TC-22`–`TC-27`, `TC-43`–`TC-56`, `TC-61`–`TC-63`, `TC-70`–`TC-74`;
- trivial/base scenarios `TC-01`–`TC-15`, to keep the slice action-trace focused;
- remaining structured scenarios `TC-64`–`TC-68`, reserved for a separate structured-output specific check;
- `TC-35`, `TC-36`, `TC-41`, `TC-42`, reserved as a second small hold-out.

## Comparisons

Primary controls:

```text
q8q8-a vs q8q8-b
q8turbo4-a vs q8turbo4-b
q8turbo3-a vs q8turbo3-b
q8turbo2-a vs q8turbo2-b
```

Primary A/B:

```text
q8q8-a vs q8turbo4-a
q8q8-a vs q8turbo3-a
q8q8-a vs q8turbo2-a
```

## Review rules

- Do not treat scenario metadata as human review unless trace-bound/global.
- Default output may contain `stale_metadata_needs_review`; do not convert it silently.
- Any non-equivalent case used as public evidence needs a separate review record.
- This hold-out may use agent review for internal triage, but must label it as agent-assisted, not human review.

## Success / failure criteria

A useful hold-out result requires:

1. same-config controls mostly or fully equivalent;
2. cross-config differences, if present, separated into equivalent / soft / moderate / artifact / improvement;
3. no public claim from unreviewed low-confidence cases.

If controls are noisy, stop and diagnose harness nondeterminism before interpreting A/B drift.
