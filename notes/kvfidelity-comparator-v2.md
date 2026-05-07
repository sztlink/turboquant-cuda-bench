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
- low-confidence drift requiring human review.

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
human-review-queue.md
```

## Same-config controls

Same-config duplicate comparisons were clean on the reviewed N=28 subset:

| Pair | Result | High-confidence regression |
|---|---:|---:|
| `q8/q8` vs `q8/q8` | 28/28 `EQUIVALENT` | 0 |
| `q8/turbo3` vs `q8/turbo3` | 28/28 `EQUIVALENT` | 0 |
| `turbo3/turbo3` vs `turbo3/turbo3` | 28/28 `EQUIVALENT` | 0 |

This matters because it checks for false positives before interpreting cross-config drift.

## A/B result: q8/q8 → turbo3/turbo3

After comparator v2 + human review of low-confidence cases:

| Category | Count |
|---|---:|
| `EQUIVALENT` | 18 |
| `REGRESSION_MODERATE` | 6 |
| `IMPROVEMENT` | 2 |
| `REGRESSION_SOFT` | 1 |
| `ARTIFACT` excluded | 1 |

Two moderate regressions are high-confidence:

| Scenario | Category | Mechanism | Status |
|---|---|---|---|
| `TC-46` | `REGRESSION_MODERATE` | `workflow_truncation` | `pass → partial` |
| `TC-56` | `REGRESSION_MODERATE` | `identity_delivery_drift` | `pass → pass` |

## TC-56: pass/pass hides a behavior change

In `TC-56`, both runs pass the benchmark scorer, but the durable argument to an external-effect tool changes:

```text
baseline send_email.to:  "user@example.com"
candidate send_email.to: "user"
status: pass → pass
```

The scorer checks that `send_email` was called. The paired trace shows that the candidate produced a malformed/underspecified recipient address. In a real email system, `user` without a domain would likely fail validation or delivery.

This is the cleanest example in this run of aggregate pass/fail hiding action-trace drift.

## Excluded artifact: TC-45

`TC-45` is excluded from public aggregate claims.

Reason: the scenario forces tool use (`tool_choice=required`) on a trivial math prompt. Both baseline and candidate traces are pathological max-turn loops, so v1 inflated extra-action / dangerous-duplicate metrics.

v2 classification:

```text
ARTIFACT / scenario_artifact + tool_choice_artifact + max_turn_loop_artifact
```

## Improvements are visible, not hidden

Two scenarios are candidate improvements rather than regressions:

- `TC-48`: candidate succeeds where baseline fails;
- `TC-53`: candidate executes a requested conditional branch more fully than baseline.

These are excluded from degradation aggregates.

## Limitations

- N=28 selected stateful/tool-use subset, not a broad benchmark claim.
- One model/runtime/hardware setup for this evidence set.
- The comparator uses a tool ontology and scenario metadata; generalization to other benchmarks needs new ontology/metadata.
- The v2 rules were refined using this evidence set, so hold-out validation and new scenarios are still needed to reduce overfitting risk.
- `REGRESSION_MODERATE` does not mean “unsafe”. It means the candidate trace changed in a behaviorally meaningful way under the v2 taxonomy.

## Safe summary

```text
Same-config controls were 28/28 EQUIVALENT across all three duplicate configs. In q8/q8 → turbo3/turbo3, v2 + human review classified 18/28 as EQUIVALENT, 2 as IMPROVEMENT, 1 as ARTIFACT excluded, 1 as REGRESSION_SOFT, and 6 as REGRESSION_MODERATE. Two moderate regressions are high-confidence: TC-46 workflow truncation (status pass→partial) and TC-56 identity/delivery drift (send_email recipient address malformed under pass→pass).
```
