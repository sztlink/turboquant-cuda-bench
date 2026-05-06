# q4 hybrid REFRACT — Qwen3.6-35B-A3B on RTX 3090

- Captured: 2026-05-06
- Host: `felipe-pc` / RTX 3090 24GB
- Model: `C:\models\q36_35b.gguf` (~21.39 GB, Qwen3.6-35B-A3B Q4_K_M)
- Reference: `ctk=q8_0,ctv=q8_0`
- Method: TheTom's REFRACT v0.3.2.3, llama.cpp backend, Axis A Trajectory + KLD; GTM-only comparison runs.
- Raw JSON: [`data/json/`](data/json/)
- Logs: [`logs/`](logs/)

## Readout

The q4 hybrid run completed cleanly. The key result is metric divergence:

- `q4_0/q4_0` is **DEGRADED** under REFRACT Trajectory+KLD: composite 78.93, path score 65.70, KLD 98.81.
- KLD remains **EXCELLENT** for all q4 candidates (~98.8–99.0), so distribution-level closeness does not imply path preservation.
- GTM-only scores look much better: `q4_0/q4_0` = 91.26 EXCELLENT. This matches the prior pattern: GTM/token-match-style readouts can diverge from decode-time trajectory preservation.
- The K/V isolation runs are also DEGRADED under Trajectory. In this run, both isolated `q8_0/q4_0` and `q4_0/q8_0` drift, with `q4_0/q8_0` slightly worse.

This does **not** mean the original BLEU/token-match claim is "wrong". It means that under a complementary REFRACT trajectory/KLD lens, `q4_0` KV on this CUDA hybrid target does not preserve the reference generation path as cleanly as `q8_0/q8_0`.

## Primary scores — full matrix

| Axis | KV config | Composite | Band | Path/GTM score | KLD score | Full match | Median divergence | Mean prefix | JSON |
|---|---:|---:|---|---:|---:|---:|---:|---:|---|
| Trajectory | q8/q8 | 100.00 | EXCELLENT | 100.00 | 100.00 | 100.0% | — | 111.3 | [json](data/json/q4hybrid-trajectory-q8q8.json) |
| Trajectory | q4/q4 | 78.93 | DEGRADED | 65.70 | 98.81 | 53.3% | 18.5 | 72.1 | [json](data/json/q4hybrid-trajectory-q4q4.json) |
| Trajectory | q8/q4 | 73.45 | DEGRADED | 58.42 | 98.90 | 43.3% | 17 | 64.5 | [json](data/json/q4hybrid-trajectory-q8q4.json) |
| Trajectory | q4/q8 | 70.93 | DEGRADED | 55.25 | 99.03 | 36.7% | 20 | 62.8 | [json](data/json/q4hybrid-trajectory-q4q8.json) |
| GTM | q8/q8 | 100.00 | EXCELLENT | 100.00 | — | 100.0% | — | 298.8 | [json](data/json/q4hybrid-gtm-q8q8.json) |
| GTM | q4/q4 | 91.26 | EXCELLENT | 91.26 | — | 60.0% | 246 | 271.1 | [json](data/json/q4hybrid-gtm-q4q4.json) |
| GTM | q8/q4 | 92.04 | EXCELLENT | 92.04 | — | 53.3% | 257 | 275.1 | [json](data/json/q4hybrid-gtm-q8q4.json) |
| GTM | q4/q8 | 89.88 | PASS | 89.88 | — | 56.7% | 262 | 268.9 | [json](data/json/q4hybrid-gtm-q4q8.json) |

## Smoke phase

| KV config | Composite | Band | Path score | KLD score | Full match | Mean prefix | JSON |
|---:|---:|---|---:|---:|---:|---:|---|
| q8/q8 | 100.00 | EXCELLENT | 100.00 | 100.00 | 100.0% | 8.0 | [json](data/json/q4hybrid-smoke-trajectory-q8q8.json) |
| q4/q4 | 94.42 | EXCELLENT | 90.00 | 99.31 | 86.7% | 7.2 | [json](data/json/q4hybrid-smoke-trajectory-q4q4.json) |

The smoke phase passed mechanically, but was too short to be conclusive: `q4_0/q4_0` scored EXCELLENT at `n_predict=8`, then degraded in the full `n_predict=128` matrix. This supports keeping smoke as a harness check only, not as a quality result.

## Interpretation

The original upstream claim in `llama.cpp#21385` is about hybrid-model tolerance under BLEU/token-match style checks. This benchmark adds another metric family:

- **q8_0/q8_0** reference self-check: 100 under Trajectory and GTM.
- **q4_0/q4_0**: high distribution similarity (KLD 98.81) but path-preservation score 65.70.
- **q8_0/q4_0**: V-only q4 path score 58.42.
- **q4_0/q8_0**: K-only q4 path score 55.25.

In this hybrid run, K-cache q4 isolation (`q4_0/q8_0`, path 55.25) degraded slightly more than V-cache q4 isolation (`q8_0/q4_0`, path 58.42). That differs from the dense-model attn-fix run, where V-cache `turbo3` was the primary drift axis.

Practical takeaway:

> On Qwen3.6-35B-A3B Q4_K_M / RTX 3090, `q4_0` KV remains close under KLD but does not preserve the `q8_0/q8_0` generation trajectory in REFRACT's full 128-token run.

## Artifact paths

- CSV: [`results.csv`](results.csv)
- Chart: [`charts/q4-hybrid-refract.svg`](charts/q4-hybrid-refract.svg)
- JSON: [`data/json/`](data/json/)
- Logs: [`logs/`](logs/)
