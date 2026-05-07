# KVFidelity comparator v2 — action-trace fidelity under KV config changes

Date: 2026-05-07  
Status: WIP external comparator over `tool-eval-bench` Markdown traces

## Question

If we hold constant:

- model;
- scaffold / benchmark scenarios;
- decoding setup;
- prompt format;
- seed / temperature;

and only change the KV/context configuration, does the model preserve the same tool/action trace?

This note calls that lens **Action-Trace Fidelity**. When the changed knob is KV cache / context configuration, I refer to it as **KVFidelity**.

## Why v2

Comparator v1 detected trace drift, but collapsed too many cases into one bucket. Source review showed that a useful comparator must separate:

- candidate regression;
- candidate improvement;
- benign/acceptable variation;
- scenario artifact;
- low-confidence drift requiring review.

Comparator v2 adds an operational category layer before mechanism labels.

## Comparator v2 categories

```text
EQUIVALENT
REGRESSION_MODERATE
REGRESSION_SOFT
IMPROVEMENT
ARTIFACT
REGRESSION_CRITICAL
```

Mechanism classes remain separate, e.g.:

```text
workflow_truncation
identity_delivery_drift
semantic_argument_drift
entity_resolution_drift
redundant_expansion
commutative_order_swap
scenario_artifact
acceptable_variation
```

## Implementation

Relevant files:

```text
scripts/kvfidelity-compare-tool-eval-bench.mjs
bench/agentic-context-fidelity/kvfidelity-tool-ontology.json
bench/agentic-context-fidelity/kvfidelity-scenario-metadata.json
bench/agentic-context-fidelity/kvfidelity-review-overrides.json
scripts/kvfidelity-comparator-v2-spec.md
```

Example invocation:

```bash
node scripts/kvfidelity-compare-tool-eval-bench.mjs \
  --mode v2 \
  --report-a baseline.md \
  --report-b candidate.md \
  --label-a q8/q8 \
  --label-b turbo3/turbo3 \
  --out-dir out
```

Outputs:

```text
kvfidelity-v2-classified.json
kvfidelity-v2-report.md
human-review-queue.md   # review queue; filename retained for compatibility
```

Trace-bound review overrides can be supplied with:

```bash
--review-overrides bench/agentic-context-fidelity/kvfidelity-review-overrides.json
```

## Methodology update: review metadata must be trace-bound

During the severity sweep below, I found a methodology bug in v2: scenario-level review metadata could be reused by `scenario_id` even when the new baseline/candidate trace had a different direction or different argument values.

That is unsafe. A prior review of “candidate changed `user@example.com` → `user`” must not be reused for a later pair where the trace is `user` → `user@example.com`, or where that field does not drift at all.

The comparator now guards against this:

```text
review_status: stale_metadata_needs_review
metadata_stale: true
public_evidence_eligible: false
```

unless the review is explicitly scenario-global, or review metadata is trace-bound by labels and semantic/signature path hashes.

`TC-45` remains a scenario-global artifact. Other scenario metadata is not treated as fresh review by default.

## Same-build V-cache severity sweep

A fresh build of `fix/turbo-v-unpad-gate-merge` was used for this sweep. The available V-cache types exposed by this binary are:

```text
turbo2, turbo3, turbo4
```

`turbo4v2` and `turbo8v4` were not exposed by this build.

Setup:

```text
K cache: q8_0 fixed
V cache: q8_0, turbo4, turbo3, turbo2
Scenarios: same N=28 stateful/tool-use subset
Controls: duplicate runs per config
```

Same-config controls were clean:

| Control | Result | High-confidence regression |
|---|---:|---:|
| `q8/q8` vs `q8/q8` | 28/28 `EQUIVALENT` | 0 |
| `q8/turbo4` vs `q8/turbo4` | 28/28 `EQUIVALENT` | 0 |
| `q8/turbo3` vs `q8/turbo3` | 28/28 `EQUIVALENT` | 0 |
| `q8/turbo2` vs `q8/turbo2` | 28/28 `EQUIVALENT` | 0 |

## Corrected same-build curve

After the metadata guard and an explicit trace-bound, agent-assisted review pass encoded in `kvfidelity-review-overrides.json`, the corrected curve is reproducible directly from the comparator:

| Candidate | Score | `EQUIVALENT` | `REGRESSION_MODERATE` | `REGRESSION_SOFT` | `IMPROVEMENT` | `ARTIFACT` | High-conf reg |
|---|---:|---:|---:|---:|---:|---:|---:|
| `q8/turbo4` | 50/56 | 21 | 5 | 1 | 0 | 1 | 1 |
| `q8/turbo3` | 51/56 | 21 | 2 | 4 | 0 | 1 | 0 |
| `q8/turbo2` | 46/56 | 21 | 6 | 1 | 0 | 0 | 3 |

Reading:

- `turbo2` is clearly worse in this slice by score, status equality, and high-confidence regressions.
- `turbo3` looks better than `turbo4` on this N=28 slice, but this is not a broad quality ranking.
- The curve is not a simple monotonic “less aggressive always fixes trace drift” story.
- The important signal is that same-config controls are stable while cross-KV action traces can drift.

## Scenario × config pattern

Corrected pattern counts across `q8/turbo4`, `q8/turbo3`, `q8/turbo2`:

| Pattern | Count |
|---|---:|
| stable equivalent | 20 |
| stable regression | 3 |
| severity shift | 3 |
| config-specific regression | 1 |
| artifact + equivalent | 1 |

Strong recurrent evidence after correction:

| Scenario | Pattern | Mechanism |
|---|---|---|
| `TC-46` | severity shift | `workflow_truncation` |
| `TC-50` | severity shift | `redundant_expansion` |
| `TC-52` | stable regression | `evidence_truncation` |
| `TC-62` | stable regression | `semantic_argument_drift` |
| `TC-72` | stable soft regression | `commutative_order_swap` |
| `TC-74` | severity shift | `entity_resolution_drift` |

Contested cases resolved in the review pass:

| Scenario/config | Corrected classification | Rationale |
|---|---|---|
| `turbo2:TC-43` | `REGRESSION_MODERATE` | candidate called `web_search {"query":""}` where baseline refused / asked for required query |
| `turbo3:TC-54` | `EQUIVALENT` | `425.80` vs `425.8` is numeric formatting only |
| `TC-56` | `EQUIVALENT` in this sweep | previous scenario-level metadata was stale/inverted for these traces |

## TC-45 remains excluded

`TC-45` is excluded from public aggregate claims.

Reason: the scenario forces tool use (`tool_choice=required`) on a trivial math prompt. Both baseline and candidate traces can become pathological max-turn loops, so v1 inflated extra-action / dangerous-duplicate metrics.

v2 classification:

```text
ARTIFACT / scenario_artifact + tool_choice_artifact + max_turn_loop_artifact
```

## Limitations

- N=28 selected stateful/tool-use subset, not a broad benchmark claim.
- One model/runtime/hardware setup for this evidence set.
- The comparator uses a tool ontology and scenario metadata; generalization to other benchmarks needs new ontology/metadata.
- The v2 rules were refined using this evidence set, so hold-out validation and new scenarios are still needed to reduce overfitting risk.
- Agent-assisted review is not a substitute for a blinded human review protocol.
- `REGRESSION_MODERATE` does not mean “unsafe”. It means the candidate trace changed in a behaviorally meaningful way under the v2 taxonomy.

## Safe summary

```text
KVFidelity v2 now guards against stale scenario-level review metadata. In a same-build V-cache sweep on 28 stateful/tool-use scenarios, duplicate controls were 28/28 equivalent for q8/q8, q8/turbo4, q8/turbo3, and q8/turbo2. Corrected cross-KV results: q8/turbo4 had 21 equivalent / 5 moderate / 1 soft / 1 artifact; q8/turbo3 had 21 equivalent / 2 moderate / 4 soft / 1 artifact; q8/turbo2 had 21 equivalent / 6 moderate / 1 soft. This is evidence that action traces can drift under KV changes even when same-config controls are stable, not a broad claim that any KV mode is unsafe.
```
