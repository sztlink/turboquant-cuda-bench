# Appendix — retrieval utilization gap + Tecnofagia update

Date: 2026-05-15

This appendix extends `bench/RECEIPT-2026-05-12.md` without changing its scope. It separates two questions that were previously adjacent:

```txt
retrieval success: did the canonical evidence reach the model context?
utilization success: did the model use that evidence as the final answer?
```

## 1. Retrieval-utilization gap

Source:

```txt
bench/longctx-decoy-isolation-2026-05-10/summary.parsed.json
```

| arm | runs | retrieval hits | final hits | utilization gap | avg elapsed s | avg prefill tok/s |
|---|---:|---:|---:|---:|---:|---:|
| baseline_proxy | 8 | 8/8 | 5/8 | 3 | 3.00 | 2741.7 |
| anti_decoy_proxy | 8 | 8/8 | 5/8 | 3 | 1.84 | 1969.4 |
| filtered_splice | 8 | 8/8 | 8/8 | 0 | 1.81 | 2810.7 |
| oracle | 8 | 8/8 | 8/8 | 0 | 0.95 | 2244.2 |

Reading:

```txt
The canonical chunk was retrieved in all 8/8 cases, but baseline and anti-decoy prompting only closed 5/8 final answers. The failure is not retrieval absence. It is retrieval utilization under decoy pressure.
```

This is the core bridge between the receipt’s 5/8 invariant and KVFidelity-style language: a correct answer can be present in context yet fail to become the final answer.

## 2. Upstream fixes close the gap

Source:

```txt
bench/longctx-decoy-resolution-2026-05-10/summary.parsed.json
```

| arm | runs | retrieval hits | final hits | avg elapsed s |
|---|---:|---:|---:|---:|
| rerank_proxy_orig | 4 | 4/4 | 4/4 | 80.60 |
| rerank_proxy_rewrite | 4 | 4/4 | 4/4 | 82.15 |
| policy_splice_orig_retrieval | 4 | 4/4 | 4/4 | 1.62 |
| policy_splice_rewrite_retrieval | 4 | 4/4 | 4/4 | 1.71 |

Reading:

```txt
Both reranking and policy_splice close the selected hard subset to 4/4. The most important distinction is operational, not just accuracy: policy_splice achieves the fix with low latency because it moves the canonical chunk into the user-visible policy/evidence position instead of relying on a heavy rerank pass.
```

## 3. Tokens-to-correct hypothesis

The logs do not yet provide a stable, normalized `tokens_to_correct` metric across all arms. The evidence supports a hypothesis, not a measured value:

```txt
When the canonical evidence is present but decoys precede or compete with it, final accuracy depends less on raw context length and more on how early and how authoritatively the canonical span enters the model’s answer trajectory.
```

Operational definition for the next instrument:

```txt
tokens_to_correct = first generated token index after which the final expected string appears in the model's answer stream and is not later overwritten by a decoy or alternate answer.
```

This should be measured on generated outputs, not inferred from retrieval rank alone.

## 4. Tecnofagia update — real Discord decoys

Source:

```txt
bench/tecnofagia-discord-2026-05-14/RESULTS.md
bench/tecnofagia-discord-2026-05-14/sanitized-results-auto-20260515-015428.json
bench/tecnofagia-discord-2026-05-14/sanitized-results-turboquant_k8v4-20260515-090744.json
```

Result:

```txt
model: Qwen/Qwen2.5-7B-Instruct
engine: vLLM 0.20.2
kv_cache_dtype: auto
fixture: 5 hit-class handles, canonical preserved, decoys replaced by Discord/Waffle chunks
hits: 5/5
```

Reading:

```txt
The 5/5 hit-class subset survived replacement of synthetic decoys with real Discord/Waffle decoys under vLLM auto/BF16.
```

Boundary:

```txt
This does not prove the original 8-handle invariant generalizes. The Tecnofagia fixture contains only the 5 hit-class handles because the three failure handles lacked canonical top-4 placement in the source mapping. It answers a narrower question: the handles that previously survived synthetic decoys also survive real Discord decoys.
```

## 5. TurboQuant K8V4 status

A first TurboQuant attempt failed before model load due custom vLLM environment mismatch. A fresh venv rebuild following `bench/vllm-smoke-2026-05-10/BUILD-CUDA.md` passed import smoke and completed the same sanitized fixture.

```txt
model: Qwen/Qwen2.5-7B-Instruct
engine: vLLM 0.1.dev1+g36fc04825
kv_cache_dtype: turboquant_k8v4
fresh venv: /home/felipe/vllm-lab/venv-tq-fresh-20260515
hits: 5/5
```

Reading:

```txt
The five hit-class handles that survived synthetic decoys and real Discord decoys under vLLM auto also survived this narrow TurboQuant K8V4 cell. This is still not a broad TurboQuant quality claim; it only says this 5-handle sanitized fixture did not expose a utilization failure under K8V4.
```

## Safe public sentence

```txt
On the existing longctx decoy fixture, retrieval was not the bottleneck: canonical evidence reached context in 8/8 cases, while final answers closed only 5/8 until the canonical span was elevated by rerank or policy_splice. A follow-up Tecnofagia probe replaced synthetic decoys with real Discord/Waffle chunks for the five hit-class handles; both vLLM auto and a freshly rebuilt TurboQuant K8V4 vLLM fork preserved 5/5 on this narrow sanitized fixture.
```
