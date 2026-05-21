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
REALRAG-PHASE0-CLOSURE.md
EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md
EVIDENCE-PROTECTION-LAYER-INDEX.md
EVIDENCE-PROTECTION-LAYER-v0-SPAN-PROVENANCE.md
EVIDENCE-PROTECTION-LAYER-v0.1-PACKING-INVARIANCE.md
EVIDENCE-PROTECTION-LAYER-v0.2-ANSWER-EQUIVALENCE.md
EVIDENCE-PROTECTION-LAYER-v0.3-REPLAY-COMPATIBILITY.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md
EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.5.md
REALRAG-HOTPOTQA-R1.md
REALRAG-HOTPOTQA-R2-RANKCURVE.md
REALRAG-HOTPOTQA-R3A-PROMPTVARIANTS.md
REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md
REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md
REALRAG-HOTPOTQA-R3C-METRIC-AUDIT.md
REALRAG-HOTPOTQA-R3D-LOCAL-JUDGE.md
REALRAG-HOTPOTQA-R3E-HUMAN-ADJUDICATION-PACK.md
REALRAG-HOTPOTQA-R3F-AI-ADJUDICATION.md
REALRAG-R3K-ADJUDICATION-LIGHT.md
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

- `REALRAG-PHASE0-CLOSURE.md` — closed Phase 0 readout across HotpotQA, 2Wiki, adjudication triage, and 32B scale.
- `EVIDENCE-PATH-OBSERVE-PROTECT-INTERVENE.md` — Casey-informed operating map separating observe, protect, and intervene regimes.
- `EVIDENCE-PATH-RUNTIME-TELEMETRY-INDEX.md` — consolidated Phase 1 telemetry index and non-intervention boundary freeze.
- `EVIDENCE-PROTECTION-LAYER-INDEX.md` — consolidated PROTECT index and non-intervention boundary freeze.
- `EVIDENCE-PROTECTION-LAYER-v0-SPAN-PROVENANCE.md` — first PROTECT gate; support spans survive deterministic packing as hashed provenance.
- `EVIDENCE-PROTECTION-LAYER-v0.1-PACKING-INVARIANCE.md` — structural packing transforms preserve paragraph multisets, support hashes, and no-support emptiness.
- `EVIDENCE-PROTECTION-LAYER-v0.2-ANSWER-EQUIVALENCE.md` — synthetic original-vs-protected rewrite equivalence with fail-closed blocking.
- `EVIDENCE-PROTECTION-LAYER-v0.3-REPLAY-COMPATIBILITY.md` — real-record replay compatibility; stable packs allowed, reorders blocked pending equivalence/adjudication.
- `EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md` — Phase 1 default-off replay bridge from RealRAG records into the runtime telemetry schema.
- `EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md` — default-off runtime sidecar emitter smoke on synthetic/local prompts.
- `EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md` — fail-closed and privacy-regression fixtures for the sidecar telemetry contract.
- `EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md` — guarded sidecar run loop with default-off, preflight, served-model guard, postflight validation, and privacy scan.
- `EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md` — config-driven CI-style command for the guarded sidecar.
- `EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.5.md` — read-only/no-endpoint CI verifier for committed telemetry artifacts.
- `REALRAG-HOTPOTQA-R1.md` — HotpotQA evidence-placement result: oracle-first vs BM25 vs oracle-last vs distractor-first vs no-support.
- `REALRAG-HOTPOTQA-R2-RANKCURVE.md` — forced support-rank curve: beginning helps, middle burial hurts, end partially recovers.
- `REALRAG-HOTPOTQA-R3A-PROMPTVARIANTS.md` — direct/citation/reasoning prompt ablation; the position effect survives simple prompting changes.
- `REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md` — BM25 vs BGE reranker vs oracle/no-support; strong reranking closes most of the natural BM25-to-oracle gap.
- `REALRAG-HOTPOTQA-R3L-32B-NATURAL-RETRIEVAL.md` — 32B scale check on the same HotpotQA natural-retrieval gate; scale raises closure but preserves the rank/placement ladder.
- `REALRAG-HOTPOTQA-R3C-METRIC-AUDIT.md` — supporting-fact sentence audit and stratified sample pack for manual/judge review.
- `REALRAG-HOTPOTQA-R3D-LOCAL-JUDGE.md` — local Qwen semantic-judge triage over R3C samples; not ground-truth adjudication.
- `REALRAG-HOTPOTQA-R3E-HUMAN-ADJUDICATION-PACK.md` — unreviewed packet for human/independent adjudication.
- `REALRAG-HOTPOTQA-R3F-AI-ADJUDICATION.md` — non-authoritative AI-assisted adjudication draft over R3E.
- `REALRAG-R3K-ADJUDICATION-LIGHT.md` — 200-item high-risk local-LLM triage pack across Hotpot/2Wiki buckets.
- `REALRAG-2WIKI-R3G-NATURAL-RETRIEVAL.md` — 2Wiki generalization check; support-present beats no-support, but BGE/oracle do not clearly improve closure over BM25.
- `REALRAG-2WIKI-R3H-DIAGNOSTIC.md` — diagnosis by question type, answer class, supporting-fact sentence rank, and disagreement buckets.
- `REALRAG-2WIKI-R3I-PROMPT-SCHEMA-ABLATION.md` — prompt/schema ablation showing support-sentence and gold-triple gains over paragraph context.
- `REALRAG-2WIKI-R3J-SENTENCE-COMPRESSION.md` — non-gold lexical sentence compression gate; naive compression hurts globally.
- `REALRAG-HOTPOTQA-SAMPLES-v1.md` / `.jsonl` — audit sample pack with questions, gold answers, predictions, metrics, and context titles.
- `REALRAG-R3-PLAN.md` — executed R3 gate ledger plus remaining optional validation.

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
Phase 0 is closed as a public-dataset answer-closure package
Phase 1 telemetry membrane is established through v0.5 and frozen as telemetry-only / non-intervention
PROTECT membrane is established through EPL v0.3 and frozen as hook-off / non-kernel / non-intervention
R3L shows 32B scale raises HotpotQA closure sharply in support-present conditions but keeps BM25 < BGE < oracle_first >> no_support
R3C confirms supporting-fact sentence presence; R3D/R3F local AI triage and R3E review packet make independent/human adjudication the next gate
2Wiki R3G/R3H/R3I/R3J shows the HotpotQA reranker ladder does not generalize cleanly under the same harness; type/prompt/schema fit and relation-aware evidence compression matter
evidence depth != answer closure
local evidence competition can dominate closure in synthetic probes
```
