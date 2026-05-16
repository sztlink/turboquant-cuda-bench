# Longctx utilization overnight — RESULTS

Date: 2026-05-16
Status: sanitized canonical summary

## Thesis tested

```txt
Retrieval is not utilization.
A retrieved chunk is not a used chunk.
```

The rerun tested whether canonical evidence merely appearing in context is enough for answer closure under decoy pressure.

## Project A — decoy isolation rerun

Source:

```txt
sanitized-overnight-summary.json
project-a-isolation/summary.parsed.json
```

| arm | runs | retrieval hits | final hits | errors | reading |
|---|---:|---:|---:|---:|---|
| baseline_proxy | 8 | 8/8 | 5/8 | 0 | evidence present, closure failed on 3 |
| anti_decoy_proxy | 8 | 8/8 | 5/8 | 0 | stronger prompt did not close the gap |
| filtered_splice | 8 | 8/8 | 8/8 | 0 | evidence elevation closed the gap |
| oracle | 8 | 8/8 | 8/8 | 0 | isolated canonical shard closed the gap |

Readout:

```txt
Prompting alone did not fix it. Evidence placement did.
```

The important observation is not just the 5/8 baseline. It is the separation between:

- retrieval: canonical span entered the context in 8/8 cases;
- utilization/closure: final answer used the canonical span only 5/8 times until evidence was elevated.

## Project B — targeted resolution rerun

Source:

```txt
sanitized-resolution-summary.json
project-b-resolution/summary.parsed.json
```

| arm | runs | retrieval hits | final hits | used rerank | mean rank | mean decoys before |
|---|---:|---:|---:|---:|---:|---:|
| rerank_proxy_orig | 4 | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 |
| rerank_proxy_rewrite | 4 | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 |
| policy_splice_orig_retrieval | 4 | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 |
| policy_splice_rewrite_retrieval | 4 | 4/4 | 4/4 | 4/4 | 1.0 | 0.0 |

Readout:

```txt
With reranker active, the canonical span reached rank 1 with no decoy before it, and closure recovered 4/4 on the targeted subset.
```

## Combined interpretation

The overnight runs strengthen the publication-safe claim:

```txt
Retrieval was not the bottleneck on this fixture. Canonical evidence reached context in all cases. Baseline closure failed on 3/8. Anti-decoy prompting alone remained 5/8. Filtered splice and oracle closed 8/8. On the targeted hard subset, reranking moved canonical evidence to rank 1 and closed 4/4.
```

Operationally, the failure mode is better described as an **evidence-position / utilization** failure than a recall failure.

## Caveats

- Synthetic decoy fixture, not a broad RAG benchmark.
- Single local runtime family for this overnight rerun.
- Small n: 8 handles for isolation, 4 handles for targeted resolution.
- Discovery/retention/closure labels are extractor-derived, not human validation.
- Do not infer any broad TurboQuant, CASK, FP8, or model-quality claim from this package.

## Public phrasing

Safe short form:

```txt
A retrieved chunk is not a used chunk. In this long-context decoy fixture, canonical evidence reached context 8/8 times, but baseline answers closed only 5/8. Prompting alone did not fix it. Evidence elevation did.
```
