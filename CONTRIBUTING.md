# Contributing

Thanks for reading or reproducing `turboquant-cuda-bench`.

This repo is a research archive, not a benchmark leaderboard. Contributions are most useful when they preserve provenance, exact commands, model/runtime versions, and failure cases.

## Best ways to contribute

### 1. Ask questions or suggest tests

Use GitHub Discussions for:

- benchmark ideas;
- reproduction attempts;
- interpretation questions;
- requests for clearer public summaries or charts.

Start here: [Welcome & Feedback thread](https://github.com/sztlink/turboquant-cuda-bench/discussions/2)

### 2. Report broken files or scripts

Use Issues for concrete problems:

- broken links;
- scripts that no longer run;
- missing artifact references;
- unclear reproduction steps;
- mistakes in tables or copied numbers.

Please include:

```txt
OS / GPU:
CUDA / driver:
Runtime: llama.cpp / vLLM / other
Model:
Command or script:
Observed result:
Expected result:
Relevant log excerpt:
```

### 3. Submit a reproduction receipt

A good receipt includes:

- exact commit or package version;
- model name and quantization;
- GPU and driver;
- context length / KV dtype / runtime flags;
- prompt fixture or public dataset pointer;
- raw output or sanitized aggregate;
- a short interpretation boundary.

Please avoid claiming global model rankings from a narrow fixture. Most packages here are designed to isolate one failure mode.

## Public-safe boundary

Do not submit private prompts, API keys, secrets, production logs, personal data, or proprietary corpora.

Prefer synthetic fixtures, sanitized aggregates, or minimal reproductions.

## Repo structure for contributors

- `bench-public/` - public-safe summaries and visual assets.
- `bench/` - benchmark packages and receipts.
- `07-scripts/` - scripts that generate or transform artifacts.
- `06-publicable/` - narrative/public-facing artifacts.
- `02-raw/`, `03-lab/`, `04-processed/` - provenance and research internals; avoid adding here unless the artifact needs traceability.

## Style

- Keep claims narrow.
- Include numbers and denominators.
- Separate retrieval, answer closure, action fidelity, target fidelity, and source-rank fidelity when possible.
- Prefer reproducible receipts over broad conclusions.
