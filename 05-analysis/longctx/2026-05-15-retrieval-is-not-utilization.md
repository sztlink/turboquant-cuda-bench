# Retrieval is not utilization

Date: 2026-05-15
Updated: 2026-05-16
Status: internal field note / publicable draft after review
Scope: long-context decoy fixtures, Qwen-family local inference, vLLM/llama.cpp/TurboQuant research front

## Thesis

```txt
Retrieval success is not utilization success.
```

A canonical evidence span can be present in the model context and still fail to become the final answer. The failure is not always that retrieval missed. Sometimes the evidence arrived, but a decoy, ordering effect, prompt position, or answer trajectory displaced it before closure.

This is the long-context sibling of the KVFidelity thesis:

```txt
A correct answer is not a score. It is a temporal event: it emerges, persists, drifts, closes, or disappears.
```

For retrieval systems, the equivalent is:

```txt
A retrieved chunk is not a used chunk. It must enter the answer trajectory and survive to closure.
```

## Evidence set 1 — existing decoy fixture

Source:

```txt
bench/longctx-decoy-isolation-2026-05-10/summary.parsed.json
bench/APPENDIX-retrieval-utilization-2026-05-15.md
```

| arm | runs | retrieval hits | final hits | utilization gap | avg elapsed s | avg prefill tok/s |
|---|---:|---:|---:|---:|---:|---:|
| baseline_proxy | 8 | 8/8 | 5/8 | 3 | 3.00 | 2741.7 |
| anti_decoy_proxy | 8 | 8/8 | 5/8 | 3 | 1.84 | 1969.4 |
| filtered_splice | 8 | 8/8 | 8/8 | 0 | 1.81 | 2810.7 |
| oracle | 8 | 8/8 | 8/8 | 0 | 0.95 | 2244.2 |

Reading:

```txt
The canonical chunk reached context in all 8/8 cases. Baseline and anti-decoy prompting closed only 5/8 final answers. Therefore the observed failure is not retrieval absence; it is utilization failure under decoy pressure.
```

The `filtered_splice` and `oracle` rows matter because they show the task can close when the canonical evidence is made structurally harder to ignore.

## Evidence set 2 — interventions that close the gap

Source:

```txt
bench/longctx-decoy-resolution-2026-05-10/summary.parsed.json
bench/APPENDIX-retrieval-utilization-2026-05-15.md
```

| arm | runs | retrieval hits | final hits | avg elapsed s |
|---|---:|---:|---:|---:|
| rerank_proxy_orig | 4 | 4/4 | 4/4 | 80.60 |
| rerank_proxy_rewrite | 4 | 4/4 | 4/4 | 82.15 |
| policy_splice_orig_retrieval | 4 | 4/4 | 4/4 | 1.62 |
| policy_splice_rewrite_retrieval | 4 | 4/4 | 4/4 | 1.71 |

Reading:

```txt
Reranking and policy_splice both close the selected hard subset to 4/4.
```

The important distinction is not only accuracy. It is operational shape:

- `rerank_proxy` fixes the evidence order by paying a heavier reranking cost;
- `policy_splice` fixes the evidence authority/position by moving the canonical span into the user-visible policy/evidence position with low latency.

This suggests the failure mode is not “the model cannot know.” It is “the correct span did not occupy a strong enough position in the answer trajectory.”

## Evidence set 2b — overnight confirmation, 2026-05-16

Source:

```txt
bench/longctx-utilization-overnight-2026-05-16/RESULTS.md
bench/longctx-utilization-overnight-2026-05-16/sanitized-overnight-summary.json
bench/longctx-utilization-overnight-2026-05-16/sanitized-resolution-summary.json
```

Runtime:

```txt
AYA2 -> ssh 4090 Windows -> llama-server build-head3
model: q36_27b_new.gguf
ctx: 196608
ctk: q8_0
ctv: turbo3
```

### Isolation rerun

| arm | runs | retrieval hits | final hits | reading |
|---|---:|---:|---:|---|
| baseline_proxy | 8 | 8/8 | 5/8 | evidence present, closure failed on 3 |
| anti_decoy_proxy | 8 | 8/8 | 5/8 | stronger prompt did not close the gap |
| filtered_splice | 8 | 8/8 | 8/8 | evidence elevation closed the gap |
| oracle | 8 | 8/8 | 8/8 | isolated canonical shard closed the gap |

### Targeted resolution rerun

| arm | runs | retrieval hits | final hits | mean canonical rank | mean decoys before |
|---|---:|---:|---:|---:|---:|
| rerank_proxy_orig | 4 | 4/4 | 4/4 | 1.0 | 0.0 |
| rerank_proxy_rewrite | 4 | 4/4 | 4/4 | 1.0 | 0.0 |
| policy_splice_orig_retrieval | 4 | 4/4 | 4/4 | 1.0 | 0.0 |
| policy_splice_rewrite_retrieval | 4 | 4/4 | 4/4 | 1.0 | 0.0 |

Reading:

```txt
Prompting alone did not fix it. Evidence placement did. With reranker active, the canonical span reached rank 1, no decoy preceded it, and closure recovered on the targeted hard subset.
```

## Evidence set 3 — Tecnofagia real Discord decoys

Source:

```txt
bench/tecnofagia-discord-2026-05-14/RESULTS.md
bench/tecnofagia-discord-2026-05-14/sanitized-results-auto-20260515-015428.json
bench/tecnofagia-discord-2026-05-14/sanitized-results-turboquant_k8v4-20260515-090744.json
```

Privacy boundary:

```txt
No prompts, Discord chunks, raw model answers, or full logs are committed in the sanitized artifacts.
```

### vLLM auto / BF16

```txt
model: Qwen/Qwen2.5-7B-Instruct
engine: vLLM 0.20.2
kv_cache_dtype: auto
fixture: 5 hit-class handles, canonical preserved, decoys replaced by Discord/Waffle chunks
hits: 5/5
```

### TurboQuant K8V4

```txt
model: Qwen/Qwen2.5-7B-Instruct
engine: vLLM 0.1.dev1+g36fc04825
kv_cache_dtype: turboquant_k8v4
fresh venv: /home/felipe/vllm-lab/venv-tq-fresh-20260515
hits: 5/5
```

Reading:

```txt
The five hit-class handles that survived synthetic decoys also survived replacement with real Discord/Waffle decoys under both vLLM auto and a freshly rebuilt TurboQuant K8V4 vLLM fork.
```

Boundary:

```txt
This does not prove the original 8-handle invariant generalizes. The Tecnofagia fixture contains only the five hit-class handles because the three failure handles lacked canonical top-4 placement in the source mapping. This is not a broad TurboQuant quality claim.
```

## Why this matters now

The field is entering a noisy phase:

- X has many new TurboQuant claims around 3060/3090/12GB cards, Qwen3.6 35B, MTP, 120K–300K context, and generic “Google TurboQuant” summaries;
- Discord/Waffle is organizing into a more formal engineering front (`houseofwaffles`), with active discussion around benchmarks, funding, and shared repos;
- TheTom is discussing runtime telemetry for longctx: repeated retrievals, stale scope, negative constraints, dogfood replay, `tokens-to-correct`, and retrieval-utilization measurement.

This note positions the szt.link contribution as **measurement discipline**:

```txt
Do not ask only whether the context window fits.
Ask whether the retrieved evidence is used.
```

## Relationship to KVFidelity

KVFidelity asks whether an operational trace survives when the inference apparatus changes.

Retrieval-utilization asks whether the evidence path survives after retrieval:

| Layer | Question |
|---|---|
| Retrieval | Did the canonical span enter context? |
| Utilization | Did it influence the answer? |
| Closure | Did the expected answer survive to final output? |
| Trace fidelity | Did the action/answer path remain equivalent under a changed runtime? |

The same phenomenon appears in both fronts:

```txt
Final score hides temporal structure.
```

In AIME/CASK, a correct answer may appear and drift away before closure.
In longctx retrieval, a correct span may be present and still lose to a decoy before final answer.

## Proposed metric: tokens-to-correct

Current status: hypothesis / next instrument, not yet a normalized measured metric in these runs.

Operational definition:

```txt
tokens_to_correct = first generated token index after which the final expected string appears in the model's answer stream and is not later overwritten by a decoy or alternate answer.
```

Required fields for a future instrument:

| field | meaning |
|---|---|
| `expected_id` | stable handle / hash, not raw secret |
| `retrieval_hit` | canonical evidence entered context |
| `canonical_rank` | rank/position of canonical evidence in the retrieved set |
| `canonical_zone` | system/policy/user/retrieved/context section where evidence appeared |
| `first_expected_token_idx` | first output token index where expected answer appears |
| `last_decoy_token_idx` | last output token index where a decoy/alternate answer appears |
| `closed` | expected answer survived to final output |
| `tokens_to_correct` | stable first index if closed; null otherwise |
| `overwrite_event` | true if correct appeared then was replaced/drifted |

This should be measured from generated outputs or streaming traces, not inferred from retrieval rank alone.

## Publication boundary

Safe public claim:

```txt
On an existing long-context decoy fixture, retrieval was not the bottleneck: canonical evidence reached context in 8/8 cases, while final answers closed only 5/8. Stronger anti-decoy prompting remained 5/8. Filtered splice/oracle closed 8/8, and a targeted reranker run moved canonical evidence to rank 1 with 4/4 closure. A follow-up Tecnofagia probe replaced synthetic decoys with real Discord/Waffle chunks for the five hit-class handles; both vLLM auto and a freshly rebuilt TurboQuant K8V4 vLLM fork preserved 5/5 on this narrow sanitized fixture.
```

Do not claim:

- “TurboQuant is better than FP8” from this note;
- “TurboQuant K8V4 is globally safe”;
- “retrieval-augmented generation is solved by policy_splice”;
- “CASK wins/loses”;
- anything based on raw Discord-derived chunks or private messages.

## Next experiment

Build a larger **sanitized** fixture where raw Discord-derived text never leaves local storage:

1. include the original five hit-class handles;
2. add controlled synthetic hard cases for the three failure modes;
3. log retrieval rank, evidence zone, generated answer stream, and closure;
4. compute `tokens_to_correct` and overwrite/drift events;
5. run paired `auto` vs `turboquant_k8v4` only after environment smoke passes.

The goal is not a leaderboard. The goal is a detector for the gap between evidence presence and evidence use.
