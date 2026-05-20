# Key findings

This file is the short public readout of the repo. Numbers are from local RTX 4090 / RTX 3090 receipts unless stated otherwise.

## Core findings

These are the stable public findings from promoted receipts. The phrase **retrieved ≠ used** is shorthand for an operational separation between evidence presence and answer closure. It is not a proof of internal evidence use or a claim that this is the dominant production RAG bottleneck.

## 1. Public HotpotQA: answer closure is position-sensitive

The RealRAG R1/R2/R3A/R3B/R3C runs move the evidence-placement claim beyond synthetic fixtures onto public HotpotQA dev distractor.

R1 full evidence-placement gate:

- **7,384** HotpotQA questions, **36,920** records, **0 errors**.
- `oracle_first`: **51.1%** closure.
- `bm25_retrieved`: **46.2%** closure.
- `oracle_last`: **42.7%** closure.
- `distractor_first`: **38.5%** closure.
- `no_support`: **6.8%** closure.

R2 forced support-rank curve:

- **7,384** questions, **44,304** records, **0 errors**.
- `rank_1`: **51.4%** closure.
- `rank_last`: **42.4%** closure.
- `rank_3`: **40.4%** closure.
- `rank_8`: **38.7%** closure.
- `rank_5`: **38.6%** closure.
- `no_support`: **6.9%** closure.

Observed position curve:

```txt
rank_1 > rank_last > rank_3 > rank_8 ≈ rank_5 >> no_support
```

R3A prompt/citation ablation:

- **1,991** questions, **23,892** records, **0 errors**.
- `direct_short_answer`: `rank_1` **51.5%**, `rank_5` **38.4%**, `rank_last` **42.7%**, `no_support` **6.5%**.
- `cite_then_answer`: `rank_1` **48.0%**, `rank_5` **37.2%**, `rank_last` **37.0%**, `no_support` **6.7%**.
- `reason_then_answer`: `rank_1` **52.3%**, `rank_5` **39.3%**, `rank_last` **43.8%**, `no_support` **8.6%**.
- Paired `rank_1 - rank_5` deltas remained large: direct **+13.1 pp**, cite **+10.8 pp**, reason **+13.1 pp**.
- Citation-hit in `cite_then_answer` fell as evidence moved away from the start: `rank_1` **43.9%**, `rank_5` **32.9%**, `rank_last` **28.2%**.

R3B natural retrieval + BGE reranker gate:

- **1,991** questions, **7,964** records, **0 errors**.
- `bm25_top10`: **45.8%** closure, support rank mean **1.34**.
- `bge_rerank_top10`: **50.1%** closure, support rank mean **1.05**.
- `oracle_first`: **51.2%** closure.
- `no_support`: **6.8%** closure.
- Paired `bge_rerank_top10 - bm25_top10`: **+4.4 pp**, 95% CI **+2.7 to +6.1 pp**.
- Paired `oracle_first - bge_rerank_top10`: **+1.1 pp**, 95% CI **-0.6 to +2.7 pp**.

R3C metric/supporting-facts audit:

- R3B support-present conditions have **100%** supporting-fact sentence recall.
- Supporting-fact sentence rank mean improves from BM25 **3.17** to BGE **1.77**; oracle is **1.54**.
- Stratified audit buckets: BM25 fail → BGE success **198** cases; BM25 success → BGE fail **111**; BM25/BGE fail → oracle success **86**; all support-present conditions fail **796**; no-support closure/leakage **136**.
- The audit pack is not adjudicated yet: `audit_label` is `unreviewed`.

Interpretation: answer closure is sensitive to where gold supporting evidence sits in the context field. Beginning helps, middle burial hurts, and end placement partially recovers. Simple citation or reasoning prompts do not remove the controlled position effect. R3B changes the practical verdict: a strong reranker mitigates most of the natural BM25-to-oracle gap on this HotpotQA slice. R3C changes the next question: remaining failures need semantic/judge audit before being interpreted as evidence-use failures.

Boundaries: this is answer-side EM/contains/F1-derived closure. Citation-hit is title-string overlap, not proof of internal citation use. Supporting-fact sentence presence validates prompt inclusion, not internal use. These results do not prove attention, internal evidence use, production RAG value, a dominant production-RAG bottleneck, or runtime readiness.

Public packages:

- [RealRAG HotpotQA R1](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R1.md)
- [RealRAG HotpotQA R2 rank curve](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R2-RANKCURVE.md)
- [RealRAG HotpotQA R3A prompt variants](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3A-PROMPTVARIANTS.md)
- [RealRAG HotpotQA R3B natural retrieval](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3B-NATURAL-RETRIEVAL.md)
- [RealRAG HotpotQA R3C metric audit](bench-public/evidence-utilization/REALRAG-HOTPOTQA-R3C-METRIC-AUDIT.md)
- [RealRAG sample pack](bench-public/evidence-utilization/REALRAG-HOTPOTQA-SAMPLES-v1.md)
- [RealRAG R3 plan](bench-public/evidence-utilization/REALRAG-R3-PLAN.md)

## 1b. Synthetic fixtures isolate stronger rank/decoy effects

In the promoted synthetic evidence-utilization phase, the system ran **11,376** public-safe synthetic cases with **0 errors** and **7,902/11,376** answer closures (**69.5%**).

The main failure mode was not raw context depth. It was local evidence competition:

- phase diagram: canonical rank 1 closed **93.8%**, rank 16 closed **38.8%**.
- distractor taxonomy: rank 1 closed **98.9%**, rank 16 closed **23.2%**.
- stale records were much harder than unrelated noise: **36.1%** vs **84.2%** closure.
- prompt scaffolding did not reliably fix the problem: baseline **86.3%**, structured **67.6%**.

Synthetic probes are useful because they isolate rank, decoys-before, and distractor type. They should not be read as production RAG evidence by themselves.

Public package: [`bench-public/evidence-utilization/`](bench-public/evidence-utilization/)

## 2. Long context can retrieve cleanly up to 192K, but decoys still win

Needle retrieval passed on the vLLM TurboQuant path:

- Qwen 2.5-7B + vLLM + `turboquant_k8v4` + YaRN: **5/5** at 128K, **5/5** at 160K after factor adjustment, **5/5** at 192K.
- llama.cpp Qwen 27B q8/turbo4 also passed **5/5** at 128K/160K/192K on the same prompt family.

But in the decoy/ranking replay, exact retrieved chunks still produced wrong answers:

- llama.cpp Qwen 27B: **5/8**.
- vLLM Qwen 2.5-7B, V3 off: **5/8**.
- vLLM Qwen 2.5-7B, V3 on: **5/8**.
- the `brass-river-index` wrong answer was byte-identical across stacks: `DECOY-0616-1`.

Public package: [`bench-public/vllm-cross-stack/`](bench-public/vllm-cross-stack/)

## 3. Policy splice is the robust fix in this fixture

For the four hard decoy cases, injecting the canonical evidence first in the user message recovered:

- `policy_splice_orig`: **4/4** on llama.cpp Qwen 27B, vLLM Qwen 7B, vLLM Qwen 32B-AWQ, Mistral 7B.
- `policy_splice_rewrite`: **4/4** across the same tested stack/family cells.

Reranking alone was more model/family/corpus-format dependent: Qwen 2.5-7B was weaker on `glass-orchid-vector` under strict format instructions, while Mistral 7B and Qwen 14B/32B recovered.

## Method bridge

These findings separate the evaluation layers: answer closure, action trace, target identity, and source rank.

## 4. KVFidelity detects trace drift hidden by pass/fail

The early KVFidelity N=28 stateful/tool-use sweep found stable same-config controls but paired trace drift under KV/cache changes:

- same-config duplicate controls: **100% stable** across q8/q8, q8/turbo3, and turbo3/turbo3.
- q8/q8 vs q8/turbo3: action-class equality **82.1%**, semantic equality **53.6%**, full-signature equality **50.0%**, while aggregate tool-eval score stayed near-equivalent.
- q8/q8 vs turbo3/turbo3: action-class equality **67.9%**, semantic equality **46.4%**, status equality **92.9%**.

After parser fixes and hold-out review, the claim narrowed substantially:

- hold-out controls: **20/20 equivalent** for each same-config duplicate.
- q8/turbo3 hold-out: **20/20 equivalent**.
- q8/turbo2 retained one moderate high-confidence regression.

The usable claim is not “KV compression breaks agents.” It is: pass/fail can miss trace-level behavior changes.

Public package: [`bench-public/kvfidelity/`](bench-public/kvfidelity/)

## 5. Compression method and task shape are separate variables

The CASK × KVFidelity bridge v2 separates `action`, `target`, and `source_rank` fidelity on 120 synthetic action-router cases:

| run | exact | action | target | rank |
|---|---:|---:|---:|---:|
| FullKV | 119/120 | 119/120 | 119/120 | 120/120 |
| CASK b512 | 1/120 | 117/120 | 2/120 | 108/120 |
| CASK b1024 | 109/120 | 119/120 | 109/120 | 120/120 |
| CASK b2048 | 119/120 | 119/120 | 119/120 | 120/120 |
| TriAttention b2048 | 119/120 | 119/120 | 119/120 | 120/120 |

Action and source-rank can survive after exact target identity fails. This is a methodology probe, not a global leaderboard.

Public package: [`bench-public/cask-kvfidelity-bridge/`](bench-public/cask-kvfidelity-bridge/)

## 6. TurboQuant K8V4 preserved BF16 behavior on the decoy dtype sweep

On the vLLM decoy k=16 workload with Qwen 2.5-7B:

- BF16/auto: **5/8**.
- TurboQuant `turboquant_k8v4`: **5/8**, byte-identical failure pattern to BF16.
- naive FP8 KV: **0/8**.
- FP8 with on-the-fly random-token scaling: **0/8**.
- calibrated W8A8-KV8 FP8: structure recovered, exact precision did not, **0/8** exact.

This does not refute FP8 claims at 70B+ reasoning scale. It shows that for this 7B exact-match adversarial retrieval workload, TurboQuant K8V4 was the safer drop-in.

## Exploratory runtime observability

This section is architecture and instrumentation direction, not a production claim.

## 7. Evidence-Paged KV has kernel receipts, not a production hook

The 2026-05-18 Evidence-Paged KV CUDA series explores evidence-aware KV page access as a kernel shape:

- **v4** is the best public receipt: score tiles → top-k/softmax → value accumulation. It is hybrid: Torch CUDA still handles top-k/softmax.
- **v5** is the best current custom `K=32` path: staged custom top-k/value wins over materialized PyTorch in the tested shapes, but loses for naive `K=128`.
- **v7** is the best architectural expression: page-local warp-scored top-k without full `[M,H]` score materialization, but it still loses to v5 at larger M.

Do not read this as vLLM integration, serving speedup, production attention, evidence-use proof, or model-quality improvement. The live hook-on path remains paused behind an explicit runtime gate; the current durable milestone is the offline v1.9 evidence-path ledger and validator-first view.

Public package: [`bench-public/evidence-paged-kv/`](bench-public/evidence-paged-kv/)
