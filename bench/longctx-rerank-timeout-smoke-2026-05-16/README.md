# longctx-svc rerank timeout smoke — 2026-05-16

Status: local patch / structural smoke, not upstreamed.

## Problem

The rerank path in `longctx-svc` could block `/retrieve` for minutes on CPU with the default `BAAI/bge-reranker-v2-m3` cross-encoder. In an earlier micro-repro, a single `/retrieve` call timed out client-side after 300s while the server kept working and only logged HTTP 200 later.

## Local patch

Patch file:

```txt
../../07-scripts/patches/longctx-svc-rerank-timeout-2026-05-16.patch
```

What it adds:

```txt
LONGCTX_RERANK_TIMEOUT_SECONDS
LONGCTX_RERANK_MIN_CHUNKS
LONGCTX_RERANK_PREFILTER_SMALL
LONGCTX_RERANK_PREFILTER_LARGE
LONGCTX_SPLICE_MAX_CHARS
/retrieve body: use_rerank, prefilter
/proxy body: longctx_use_rerank, longctx_prefilter
```

When `LONGCTX_RERANK_TIMEOUT_SECONDS > 0`, cross-encoder scoring runs in a killable subprocess. On timeout/error, retrieval falls back to cosine/BM25 order and returns `used_rerank=false` rather than hanging the service.

## Smoke result

Environment:

```txt
LONGCTX_RERANK_MIN_CHUNKS=1
LONGCTX_RERANK_PREFILTER_SMALL=16
LONGCTX_RERANK_PREFILTER_LARGE=16
LONGCTX_RERANK_TIMEOUT_SECONDS=10
```

Single `/retrieve`, same synthetic expanded corpus, cached index:

```txt
elapsed_sec: 21.783
status: 200
used_rerank: false
paraphrases_count: 1
n_chunks: 16
```

Interpretation:

```txt
Timeout fallback works: the request returns instead of hanging. It does not prove rerank quality; it only makes the failure mode bounded and safe.
```

## Next

- If we need actual rerank quality, test a smaller/local reranker or GPU-backed rerank.
- Then run `n=4 rerank-only` and `n=24 rerank-only`.
- Keep rerank separate from the current retrieval-utilization result until this path is stable.
