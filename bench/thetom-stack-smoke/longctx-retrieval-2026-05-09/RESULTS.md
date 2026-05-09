# longctx retrieval smoke

Date: 2026-05-09

Status: local smoke, not a quality benchmark.

## Goal

Test whether TheTom's `longctx-svc` can do a real local retrieval pass over this repo using the actual `sentence-transformers/all-MiniLM-L6-v2` embedder.

## Setup

```text
longctx repo: /home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/longctx-clone
service: longctx-svc 0.3.0a3
repo indexed: /home/aya/implante/research/turboquant-cuda-bench
cache dir: /home/aya/implante/tmp/longctx-cache-smoke-2026-05-09
embedder: sentence-transformers/all-MiniLM-L6-v2
reranker: disabled for this smoke
```

Dependencies were installed into a local pip target, not system Python:

```text
/home/aya/implante/tmp/python-deps/longctx-svc-smoke
```

## Request

```json
{"session_id": "sztlink-longctx-smoke-20260509", "prefill_text": "Working in /home/aya/implante/research/turboquant-cuda-bench/notes/kvfidelity-cross-gpu-mini-check.md and /home/aya/implante/research/turboquant-cuda-bench/notes/thetom-stack-integration.md", "query": "KVFidelity cross GPU mini check binary hash driver deployment stack caveat", "top_k": 5, "explicit_scope": "/home/aya/implante/research/turboquant-cuda-bench"}
```

## Result

```text
scope_status: ready
scope_path: /home/aya/implante/research/turboquant-cuda-bench
chunks: 5
used_rerank: False
paraphrases_count: 4
```

Top hit was correct:

```text
score=0.6932
/home/aya/implante/research/turboquant-cuda-bench/notes/kvfidelity-cross-gpu-mini-check.md:1-72
```

Second and third hits were also on-target:

```text
score=0.6685
/home/aya/implante/research/turboquant-cuda-bench/notes/kvfidelity-positioning-one-pager.md:68-137

score=0.5524
/home/aya/implante/research/turboquant-cuda-bench/notes/kvfidelity-cross-gpu-mini-check.md:215-272
```

The fourth hit was the request JSON saved inside the output directory. That is expected contamination because the output directory lived inside the indexed repo. Next smoke should write outputs outside the indexed scope or add the smoke output directory to ignore rules.

## Artifacts

```text
request.json
response.json
summary.txt
status.txt
health.json
service.log
```

## Interpretation

`longctx-svc` is now testable in the local stack as a real retrieval sidecar. It correctly retrieved the KVFidelity cross-GPU note and positioning note for a deployment-stack/binary-hash query.

This is not an MRCR claim and not a production recommendation yet. It only proves the local path works:

```text
longctx-svc -> scope detection/index build -> MiniLM embeddings -> retrieve -> JSON chunks
```

Next local step: put outputs outside the indexed repo and test proxy mode in front of an OpenAI-compatible local server.
