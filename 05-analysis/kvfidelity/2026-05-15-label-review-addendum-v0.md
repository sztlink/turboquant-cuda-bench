# KVFidelity label review addendum v0 — selected AIME24 cases

Scope: trace-derived review of the selected cases requested before any public/upstream claim.

Cases:

```txt
idx 0, 7, 9, 11, 12, 24, 26
```

Source:

```txt
04-processed/kvfidelity/2026-05-13-aime24-n30/traces.jsonl
```

Important limitation: this is still a **trace-field/tail review**, not a full human re-reading of every complete generation. Treat verdicts as publication-gating notes, not final adjudication.

## Verdict table

| idx | gt | primary role | review verdict | publication stance |
|---:|---:|---|---|---|
| 0 | 204 | FullKV 4096 gain | strong closure at 4096; 2048 shows truncation/extractor drift (`2040` vs `204`) | usable as “longer generation can recover closure”, with truncation caveat |
| 7 | 25 | shared CASK/Tri/FullKV success/failure contrast | useful but noisy: small answer creates incidental-match risk; several runs mention 25 without clean closure | usable only with caveat; not a clean flagship case alone |
| 9 | 116 | label-birth / overthinking case | strong temporal case: FullKV 2048 closes, FullKV 4096 discovers then drifts; compressed mostly fail to discover | best flagship case for “correct answer as temporal event” |
| 11 | 294 | FullKV 4096 gain | clean FullKV 4096 closure; compressed runs mostly not discovered or drift | usable as support, not primary story |
| 12 | 540 | extractor-selected drift-heavy case | downgrade: repeated GT mentions exist in FullKV but closure remains weak; compressed labels include incidental formula numbers | keep as appendix/ambiguous, not public lead |
| 24 | 33 | FullKV 4096 gain | clean FullKV 4096 closure; compressed no-GT mostly | usable as support case |
| 26 | 55 | FullKV 4096 gain | clean FullKV 4096 closure; compressed no-GT mostly | usable as support case |

## Per-case notes

### idx 0 — gt 204

- `fullkv_2048`: evaluator prediction normalized to `2040`; GT `204` appears late and after answer markers, but output tail truncates after “Therefore, the answer”. This is a closure/truncation boundary, not clean solved output.
- `fullkv_4096`: clean correct with repeated boxed `204` near tail.
- compressed runs do not discover GT.

Verdict: **confirmed as recovery/closure case**, but do not overread `fullkv_2048` as “knew answer and evaluator failed”; it looks like finalization/truncation drift.

### idx 7 — gt 25

- `fullkv_2048`, `cask_b256_2048`, `tri_b256_4096`, `cask_b256_4096`, `tri_b512_4096`, `cask_b512_4096` all show strong or correct answer evidence.
- But answer `25` is small and appears repeatedly in algebraic intermediates. Several “drift” rows have after-marker GT without boxed closure.

Verdict: **confirmed useful but contamination-prone**. Use in appendix or lifecycle strip, not as sole proof of trajectory fidelity.

### idx 9 — gt 116

- `fullkv_2048`: closes correctly.
- `fullkv_4096`: GT occurs 9 times, late and after markers, but final prediction drifts to `4`.
- compressed runs mostly do not discover GT; some show late incidental/weak GT evidence (`tri_b384_4096`, `tri_b512_4096`, `cask_b512_4096`).

Verdict: **strong flagship for temporal-event framing**: the answer can be born, persist briefly, and be overwritten by later reasoning.

### idx 11 — gt 294

- `fullkv_4096`: clean correct with boxed `294`.
- `fullkv_2048`: mentions GT after marker but final prediction drifts.
- compressed runs mostly no-GT; some budgets mention GT without closure.

Verdict: **confirmed support case** for FullKV 4096 discovering/closing where compressed variants do not.

### idx 12 — gt 540

- `fullkv_2048` and `fullkv_4096` have many GT mentions and after-marker evidence, but evaluator remains incorrect and candidate tails drift to other values.
- Several compressed runs show formula numbers (`75`, `96`, `324`, `432`, etc.) and occasional GT occurrences, raising incidental numeric risk.

Verdict: **downgrade to ambiguous/drift-heavy appendix case**. Do not use as headline unless full generation is manually reread.

### idx 24 — gt 33

- `fullkv_4096`: clean correct with boxed `33`.
- all compressed runs show no GT; many are trapped in exponent/log algebra intermediates.

Verdict: **confirmed support case**.

### idx 26 — gt 55

- `fullkv_4096`: clean correct with boxed `55`.
- compressed runs do not discover GT; many are stuck around binary expansion of 2024.

Verdict: **confirmed support case**.

## Publication-gating conclusion

The safest three cases for public/upstream simplification are:

```txt
idx 9  — flagship temporal drift / label birth
idx 0  — generation-length closure recovery
idx 24 or 26 — clean FullKV 4096 support case
```

Cases to avoid as headline:

```txt
idx 7  — useful but small-number contamination risk
idx 12 — extractor-selected, ambiguous, needs full human reread
```

## Updated stance

This review strengthens the current thesis but does not convert it into a benchmark claim:

```txt
A correct answer is not just a score. It is a temporal event: it emerges, persists, drifts, closes, or disappears.
```

CASK remains the experiment under analysis; KVFidelity remains the proposed diagnostic lens.
