# RealRAG HotpotQA R3D — local semantic judge audit

Status: local judge triage complete  
Source: R3C stratified audit samples  
Primary artifact: `bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/`

## One-line result

A local Qwen judge mostly agrees with the closure metric on the stratified R3C sample, but finds meaningful false-negative / partial-answer cases. This supports using closure as a rough diagnostic, not as final adjudication.

## Boundary

This is **not** ground truth.

- Judge: the same local vLLM/Qwen2.5-7B setup family used in the benchmark path.
- Purpose: triage and metric debugging, not final semantic adjudication.
- Sample: stratified R3C audit rows, not a population-representative sample.
- Labels require human or independent-judge review before paper-like claims.
- No runtime hook, no serving mutation, no production-RAG claim.

The judge itself makes visible mistakes in some cases, so R3D should be read as a prioritization layer.

## Scale

```txt
R3C sample rows: 210
unique judged condition predictions: 684
membership rows: 840
parse/error issues: 2 low-level parse errors across condition aggregates
```

Each judged item includes:

```txt
question
gold answer
prediction
condition
closure metrics
supporting-fact title/sentence pairs
judge label
judge rationale
derived metric agreement
```

## Metric vs judge confusion

| metric / judge | n |
|---|---:|
| metric closed / judge positive | 267 |
| metric closed / judge negative | 4 |
| metric open / judge negative | 354 |
| metric open / judge positive | 59 |

On this stratified sample, the local judge flags few closure false positives and more possible false negatives / partial-answer cases.

## By condition

| condition | n | metric closure | judge-positive | label breakdown |
|---|---:|---:|---:|---|
| `bm25_top10` | 171 | 40.4% | 50.3% | wrong 85; partial 21; correct 65 |
| `bge_rerank_top10` | 171 | 47.4% | 59.1% | wrong 70; correct 81; partial 20 |
| `oracle_first` | 171 | 53.2% | 61.4% | wrong 66; correct 88; partial 17 |
| `no_support` | 171 | 17.5% | 19.9% | wrong 137; prior/leakage 34 |

Important: these rates are over the stratified R3C sample, not the full R3B population. The no-support rows are oversampled because one R3C bucket is specifically `no_support_success_leakage`.

## By audit bucket

| bucket | n | metric closure | judge-positive | label breakdown |
|---|---:|---:|---:|---|
| `bm25_fail_bge_success` | 120 | 43.3% | 50.8% | wrong 59; correct 46; partial 12; prior/leakage 3 |
| `bm25_success_bge_fail` | 120 | 33.3% | 44.2% | correct 39; wrong 67; partial 13; prior/leakage 1 |
| `bm25_fail_bge_fail_oracle_success` | 120 | 25.0% | 33.3% | wrong 80; correct 28; partial 11; prior/leakage 1 |
| `all_support_conditions_fail` | 120 | 0.8% | 19.2% | wrong 97; partial 16; correct 5; prior/leakage 2 |
| `oracle_success_bge_fail` | 120 | 30.8% | 36.7% | wrong 76; partial 11; correct 32; prior/leakage 1 |
| `bge_success_oracle_fail` | 120 | 33.3% | 38.3% | wrong 74; correct 35; partial 10; prior/leakage 1 |
| `no_support_success_leakage` | 120 | 97.5% | 95.8% | wrong 5; prior/leakage 28; correct 87 |

Bucket rows include all condition predictions for selected questions, so some labels inside a bucket refer to support-present conditions and not only the bucket trigger condition.

## What R3D changes

R3D does not overturn R3B/R3C. It adds a caution:

```txt
closure is useful but conservative/rough;
there are many metric-open predictions the local judge calls correct or partial;
metric-closed false positives appear rarer in this stratified sample;
no-support closures are mostly judged as real answer leakage/prior knowledge, but the judge is not independent.
```

Examples of likely metric-sensitive patterns surfaced by R3D:

- alias equivalence: `George Orwell` vs `Eric Arthur Blair`.
- partial entity form: `Etruscan` vs `the Etruscan civilization`.
- granularity mismatch: `Atatürk Museum Mansion` vs `museum`.
- no-support prior/leakage: correct answers without supporting facts in prompt.

## Updated safe statement

> R3D suggests the EM/contains/F1 closure metric is directionally useful for this diagnostic, but it is not sufficient for adjudication. The next step before broader claims is independent/human judging on the R3C/R3D sample buckets.

## Recommended next gate

R3E should be an **independent/human judge pass**, not another runtime experiment:

```txt
- sample 15–25 cases from each R3C/R3D bucket
- label correct / partial / wrong / ambiguous / metric false positive / metric false negative / prior-leakage
- compare human/independent judge against closure and local Qwen judge
```

Only after that should this move to 2WikiMultiHopQA, MuSiQue, or second-model replication.

## Source artifacts

```txt
bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/RESULTS.md
bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/summary.json
bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/judge-records.jsonl
bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/tasks.json
bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/memberships.json
```
