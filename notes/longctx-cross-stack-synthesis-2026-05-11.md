# Longctx + decoys cross-stack: what survived the week

Date: 2026-05-11.

This is a narrative synthesis of three days of bench work (May 9–11, 2026) on long-context retrieval under adversarial conditions. It is intentionally shorter than any single RESULTS.md in the repo. The point is not to enumerate results; the point is to record what generalizes beyond this specific stack and this specific corpus.

## The question we started with

Does TheTom's TurboQuant KV-cache compression actually work on consumer GPU hardware (RTX 4090) for long-context inference with a real-size model (Qwen 27B dense), in conditions that approximate production retrieval (chunks injected into the prompt from an external retriever)?

That question got a clean answer in the first 24 hours: yes. At 192K context with `q8_0/turbo4` KV, single-needle retrieval is 5/5. The 4090 holds. KV compression does what it advertises. The rest of the week was the inverted question: when it stops working, what's actually breaking?

## What turned out to matter

The single most consequential finding is that adversarial retrieval has at least **three nested failure modes** that all look like the same number on a results table.

A test corpus with 8 questions, 16 retrieved chunks per question, several DECOY chunks per question, and one canonical chunk that contains the right answer should, in principle, yield 8/8 correct answers from a competent model. It does not. Across **five independent (stack × family × size) configurations** we tested — llama-cpp + Qwen 27B, vLLM + Qwen 2.5-7B, vLLM + Qwen 2.5-14B-AWQ, vLLM + Qwen 2.5-32B-AWQ, vLLM + Mistral 7B — the same 5/8 score appears, and the same 3 specific handles fail. The wrong-answer text on at least one handle (`brass-river-index` → `DECOY-0616-1`) is **byte-identical** across two different model families and across two different inference stacks. That's not a model property. That's a property of the relationship between how chunks were curated, how the retriever ranks them, and how the decoder reads what it gets.

The second finding is that the failure of one of those handles (`glass-orchid-vector`) is not "the model is too small." It's a chain: the retriever (a combination of dense embedding and BM25 inside `longctx-svc 0.3.0a3` with `bge-reranker-v2-m3`) does not surface the dedicated canonical shard at all, even with `top_k=50` requested; the top three reranker positions are decoys lexically dense in the alias phrase; the only chunk in the returned context that contains the right secret is a structured-data entry (manifest.json), in a format that doesn't match what a strict system prompt asks for. A 7B model with a permissive prompt extracts it. A 7B model with a strict prompt refuses. A 14B+ model extracts it under any prompt. A 7B-class model from a different family (Mistral) extracts it under any prompt. **The capacity story is downstream of two earlier failures the smaller models can't compensate for.**

The third finding, the universally invariant one, is that injecting the canonical chunk as plain text directly into the user message — what the bench calls `policy_splice` — produces 4/4 across every single (stack × family × size × system-prompt) combination. It sidesteps the retrieval miss, the decoy dominance, and the format mismatch all at once. It is also, of course, only available when you already know which chunk is canonical, which is the same as saying the retrieval problem is already solved upstream. The fix is universal but moves the problem.

## What generalizes

These conclusions do not depend on TurboQuant's specific KV compression, on vLLM's specific model executor, on Qwen-family training, or on this particular corpus shape:

- A retrieval pipeline that does not surface the canonical chunk into its returned set cannot be saved by any downstream model, regardless of size.
- When decoys are lexically dense in the query terms and the canonical is in a different format, a cross-encoder reranker over a small candidate pool will not recover.
- "Inject the right answer first, in the format the prompt asks for, plain text" beats every other intervention measured here.
- "Model size matters" is, in adversarial-retrieval settings on small corpora, often a proxy for "model is robust enough to extract from a format the prompt did not literally ask for." Family/calibration training differences (Mistral's refuse-honestly behavior, Qwen 2.5's commit-to-decoy behavior) can produce larger effects than parameter-count differences.

## What stays tied to this corpus

The byte-identical `DECOY-0616-1` answer across stacks is real but is a property of *this curated synthetic corpus*. We have not yet repeated the experiment on a corpus curated outside this project — for example, captured Discord text, a real source repository, a PDF library. Whether the same patterns appear there is the next test. Until then, the synthesis is: "this is what adversarial retrieval looks like *when the corpus is shaped this way*", not "this is what adversarial retrieval looks like *in general*."

## Where this fits

In an artistic/research practice that takes computational systems as material, the operationally useful conclusion is: the visible result (one number on a table) is the surface of a multi-layer pipeline whose individual failures look identical from outside. Auditing each layer — the retriever, the reranker, the prompt strictness, the canonical chunk format, the model family — produces a different debugging story than auditing only the model. The bench is not a model benchmark; it is a system trace.

## What the next test should be

Take a non-curated corpus (Discord captures from `bench/longctx-proxy-hard-2026-05-10/corpus/...` are not it — those were curated by the same author who built the test framework) and rebuild the eight-handle structure from there. If the failure modes survive, the synthesis above is general. If they don't, the synthesis is specific to this corpus, and that itself is the interesting result.

## Index of receipts (for replication, not for narrative)

- `bench/longctx-proxy-hard-2026-05-10/` — original 5/8 retrieval-vs-answer baseline on llama-cpp + Qwen 27B
- `bench/longctx-decoy-resolution-2026-05-10/` — same corpus, rerank + policy_splice recovers to 16/16 on the 4 hard handles
- `bench/vllm-decoy-2026-05-11/` — full cross-stack replay, 5-row table, glass deep dive, format-mismatch correction
- `bench/vllm-needle-2026-05-11/` — single-needle (no decoys) cross-stack at 128K/160K/192K
- `bench/vllm-smoke-2026-05-10/` — first-light vLLM TurboQuant + V3 enable mechanics
- `bench/vllm-smoke-2026-05-10/BUILD-CUDA.md` — install recipe for the vLLM CUDA path on WSL2
