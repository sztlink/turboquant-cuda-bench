---
id: 2026-05-13-cask-aime24-n30-trace-atlas
date: 2026-05-13
status: canonical-local-slice
question: "Can CASK/AIME24 outputs be read through a KVFidelity lens that separates discovery, retention, and closure?"
model: Qwen3-8B
dataset: AIME24 first 30 problems
hardware: RTX 4090 via Windows WSL2 Ubuntu-24.04
runtime_path: "AYA2 nohup ssh -> Windows sshd -> wsl.exe -> bash"
raw_logs: "../../../02-raw/benchmarks/cask/2026-05-13-aime24-n30/"
processed: "../../../04-processed/kvfidelity/2026-05-13-aime24-n30/"
analysis: "../../../05-analysis/kvfidelity/2026-05-15-trace-atlas-lab-note-v2.md"
publicable: "../../../06-publicable/kvfidelity/2026-05-trace-atlas-v4/"
scripts: "../../../07-scripts/kvfidelity/"
---

# Experiment: CASK AIME24 n=30 → KVFidelity Trace Atlas

## Hypothesis

Final-answer accuracy hides trajectory-level behavior. A trace lens can distinguish:

- discovery: the normalized ground-truth answer appears somewhere;
- retention: it remains near final/answer-marker regions;
- closure: the evaluator-visible final answer is correct.

## Operational result

The 4090 runtime path was fixed by abandoning `systemd-service-inside-WSL standalone` and using AYA2-anchored SSH/WLS execution.

## Empirical result

At `max_new_tokens=4096`, FullKV discovered 11/30, retained 10/30, and closed 4/30. Compressed runs discovered fewer answers under budgets 256/384/512 and did not separate CASK cleanly from TriAttention in this slice.

## Caveats

- n=30 only;
- Qwen3-8B only;
- single order / single run;
- Discovery/Retention are regex/extractor-derived;
- AIME numeric answers can produce incidental matches;
- TriAttention used packaged stats fallback `for_aime25_experiment/qwen3_8b.pt`, possibly suboptimal for AIME24;
- budgets 256/384/512 only.

## Canonical outputs

- Lab note: `05-analysis/kvfidelity/2026-05-15-trace-atlas-lab-note-v2.md`
- Atlas: `06-publicable/kvfidelity/2026-05-trace-atlas-v4/`
- Trace JSONL: `04-processed/kvfidelity/2026-05-13-aime24-n30/traces.jsonl`
