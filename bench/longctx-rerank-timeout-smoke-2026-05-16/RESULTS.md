# longctx-svc rerank timeout smoke — RESULTS

Date: 2026-05-16

```txt
single retrieve with forced rerank eligibility
reranker: BAAI/bge-reranker-v2-m3
LONGCTX_RERANK_TIMEOUT_SECONDS=10
status: 200
elapsed_sec: 21.783
used_rerank: false
chunks: 16
```

Readout: timeout fallback returns safely and marks `used_rerank=false`. This is a structural fix smoke, not a rerank-quality result.
