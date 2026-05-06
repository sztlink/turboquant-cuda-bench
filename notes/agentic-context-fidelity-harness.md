# Agentic Context Fidelity Harness

> Draft spec — Gesto 3 for `@sztlink` / TurboQuant CUDA fidelity lab.

## Thesis

Long-context reliability is not retrieval.

A model does not “have long context” because it can retrieve a string from a large prompt. It has long context when earlier constraints, corrections, and dependencies continue to shape later actions.

This harness is **not a new long-context benchmark leaderboard**. It is an A/B fidelity protocol:

```text
same model
same task
same scaffold
same decoding setup
reference KV/context mechanism vs compressed or selective mechanism
→ did the agentic trajectory remain behaviorally equivalent?
```

## Motivation

Most long-context evaluations ask whether information can be found or used in a long prompt. That is necessary, but not sufficient for local agent workloads.

In an agentic run, small context errors can appear as:

- forgotten constraints;
- repeated tool calls;
- loops without progress;
- ignored corrections;
- wrong delayed dependency;
- premature stopping;
- choosing a plausible but forbidden action;
- drift from the reference path even when final-token metrics look acceptable.

For KV-cache quantization, compression, and sparse/selective attention, the question is not only:

```text
Is the distribution close?
```

It is also:

```text
Does the altered context mechanism preserve the behavior that the context was meant to induce?
```

## Prior art map

Existing benchmarks already cover major parts of the long-context territory:

- **RULER** — configurable synthetic long-context evaluation beyond simple needle-in-a-haystack.  
  <https://github.com/NVIDIA/RULER>
- **InfiniteBench** — 100k+ super-long-context evaluation.  
  <https://github.com/OpenBMB/InfiniteBench>
- **NeedleBench** — retrieval and reasoning up to million-token context.  
  <https://arxiv.org/abs/2407.11963>
- **BABILong** — reasoning-in-a-haystack with distributed facts.  
  <https://github.com/booydar/babilong>
- **LongBench / LongBench v2** — realistic long-context multitask QA and reasoning.  
  <https://github.com/THUDM/LongBench>
- **HELMET** — application-centric long-context evaluation across categories.  
  <https://github.com/princeton-nlp/HELMET>
- **NoLiMa** — long-context evaluation beyond literal matching.  
  <https://github.com/adobe-research/NoLiMa>
- **LIFBench** — instruction-following stability in long-context scenarios.  
  <https://github.com/sheldonwu0327/lif-bench-2024>
- **LOCA-bench** — language agents under controllable and extreme context growth.  
  <https://github.com/hkust-nlp/LOCA-bench>
- **Context-Bench** — agentic context engineering / multi-file context retrieval / skills.  
  <https://contextbench.github.io/>

None of the above performs cross-mechanism A/B comparison under altered KV-cache or attention mechanisms. All measure a single model/mechanism. That is the gap this harness targets.

This harness should reuse or adapt existing work where possible. Its distinctive axis is not dataset novelty, but **behavioral A/B fidelity under altered context mechanisms**.

Missing from most prior art maps but relevant here:

- **REFRACT** (TheTom / turboquant_plus) — token-level trajectory fidelity comparison, same model, reference vs candidate KV config. Closest existing tool; not yet applied to agentic action traces.  
  <https://github.com/TheTom/turboquant_plus/tree/main/refract>
- **AgentBench** — multi-step LLM-as-agent evaluation across 8 environments (web, code, DB, game). Standard baseline for agentic capability; does not do A/B under compressed KV.  
  <https://github.com/THUDM/AgentBench>
- **IFEval** — instruction-following fidelity evaluation, widely used; single-turn but covers constraint adherence directly relevant to instruction persistence.  
  <https://github.com/google-research/google-research/tree/master/instruction_following_eval>

## Scope

### In scope

- Same-model A/B comparisons:
  - `q8_0/q8_0` KV reference;
  - `q4_0/q4_0` KV;
  - asymmetric KV variants;
  - TurboQuant variants;
  - sparse/selective attention variants, where accessible.
- Local inference runs on consumer GPUs.
- Agent-like tasks with explicit action traces.
- Scoring both final outcome and path behavior.
- Small reproducible smoke suites before any leaderboard-scale ambition.

### Out of scope

- A global model leaderboard.
- Claims that one benchmark “proves” long-context ability.
- Private `szt.link` / AYA data.
- Human identity or social-media account evaluation.
- SubQ-specific claims without reproducible public artifacts.

## Task families

### 1. Instruction persistence

A rule is given early, buried under distractors, then challenged later.

Example failure:

```text
The model completes the final task but violates the original constraint.
```

Metrics:

- constraint preserved / violated;
- violation severity;
- whether the model explicitly cites the active constraint.

### 2. Delayed dependency

A small fact appears early and becomes necessary much later.

Example failure:

```text
The model uses a frequent distractor instead of the earlier low-frequency fact.
```

Metrics:

- dependency hit;
- distractor selection;
- explanation consistency.

### 3. Correction uptake

A user correction changes the state of the task. Later turns must respect the corrected state, not the original premise.

Metrics:

- correction retained;
- stale premise reused;
- conflict acknowledged.

### 4. Tool-loop stability

The model must decide when to call a tool, when to stop, and when a repeated call is no longer useful.

Metrics:

- repeated tool calls;
- no-progress loops;
- unnecessary calls;
- premature stop;
- intervention required.

### 5. Multi-hop state

Decision A affects B, B affects C. The final action is only correct if the chain was maintained.

Metrics:

- chain consistency;
- first divergence point;
- final answer correctness.

### 6. Low-frequency adversarial dependency

The critical dependency is rare; distractors repeat a plausible wrong value.

Metrics:

- rare dependency recovered;
- majority/distractor bias;
- confidence mismatch.

## Trace format

Each run should produce a structured trace:

```json
{
  "task_id": "instruction-persistence-001",
  "model": "qwen3.6-35b-a3b-q4_k_m",
  "reference": "q8_0/q8_0",
  "candidate": "q4_0/q4_0",
  "context_tokens": 65536,
  "turns": [
    {
      "turn": 1,
      "role": "user",
      "content_hash": "..."
    },
    {
      "turn": 2,
      "role": "assistant",
      "action": "tool_call",
      "tool": "search_context",
      "args_hash": "..."
    }
  ],
  "scores": {
    "final_pass": true,
    "constraint_violations": 0,
    "loop_count": 0,
    "delayed_dependency_hit": true,
    "intervention_required": false
  }
}
```

## Fidelity metrics

The primary unit is not token identity. It is behavioral equivalence.

Minimum scoring dimensions:

| Metric | Meaning |
|---|---|
| final pass | did the task finish correctly? |
| constraint violations | did the model break prior rules? |
| delayed-dependency hit | did it use the relevant old fact? |
| correction retention | did it preserve later corrections? |
| loop count | repeated no-progress actions |
| unnecessary tool calls | actions not needed by reference path |
| premature stop | stopped before sufficient evidence/action |
| first divergence point | first turn/action where candidate deviates from reference |
| intervention required | did a human/scaffold need to rescue the run? |

For REFRACT-style comparison, this can be paired with:

- token-level trajectory comparison;
- action-level trajectory comparison;
- KLD / distribution-local metrics where available;
- path-preservation score.

## First smoke suite

The first public artifact should be small:

```text
10 synthetic tasks
2 context lengths: 16k and 64k
1 model
1 GPU
reference: q8_0/q8_0
candidate: q4_0/q4_0
manual + scriptable scoring
```

Do not start with a leaderboard.

The smoke suite should answer only:

```text
Can this protocol reveal behavioral differences that ordinary retrieval scores miss?
```

## Publication posture

This should be introduced as a prior-art-aware method note:

```text
This is not a replacement for RULER, LongBench, HELMET, NoLiMa, LIFBench, LOCA-bench, or Context-Bench.

It is a small A/B adapter for measuring whether context-altering inference mechanisms preserve agentic behavior.
```

## Open questions

1. Can REFRACT ingest action traces directly, or should a separate trace comparator emit REFRACT-like scores? (Determines whether this is a REFRACT extension or a standalone tool.)
2. Which existing benchmark should be adapted first: LIFBench, LOCA-bench, Context-Bench, NoLiMa, or RULER?
3. Should the first trace compare natural-language turns only, or tool/action calls?
4. How deterministic must decoding be for the path comparison to be useful?
5. Should the reference be `q8_0/q8_0`, `f16/f16`, or model-dependent practical reference?
6. What is the minimal task count that gives signal without pretending to be a leaderboard?

## Proposed next step

Ask for prior-art correction before implementing:

```text
Is there already a benchmark or adapter that specifically measures agentic trajectory preservation under KV-cache compression or sparse/selective attention?
```
