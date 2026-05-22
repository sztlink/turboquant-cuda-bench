# EPKV / RealRAG — 12h autonomous sprint plan

Start intent: run goal-mode, runtime-first, no paper-loop.

## North star

Make vLLM evidence-aware in a way that changes decode usefully on real RAG cases.

Current falsified hypotheses:

```txt
page selection alone is enough          -> false
token-row selection alone is enough     -> false
answer-token value replacement is enough -> false
```

Current live fact:

```txt
KV/value interventions are live: they deform outputs.
But semantic closure still collapses to first-hop tokens.
```

Therefore the sprint target is:

```txt
move from KV selection/value-mix to LM-head-facing evidence control
```

## Guardrails

Allowed without stopping:

- experimental vLLM patch
- VLLM-AutoStart restart
- dry-run and non-dry trace
- service restore
- commit/push concrete runtime artifacts
- Discord/read-only checks if needed

Stop/wake only for:

- service cannot be restored
- 3 failures in same operation
- broad infra changes outside 4090/vLLM scope
- deletes/credentials/financial/irreversible
- result milestone requiring Felipe taste/decision

End state must include:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
commits pushed
RESULTS.md updated
memory written
```

## Phase 0 — sprint boot / safety rails (0:00–0:30)

- Record current git status and latest commits.
- Snapshot remote hook file backup path.
- Confirm 4090 `/health` and `VLLM_EPKV_RUNTIME_HOOK=0`.
- Create tmux/watch log if running unattended.

Deliverable:

```txt
bench/epkv-live-probe-v0-2026-05-21/sprint-12h/logs/boot.json
```

## Phase 1 — locate LM-head/logit interception point (0:30–2:00)

Goal: find the closest safe place to trace logits/token ids without invasive vLLM surgery.

Search targets in remote vLLM tree:

```txt
sampler
logits_processor
model_runner
sample_next_token
LogprobsProcessor
```

Implement minimal default-off trace if feasible:

```txt
VLLM_EPKV_LOGIT_TRACE=1
VLLM_EPKV_LOGIT_TRACE_TOPK=20
VLLM_EPKV_LOGIT_TRACE_TOKEN_IDS=<comma ids>
```

Trace only:

- generated step index
- top-k token ids / decoded strings when safe
- score/rank for gold answer tokens
- request tag

No prompt text or credentials.

Deliverable:

```txt
07-scripts/vllm-hook/... logit trace patch or scout note
bench/.../logit-trace-scout/RESULTS.md
```

Decision:

- If vLLM logit hook is easy: patch and run.
- If hard: build OpenAI API logprobs harness first and continue to Phase 2.

## Phase 2 — API-level logprob harness (2:00–3:30)

Goal: before patching LM head, measure whether endpoint exposes useful logprobs/token ids.

For adversarial case 2:

```txt
baseline output: Armando Bo -> Víctor Bó
bad intervention output: Armando Bo
gold object: Víctor Bó
```

Run:

```txt
baseline logprobs/top_logprobs
page boost logprobs
token guard logprobs
answer-token value replace logprobs
start_call variants logprobs
```

Capture:

- first generated token
- top candidate strings
- whether `Víctor`/`Victor`/`Bó` appears in top-k
- whether interventions suppress or never expose it

Deliverable:

```txt
bench/.../logprob-harness/summary.json
bench/.../logprob-harness/RESULTS.md
```

## Phase 3 — hidden/logit-facing runtime patch (3:30–6:30)

Depending on Phase 1/2:

### Path A — safe internal logits hook found

Patch default-off intervention:

```txt
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=<ids>
VLLM_EPKV_LOGIT_BIAS=<float>
VLLM_EPKV_LOGIT_BIAS_STEPS=0-2
VLLM_EPKV_LOGIT_BIAS_TAG=<tag>
```

Use this only as a diagnostic bridge, not as final product.

Purpose:

```txt
prove the output can be redirected at decode policy layer
```

### Path B — internal hook too risky

Build external OpenAI-compatible diagnostic harness with constrained decoding / logit_bias if vLLM supports it. If not supported, produce exact patch plan and move to Phase 4.

Deliverable:

```txt
logit-bias patch + non-dry trace OR precise blocker note
```

## Phase 4 — controlled non-dry experiments (6:30–9:00)

Run on small, real set:

- adversarial case 1: English
- adversarial case 2: Víctor Bó
- 2Wiki original case 2
- 2Wiki original case 3

Conditions:

```txt
baseline
best KV-only condition
logit/hidden diagnostic condition
KV + logit/hidden condition
```

Metrics:

- output text
- closure exact/normalized
- first token drift
- evidence token hit rate
- logit rank of gold tokens if available
- service health after each batch

Deliverable:

```txt
bench/.../decode-policy-sweep/summary.json
bench/.../decode-policy-sweep/RESULTS.md
```

## Phase 5 — consolidate into next runtime design (9:00–10:30)

If logit/hidden patch works:

- promote from diagnostic token bias to evidence-derived bias:
  - derive candidate answer token ids from support span;
  - apply only at early decode steps;
  - compare against raw gold-token oracle.

If it fails:

- identify exact failure layer:
  - logits never expose answer;
  - output parser/template suppresses answer;
  - attention output already collapsed;
  - tokenization issue.

Deliverable:

```txt
bench/.../DECODE-POLICY-DESIGN.md
```

## Phase 6 — commit/push + restore + morning report (10:30–12:00)

- Restore vLLM:

```txt
VLLM_EPKV_RUNTIME_HOOK=0
/health OK
```

- Commit/push only concrete runtime/harness/results.
- Write memory.
- Prepare concise morning report:

```txt
what changed
what worked
what failed
where exactly it failed
what Felipe needs to decide/help with
next command to resume
```

## Success criteria

Minimum success:

```txt
logprob/logit visibility achieved + concrete trace explains why `Víctor Bó` loses
```

Strong success:

```txt
non-dry diagnostic logit/hidden intervention flips at least one adversarial case back to correct answer
```

Excellent success:

```txt
evidence-derived candidate token policy improves real records without hardcoding gold answer
```

## Do-not-do list

- Do not build R9/R10 paper eval loops.
- Do not create more human calibration sheets.
- Do not spend the night on README/public framing.
- Do not chase large dataset stats before the live decode mechanism is understood.
- Do not leave vLLM experimental at the end.
