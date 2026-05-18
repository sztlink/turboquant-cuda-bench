# Evidence-utilization phase package — 2026-05-17

Status: sanitized material package.

This package consolidates four synthetic long-context evidence-utilization sweeps. The fixture asks whether canonical evidence that is available in context becomes the final answer under competing evidence.

## Headline

```txt
Retrieval depth was not the main bottleneck in these fixtures.
Answer closure was dominated by evidence competition:
canonical rank, decoys-before, and distractor type.
Prompt scaffolding did not reliably fix the failure mode.
```

## Runs

| sweep | runs | hits | errors |
|---|---:|---:|---:|
| phase diagram | 1200 | 743/1200 (61.9%) | 0 |
| depth sweep | 3840 | 3022/3840 (78.7%) | 0 |
| prompt scaffold | 3456 | 2532/3456 (73.3%) | 0 |
| distractor taxonomy | 2880 | 1605/2880 (55.7%) | 0 |

Total across promoted aggregates:

```txt
runs: 11376
hits: 7902/11376 (69.5%)
errors: 0
```

## 1. Phase diagram

From `phase/RESULTS.md`:

```txt
runs: 1200
hits: 743/1200 (61.9%)
errors: 0
```

By canonical rank:

| rank | hits/runs | wrong decoy |
| ---: | ---: | ---: |
| 1 | 75/80 (93.8%) | 0 |
| 2 | 144/160 (90.0%) | 15 |
| 4 | 174/240 (72.5%) | 27 |
| 8 | 195/320 (60.9%) | 42 |
| 16 | 155/400 (38.8%) | 84 |

By decoys before canonical evidence:

| decoys before | hits/runs | wrong decoy |
| ---: | ---: | ---: |
| 0 | 380/400 (95.0%) | 0 |
| 1 | 186/320 (58.1%) | 102 |
| 3 | 117/240 (48.8%) | 40 |
| 7 | 43/160 (26.9%) | 26 |
| 15 | 17/80 (21.3%) | 0 |

## 2. Depth sweep

Depth increased latency but did not materially reduce closure in this fixture.

| depth chars | hits/runs | wrong decoy | mean elapsed |
| ---: | ---: | ---: | ---: |
| 20000 | 985/1280 (77.0%) | 4 | 1.1s |
| 80000 | 1012/1280 (79.1%) | 3 | 2.1s |
| 160000 | 1025/1280 (80.1%) | 8 | 3.6s |

## 3. Prompt scaffold sweep

The simple baseline prompt outperformed more explicit prompt scaffolds in this run.

| prompt | hits/runs | wrong decoy | mean elapsed |
| --- | ---: | ---: | ---: |
| baseline | 746/864 (86.3%) | 1 | 2.2s |
| negative | 605/864 (70.0%) | 0 | 2.2s |
| positive | 597/864 (69.1%) | 0 | 2.2s |
| structured | 584/864 (67.6%) | 5 | 2.2s |

Rank and local competition still dominated:

| rank | hits/runs | wrong decoy |
| ---: | ---: | ---: |
| 1 | 854/864 (98.8%) | 0 |
| 4 | 681/864 (78.8%) | 6 |
| 8 | 622/864 (72.0%) | 0 |
| 16 | 375/864 (43.4%) | 0 |

## 4. Distractor taxonomy

Unrelated noise was much easier than stale records, near-duplicates, or conflicting correction-like records.

| distractor | hits/runs | wrong distractor | mean elapsed |
| --- | ---: | ---: | ---: |
| unrelated_noise | 485/576 (84.2%) | 0 | 1.5s |
| explicit_decoy | 335/576 (58.2%) | 8 | 1.6s |
| conflicting_correction | 312/576 (54.2%) | 221 | 1.6s |
| near_duplicate | 265/576 (46.0%) | 137 | 1.6s |
| stale_record | 208/576 (36.1%) | 347 | 1.6s |

Rank remained decisive under the taxonomy sweep:

| rank | hits/runs | wrong distractor |
| ---: | ---: | ---: |
| 1 | 712/720 (98.9%) | 3 |
| 4 | 401/720 (55.7%) | 188 |
| 8 | 325/720 (45.1%) | 213 |
| 16 | 167/720 (23.2%) | 309 |

## Privacy / publication boundary

- Fixtures are synthetic.
- Raw per-request `summary.jsonl` files and raw prompt/answer traces are intentionally not included in this package.
- Aggregates, scripts, and compact results are included.
- This is not a leaderboard, not a global model claim, and not a claim that TheTom's `longctx-svc` is broken.

## Safe claim

```txt
A retrieved chunk is not necessarily a used chunk.
In synthetic decoy-heavy fixtures, answer closure was more sensitive
to canonical rank, decoys-before, and distractor type than to raw context depth.
Prompting harder did not reliably fix the failure mode.
```
