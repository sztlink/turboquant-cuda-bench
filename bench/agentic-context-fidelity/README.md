# Agentic Context Fidelity — smoke suite

> Gesto 3 for the `@sztlink` TurboQuant CUDA fidelity lab.

This is not a new long-context leaderboard. It is a small A/B harness for testing whether an altered context mechanism preserves agentic behavior.

```text
same model / same task / same scaffold / same decoding setup
reference KV/context mechanism vs candidate KV/context mechanism
→ did the agentic trajectory remain behaviorally equivalent?
```

## Why this exists

Long-context retrieval benchmarks ask whether a model can find or use information in a long prompt. This harness asks a narrower inference-fidelity question:

```text
If the same model runs with compressed KV cache or sparse/selective attention,
do prior constraints still shape later actions in the same way?
```

The first target comparison is practical and local:

```text
reference: q8_0/q8_0 KV
candidate: q4_0/q4_0 KV
model: Qwen3.6-35B-A3B Q4_K_M
hardware: RTX 3090 / RTX 4090 class
```

## Prior art boundary

This suite is not a replacement for RULER, InfiniteBench, BABILong, LongBench v2, HELMET, NoLiMa, LIFBench, LOCA-bench, Context-Bench, AgentBench, IFEval, or REFRACT.

The gap targeted here is cross-mechanism A/B comparison:

```text
same model, same task, same scaffold;
only the KV/context mechanism changes;
compare behavior/action trace, not only final answer or token distribution.
```

REFRACT remains the closest anchor for trajectory fidelity. This smoke suite starts with a separate action-trace comparator, then can later be integrated with REFRACT if useful.

The A/B comparison — two runs, same task, different KV/context configuration, compared via `--reference` — is the primary contribution. Single-run scoring is only a debug convenience.

## Smoke suite contents

Initial task families:

| Task | Family | Failure mode targeted |
|---|---|---|
| `001-instruction-persistence.json` | instruction persistence | model violates an early constraint after distractors |
| `002-delayed-dependency.json` | delayed dependency | model uses frequent distractor instead of old rare fact |
| `003-correction-uptake.json` | correction uptake | model reverts to stale premise after user correction |
| `004-low-frequency-dependency.json` | low-frequency adversarial dependency | majority/distractor bias overrides single critical value |
| `005-tool-loop-stability.json` | tool-loop stability | model repeats tool calls without progress or stops early |

These tasks are synthetic. They intentionally avoid private `szt.link` / AYA data.

## Task schema

Each task JSON contains:

```json
{
  "task_id": "001-instruction-persistence",
  "family": "instruction_persistence",
  "objective": "...",
  "context_lengths": [16000, 64000],
  "setup": {
    "early_instruction": "...",
    "critical_fact": "...",
    "distractor_policy": "...",
    "late_challenge": "..."
  },
  "expected_behavior": {
    "required_phrases": ["..."],
    "forbidden_phrases": ["..."],
    "forbidden_scope": "final_answer",
    "max_tool_calls": 0,
    "max_repeated_tool_calls": 0
  },
  "scoring_notes": ["..."]
}
```

## Trace schema

A run trace should be JSON:

```json
{
  "task_id": "001-instruction-persistence",
  "run_id": "q8-ref-001",
  "model": "qwen3.6-35b-a3b-q4_k_m",
  "kv_config": "q8_0/q8_0",
  "context_tokens": 16000,
  "turns": [
    {
      "turn": 1,
      "role": "assistant",
      "content": "...",
      "action": null
    },
    {
      "turn": 2,
      "role": "assistant",
      "action": "tool_call",
      "tool": "inspect_context",
      "args_hash": "sha256:...",
      "progress": "new_evidence_found"
    }
  ],
  "final_answer": "...",
  "manual_scores": {
    "final_pass": true,
    "constraint_violations": 0,
    "delayed_dependency_hit": true,
    "correction_retained": true,
    "intervention_required": false
  }
}
```

Manual scores are allowed in the first smoke. The scriptable scorer adds basic checks and can compare action paths when a reference trace is provided.

## Prompt building

Build a deterministic synthetic prompt from a task:

```bash
node bench/agentic-context-fidelity/scripts/build-prompt.mjs \
  --task bench/agentic-context-fidelity/tasks/005-tool-loop-stability.json \
  --context 16000 \
  --out /tmp/acf-005-16k.prompt.txt
```

`--context` is an approximate token budget. The current builder uses ~4 chars/token and produces a single prompt ending with the late challenge.

## Scoring

Run:

```bash
node bench/agentic-context-fidelity/scripts/score-trace.mjs \
  --task bench/agentic-context-fidelity/tasks/001-instruction-persistence.json \
  --trace bench/agentic-context-fidelity/traces/example-trace.json
```

Optional reference comparison:

```bash
node bench/agentic-context-fidelity/scripts/score-trace.mjs \
  --task bench/agentic-context-fidelity/tasks/001-instruction-persistence.json \
  --trace candidate.json \
  --reference reference.json
```

Scoring separates required evidence from forbidden answer signals:

- required phrases are checked over the full trace corpus;
- forbidden phrases default to `final_answer` scope, because some tasks require mentioning distractors in the trace as rejected alternatives;
- set `forbidden_scope: "trace_corpus"` only when any mention of a forbidden phrase is itself a violation.

The first public result should report both:

1. task-level pass/fail and violations;
2. first action divergence from the reference path, if available.

## First run plan

Do not start with a leaderboard.

Minimal run:

```text
5 tasks
1 context length first: 16k
then 64k if 16k reveals useful signal
reference: q8_0/q8_0
candidate: q4_0/q4_0
same model / seed / prompt / scaffold
manual + scriptable scoring
```

Question for the smoke:

```text
Can action-level fidelity expose context-mechanism drift that retrieval or distribution-level metrics would miss?
```
