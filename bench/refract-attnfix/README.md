# REFRACT attn-fix — GTM vs Trajectory

CUDA rerun of REFRACT after the TurboQuant attention fix.

## Main files

- [`results.md`](results.md) — full writeup and tables
- [`refract-attnfix-final.csv`](refract-attnfix-final.csv) — normalized score table
- [`charts/refract-attnfix-final-chart.png`](charts/refract-attnfix-final-chart.png) — publication chart
- [`data/3090-attnfix/`](data/3090-attnfix/) — 3090 JSON reports, 27B + 32B
- [`data/4090-attnfix/`](data/4090-attnfix/) — 4090 JSON reports, 27B cross-GPU sanity

## Published discussion

- GitHub discussion: https://github.com/ggml-org/llama.cpp/discussions/20969#discussioncomment-16822042
- X thread: https://x.com/sztlink/status/2051817370117619967

## Short finding

GTM remains permissive for `ctv=turbo3`, while Trajectory catches generation-path drift. The effect is stable across 3090/4090 at 27B and amplifies strongly at 32B.
