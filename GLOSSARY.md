# Glossary

Short definitions for readers arriving from GitHub, Discord, X, or a paper link.

## TurboQuant

A KV-cache quantization family for long-context inference. In this repo it appears in two runtime paths:

- llama.cpp / TheTom fork, using flags such as `-ctk q8_0 -ctv turbo3/turbo4`.
- vLLM / TheTom `feature/turboquant_plus`, using `kv_cache_dtype=turboquant_k8v4` and related presets.

## KV cache

The key/value memory used by transformer attention to avoid recomputing prior context. Long context increases KV-cache memory pressure, which motivates quantization, eviction, compression, and retrieval/splice strategies.

## KV-cache compression

Any method that reduces the memory footprint or active working set of the KV cache. Examples here include TurboQuant, CASK, TriAttention, and FP8 KV variants.

## KVFidelity

A diagnostic lens for asking whether behavior stays equivalent when the runtime KV/cache mechanism changes.

The core question:

```txt
Same model, same prompt/scaffold, same decoding setup, different KV/cache runtime: does the action trace stay equivalent?
```

KVFidelity is not a general agent benchmark. It is a paired trace comparison method.

## Action trace

The ordered sequence of tool/action decisions emitted by a model or agent scaffold: which tool was called, when, with what arguments, and whether the final status changed.

## Action-class fidelity

Whether the sequence of action/tool classes stayed the same, ignoring some argument details.

Example: `search → read → email` equals `search → read → email` at action-class level even if the query string or recipient differs.

## Semantic argument drift

A change in meaningful arguments while the action class remains the same.

Example: calling `create_event` in both traces but with different people, dates, paths, entities, or target identifiers.

## Full-signature equality

Strictest trace comparison: action class + meaningful arguments + order all match.

## Evidence utilization

The current main front of the repo. It asks whether retrieved evidence actually becomes the final answer.

Short form:

```txt
retrieved != used
```

A chunk can be present in context and still lose to a decoy, stale record, rank effect, or prompt presentation effect.

## Evidence-utilization phase

A promoted synthetic package with 11,376 runs testing rank, depth, prompt scaffolds, and distractor taxonomy. Public entry: [`bench-public/evidence-utilization/`](bench-public/evidence-utilization/).

## Decoy

A competing chunk that resembles the correct evidence but contains an invalid answer, stale value, or wrong target. Decoys test whether the model uses the right evidence rather than merely seeing some relevant-looking evidence.

## Canonical rank

The position of the correct evidence chunk in the presented evidence list. Lower is better: rank 1 means canonical evidence appears first; rank 16 means many chunks appear before it.

## Decoys-before

The number of misleading chunks placed before the canonical evidence. This repo found it can dominate answer closure more than raw context length.

## Policy splice

A deterministic intervention that places the canonical evidence first and plainly in the user message. In the tested hard decoy cases, this was more robust than relying on model-side discrimination after retrieval.

## Rerank proxy

A path where `longctx-svc` retrieves candidate chunks, reranks them with a cross-encoder, then forwards the selected context to an OpenAI-compatible model server.

## longctx-svc

TheTom's retrieval/proxy service used in several local long-context experiments. This repo tests around it; it does not claim the service is broken.

## CASK

A KV-cache compression method evaluated in this repo as an experimental object. In the public bridge package, CASK is not treated as a winner/loser. It is used to test whether upstream compression metrics connect to downstream action/target/source-rank fidelity.

## CASK × KVFidelity bridge

A synthetic action-router fixture that separates:

- action choice;
- exact target identity;
- source-rank fidelity;
- exact all-fields match.

Public entry: [`bench-public/cask-kvfidelity-bridge/`](bench-public/cask-kvfidelity-bridge/).

## TriAttention

A KV/cache selection or eviction path present in the TheTom vLLM fork. In this repo it appears both as a benchmarked method in CASK experiments and as a vLLM runtime feature.

## REFRACT

TheTom's quality-scoring method for KV compression, used in this repo as a neighboring metric layer. REFRACT can detect token/trajectory-level degradation; KVFidelity asks whether the degradation reaches action traces.

## Needle retrieval

A synthetic long-context test where a unique key is inserted at some depth and the model must retrieve it exactly. This repo uses it as a retrieval ceiling check, not as a complete RAG quality test.

## 4090 / 3090

Local consumer GPUs used for receipts:

- RTX 4090, SM89, 24 GB, main CUDA/vLLM bench host.
- RTX 3090, SM86, 24 GB, comparison/fallback host.

## Public package

A curated, public-safe copy or summary of results under [`bench-public/`](bench-public/). Raw logs, operational scratch, and lab materials stay in their original folders.
