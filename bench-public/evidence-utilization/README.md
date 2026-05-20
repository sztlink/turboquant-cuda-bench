# Evidence-placement / answer-closure diagnostics

Public HotpotQA gates plus synthetic long-context probes for the retrieval-utilization front.

The central behavior:

```txt
FOUND      retrieved evidence is present
PRESENTED  rank/decoys/context decide what competes locally
USED       answer closure may still fail
```

Start with:

```txt
REALRAG-HOTPOTQA-R1.md
REALRAG-HOTPOTQA-R2-RANKCURVE.md
REALRAG-HOTPOTQA-R3A-PROMPTVARIANTS.md
REALRAG-HOTPOTQA-SAMPLES-v1.md
REALRAG-R3-PLAN.md
RESULTS.md
```

Sealed offline milestone:

```txt
OFFLINE-MILESTONE-v1.9.md
```

<p>
  <img src="../assets/evidence-path-ledger-v19.svg" alt="evidence path ledger v1.9" width="860">
</p>

Bridge docs:

```txt
EPKV-BRIDGE-SPEC.md
EPKV-BRIDGE-READOUT.md
EPKV-BEHAVIOR-MAP.md
EVIDENCE-PATH-LEDGER.md
EVIDENCE-PATH-LEDGER-VIEW.html
OFFLINE-MILESTONE-v1.9.md
```

Public-dataset gates:

- `REALRAG-HOTPOTQA-R1.md` — HotpotQA evidence-placement result: oracle-first vs BM25 vs oracle-last vs distractor-first vs no-support.
- `REALRAG-HOTPOTQA-R2-RANKCURVE.md` — forced support-rank curve: beginning helps, middle burial hurts, end partially recovers.
- `REALRAG-HOTPOTQA-R3A-PROMPTVARIANTS.md` — direct/citation/reasoning prompt ablation; the position effect survives simple prompting changes.
- `REALRAG-HOTPOTQA-SAMPLES-v1.md` / `.jsonl` — audit sample pack with questions, gold answers, predictions, metrics, and context titles.
- `REALRAG-R3-PLAN.md` — remaining reranker, judging, more-dataset, and multi-model gates.

Synthetic sweeps:

- `phase/` — evidence zone, canonical rank, and decoys-before phase diagram.
- `depth/` — 20k / 80k / 160k context-depth sweep.
- `prompt-scaffold/` — baseline vs negative / positive / structured prompt variants.
- `distractor-taxonomy/` — unrelated noise vs explicit decoy / stale record / conflicting correction / near duplicate.
- `controller/` — overnight sequence wrapper log and done marker.

Not included: raw per-request `summary.jsonl` / raw answers. Those remain local staging artifacts.

Core thesis, qualified:

```txt
retrieved != used is shorthand for operational separation, not proof of internal evidence use or a dominant production-RAG bottleneck
answer closure is sensitive to position/rank/recency under controlled evidence placement
simple citation/reasoning prompts did not remove the HotpotQA position effect in R3A
evidence depth != answer closure
local evidence competition can dominate closure in synthetic probes
```
