# Agentic Context Fidelity Ramp Protocol

Status: draft v0.1  
Date: 2026-05-06

## Purpose

ACF should behave like an FTP/ramp test, not like a set of isolated handmade tasks.

The goal is to estimate the maximum state/action load a model can preserve without action-level collapse, and to separate two thresholds:

1. **Model capacity threshold** — the first stage where the reference (`q8/q8`) also fails.
2. **KV fidelity threshold** — the first stage where reference passes but candidate (`q4/q4`) fails.

This reframes ACF from “did this one task pass?” to:

```text
At what stage does behavior stop being preserved?
```

## Load axes

Each stage increases one or more explicit state/action load axes:

| Axis | Meaning |
|---|---|
| `turns` | Number of generated assistant turns carried forward as state |
| `facts` | Number of active facts that must be preserved/composed |
| `revocations` | Number of prior states that become invalid |
| `near_miss_tokens` | Similar valid/invalid symbols, e.g. `GO-8` vs `GO-9` |
| `branches` | Active vs dormant/contingent branches |
| `pressure_events` | User attempts to force stale/invalid action |
| `irreversible_actions` | Tool calls that must happen exactly once or never |
| `interleaved_cases` | Number of concurrent cases sharing similar structure |
| `distance` | Turns between state creation and required use |
| `distractor_salience` | How prominent stale/invalid state is relative to valid state |

## Stage ladder v0

The current `302-irreversible-tool-gate` task is **Stage 2**.

| Stage | Turns | Facts | Revocations | Near-miss tokens | Branches | Pressure | Irreversible | Description |
|---:|---:|---:|---:|---|---:|---:|---:|---|
| 0 | 2 | 1 | 0 | no | 0 | 0 | 0 | Basic carryover: preserve one decision across one follow-up |
| 1 | 3 | 2 | 0 | no | 0 | 1 | 0 | Compose two facts under mild pressure |
| 2 | 6 | 3 | 1 | yes | 1 | 2 | 1 | Current 302: GO-8/GO-9, one irreversible `close_case` |
| 3 | 6 | 3 | 2 | yes | 1 | 2 | 1 | Stage 2 plus second revocation / rollback |
| 4 | 7 | 4 | 2 | yes | 2 | 2 | 1 | Add active vs dormant branch |
| 5 | 8 | 5 | 3 | yes | 2 | 3 | 2 | Interleaved irreversible actions, one execute and one block |

## Stage schema

A generated ramp task should be described by a compact stage spec:

```json
{
  "stage": 3,
  "seed": 17,
  "context_lengths": [16000, 32000],
  "load": {
    "turns": 6,
    "facts": 3,
    "revocations": 2,
    "near_miss_tokens": 1,
    "branches": 1,
    "pressure_events": 2,
    "irreversible_actions": 1,
    "interleaved_cases": 1,
    "distance": 3,
    "distractor_salience": "medium"
  },
  "entities": {
    "case_id": "CASE-77",
    "action": "close_case",
    "valid_token": "GO-9",
    "near_miss_token": "GO-8",
    "revoked_token": "GO-7"
  },
  "hard_path": {
    "tool_counts_by_turn": [0, 0, 0, 0, 1, 0],
    "required_tool_names": ["close_case"],
    "forbidden_ready_before_turn": 5,
    "required_valid_token_at_execution": "GO-9"
  }
}
```

## Deriving Stage 3 from Stage 2

Stage 2 (`302`) has one revocation:

```text
GO-8 invalid/revoked → GO-9 issued → execute once
```

Stage 3 should add a second revocation without changing the overall action shape:

```text
turn 1: hold ON, no token → no action
turn 2: pressure → no action
turn 3: hold OFF, GO-8 visible → invalid, no action
turn 4: GO-8 replaced by GO-9-PENDING, but pending is not executable → no action
turn 5: GO-9-PENDING revoked; GO-9-ACTIVE issued → execute exactly once
turn 6: duplicate request → no action
```

Expected hard path remains:

```text
0/0/0/0/1/0
```

But the state load increases:

```text
one invalid near-match + one revoked pending near-match + one final valid token
```

This tests whether the model promotes stale/pending state into executable state.

## Pass/fail semantics

A stage result has three layers:

1. **Reference pass** — `q8/q8` satisfies hard path and state requirements.
2. **Candidate pass** — `q4/q4` satisfies hard path and state requirements.
3. **A/B hard equivalence** — candidate and reference preserve the same action/tool/status path.

Threshold rules:

```text
if q8 fails: model capacity threshold reached
if q8 passes and q4 fails: KV fidelity threshold reached
if both pass: stage is below threshold
if both fail: stage is above model capacity, not useful for KV comparison
```

## Calibration controls

Every stage family must include positive controls before GPU runs are interpreted:

| Control | Expected |
|---|---|
| Known-pass trace | `scriptable_pass=true` |
| Valid token replaced by near-miss token | `scriptable_pass=false` |
| Irreversible action executed early | `scriptable_pass=false` |
| Duplicate irreversible action | `scriptable_pass=false` |
| Dormant branch promoted to active | `scriptable_pass=false` |

The current 302 known-fail control is confirmed:

```text
turn 5 GO-9 → GO-8
scriptable_pass=false
failed turn: 5
missing: GO-9
```

## Stage 3 seed 001 implementation status

The first generated ramp task exists:

```text
bench/agentic-context-fidelity/tasks-ramp/ramp-stage-03-seed-001.json
```

Generator:

```text
bench/agentic-context-fidelity/scripts-ramp/generate-ramp-stage.mjs
```

Synthetic controls were generated and scored locally before GPU:

```text
/home/aya/implante/tmp/acf-ramp-stage3-seed001-controls/
```

| Control | Expected | Result |
|---|---|---|
| known-pass | pass | pass |
| pending token used for execution | fail | fail |
| early irreversible tool call | fail | fail |
| duplicate irreversible tool call | fail | fail |

This confirms the Stage 3 scorer/task pair can detect the intended failures before q8/q4 runs.

## Execution protocol

For each generated stage and seed:

```text
1. Generate task JSON from stage spec.
2. Generate known-pass and known-fail traces.
3. Validate scorer locally without GPU.
4. Run q8/q8 and q4/q4 at 16k.
5. If q8 passes, run at 32k.
6. Stop escalating when q8 fails or q4 diverges.
```

Default generation policy:

```text
seeds per stage: 5 initially, then 20 for publication-grade runs
contexts: 16k, 32k; 64k only after threshold behavior is observed
model: Qwen3.6-35B until smaller supported model is available
```

## Claim boundary

ACF Ramp is not a leaderboard. It estimates a behavioral threshold under a specific model, task family, context regime, and KV configuration.

Safe claim form:

```text
In this ACF Ramp family, q4/q4 preserved hard action behavior through Stage N at 32k, while REFRACT measured token-level trajectory drift under the same KV compression family.
```

Unsafe claim form:

```text
q4/q4 is behaviorally equivalent to q8/q8.
```
