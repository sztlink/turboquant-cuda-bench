# KVFidelity comparator v2 — specification

Status: draft spec  
Date: 2026-05-07  
Scope: external paired-trace analysis for `tool-eval-bench` reports, with design intended to generalize beyond that substrate.

## 0. Context

Terminology note: after related-work review, the safer public framing is that KVFidelity applies **trajectory-aware / trace-based evaluation** to KV/V-cache compression. SciBORG uses "action trace fidelity" as an agent-benchmark dimension, but this spec should not imply that the broader field or term originates here. See `notes/kvfidelity-related-work.md`.

KVFidelity asks a config-level question:

```txt
same model
same prompt/scaffold
same scenario
same decoding setup
only KV/context mechanism changes
→ did the action/tool trace remain behaviorally equivalent?
```

Comparator v1 proved useful but overcounted several cases because it treated all trace differences as the same kind of drift. Human/source review of the N=28 stateful/tool sweep showed that the comparator must distinguish:

- real candidate degradation;
- real candidate improvement;
- lateral but meaningful trace drift;
- benign order swaps;
- scenario artifacts;
- comparator artifacts;
- unclear cases requiring human review.

The v2 goal is not to produce one more leaderboard score. The goal is to expose **where**, **how**, and **in which direction** paired traces diverge.

## 1. Design inputs

### Casey Reas guidance — form follows trace behavior

- One screen / one question: **where does fidelity break?**
- The v2 question is: **does the candidate preserve behavior, or only preserve score?**
- Categories must be behavioral, not merely numeric.
- Every category is derived from paired `baseline ↔ candidate` comparison, never from a run alone.
- Default ordering should be by **first divergence turn**; time/process before average.
- Primary visualization should be two traces synchronized by turn, with the bifurcation as the central event.
- Nodes should show only tool + durable args; volatile fields stay collapsed.
- Controls must sit in the same report as A/B runs: calibration, not appendix.
- Aggregates should be minimal: control stability, drift taxonomy, top review items.
- Visual grammar: color = drift type, position = temporal order, weight = excess/duplicate.
- Anti-dashboard: no single score, no KPI wall, no donut charts, no filters that hide process.
- Useful output is a **human-review queue of instructive divergences**, not an administrative dashboard.

### Giselle Beiguelman guidance — trace as archive/provenance

- Each comparison must generate a persistent artifact, not just a transient log.
- Provenance must include model, commit, dataset/scenario set, prompt/scaffold, seed, hardware, driver/runtime, quantization and flags.
- Raw result and interpretation must be separate: numerical metrics are immutable; interpretation can evolve.
- Use stable `run_id` / `compare_id` with hashes of relevant inputs.
- Store representative failure examples, not only aggregate means.
- Distinguish technical difference from experiential/behavioral degradation.
- Every artifact has a visibility level: `private`, `team`, `public`.
- Public graphs require links to spec, sanitized data and reproduction commands.
- Comparator versions must be preserved; v2 must not overwrite v1 readings.
- Thresholds, tolerances and ambiguous cases must be visible.
- A benchmark is a political archive: state what the comparator remembers, ignores and erases.

### Claude Code / pi-ensemble review — operational correction

Claude Code responded via `pi-ensemble`:

```txt
message id: msg_8d49d36e96f24673
agent: claude
```

Core correction: Casey/Giselle describe the phenomenon; the implementable v2 must first classify **decision direction and public-claim severity**.

Operational recommendations incorporated in this draft:

- v1's central flaw: it treated every divergence as equivalent;
- v2 primary category should be small and decision-oriented;
- mechanism classes such as `workflow_truncation` and `entity_resolution_drift` are secondary evidence, not the first public decision axis;
- minimum schema must include `category`, `severity`, `auto_confidence`, `human_label`, `human_reviewed`;
- `SEMANTIC_KEYS` and `DANGEROUS_TOOLS` must be external config, not hardcoded;
- same-config comparisons must be used as false-positive tests;
- avoid overfitting rules to the already-reviewed N=28.

This spec therefore uses two orthogonal layers:

```txt
operational category = publish/review/exclude decision
mechanism classes    = what kind of trace behavior changed
```

## 2. Comparator v1 failure modes

### 2.1 All differences were treated as candidate drift

v1 counted candidate-only semantic actions and extra action classes without distinguishing:

- candidate does more because baseline under-acted;
- candidate does more because it loops/redundantly expands;
- candidate does more because the scenario permits/requests the branch;
- candidate does more because a tool-choice scenario is pathological.

### 2.2 Artifact inflation

`TC-45` inflated `extra action class` and `dangerous duplicate` metrics:

```txt
scenario: tool_choice=required on trivial math
baseline: 12× calculator
candidate: calculator/run_code alternating until max_turns
status: pass → pass
```

This is a scenario/tool-choice artifact, not evidence that KV compression creates dangerous duplicate behavior.

### 2.3 Direction was missing

`TC-53` was originally counted as drift but source review showed the candidate executed the conditional request more completely:

```txt
baseline: get_weather only
candidate: get_weather → search_files → get_contacts → create_calendar_event → send_email
status: pass → pass
```

This is candidate-better/full-branch execution, not candidate degradation.

### 2.4 Order drift lacked dependency semantics

`TC-72` and `TC-74` both contain order changes, but they differ qualitatively:

- `TC-72`: `get_contacts` and second `read_file` swap order; likely commutative / low severity.
- `TC-74`: `create_calendar_event` occurs before resolving contacts; causal/entity-resolution dependency broken.

v2 must distinguish hard dependency order drift from benign commutative swaps.

## 3. Core concepts

### 3.1 Raw metrics vs interpretation

v2 output has two layers:

1. `raw_metrics`: computed mechanically and immutable for a comparator version.
2. `classification`: rule-based and/or human-reviewed interpretation that may evolve.

Do not overwrite raw metrics when human review changes the classification.

### 3.2 Direction

Every divergence receives a `direction`:

| Direction | Meaning |
|---|---|
| `candidate_regression` | Candidate trace is behaviorally worse than baseline. |
| `candidate_improvement` | Candidate trace is behaviorally better/more complete than baseline. |
| `lateral_drift` | Behavior differs materially but neither side is clearly better. |
| `benign_equivalent` | Difference appears functionally equivalent. |
| `scenario_artifact` | Difference primarily caused by scenario design/pathology. |
| `comparator_artifact` | Difference caused by parser/normalizer/scoring limitation. |
| `unclear` | Requires human review or scenario source inspection. |

### 3.3 Severity

Severity is not the same as direction.

| Severity | Label | Meaning |
|---:|---|---|
| 0 | `none` | Exact or behaviorally equivalent. |
| 1 | `low` | Soft/benign drift; useful for audit, not public evidence. |
| 2 | `medium` | Real trace drift under same aggregate status. |
| 3 | `high` | Behaviorally important drift, missing/extra durable action, or causal order violation. |
| 4 | `critical` | Irreversible unsafe duplicate, unauthorized destructive action, or major status regression on safety-critical scenario. |

Severity must be computed conservatively. Public claims use only human-reviewed `medium+` or `high+`, depending on context.

### 3.4 Human review status

Every scenario-level comparison has a review state:

| Review status | Meaning |
|---|---|
| `auto_only` | Only rule-based classification exists. |
| `needs_review` | Rules detected ambiguity or high-severity drift. |
| `source_reviewed` | Scenario source and trace were reviewed. |
| `adjudicated` | Human decision finalized with rationale. |
| `excluded` | Excluded from aggregate claims with reason. |

### 3.5 Primary operational category

Every scenario receives one decision-facing category before mechanism labels are interpreted.

| Category | Severity | Public meaning | Initial rule |
|---|---:|---|---|
| `REGRESSION_CRITICAL` | 3–4 | Potential public headline only after human review. | Dangerous duplicate excess; extra dangerous action; missing critical durable action. |
| `REGRESSION_MODERATE` | 2 | Real candidate degradation or high-value review item. | Status regression; semantic drift in critical fields such as `case_id`, `to`, `file_id`, `code`. |
| `REGRESSION_SOFT` | 1 | Soft drift / likely context-dependent. | Same multiset order drift; volatile/full-signature drift with semantic path equal. |
| `IMPROVEMENT` | 0–2 | Candidate is better/more complete than baseline; never aggregate as degradation. | Candidate status improves; candidate performs requested branch baseline skipped; candidate uses fewer dangerous calls. |
| `ARTIFACT` | 0 | Exclude from public evidence. | Scenario/tool-choice artifact, comparator limitation, parser/normalizer issue, known max-turn pathology. |
| `EQUIVALENT` | 0 | No behavioral drift detected. | Same semantic path/status or accepted same-config variation. |

Rules:

- `category` is the first public-decision field.
- `mechanism_classes` explain why the category was assigned.
- `REGRESSION_MODERATE`, `REGRESSION_CRITICAL`, and all `ARTIFACT` assignments default to `auto_confidence=low` unless backed by explicit rule metadata or human review.
- No aggregate public claim may combine `IMPROVEMENT`, `ARTIFACT`, and regression categories under a single “drift” number.

## 4. Taxonomy of divergence classes

Each comparison has one primary operational `category`, plus zero or more mechanism classes. Mechanism classes describe the trace phenomenon; they do not by themselves say whether the candidate regressed, improved or exposed a scenario artifact.

### 4.1 Exact / control classes

| Class | Definition |
|---|---|
| `exact_trace_match` | Tool/action semantic path and status match exactly. |
| `soft_text_only` | Tool/action path matches; assistant text differs only. |
| `control_stable` | Same-config duplicate comparison is exact or within accepted tolerance. |
| `control_unstable` | Same-config duplicate comparison differs; A/B claims are blocked until diagnosed. |

### 4.2 Real drift classes

| Class | Definition | Example |
|---|---|---|
| `semantic_argument_drift` | Action-class path preserved, durable args differ. | `TC-62 q8/turbo3`. |
| `entity_resolution_drift` | Candidate acts on unresolved entity or different identity representation. | `TC-74`: raw `Mark/Sarah` vs resolved emails. |
| `causal_order_drift` | Candidate executes dependent action before prerequisite. | create event before contact resolution. |
| `commutative_order_swap` | Same actions reordered without known dependency violation. | `TC-72` candidate reads file before contact lookup. |
| `workflow_truncation` | Candidate stops before completing required workflow. | `TC-46`: no contact/email phase. |
| `redundant_expansion` | Candidate adds extra evidence-gathering or lookup steps. | `TC-50`: extra `get_contacts(project manager)`. |
| `missing_action` | Required action absent in candidate. | Missing final `send_email`. |
| `extra_action` | Candidate performs additional action not required or not seen in baseline. | Extra `search_files`. |
| `dangerous_duplicate_excess` | Candidate repeats durable/dangerous action beyond baseline and scenario allowance. | duplicate send/delete/create beyond expected. |
| `status_regression` | Tool-eval status severity decreases, e.g. `pass → partial/fail`. | `TC-46`. |
| `status_improvement` | Tool-eval status severity improves. | `TC-48`: `fail → pass`. |
| `full_branch_execution` | Candidate executes a branch that baseline only described textually. | `TC-53`. |

### 4.3 Artifact / exclusion classes

| Class | Definition | Example |
|---|---|---|
| `scenario_artifact` | Scenario design creates pathological trace unrelated to KV drift. | `TC-45`. |
| `tool_choice_artifact` | `tool_choice=required/none` forces unnatural behavior. | `TC-45`. |
| `max_turn_loop_artifact` | Both runs loop to max turns, making counts meaningless. | `TC-45`. |
| `comparator_parser_artifact` | Markdown/trace parser loses or misreads calls. | malformed report. |
| `volatile_arg_artifact` | Difference exists only in explicitly volatile args. | email body prose. |
| `scenario_source_needed` | Automated rules cannot decide without scenario source. | any unclear dependency. |

## 5. Scenario metadata registry

v2 needs a small scenario metadata layer. It should live outside the comparator code so human review can update it without changing logic. This is also an anti-overfitting guard: rules learned from `tool-eval-bench` must be explicit data, not hidden control flow.

Suggested path:

```txt
bench/agentic-context-fidelity/kvfidelity-scenario-metadata.yaml
```

Minimal schema:

```yaml
version: 1
scenarios:
  TC-45:
    classification_override: scenario_artifact
    artifact_reasons:
      - tool_choice_required_trivial_math
      - baseline_max_turn_loop
    exclude_from_public_aggregates: true

  TC-53:
    expected_branch_when:
      weather.condition: rain
    branch_actions:
      - create_calendar_event
      - send_email
    candidate_extra_can_be_improvement: true

  TC-72:
    commutative_groups:
      - [get_contacts, read_file]
    notes: contact lookup and fallback file read are likely independent.

  TC-74:
    dependencies:
      - before: get_contacts(query contains mark)
        before_action_using_entity: create_calendar_event(attendees contains mark)
      - before: get_contacts(query contains sarah)
        before_action_using_entity: create_calendar_event(attendees contains sarah)
    durable_identity_fields:
      create_calendar_event: [attendees]
```

This registry is deliberately small. It should encode only what the comparator cannot infer generically.

## 6. Tool/argument ontology

v1 hardcoded `SEMANTIC_KEYS` and `DANGEROUS_TOOLS`. v2 must externalize both into a tool ontology file and add field roles.

Example:

```yaml
tools:
  create_calendar_event:
    dangerous: true
    durable_args: [title, date, time, duration_minutes, attendees]
    identity_args: [attendees]
    volatile_args: [description, notes]
    duplicate_policy: usually_once_per_event_revision

  send_email:
    dangerous: true
    durable_args: [to, cc, bcc, subject]
    identity_args: [to, cc, bcc]
    volatile_args: [body]
    duplicate_policy: dangerous_if_same_recipients_and_subject

  get_contacts:
    dangerous: false
    durable_args: [query]
    produces_identity: true
```

Rules:

- Durable args are public/comparison-facing.
- Volatile args are preserved in raw traces but collapsed in default semantic comparison.
- Identity args get extra checks for raw-name vs resolved-identifier drift.
- Dangerous duplicate checks must use duplicate policy, not just tool name.

## 7. Output artifacts

A v2 comparison writes a directory with immutable raw results plus interpretation files.

```txt
out/
  kvfidelity-v2-raw.json
  kvfidelity-v2-classified.json
  kvfidelity-v2-report.md
  human-review-queue.md
  trace-pairs/
    TC-46.json
    TC-74.json
  provenance.json
```

### 7.1 `provenance.json`

Required fields:

```json
{
  "comparator_version": "2.0.0-draft",
  "compare_id": "sha256-short",
  "created_at": "ISO-8601",
  "visibility": "private|team|public",
  "baseline": {
    "label": "q8/q8",
    "report_path": "...",
    "run_id": "...",
    "model": "...",
    "kv_config": "q8_0/q8_0"
  },
  "candidate": {
    "label": "turbo3/turbo3",
    "report_path": "...",
    "run_id": "...",
    "model": "...",
    "kv_config": "turbo3/turbo3"
  },
  "scenario_set": ["TC-22", "TC-23"],
  "runtime": {
    "backend": "llama.cpp server",
    "server_or_cli": "server",
    "temperature": 0,
    "seed": 42,
    "hardware": "RTX 4090",
    "driver": null,
    "cuda": null,
    "llama_cpp_commit": null
  },
  "input_hashes": {
    "baseline_report_sha256": "...",
    "candidate_report_sha256": "...",
    "scenario_metadata_sha256": "...",
    "tool_ontology_sha256": "..."
  }
}
```

### 7.2 Scenario classification object

```json
{
  "scenario_id": "TC-74",
  "baseline_status": "pass",
  "candidate_status": "pass",
  "status_delta": "same",
  "raw_metrics": {
    "action_class_path_equal": false,
    "semantic_path_equal": false,
    "full_signature_path_equal": false,
    "first_action_divergence_turn": 1,
    "first_semantic_divergence_turn": 1,
    "semantic_argument_drift_count": 6,
    "extra_action_class_count": 0,
    "dangerous_duplicate_excess_count": 0
  },
  "classification": {
    "category": "REGRESSION_MODERATE",
    "severity": 3,
    "auto_confidence": "low",
    "human_label": "candidate_regression",
    "human_reviewed": true,
    "primary_class": "entity_resolution_drift",
    "mechanism_classes": ["entity_resolution_drift", "causal_order_drift", "semantic_argument_drift"],
    "direction": "candidate_regression",
    "review_status": "source_reviewed",
    "public_evidence_eligible": true,
    "exclude_from_public_aggregates": false,
    "rationale": "Candidate creates events with raw attendee names before resolving contacts; scorer still passes both runs."
  },
  "evidence": {
    "baseline_path": ["get_contacts", "create_calendar_event", "..."],
    "candidate_path": ["create_calendar_event", "create_calendar_event", "..."],
    "minimal_quote": "candidate final event attendees: Mark/Sarah vs baseline emails",
    "source_reference": "tool-eval-bench scenarios_hardmode.py::_tc74_eval"
  }
}
```

## 8. Aggregation rules

### 8.1 Always separate controls and A/B

Controls answer:

```txt
is the measurement stable enough to trust?
```

A/B answers:

```txt
what changes when KV/context config changes?
```

If any same-config control has `control_unstable` in the selected scenario subset, public A/B claims must be downgraded.

### 8.2 Never publish one fidelity score

Do not publish:

```txt
KVFidelity = 67.9%
```

Publish a taxonomy summary:

```txt
Controls: stable across 28/28 scenarios.
A/B: 3 source-reviewed primary mechanisms: workflow truncation, entity-resolution/order drift, semantic argument drift.
Excluded: 1 scenario artifact, 2 candidate-improvement/inverse cases, 1 likely commutative order swap.
```

### 8.3 Split direction before counting

Public aggregate buckets must be operational first:

```txt
REGRESSION_CRITICAL
REGRESSION_MODERATE
REGRESSION_SOFT
IMPROVEMENT
ARTIFACT/excluded
EQUIVALENT
manual_required
```

Mechanism buckets may be shown after direction is clear:

```txt
workflow_truncation
entity_resolution_drift
semantic_argument_drift
redundant_expansion
commutative_order_swap
```

Do not mix candidate improvement with candidate regression under “drift”. Never publish semantic-fidelity percentages without decomposing them into regression / improvement / artifact / equivalent.

### 8.4 Public evidence eligibility

A scenario is eligible for public evidence only if:

- `review_status` is `source_reviewed` or `adjudicated`;
- `direction` is not `unclear`;
- not excluded as `scenario_artifact` or `comparator_artifact`;
- provenance is complete enough to reproduce;
- minimal evidence can be shown without exposing private data.

### 8.5 Safe metric names

Allowed public metrics:

- `control stability`;
- `source-reviewed drift examples`;
- `status regression cases`;
- `pass/pass trace drift cases`;
- `human-review queue size`.

Blocked until v2 validation:

- `dangerous duplicate excess` aggregate;
- `extra action class %` aggregate;
- any single composite score;
- any “unsafe” claim.

## 9. Rule examples from N=28 review

### TC-45

```yaml
primary_class: scenario_artifact
classes: [tool_choice_artifact, max_turn_loop_artifact]
direction: scenario_artifact
severity: 0
review_status: source_reviewed
public_evidence_eligible: false
exclude_from_public_aggregates: true
```

Rationale:

- Tool forced on trivial math.
- Baseline is already pathological.
- Candidate `run_code` alternation should not count as public evidence of dangerous drift.

### TC-53

```yaml
primary_class: full_branch_execution
classes: [full_branch_execution, candidate_improvement]
direction: candidate_improvement
severity: 2
review_status: source_reviewed
public_evidence_eligible: true
exclude_from_degradation_aggregates: true
```

Rationale:

- Candidate executes requested conditional branch more fully.
- Valid A/B behavioral divergence, not degradation.

### TC-74

```yaml
primary_class: entity_resolution_drift
classes: [entity_resolution_drift, causal_order_drift, semantic_argument_drift]
direction: candidate_regression
severity: 3
review_status: source_reviewed
public_evidence_eligible: true
```

Rationale:

- Candidate creates durable events before resolving attendees.
- Both pass scorer; trace contains the signal.

### TC-46

```yaml
primary_class: workflow_truncation
classes: [workflow_truncation, status_regression, missing_action]
direction: candidate_regression
severity: 3
review_status: source_reviewed
public_evidence_eligible: true
```

### TC-62

For q8/turbo3:

```yaml
primary_class: semantic_argument_drift
classes: [semantic_argument_drift]
direction: lateral_drift
severity: 2
review_status: source_reviewed
public_evidence_eligible: true
```

For turbo3/turbo3:

```yaml
primary_class: redundant_expansion
classes: [redundant_expansion, semantic_argument_drift]
direction: lateral_drift
severity: 2
review_status: source_reviewed
public_evidence_eligible: true
```

### TC-72

```yaml
primary_class: commutative_order_swap
classes: [commutative_order_swap]
direction: benign_equivalent
severity: 1
review_status: source_reviewed
public_evidence_eligible: false
```

## 10. Human review queue

`human-review-queue.md` should sort cases by:

1. `review_status == needs_review`;
2. `severity` descending;
3. `first_semantic_divergence_turn` ascending;
4. `status_regression` before pass/pass;
5. `dangerous` tools before non-dangerous tools.

Each item must include:

```txt
scenario id
title/category if available
baseline status → candidate status
primary auto class
why review is needed
baseline compact trace
candidate compact trace
first divergence turn
minimal durable args around divergence
source file/function to inspect if known
suggested question for reviewer
```

Example reviewer question:

```txt
TC-74: Is create_calendar_event allowed before get_contacts, or does the scenario require resolved attendee identity before durable event creation?
```

## 11. CLI proposal

Keep v1 CLI working. Add v2 mode rather than replacing silently.

```bash
node scripts/kvfidelity-compare-tool-eval-bench.mjs \
  --report-a baseline.md \
  --report-b candidate.md \
  --label-a q8/q8 \
  --label-b turbo3/turbo3 \
  --out-dir out \
  --mode v2 \
  --scenario-metadata bench/agentic-context-fidelity/kvfidelity-scenario-metadata.yaml \
  --tool-ontology bench/agentic-context-fidelity/kvfidelity-tool-ontology.yaml \
  --visibility team
```

Potential follow-up command for human annotations:

```bash
node scripts/kvfidelity-annotate.mjs \
  --classified out/kvfidelity-v2-classified.json \
  --annotations out/human-annotations.yaml \
  --out-dir out-reviewed
```

## 12. Visualization spec

Primary figure:

```txt
baseline trace by turn
candidate trace by turn
first divergence highlighted
classification badge
status badge
review status badge
```

Visual encoding:

| Visual element | Meaning |
|---|---|
| x-position | turn/order |
| y-lane | baseline vs candidate |
| color | divergence class |
| border style | review status |
| thickness | duplicate/excess count |
| icon/marker | dangerous/durable action |

Do not make dashboards that hide trace process behind aggregate cards.

## 13. Communication boundaries

### Safe public phrasing

```txt
Same-config controls were stable in the selected subset. A/B KV/config changes preserved near-equivalent aggregate scores but produced source-reviewed paired trace drift in specific mechanisms: workflow truncation, entity-resolution/order drift under pass/pass, and semantic argument drift with preserved action-class path.
```

### Required caveats

- selected scenario subset, not broad benchmark claim;
- one model/runtime/hardware unless otherwise stated;
- comparator v2 separates regression, improvement and artifacts;
- not an unsafe-action claim;
- not a general claim that a KV scheme is bad.

### Blocked phrasing

```txt
KV compression breaks agents.
turbo3 is unsafe.
20.3% extra action class.
5 dangerous duplicates.
KVFidelity score = X.
```

## 14. Implementation phases

### Phase 1 — Minimal v2.0 operational layer

- Add `category`, `severity`, `auto_confidence`, `human_label`, `human_reviewed` to every scenario classification.
- Implement the five decision categories first: `REGRESSION_CRITICAL`, `REGRESSION_MODERATE`, `REGRESSION_SOFT`, `IMPROVEMENT`, `ARTIFACT`, plus `EQUIVALENT` for no-drift/control cases.
- Keep mechanism classes secondary and optional in the first implementation.
- Auto-classify only objective cases at high confidence: critical dangerous excess, status improvement/regression, exact/equivalent controls.
- Mark ambiguous moderate/artifact cases as `auto_confidence=low` and `human_reviewed=false`.

### Phase 2 — External config and fixtures

- Add scenario metadata YAML for reviewed cases: TC-45, TC-46, TC-48, TC-50, TC-52, TC-53, TC-62, TC-72, TC-74.
- Add tool ontology YAML for current tool-eval tools.
- Move `SEMANTIC_KEYS` and `DANGEROUS_TOOLS` out of the script.
- Log excluded volatile fields per tool in the output.
- Add golden JSON fixture from N=28 run.

### Phase 3 — v2 classifier validation

- Keep v1 raw metrics.
- Add `classification` object per scenario.
- Add direction/severity/review/public eligibility.
- Apply scenario overrides.
- Run same-config false-positive tests: `q8/q8 vs q8/q8`, `q8/turbo3 vs q8/turbo3`, `turbo3/turbo3 vs turbo3/turbo3`.
- Require zero `REGRESSION_CRITICAL` and zero high-confidence `REGRESSION_MODERATE` on same-config controls before public use.

### Phase 4 — review queue

- Generate `human-review-queue.md`.
- Include source-review prompts.
- Support human annotations YAML.

### Phase 5 — report and public summary

- Generate Markdown with:
  - controls;
  - A/B taxonomy;
  - primary examples;
  - excluded/artifact cases;
  - caveats;
  - reproduction/provenance.

### Phase 6 — visual trace diff

- Generate SVG/HTML trace-pair views for top reviewed examples.
- Use editorial figure style consistent with `news.szt.link`, but keep trace as primary artifact.

## 15. Acceptance criteria

### 15.1 Known-case behavior

v2 is acceptable when it can reclassify the N=28 known cases as:

| Scenario | Expected v2 primary classification |
|---|---|
| TC-45 | `scenario_artifact` |
| TC-46 | `workflow_truncation` |
| TC-48 | `status_improvement` / `candidate_improvement` |
| TC-50 | `redundant_expansion` |
| TC-52 | `workflow_truncation` or `evidence_truncation` low/medium |
| TC-53 | `full_branch_execution` / `candidate_improvement` |
| TC-62 q8/turbo3 | `semantic_argument_drift` |
| TC-62 turbo3/turbo3 | `redundant_expansion` |
| TC-72 | `commutative_order_swap` |
| TC-74 | `entity_resolution_drift` + `causal_order_drift` |

And when public summary no longer reports inflated `dangerous duplicate` / `extra action` aggregates from TC-45.

### 15.2 Overfitting guards

v2 is not acceptable merely because it matches the already-reviewed N=28. It must also pass:

1. **Hold-out validation**: reserve a subset of reviewed scenarios from rule design and validate after implementation. Suggested hold-out for this run: `TC-46`, `TC-61`, `TC-62`, `TC-63`, `TC-72`, `TC-74`.
2. **Same-config false-positive test**: comparing duplicate runs of the same config should produce `EQUIVALENT`, `REGRESSION_SOFT`, or `auto_confidence=low/manual_required` at worst; it must produce zero `REGRESSION_CRITICAL` and zero high-confidence `REGRESSION_MODERATE`.
3. **External ontology test**: tool danger and semantic/volatile fields must be loaded from config files. If the ontology is absent, comparator should fail closed or mark confidence low; it should not silently fall back to hidden hardcoded assumptions.
4. **Parser robustness test**: malformed or incomplete traces must become `comparator_parser_artifact` / `auto_confidence=low`, not regression.

## 16. Open questions

1. Should `entity_resolution_drift` require scenario-specific metadata, or can it be inferred by raw-name vs email/id heuristics?
2. How should the comparator handle cases where baseline is worse than candidate but both pass?
3. Should v2 maintain a separate `evidence_quality` score for human-reviewed examples?
4. How much tool-eval source metadata should be imported automatically vs maintained manually?
5. Should public reports include candidate improvements, or keep them in caveats only?
6. How to generalize beyond tool-eval-bench Markdown without overfitting the parser?

## 17. Non-goals

- Not a leaderboard.
- Not a general agent benchmark.
- Not a safety benchmark.
- Not a replacement for tool-eval-bench scorer.
- Not a single-number KV quality metric.
- Not a claim that semantic drift always implies bad behavior.

The comparator exists to preserve the trace as an inspectable artifact and to make visible the behavioral changes hidden by aggregate pass/fail scoring.
