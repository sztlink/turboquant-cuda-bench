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
REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md
REALRAG-HOTPOTQA-R3C-METRIC-AUDIT.md
REALRAG-HOTPOTQA-R3D-LOCAL-JUDGE.md
REALRAG-HOTPOTQA-R3E-HUMAN-ADJUDICATION-PACK.md
REALRAG-HOTPOTQA-R3F-AI-ADJUDICATION.md
REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md
REALRAG-2WIKI-R3H-DIAGNOSTIC.md
REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md
REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md
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
- `REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md` — BM25 vs BGE reranker vs oracle/no-support; strong reranking closes most of the natural BM25-to-oracle gap.
- `REALRAG-HOTPOTQA-R3C-METRIC-AUDIT.md` — supporting-fact sentence audit and stratified sample pack for manual/judge review.
- `REALRAG-HOTPOTQA-R3D-LOCAL-JUDGE.md` — local Qwen semantic-judge triage over R3C samples; not ground-truth adjudication.
- `REALRAG-HOTPOTQA-R3E-HUMAN-ADJUDICATION-PACK.md` — unreviewed packet for human/independent adjudication.
- `REALRAG-HOTPOTQA-R3F-AI-ADJUDICATION.md` — non-authoritative AI-assisted adjudication draft over R3E.
- `REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md` — 2Wiki generalization check; support-present beats no-support, but BGE/oracle do not clearly improve closure over BM25.
- `REALRAG-2WIKI-R3H-DIAGNOSTIC.md` — diagnosis by question type, answer class, supporting-fact sentence rank, and disagreement buckets.
- `REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md` — prompt/schema ablation showing support-sentence and gold-triple gains over paragraph context.
- `REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md` — non-gold lexical sentence compression gate; naive compression hurts globally.
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
BGE reranking mitigated most of the BM25-to-oracle gap in R3B natural retrieval
R3C confirms supporting-fact sentence presence; R3D/R3F local AI triage and R3E review packet make independent/human adjudication the next gate
2Wiki R3G/R3H/R3I/R3J shows the HotpotQA reranker ladder does not generalize cleanly under the same harness; type/prompt/schema fit and relation-aware evidence compression matter
evidence depth != answer closure
local evidence competition can dominate closure in synthetic probes
```
