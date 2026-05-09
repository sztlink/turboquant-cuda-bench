# KVFidelity positioning one-pager

Date: 2026-05-09  
Status: draft canonical positioning note

## One-line framing

KVFidelity applies trajectory-aware / trace-based evaluation to KV/V-cache compression: paired action-trace comparison across runtime inference configurations, with same-build controls and scenario order as a measured axis.

## What KVFidelity is

KVFidelity is an evaluation harness, not a compression method.

It asks:

```text
If the model, task, prompt scaffold, decoding setup, seed, and temperature stay fixed, but the runtime KV/V-cache config changes, does the action/tool trace survive?
```

The measured object is the operational trace:

- tool/action sequence;
- action-class path;
- durable semantic arguments;
- full argument signature when needed;
- first divergence and trace category;
- same-config duplicate stability;
- sensitivity to scenario order/runtime context.

## Position in related work

| Work | Measures | Relation to KVFidelity |
|---|---|---|
| SciBORG, Muhoberac/Chopra et al., arXiv:2507.00081 | Uses "action trace fidelity" as an agent-benchmark dimension against valid command sequences / blueprints | Establishes nearby terminology in agent evaluation. KVFidelity should cite this precisely and not claim the term originates here. |
| TRAJECT-Bench, He et al., arXiv:2510.04550 | Predicted tool-use trajectories vs gold trajectories, with Exact Match, Inclusion, Tool Usage, ordering, Traj-Satisfy, and final Accuracy | Closest trajectory-eval peer. KVFidelity differs by comparing paired traces across runtime configs, not predicted vs gold traces. |
| CASK, Kim/Gwon, arXiv:2604.10900 | Teacher-forced token replay against full-KV reference continuation, with top-1, top-5, mean NLL, first mismatch, and output bridge metrics | Closest KV peer. KVFidelity is complementary: action-level trace replay across runtime configs rather than token-level replay against full-KV continuation. |
| Hold Onto That Thought, Liu et al., arXiv:2512.12008 | Task accuracy and attention loss for reasoning under KV-cache compression | Shows reasoning under KV compression is an active benchmark question. KVFidelity adds action-trace and order axes. |
| CurDKV, Sengupta et al., arXiv:2509.15038 | Attention-output similarity / eviction loss / CUR reconstruction fidelity | Useful vocabulary foil. Its fidelity is reconstruction/attention-output fidelity, not action-trace fidelity. |
| VQKV, Wang et al., arXiv:2603.16435 | KV-vector reconstruction and downstream score retention | Useful vocabulary foil for "high-fidelity KV compression." KVFidelity uses fidelity in a behavioral trace sense. |
| KQ-SVD, Lesens/Rakhshan/Rabusseau, arXiv:2512.05916 | Analytical attention-fidelity guarantees | Adjacent only. KVFidelity does not provide analytical guarantees. |

## Difference from CASK in one table

| Axis | CASK | KVFidelity |
|---|---|---|
| Primary object | token continuation / reasoning text | tool/action trace |
| Comparator | candidate compression vs full-KV reference | paired runtime KV/V-cache configs |
| Main question | does compressed KV follow the full-KV continuation? | does changing KV config change the operational trace? |
| Metrics | top-1, top-5, mean NLL, first mismatch, output bridge | action path, semantic args, full signatures, categories, review metadata |
| Order/context | regime and witness taxonomy | scenario order/context as measured axis |
| Best use | reasoning-token replay fidelity | serving-config action-trace fidelity |

## Difference from TRAJECT-Bench

TRAJECT-Bench compares a predicted tool trajectory to a ground-truth trajectory.

KVFidelity compares two observed traces from the same task/scaffold/model under different runtime KV/V-cache configurations.

A possible adapter framing:

```text
reference trace = q8/q8 or full-KV-equivalent config
candidate trace = compressed KV/V-cache config
```

Then TRAJECT-style metrics can describe tool selection, inclusion, usage, and ordering, while KVFidelity adds:

- same-config duplicate controls;
- trace-bound review categories;
- runtime config labels;
- scenario order as a measured axis.

## Current evidence package

Order-sensitivity soak:

- 25 scenario orders;
- 4 KV configs;
- 2 reps per order/config;
- 200 runs;
- 4000 scenario traces.

Same-config duplicate controls were stable within fixed orders:

| Control | Result |
|---|---:|
| q8/q8 | 500/500 equivalent |
| q8/turbo4 | 500/500 equivalent |
| q8/turbo3 | 500/500 equivalent |
| q8/turbo2 | 500/500 equivalent |

Reading:

```text
Within a fixed order/config, duplicate traces were stable. Across order permutations and V-cache settings, action traces drifted.
```

Strongest reviewed example:

- TC-31, prompt: "Send the report to Sarah."
- observed gestures: tools-first ambiguity resolution, safe clarification, or no-resolution failure;
- drift depends on KV config and scenario order;
- use as reviewed evidence, not raw-count proof of broad degradation.

## Safe claims

Use:

```text
KVFidelity is a KV-cache-level instantiation of trajectory-aware / trace-based evaluation: paired action-trace comparison across runtime KV/V-cache configurations, with same-build controls and scenario order as a measured axis.
```

Use:

```text
KVFidelity is complementary to CASK's token-level teacher-forced replay and TRAJECT-Bench's gold-trajectory tool-use evaluation.
```

Use:

```text
The current evidence shows that fixed-order same-config controls are stable while cross-config and cross-order traces can drift in reviewed tool-use cases.
```

## Claims to avoid

Do not claim:

- first trajectory-aware evaluation;
- first action trace fidelity benchmark;
- first replay-based KV evaluation;
- first reasoning-on-KV benchmark;
- KV compression breaks agents;
- CASK missed behavior;
- TRAJECT-Bench should support this natively;
- analytical attention-fidelity guarantees;
- broad model quality ranking from the current soak.

## Public links

- Related work note: `notes/kvfidelity-related-work.md`
- Comparator v2: `notes/kvfidelity-comparator-v2.md`
- Order-sensitivity soak: `notes/kvfidelity-order-sensitivity-soak-result.md`
- CASK issue: https://github.com/Skyline-23/CASK/issues/1

## Current outreach state

- X correction posted as integrity/related-work update.
- CASK issue opened to clarify token-level replay vs action-level trace fidelity.
- TRAJECT-Bench issue drafted but not posted.
- No further outreach should happen without a concrete reason or Felipe approval.
