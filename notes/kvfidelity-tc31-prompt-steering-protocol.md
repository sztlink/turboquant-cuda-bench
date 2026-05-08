# KVFidelity TC-31 prompt-steering ablation protocol

Date: 2026-05-07  
Status: frozen before run

## Purpose

Test whether the remaining reviewed hold-out difference on `TC-31` is absorbed by stricter tool-use / ambiguity-resolution steering.

This is not a new broad sweep. It targets the only remaining reviewed non-equivalent hold-out scenario after the parser fix:

- `q8/turbo4 TC-31`: soft regression — asks for clarification before baseline contact/file disambiguation.
- `q8/turbo2 TC-31`: moderate regression — no ambiguity-resolution attempt, pass→fail.

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

Decoding / harness:

```text
temperature: 0
seed: 42
ctx: 18000
max_turns: 12
parallel: 1
no_think: true
scenario: TC-31 only
```

## Config matrix

K cache fixed at `q8_0`. V cache varies:

| Label | ctk | ctv | Replicates |
|---|---|---|---:|
| q8q8 | q8_0 | q8_0 | 2 |
| q8turbo4 | q8_0 | turbo4 | 2 |
| q8turbo2 | q8_0 | turbo2 | 2 |

`q8/turbo3` is omitted because it was already 20/20 equivalent in the hold-out and did not carry the residual `TC-31` signal.

## Prompt conditions

Two prompt conditions:

### original

Unmodified `tool-eval-bench` system prompt/scaffold.

### strict

A local, non-upstream patch adds this extra system instruction:

```text
Strict tool-use steering for ambiguous requests: before asking for clarification, first use available read-only tools to resolve obvious ambiguities when doing so is safe. For requests that mention a person and a document by generic name, look up relevant contacts/files before deciding whether clarification is still needed. Do not send or write until the ambiguity is resolved.
```

The strict patch is applied only in the temporary local copy:

```text
/home/aya/implante/tmp/tool-eval-bench-tc31-steering-2026-05-07/
```

It is enabled by:

```text
KVFIDELITY_STRICT_TOOL_STEERING=1
```

## Comparisons

Within each prompt condition:

```text
control-q8q8-a-vs-b
control-q8turbo4-a-vs-b
control-q8turbo2-a-vs-b
ab-q8q8-vs-q8turbo4
ab-q8q8-vs-q8turbo2
```

Across prompt conditions, compare behavior by matrix, not as a single score:

| Prompt | Config | Expected question |
|---|---|---|
| original | q8/turbo4 | Does soft clarification-before-resolution reproduce? |
| strict | q8/turbo4 | Does read-only disambiguation appear? |
| original | q8/turbo2 | Does moderate no-resolution reproduce? |
| strict | q8/turbo2 | Does moderate regression disappear? |

## Interpretation

If strict steering eliminates the residual `TC-31` differences:

```text
Prompt/tool-use steering absorbs the observed residual drift on this scenario.
```

If strict steering does not eliminate the residual differences:

```text
The remaining drift persists even under stricter scaffold instructions.
```

Either result is informative. Do not overclaim beyond `TC-31`.

## Publication rule

Do not post X/news from this run until:

1. duplicate controls are checked;
2. traces are inspected for `TC-31`;
3. result is documented in GitHub.

Discord reply/update can be a short technical note if the result directly answers ekryski's prompt-steering question.
