# KVFidelity / Action-Trace Fidelity — 2026-05-07 synthesis

Date: 2026-05-07  
Status: reviewed synthesis of the day’s KVFidelity work  
Scope: same-build local inference traces on Qwen3.6-35B-A3B, RTX 4090

## Related-work / terminology note

This note used **Action-Trace Fidelity** as a working label for the measured lens. After related-work review, the safer positioning is: KVFidelity applies **trajectory-aware / trace-based evaluation** to KV/V-cache compression. SciBORG (Muhoberac, Chopra et al., arXiv:2507.00081) explicitly uses lower-case "action trace fidelity" as an agent-benchmark dimension, but does not appear to define a formal capitalized/hyphenated term. See [`kvfidelity-related-work.md`](./kvfidelity-related-work.md).

## Thesis

**Action-Trace Fidelity** asks whether a local inference system preserves the same sequence of operational decisions when the model, prompt/scaffold, decoding setup, and benchmark scenario are held constant while a runtime/context knob changes.

When the changed knob is KV-cache format, this note calls the lens **KVFidelity**.

The thesis after today’s work:

```text
KV/cache changes can preserve token-level plausibility while changing the action trace: which tools are called, in what order, with which arguments, and whether the model resolves ambiguity or exits early. Same-config controls can be stable while cross-KV traces drift. This is an instrument for reading behavioral drift, not a broad safety ranking of KV modes.
```

The public boundary remains important:

- do **not** claim that “KV compression breaks agents”;
- do **not** claim that `turbo2`, `turbo3`, or `turbo4` is globally unsafe;
- do **not** publish raw comparator counts without review;
- do distinguish benchmark pass/fail from action-trace fidelity.

## Runtime anchor

Most reviewed evidence below used the same fresh 4090 build:

```text
C:\turbo-build\llama-cpp-turboquant-fix-unpad\build\bin\llama-server.exe
branch: fix/turbo-v-unpad-gate-merge
HEAD: a1bcb34a1
model: C:\models\q36_35b.gguf
K cache: q8_0 fixed
V cache: q8_0 / turbo4 / turbo3 / turbo2
temperature: 0
seed: 42
ctx: 18000
max_turns: 12
```

The build exposed:

```text
turbo2, turbo3, turbo4
```

It did not expose:

```text
turbo4v2, turbo8v4
```

## Evidence set 1 — same-build severity sweep

Source note: [`kvfidelity-comparator-v2.md`](./kvfidelity-comparator-v2.md)

Scope:

```text
N=28 stateful/tool-use scenarios
q8_0 K fixed
V cache: q8_0 / turbo4 / turbo3 / turbo2
duplicate same-config controls per config
```

Same-config controls were clean:

| Control | Result | High-confidence regression |
|---|---:|---:|
| `q8/q8` vs `q8/q8` | 28/28 equivalent | 0 |
| `q8/turbo4` vs `q8/turbo4` | 28/28 equivalent | 0 |
| `q8/turbo3` vs `q8/turbo3` | 28/28 equivalent | 0 |
| `q8/turbo2` vs `q8/turbo2` | 28/28 equivalent | 0 |

Corrected, trace-reviewed curve:

| Candidate | Score | Equivalent | Moderate | Soft | Artifact | High-conf reg |
|---|---:|---:|---:|---:|---:|---:|
| `q8/turbo4` | 50/56 | 21 | 5 | 1 | 1 | 1 |
| `q8/turbo3` | 51/56 | 21 | 2 | 4 | 1 | 0 |
| `q8/turbo2` | 46/56 | 21 | 6 | 1 | 0 | 3 |

Read carefully:

- the curve is not a simple monotonic story;
- `turbo3` looked cleaner than `turbo4` in this slice, but that is not a broad ranking;
- `turbo2` had the strongest degradation signal in this slice;
- the strongest methodological result is that stable same-config controls can coexist with cross-KV action-trace drift.

Methodological correction made during this phase:

```text
Review metadata must be trace-bound, not reused by scenario_id.
```

The comparator now marks stale scenario-level review metadata as ineligible for public evidence unless hashes/labels match or the review is explicitly scenario-global.

## Evidence set 2 — frozen hold-out

Sources:

- protocol: [`kvfidelity-holdout-protocol.md`](./kvfidelity-holdout-protocol.md)
- result: [`kvfidelity-holdout-result.md`](./kvfidelity-holdout-result.md)

Scope:

```text
N=20 frozen hold-out scenarios
same 4090 build
q8_0 K fixed
V cache: q8_0 / turbo4 / turbo3 / turbo2
```

Hold-out scenario IDs:

```text
TC-16 TC-17 TC-18 TC-19 TC-20 TC-21
TC-28 TC-29 TC-30 TC-31 TC-32 TC-33 TC-34
TC-37 TC-38
TC-57 TC-58 TC-59 TC-60
TC-69
```

Duplicate controls were again clean:

| Control | Result |
|---|---:|
| `q8/q8` | 20/20 equivalent |
| `q8/turbo4` | 20/20 equivalent |
| `q8/turbo3` | 20/20 equivalent |
| `q8/turbo2` | 20/20 equivalent |

Final reviewed hold-out curve after parser fix:

| Candidate | Score | Equivalent | Soft | Moderate | Artifact | High-conf reg |
|---|---:|---:|---:|---:|---:|---:|
| `q8/turbo4` | 38/40 | 19 | 1 | 0 | 0 | 0 |
| `q8/turbo3` | 38/40 | 20 | 0 | 0 | 0 | 0 |
| `q8/turbo2` | 36/40 | 19 | 0 | 1 | 0 | 1 |

Remaining reviewed differences:

| Config | Scenario | Reviewed category | Meaning |
|---|---|---|---|
| `q8/turbo4` | TC-31 | soft regression | candidate asks for clarification before baseline’s contact/file disambiguation; both pass |
| `q8/turbo2` | TC-31 | moderate regression | candidate does not attempt ambiguity resolution and fails; baseline resolves contact/file and passes |

Important parser correction:

- nested Markdown fences inside model outputs had produced false status differences;
- the comparator now parses scenario sections by `### TC-*` headings rather than the first closing code fence;
- prior apparent artifacts in TC-29, TC-28, and TC-30 resolved as equivalent.

## Four paradigmatic mechanisms

These are not all possible mechanisms. They are the clearest paradigmatic forms seen today.

### 1. Workflow truncation / no-resolution exit

Pattern:

```text
baseline: uses read-only tools to resolve ambiguity, then asks for clarification or proceeds safely
candidate: exits early, asks directly, or produces a final answer without the resolution step
```

Example:

- `TC-31` — “Send the report to Sarah.”
- `q8/q8`: `get_contacts → search_files`, then asks for clarification.
- `q8/turbo2` in minibatch/hold-out: no tools, asks for file/contact details directly, benchmark fail.
- `q8/turbo4` isolated: no tools, fail.

Why it matters:

The text may look reasonable, but the operational trace lost the read-only disambiguation step. KVFidelity catches the missing action, not just the final prose.

### 2. Entity-resolution drift

Pattern:

```text
baseline and candidate both try to resolve an entity, but they bind the request to different entities, files, contacts, or evidence sources.
```

Examples:

- severity sweep recurrent case: `TC-74` classified as `entity_resolution_drift` / severity shift;
- TC-31 is also a simple entity-resolution stressor: “Sarah” and “the report” are underspecified, and different KV settings choose different ways to handle that ambiguity.

Why it matters:

Agentic behavior depends on binding names to operational referents. A trace can preserve grammatical helpfulness while changing what object the system is acting on or whether it resolves the object at all.

### 3. Semantic argument drift

Pattern:

```text
same tool class, different semantically relevant arguments
```

Example:

- severity sweep recurrent case: `TC-62` classified as stable regression with `semantic_argument_drift`.

Why it matters:

A tool path can look equivalent at the name level while the actual action changes because the query, recipient, file ID, date, or other semantic field changes. KVFidelity therefore tracks tool-name path, semantic path, and full signature path separately.

### 4. Redundant expansion / evidence or workflow overrun

Pattern:

```text
candidate adds unnecessary extra tool calls, repeats a step, or expands the workflow beyond the baseline’s minimal path
```

Examples:

- severity sweep recurrent case: `TC-50` showed `redundant_expansion` / severity shift;
- `TC-45` remains excluded as a scenario artifact because forced tool use on a trivial math prompt can produce pathological max-turn loops.

Why it matters:

Not all regressions are omissions. Some are excess: extra calls can increase latency, cost, side effects, or exposure to later mistakes. The comparator tracks extra action classes and dangerous duplicate action signatures, but scenario artifacts must be excluded from public aggregates.

## Central finding from TC-31 follow-ups

Sources:

- prompt steering: [`kvfidelity-tc31-prompt-steering-result.md`](./kvfidelity-tc31-prompt-steering-result.md)
- batch/order: [`kvfidelity-tc31-batch-order-result.md`](./kvfidelity-tc31-batch-order-result.md)

### Steering ablation

Isolated TC-31, two prompt conditions:

```text
original scaffold
strict tool-use / ambiguity-resolution steering
```

Key result:

- original `q8/turbo4`: stable fail in both replicates;
- strict `q8/turbo4`: pass in both replicates;
- original `q8/turbo2`: did not reproduce the hold-out failure in isolation;
- strict steering changed pass/fail outcomes, but did **not** force one identical action trace across KV settings.

Reviewed conclusion:

```text
For isolated TC-31, prompt/tool-use steering absorbs the reproducible q8/turbo4 failure at the benchmark pass/fail level, but it does not eliminate action-trace variability. The q8/turbo2 hold-out failure did not reproduce under this isolated protocol.
```

### Batch/order ablation

Original scaffold only, three order conditions:

| Condition | Scenario order |
|---|---|
| isolated | `TC-31` |
| minibatch | `TC-28 TC-29 TC-30 TC-31 TC-32 TC-33` |
| holdout | full N=20 hold-out order |

TC-31 matrix:

| Condition | `q8/q8` | `q8/turbo4` | `q8/turbo2` |
|---|---|---|---|
| isolated | pass with tools | fail without tools | pass with tools |
| minibatch | pass with tools | pass without tools | fail without tools |
| holdout | pass with tools | pass without tools | fail without tools |

Reviewed conclusion:

```text
TC-31 is not just a local prompt effect. Under the original scaffold, behavior changes with batch/order/runtime context: q8/turbo2 passes in isolation but reproducibly fails when embedded in minibatch/hold-out order; q8/turbo4 fails in isolation but shifts to a safe-clarification pass in batch/hold-out. The stable q8/q8 baseline continues to resolve by read-only tools first.
```

Central synthesis:

```text
Steering can move a trace back across the benchmark pass/fail boundary, but it does not guarantee trace identity. TC-31 also shows that KVFidelity is sensitive to execution context: the same scenario can behave differently when isolated versus embedded in a batch/order.
```

## Limitations

- One model family and one primary hardware/runtime stack for the reviewed 2026-05-07 evidence.
- Same-build 4090 runs reduce confounds, but they do not prove portability to other engines, GPUs, models, or prompts.
- `tool-eval-bench` scenarios are useful probes, not a complete agent workload.
- Comparator v2 uses an ontology and scenario metadata; other tool suites need their own ontology.
- Agent-assisted review is not blinded human review.
- Raw `REGRESSION_MODERATE` is not automatically “unsafe”; it is an operational classification requiring trace review.
- Some pass/fail distinctions are evaluator-mediated and subtle, especially in ambiguity-resolution scenarios where wording changes the rubric outcome.
- Batch/order sensitivity means isolated scenario reproduction is necessary but not sufficient.

## Next dimensions

No more experiments are needed today. The next dimensions, when work resumes, are:

1. **Order/context axis** — formalize isolated vs minibatch vs hold-out order as a first-class benchmark dimension.
2. **Prompt/scaffold axis** — compare original, strict, and possibly tool-policy scaffolds while reporting trace identity separately from pass/fail.
3. **Seed/restart axis** — add controlled multi-seed / server-restart replication only after the trace-review protocol is stable.
4. **Runtime axis** — compare llama.cpp builds and cache implementations without changing prompt/scenario definitions.
5. **Model axis** — test whether the same mechanisms appear on another local model, not to rank models but to check mechanism portability.
6. **Review axis** — move from agent-assisted trace review toward a blinded human-review matrix for public evidence.
7. **Public communication axis** — publish a lab note that foregrounds the instrument: “reading behavioral drift in local inference systems,” not a claim that one KV format is globally safe or unsafe.

## One-line public framing

```text
I am building instruments for reading behavioral drift in local inference systems: not just whether the answer looks right, but whether the action trace survives changes in the inference apparatus.
```
