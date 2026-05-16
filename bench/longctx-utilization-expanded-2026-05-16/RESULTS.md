# Longctx utilization expanded n=24 — RESULTS

Date: 2026-05-16
Status: staging / synthetic sanitized

## Aggregate

| arm | hits/runs | retrieval hits | errors | used rerank | mean rank | mean decoys before | mean elapsed |
|---|---:|---:|---:|---:|---:|---:|---:|
| baseline_proxy | 9/24 | 19/24 | 0 | 0/24 | 7.1 | 6.1 | 2.2 s |
| anti_decoy_proxy | 9/24 | 19/24 | 0 | 0/24 | 7.1 | 6.1 | 2.4 s |
| filtered_splice | 19/24 | 19/24 | 0 | 0/24 | 7.1 | 6.1 | 1.5 s |

## Readout

- Larger synthetic fixture, 24 targets.
- Compares baseline proxy, anti-decoy prompt, and filtered splice.
- Rerank proxy was deliberately skipped because the rerank path hung in a separate smoke; fix separately before mixing into this package.
- Synthetic staging confirmation: useful for methodology, not a public benchmark claim.

## Files

- `sanitized-summary.json`
- `summary.parsed.json`
- `remote-llama-server-preflight.json`
- `run.log`
- raw/retrieve/debug logs remain local staging.
