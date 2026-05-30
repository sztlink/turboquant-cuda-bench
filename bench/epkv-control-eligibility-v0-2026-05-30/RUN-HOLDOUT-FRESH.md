# Fresh holdout runbook - Option B frozen detector

Status: prepared, not run yet.

Reason: the current vLLM endpoint health check returned connection reset, and starting/restarting the 4090 service is an infra action requiring Felipe confirmation.

## Holdout target

```txt
dataset: local 2Wiki dev compositional/inference slice
offset: 500
limit: 100
purpose: validate frozen Option B detector on rows not used in N=500 detector redesign
```

## Output layout

```txt
bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/
  entity-hop-llm/summary.json
  entity-hop-answer-rerank/summary.json
  taxonomy/holdout-taxonomy-all.jsonl
  taxonomy/holdout-autopsy-summary.json
  option-b-holdout-summary.json
  option-b-holdout-receipts.jsonl
  option-b-holdout-shadow-run.md
```

## Commands

Run entity-hop path/strong prompts on fresh offset:

```bash
python3 07-scripts/vllm-hook/epkv-entity-hop-retrieval.py \
  --out-dir bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm \
  --limit 100 \
  --offset 500 \
  --top-k 10 \
  --bm25-first 12 \
  --seed-top 3 \
  --second-per-mention 1 \
  --max-seed-expansions 4 \
  --max-doc-mentions 5 \
  --pool-limit 80 \
  --max-tokens 32 \
  --doc-chars 700 \
  --timeout 120 \
  --skip-bge \
  --skip-extract \
  --disable-ecd
```

Run verifier/rerank only on path/strong disagreements:

```bash
python3 07-scripts/vllm-hook/epkv-entity-hop-answer-rerank.py \
  --summary bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm/summary.json \
  --responses-dir bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm/responses \
  --out-dir bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-answer-rerank \
  --limit 100 \
  --offset 0 \
  --only-disagreements \
  --max-candidates 12 \
  --max-tokens 128 \
  --timeout 120
```

Build posthoc taxonomy for holdout:

```bash
node bench/epkv-control-eligibility-v0-2026-05-30/build-n500-autopsy.mjs \
  --llm-summary bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm/summary.json \
  --gated-summary bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-answer-rerank/summary.json \
  --out-dir bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/taxonomy \
  --prefix holdout
```

Run frozen Option B detector on holdout:

```bash
node bench/epkv-control-eligibility-v0-2026-05-30/build-option-b-shadow.mjs \
  --run-id epkv-control-eligibility-option-b-holdout-offset500-n100-2026-05-30 \
  --output-prefix option-b-holdout \
  --out-dir bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100 \
  --llm-summary bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm/summary.json \
  --gated-summary bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-answer-rerank/summary.json \
  --taxonomy bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/taxonomy/holdout-taxonomy-all.jsonl
```

## Decision rule after holdout

Close gated control for now if any hold:

```txt
eligible_count < 5
EM losses > 0
EM wins < 3
eligible rows dominated by retrieval/path-limited labels
bootstrap lower bound < 0
```

Allow one final Option C only if all hold:

```txt
eligible_count >= 5
EM losses == 0
EM wins >= 3
eligible slice remains repair-heavy or clearly detectable
fresh holdout result is not worse than inspected N=500 by more than one win
Option C uses genuinely new stored signals, not another string heuristic variant
```
