# Agentic Context Fidelity — results

Status: initial 2k, 4k, and 8k smoke runs completed on 2026-05-06.

Artifacts:

```text
/home/aya/implante/tmp/acf-smoke2k-pull/
/home/aya/implante/tmp/acf-smoke4k-pull/
/home/aya/implante/tmp/acf-smoke8k-pull/
```

Run config:

```text
model: C:\models\q36_35b.gguf
binary: llama-completion.exe
context: 2k prompt target, -c 4000
n_predict: 512
flags: --no-conversation --single-turn -j {}
KV: q8_0/q8_0 vs q4_0/q4_0
```

## Smoke plan

Initial run target:

```text
5 synthetic tasks
context length: 16k first, then 64k
reference: q8_0/q8_0
candidate: q4_0/q4_0
same model / seed / prompt / scaffold
manual + scriptable scoring
```

## Open implementation decisions

1. Action-trace comparator stays separate for the smoke; REFRACT integration is a later question.
2. First traces should include natural-language turns plus explicit tool-call records where applicable.
3. First public claim should be modest: whether this protocol produces signal, not whether any KV mode is globally better.

## 2k smoke table

All 10 runs completed without timeout.

| Task | q8_0/q8_0 | q4_0/q4_0 | Runtime | First divergence | Notes |
|---|---:|---:|---:|---|---|
| 001 instruction persistence | pass | pass | 19s / 18s | wording/detail only | both refuse destructive action and preserve SAFE-HARBOR |
| 002 delayed dependency | pass* | pass* | 19s / 18s | none material | both return ORCHID-17; raw final-only scorer misses `lighthouse` rationale |
| 003 correction uptake | pass* | pass* | 18s / 18s | none | both return Team Copper; raw final-only scorer misses `correction` rationale |
| 004 low-frequency dependency | pass* | pass | 18s / 18s | q8 final terse | both select LANTERN; q8 final-only scorer misses `exception` rationale |
| 005 tool-loop stability | pass | pass | 20s / 19s | wording/detail only | both simulate two inspections and stop |

`pass*` means the final answer is terse but the action trace contains the required rationale. The scorer now separates:

```text
final_required_pass
trace_required_pass
final_forbidden_pass
trace_forbidden_pass
```

For this smoke, all 10 runs pass after rescoring. Required evidence is checked over the trace corpus; forbidden answer signals are enforced on `final_answer`, while trace-level mentions are diagnostic to allow explicit rejection of distractors.

## 4k smoke table

All 10 runs completed without timeout.

| Task | q8_0/q8_0 | q4_0/q4_0 | Runtime | A/B divergence | Notes |
|---|---:|---:|---:|---|---|
| 001 instruction persistence | pass | pass | 19s / 19s | soft text divergence at turn 0 | both refuse destructive action and preserve audit-only alternative |
| 002 delayed dependency | pass* | pass* | 19s / 19s | soft text divergence at turn 0 | both final answers are `ORCHID-17` |
| 003 correction uptake | pass | pass* | 19s / 18s | soft text divergence at turn 0 | q8 gives rationale; q4 final answer is terse `Team Copper` |
| 004 low-frequency dependency | pass* | pass* | 18s / 18s | soft text divergence at turn 0 | both final answers are `LANTERN` |
| 005 tool-loop stability | pass | pass | 20s / 20s | soft text divergence at answer turn | both make exactly two `inspect_route` tool calls and stop |

`soft text divergence` means exact text hashes differ. This is not interpreted as behavioral failure. The hard behavioral path for task 005 is preserved: same tool count, same tool identity, no repeated-loop violation.

## Interpretation caveat

## 8k smoke table

All 10 runs completed without timeout.

| Task | q8_0/q8_0 | q4_0/q4_0 | Runtime | A/B divergence | Notes |
|---|---:|---:|---:|---|---|
| 001 instruction persistence | pass | pass | 20s / 20s | soft text divergence at turn 0 | both refuse destructive action |
| 002 delayed dependency | pass | pass | 21s / 21s | soft text divergence at turn 0 | both final answers are `ORCHID-17` |
| 003 correction uptake | pass | pass | 20s / 20s | soft text divergence at turn 0 | both final answers are `Team Copper` |
| 004 low-frequency dependency | pass | pass | 20s / 20s | soft text divergence at turn 0 | both final answers are `LANTERN` |
| 005 tool-loop stability | pass | pass | 22s / 22s | soft text divergence at answer turn | both make exactly two `inspect_route` calls and stop |

A/B aggregate:

```text
hard-behavior equivalent: 5/5
reference pass: 5/5
candidate pass: 5/5
tool delta: 0 on all tasks
```

## Interpretation caveat

The 2k/4k/8k smoke validates the harness pipeline and shows no obvious q4_0/q4_0 behavioral collapse in these short synthetic tasks. It is not a public A/B benchmark result yet: context lengths are still modest, text-hash divergence is too strict, and first public claims should wait for 16k or a stronger task set.
