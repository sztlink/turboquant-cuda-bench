# Receipt template for any future megakernel run

Do not run this without explicit infra authorization.

## Header

```txt
title:
date:
repo_commit:
runtime:
model:
gpu:
mode_requested:
mode_executed:
serving_mutated: yes/no
fail_open_enabled: yes/no
```

## Claim

One sentence only.

Allowed forms:

```txt
This run validates dispatcher correctness under observe_only.
This run validates compact fallback correctness on an offline fixture.
This run tests answer-from-selected-chain quality against path_prompt.
```

Forbidden forms:

```txt
This proves EPKV improves RAG.
This is production attention.
This is a serving speedup.
This beats PagedAttention or FlashAttention.
```

## Gates

| gate | required value | observed |
|---|---|---|
| quality gate exists before runtime mutation | yes | |
| fail-open enabled | yes | |
| original attention fallback tested | yes | |
| correctness reference present | yes | |
| temp memory measured | yes | |
| p50 and p90 latency measured | yes | |
| fallback distribution measured | yes | |
| no gold answer in operational detector | yes | |

## Quality comparison

Required if any model answer is generated:

| condition | EM | contains | F1 | refusals | notes |
|---|---:|---:|---:|---:|---|
| path_prompt baseline | | | | | |
| answer_from_selected_chain | | | | | |
| runtime intervention | | | | | |

Pairwise movement:

```txt
wins:
losses:
ties:
```

## Runtime comparison

Required if any kernel path is timed:

| mode | p50 ms | p90 ms | temp bytes | max abs err vs reference | fallback rate |
|---|---:|---:|---:|---:|---:|
| original/reference | | | | | |
| probe_only | | | | | |
| compact_fallback | | | | | |
| exact_only | | | | | |

## Dispatcher telemetry

Summarize:

```txt
row_count:
page_count:
flagged_head_rate:
flagged_chunk_rate:
fail_open_count:
fail_open_reasons:
latency_watchdog_count:
```

## Decision

Choose one:

```txt
promote_to_next_offline_fixture
repeat_after_fix
stop_megakernel_lane
safe_to_attempt_observe_only_runtime_contact
```

## Non-claims

Always include:

```txt
This is not production attention.
This is not a serving speedup claim.
This is not evidence that EPKV improves natural RealRAG quality unless the quality table passes its gate.
```
