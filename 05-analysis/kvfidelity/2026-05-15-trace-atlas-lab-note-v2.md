# KVFidelity Trace Atlas — Lab Note v2

**Status:** internal technical draft, not a public benchmark claim; Claude CASK session review incorporated  
**Dataset:** AIME24, first 30 problems  
**Model:** Qwen3-8B  
**Runs:** FullKV, TriAttention, CASK across token budgets and `max_new_tokens` settings  
**Primary visual artifact:** `/home/aya/implante/tmp/kvfidelity-plotly-v3-2026-05-13/kvfidelity_plotly_atlas_v3.pdf`  
**Trace source:** `/home/aya/implante/tmp/kvfidelity-aime24-n30-traces-2026-05-13.jsonl`

## Thesis

In this slice, we use CASK as the experiment under analysis and propose KVFidelity as a diagnostic lens.

CASK should **not** be presented as a performance winner or loser. FullKV is stronger on final accuracy under these tested settings. The useful result is diagnostic: final accuracy collapses several distinct answer-trajectory phenomena into one number.

KVFidelity proposes separating at least three instruments:

1. **Discovery fidelity** — does the normalized ground-truth answer appear anywhere in the generated trajectory?
2. **Retention fidelity** — does the answer remain visible near the final zone or after an answer marker?
3. **Closure fidelity** — does the model commit to the correct final answer in the evaluator-visible form?

These are not yet human-validated semantic judgments. In this note, Discovery and Retention are **regex/extractor-derived signals** over saved model outputs. They are useful for finding trajectory phenomena, but individual cases still require manual audit.

## What this is / is not

### This is

- a diagnostic slice over AIME24 n=30;
- a trace atlas for studying answer emergence, drift, and closure;
- a method note about why final accuracy is insufficient for KV-compression evaluation;
- a candidate taxonomy for Discovery, Retention, Closure, answer drift, candidate churn, and extraction contamination.

### This is not

- a benchmark claim about CASK overall;
- evidence that CASK generally underperforms or outperforms TriAttention;
- a claim that compression always reduces discovery;
- a human-validated error analysis;
- a public leaderboard result.

## Key empirical reading

### 1. FullKV 4096 discovers more than it closes

For `fullkv_4096` on AIME24 n=30:

| Instrument | Count | Share |
|---|---:|---:|
| Discovery | 11 / 30 | 36.7% |
| Retention | 10 / 30 | 33.3% |
| Closure | 4 / 30 | 13.3% |

A leaderboard only sees 4/30. The trace shows 11/30 samples where the normalized ground-truth answer appears somewhere in the output, and 10/30 where it appears near a final/answer-marker zone.

**Interpretation:** FullKV 4096 is not merely “right 13.3% of the time.” In this slice, it often produces the correct numeric answer somewhere in the trajectory but fails to stabilize it as the final commitment.

**Caveat:** for AIME-style numeric answers, exact numeric matches can be incidental, especially for small values. The signal is diagnostic, not conclusive, until the key cases are manually audited.

### 2. More `max_new_tokens` is non-monotonic

Moving FullKV from `max_new_tokens=2048` to `max_new_tokens=4096` improves aggregate closure from 2/30 to 4/30, but the transition is non-monotonic per sample.

Observed FullKV transition classes:

| 2048 class | 4096 class | Count |
|---|---:|---:|
| not discovered | not discovered | 19 |
| not discovered | closure failure | 3 |
| not discovered | closed | 2 |
| closure failure | closed | 2 |
| closed | closure failure | 2 |
| closure failure | closure failure | 1 |
| discovered-not-retained | discovered-not-retained | 1 |

The important asymmetry is that longer generation both helps and hurts:

- it creates new closures (`not_discovered → closed`, `closure_failure → closed`);
- it also destabilizes existing closures (`closed → closure_failure`).

**Interpretation:** longer generation is not simply “more reasoning.” It can also create answer drift, candidate churn, and final-answer instability.

### 3. Compression reduces discovery under these tested budgets/configurations

At `max_new_tokens=4096`:

| Run | Discovery | Retention | Closure |
|---|---:|---:|---:|
| FullKV 4096 | 11 | 10 | 4 |
| TriAttention b256 4096 | 1 | 1 | 1 |
| CASK b256 4096 | 2 | 1 | 1 |
| TriAttention b384 4096 | 3 | 3 | 0 |
| CASK b384 4096 | 3 | 3 | 0 |
| TriAttention b512 4096 | 3 | 3 | 1 |
| CASK b512 4096 | 4 | 4 | 1 |

CASK and TriAttention behave similarly in this small slice. CASK does not separate cleanly from TriAttention on closure. At higher budget, CASK b512 discovers slightly more than TriAttention b512, but both close only 1/30.

**Interpretation:** this experiment does not support a public claim that CASK improves AIME24 accuracy. It supports a narrower claim: KVFidelity can reveal where compression affects discovery, retention, and closure under specific tested configurations.

**Caveat:** “compression reduces discovery” should be read as local to these budgets, this model, this dataset slice, this implementation, and this decoding/evaluation setup.

## Case readings

### idx 7 — compression island / closure instability

Ground truth: `25`.

This is the strongest positive case for compressed runs:

- `fullkv_2048`: closed clean
- `cask_b256_2048`: closed clean
- `tri_b256_4096`: closed clean
- `cask_b256_4096`: closed clean
- `tri_b512_4096`: closed clean
- `cask_b512_4096`: closed clean

But `fullkv_4096` becomes `answer_marker_drift`: the answer appears, even near the tail, but the final extracted answer is not closed correctly.

**Reading:** compression does not simply degrade all behavior. Some compressed conditions preserve closure on this sample while longer FullKV drifts.

**Audit note:** because the ground truth is a small number (`25`), manual inspection should verify that all “discovery” events are actual answer candidates, not incidental numeric mentions.

### idx 9 — answer appears but does not close

Ground truth: `116`.

- `fullkv_2048`: closed clean
- `fullkv_4096`: answer marker drift
- `tri_b512_4096`: latent final zone not closed
- `cask_b512_4096`: answer marker drift

This is a canonical closure-fidelity case. The answer appears in the trajectory, but the model exits through another candidate.

**Reading:** final accuracy marks this as failure; KVFidelity shows the failure happened after discovery.

### idx 11 — longer FullKV repairs closure, compression does not

Ground truth: `294`.

- `fullkv_2048`: answer marker drift
- `fullkv_4096`: closed clean
- compressed runs: mostly not discovered or drift

**Reading:** additional generation can repair FullKV closure in specific cases, but this repair does not transfer to compressed runs under these budgets.

### idx 0 / 24 / 26 — FullKV 4096 gains not recovered by compression

These are cases where FullKV 4096 closes correctly while compressed variants mostly fail to discover.

**Reading:** in these cases, compression loss appears upstream of closure: the correct answer generally does not enter the visible trajectory.

**Audit note:** idx 0 has ground truth `204`, which can appear as a substring or incidental value. Manual audit should verify candidate boundaries and answer-marker context.

### idx 12 — drift-heavy trajectory

Ground truth: `540`.

This case was selected from the trace-extractor matrix, not from the earlier 2048→4096 answer-diff subset. Several runs show the ground-truth value, but closure remains unstable. Candidate flips are high in multiple conditions.

**Reading:** this case is useful for studying overthinking/candidate churn rather than pure retrieval failure.

**Audit note:** because idx 12 was promoted by the trace extractor rather than the original answer-diff pass, it should be manually inspected before use in any external note.

## Methodological caveats before public/upstream use

1. **Small slice:** n=30 AIME24 only. No statistical claim should be made.
2. **Single model:** Qwen3-8B only.
3. **Single decoding/eval setup:** results may depend on prompt template, `max_new_tokens`, extractor, and CASK implementation details.
4. **Automatic labels:** Discovery/Retention/Closure labels are generated by trace extraction heuristics and need manual case validation.
5. **Numeric contamination:** AIME answers are short numeric strings; exact matches can be incidental.
6. **Evaluator coupling:** “Closure” is the evaluator-visible final answer, not necessarily the model’s internal belief.
7. **CASK positioning:** this does not evaluate CASK as a general method. It only studies this local AIME24/Qwen3-8B slice.
8. **Compression positioning:** avoid causal language like “compression causes X” until repeat stability or broader sweeps exist.
9. **TriAttention calibration caveat:** TriAttention used a packaged stats fallback from `for_aime25_experiment/qwen3_8b.pt` in this operational path. That may make TriAttention suboptimal for AIME24 and mixes “compression behavior” with possible calibration mismatch. Do not use TriAttention comparisons publicly without stating or fixing this.
10. **Budget range caveat:** tested compressed budgets were 256/384/512. Larger budgets such as 1024/2048 could change the discovery/closure pattern.
11. **Single-order caveat:** this is a single order/single run slice. Order sensitivity and repeat stability remain untested for these CASK runs.
12. **Difficulty/noise caveat:** Qwen3-8B on AIME24 yields low absolute scores; small absolute changes can look large in relative terms.

## Figures to use

From the v3 Plotly deck:

1. `01_topology_matrix.png` — best overview of trajectory-level behavior.
2. `02_discovery_retention_closure.png` — clearest explanation of the three instruments.
3. `04_sankey_fullkv_2048_to_4096.png` — best evidence for non-monotonic `max_new_tokens` effects.
4. `case_strip_idx_07.png`, `case_strip_idx_09.png`, `case_strip_idx_11.png` — best case narratives.

Local folder:

```txt
/home/aya/implante/tmp/kvfidelity-plotly-v3-2026-05-13/
```

## Claim → evidence → caveat

| Claim | Evidence | Caveat |
|---|---|---|
| Accuracy hides trajectory failures. | FullKV 4096 discovers 11/30, retains 10/30, closes 4/30. | Discovery/Retention are regex/extractor-derived and need manual validation. |
| More `max_new_tokens` is non-monotonic. | FullKV has both `closure_failure → closed` and `closed → closure_failure`. | Single model, small n=30 slice, no repeat stability. |
| Compression reduces discovery under these tested configurations. | Compressed 4096 runs discover 1–4/30 vs FullKV 11/30. | Local to these budgets, implementation, prompts, and extractor. |
| CASK does not separate from TriAttention on this slice. | Similar discovery/closure counts across b256/b384/b512. | Not a general CASK claim; needs repeat stability and larger sample. |
| KVFidelity is proposed as a useful diagnostic lens. | It proposes separating discovery, retention, closure, drift, and candidate churn. | Taxonomy is v0 and should be manually audited. |

## Safer wording for external use

Prefer:

> In a small AIME24/Qwen3-8B slice, final accuracy hides trajectory-level differences. A trace-based lens can separate answer discovery, retention near final zones, and final closure. Under the tested budgets, compressed runs often fail upstream at discovery, while longer FullKV generation improves aggregate accuracy but introduces non-monotonic closure drift.

Avoid:

> CASK performs worse than FullKV.

Avoid:

> Compression reduces reasoning ability.

Avoid:

> KVFidelity proves that models know the answer but fail to say it.

Use instead:

> KVFidelity flags cases where the normalized ground-truth answer appears in the generated trajectory but is not stabilized as the evaluator-visible final answer.

## Claude CASK session review incorporated

The parallel `claude-cask-kvfidelity` session reviewed v0 adversarially before closure. It found no numerical conflict with the trace counts or FullKV/CASK/TriAttention correct-index summaries, but required four changes before any public/upstream use:

1. soften “KVFidelity separates” to “KVFidelity proposes separating”;
2. add the TriAttention stats-fallback/calibration caveat;
3. make single-seed/single-order limitations explicit for all numbers, not only CASK-vs-TriAttention;
4. mark idx 12 as trace-extractor-selected rather than part of the earlier answer-diff subset.

Those changes are incorporated in this v2.

## Recommended next step

Before any public claim, manually audit the key cases:

```txt
idx 0, 7, 9, 11, 12, 24, 26
```

The goal is not to change scores. The goal is to verify whether the automatic labels correctly distinguish:

- real answer-marker drift;
- incidental numeric mentions;
- latent answer near the final zone;
- clean closure;
- extractor contamination.

Only after that should this become either:

1. a short technical note / lab note;
2. an upstream issue/comment;
3. a follow-up GPU experiment focused on repeat stability.
