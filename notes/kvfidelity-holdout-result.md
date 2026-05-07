# KVFidelity hold-out result — reviewed

Date: 2026-05-07  
Status: reviewed hold-out checkpoint  
Review type: trace-bound agent-assisted review, not human review

## Scope

This follows the frozen hold-out protocol in:

```text
notes/kvfidelity-holdout-protocol.md
```

Purpose: test whether Action-Trace / KVFidelity differences appear outside the N=28 subset used while developing comparator v2.

This is not a broad benchmark claim and not a model/runtime safety ranking.

## Runtime

Same fresh 4090 build used for the same-build severity sweep:

```text
C:\turbo-build\llama-cpp-turboquant-fix-unpad\build\bin\llama-server.exe
branch: fix/turbo-v-unpad-gate-merge
HEAD: a1bcb34a1
```

Settings:

```text
K cache: q8_0
V cache: q8_0 / turbo4 / turbo3 / turbo2
temperature: 0
seed: 42
ctx: 18000
max_turns: 12
```

Hold-out scenarios:

```text
TC-16 TC-17 TC-18 TC-19 TC-20 TC-21
TC-28 TC-29 TC-30 TC-31 TC-32 TC-33 TC-34
TC-37 TC-38
TC-57 TC-58 TC-59 TC-60
TC-69
```

## Duplicate controls

All same-config controls were exact under comparator v2:

| Control | Result |
|---|---:|
| q8/q8 | 20/20 equivalent |
| q8/turbo4 | 20/20 equivalent |
| q8/turbo3 | 20/20 equivalent |
| q8/turbo2 | 20/20 equivalent |

## Final reviewed A/B curve

| Candidate | Score | Equivalent | Soft regression | Moderate regression | Artifact | High-confidence regression |
|---|---:|---:|---:|---:|---:|---:|
| q8/turbo4 | 38/40 | 18 | 1 | 0 | 1 | 0 |
| q8/turbo3 | 38/40 | 20 | 0 | 0 | 0 | 0 |
| q8/turbo2 | 36/40 | 17 | 0 | 1 | 2 | 1 |

## Remaining reviewed differences

| Config | Scenario | Category | Review | Rationale |
|---|---|---|---|---|
| q8/turbo4 | TC-31 | REGRESSION_SOFT | agent_reviewed | Candidate asks for clarification before doing baseline's contact/file disambiguation; both pass. |
| q8/turbo2 | TC-31 | REGRESSION_MODERATE | agent_reviewed | Candidate does not attempt ambiguity resolution and fails; baseline does contact/file disambiguation and passes. |

## Artifacts

Three apparent status differences were reviewed as report-parser artifacts caused by nested markdown code fences in model answers:

| Config | Scenario | Raw outcome | Comparator artifact |
|---|---|---|---|
| q8/turbo4 | TC-29 | pass, no tools | candidate parsed as null |
| q8/turbo2 | TC-28 | pass, same search→read path | baseline parsed as null |
| q8/turbo2 | TC-30 | pass, same run_code→run_code path | candidate parsed as null |

These are not evidence of model/tool trace drift.

## Interpretation

The hold-out result is narrower than the raw comparator output:

- clean duplicate controls show the paired harness can be stable on this slice;
- most raw non-equivalents were benign query/default/wording variations or parser artifacts;
- after trace-bound review, `q8/turbo3` was 20/20 equivalent on this hold-out;
- `q8/turbo4` retained one soft behavioral contraction;
- `q8/turbo2` retained one high-confidence moderate regression.

This supports the narrow KVFidelity framing: action traces can drift under KV/cache changes even with stable same-config controls. It does **not** support a broad claim that a given KV mode is unsafe.

## Local artifacts

```text
/home/aya/implante/tmp/kvfidelity-holdout-samebuild-fix-unpad-4090-2026-05-07/HOLDOUT-FINAL-REVIEWED-SUMMARY.md
/home/aya/implante/tmp/kvfidelity-holdout-samebuild-fix-unpad-4090-2026-05-07/compares-final-reviewed/
```
