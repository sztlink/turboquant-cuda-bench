# longctx decoy resolution targeted, reranker/query rewrite/policy splice

Date: 2026-05-16 rerun of the 2026-05-10 fixture.
Runtime note: this promoted rerun used `ctk=q8_0`, `ctv=turbo3` via `C:\turbo-build\build-head3\bin\llama-server.exe`.

Purpose: test whether longctx decoy failures improve with the real reranker, query rewrite, or splice policy. Targeted to three failing cases plus one control.

## Aggregate

| arm | hits/runs | retrieval hits | used rerank | mean rank | mean decoys before | mean elapsed |
|---|---:|---:|---:|---:|---:|---:|
| policy_splice_orig_retrieval | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 | 1.6 s |
| policy_splice_rewrite_retrieval | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 | 1.7 s |
| rerank_proxy_orig | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 | 67.4 s |
| rerank_proxy_rewrite | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 | 70.2 s |

## Rows

| arm | handle | hit | retrieval | rank | decoys before | rerank | answer excerpt |
|---|---|---:|---:|---:|---:|---:|---|
| rerank_proxy_orig | brass-river-index | yes | yes | 1 | 0 | yes | AYA-HARD-BRASS-RIVER-180-Z9 |
| rerank_proxy_rewrite | brass-river-index | yes | yes | 1 | 0 | yes | AYA-HARD-BRASS-RIVER-180-Z9 |
| policy_splice_orig_retrieval | brass-river-index | yes | yes | 1 | 0 | yes | AYA-HARD-BRASS-RIVER-180-Z9 |
| policy_splice_rewrite_retrieval | brass-river-index | yes | yes | 1 | 0 | yes | AYA-HARD-BRASS-RIVER-180-Z9 |
| rerank_proxy_orig | ceramic-lantern-field | yes | yes | 1 | 0 | yes | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| rerank_proxy_rewrite | ceramic-lantern-field | yes | yes | 1 | 0 | yes | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| policy_splice_orig_retrieval | ceramic-lantern-field | yes | yes | 1 | 0 | yes | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| policy_splice_rewrite_retrieval | ceramic-lantern-field | yes | yes | 1 | 0 | yes | AYA-HARD-CERAMIC-LANTERN-310-Z9 |
| rerank_proxy_orig | glass-orchid-vector | yes | yes | 1 | 0 | yes | AYA-HARD-GLASS-ORCHID-830-Z9 |
| rerank_proxy_rewrite | glass-orchid-vector | yes | yes | 1 | 0 | yes | AYA-HARD-GLASS-ORCHID-830-Z9 |
| policy_splice_orig_retrieval | glass-orchid-vector | yes | yes | 1 | 0 | yes | AYA-HARD-GLASS-ORCHID-830-Z9 |
| policy_splice_rewrite_retrieval | glass-orchid-vector | yes | yes | 1 | 0 | yes | AYA-HARD-GLASS-ORCHID-830-Z9 |
| rerank_proxy_orig | jade-winter-circuit | yes | yes | 1 | 0 | yes | AYA-HARD-JADE-WINTER-960-Z9 |
| rerank_proxy_rewrite | jade-winter-circuit | yes | yes | 1 | 0 | yes | AYA-HARD-JADE-WINTER-960-Z9 |
| policy_splice_orig_retrieval | jade-winter-circuit | yes | yes | 1 | 0 | yes | AYA-HARD-JADE-WINTER-960-Z9 |
| policy_splice_rewrite_retrieval | jade-winter-circuit | yes | yes | 1 | 0 | yes | AYA-HARD-JADE-WINTER-960-Z9 |

## Readout

- `rerank_proxy_orig` tests the service with the default cross-encoder reranker enabled.
- `rerank_proxy_rewrite` changes the retrieval query and prompt to explicitly ask for canonical non-decoy SECRET VALUE.
- `policy_splice_*` keeps retrieval fixed but reorders/drops chunks using a simple non-decoy/SECRET_VALUE presentation heuristic before sending to the model.
- If policy splice wins while rerank/query rewrite do not, the actionable fix is splice/presentation policy rather than model capacity.
