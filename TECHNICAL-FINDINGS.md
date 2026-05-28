# Technical findings map

This is the technical core of `turboquant-cuda-bench`, organized by three distinct axes of work.

The post-N=500 governance files, especially [`STATE.md`](STATE.md) and [`CANON.md`](CANON.md), are still canonical for current claims and non-claims. But the N=500 RealRAG no-delta is one expedition, not the whole thesis of the repository.

```txt
Axis I   : KV-cache quantization fidelity   (llama.cpp / PPL / KLD / REFRACT)
Axis II  : action-trace fidelity             (KVFidelity / CASK bridge)
Axis III : runtime and kernel engineering    (vLLM cross-stack / EPKV kernels v1-v7)
```

Use this file as a technical map. Use [`README.md`](README.md) as the entry point, [`STATE.md`](STATE.md) as current governance, and [`bench/MANIFEST.md`](bench/MANIFEST.md) as the artifact status map.

## Axis I: KV-cache quantization fidelity

### Invariants across Axis I

```txt
Hardware: RTX 3090 and RTX 4090, 24 GB each.
Quality:  PPL on wikitext-2, KLD gates, and REFRACT two-axis detector.
REFRACT: GTM is the permissive token-match axis. Trajectory is the stricter generation-path axis.
Method:   cross-GPU sanity on the same config before any public readout.
```

Methodological spine:

```txt
KLD and token-match similarity do not imply generation-path preservation.
```

Across multiple runs, KLD remains high even when REFRACT Trajectory collapses. Token-match readouts can pass while decode-time trajectory has already diverged. Any `lossless` KV-cache claim measured only by KLD, BLEU, or token match is therefore under-specified.

### 1. RotorQuant planar3/iso3 vs TurboQuant turbo3

Artifacts:

- [`bench/rotorquant/results-llama8b.md`](bench/rotorquant/results-llama8b.md)
- [`bench/rotorquant/results.md`](bench/rotorquant/results.md)

RotorQuant claims improved perplexity over TurboQuant via block-diagonal rotation, with speed and KV-size claims in the originating README. This repo retested the same fork on two head dimensions.

#### Llama 3.1 8B Q4_K_M, head_dim=128

| cache type | PPL | delta vs q8_0 | K cache vs q8_0 | pp t/s vs q8_0 |
|---|---:|---:|---:|---:|
| q8_0 | 6.5980 | baseline | baseline | baseline |
| turbo3 | 6.9824 | +5.83% | -63% | -3.7% |
| planar3 | 6.9475 | +5.30% | +88% | -73.5% |
| iso3 | 6.8216 | +3.39% | +88% | -81.9% |

The PPL claim holds in this 128-dim-head regime: `iso3 < planar3 < turbo3`. The speed and memory shape do not hold in this harness: planar3/iso3 store a larger K cache than q8_0 and lose large throughput.

#### Qwen3.6-27B Q4_K_M, head_dim=256

| cache type | PPL | delta vs q8_0 | K cache vs q8_0 | pp t/s vs q8_0 |
|---|---:|---:|---:|---:|
| q8_0 | 6.1005 | baseline | baseline | baseline |
| turbo3 | 6.1507 | +0.82% | -63% | -1.5% |
| planar3 | 6.3541 | +4.16% | +88% | -38% |
| iso3 | 6.3701 | +4.42% | +88% | -50% |

The PPL advantage disappears outside the 128-dim-head regime. turbo3 becomes the better PPL and memory/throughput choice in this test.

#### Verdict

What the receipts support:

```txt
1. RotorQuant's PPL advantage appears head-dim-dependent in these tests.
2. turbo3 generalizes better across the tested head dimensions.
3. planar3/iso3 do not realize the expected compression shape in this implementation.
4. The measured throughput proxy is much worse for planar3/iso3 in this harness.
```

Boundary: the throughput columns are from the available perplexity/chunked-batch runs, not a clean standalone decode benchmark. The root-cause explanation, deferred rotation requiring a wider K buffer, is a hypothesis consistent with the artifacts, not a completed code audit.

### 2. REFRACT drift detection: the fragile axis flips with architecture

Artifacts:

- [`bench/refract-attnfix/results.md`](bench/refract-attnfix/results.md)
- [`bench/q4-hybrid-refract/results.md`](bench/q4-hybrid-refract/results.md)

REFRACT exposes which cache axis breaks first under a stricter generation-path lens.

#### Dense 27B/32B under turbo3

Dense models show V-cache fragility under turbo3. GTM can pass while Trajectory degrades or fails.

```txt
3090 27B  q8/turbo3       GTM 91.27 -> Trajectory 72.63
3090 32B  q8/turbo3       GTM 88.83 -> Trajectory 39.73
3090 32B  turbo3/turbo3   GTM 81.88 -> Trajectory 38.72
```

KLD remains high even when the path collapses, so distribution similarity alone does not catch this failure mode.

#### Hybrid/MoE 35B-A3B under q4_0

Hybrid q4_0 behaves differently. `q4_0/q4_0` looks good under GTM, but is degraded under Trajectory.

| axis | KV config | composite | band | path/GTM score | KLD |
|---|---|---:|---|---:|---:|
| Trajectory | q8/q8 | 100.00 | EXCELLENT | 100.00 | 100.00 |
| Trajectory | q4/q4 | 78.93 | DEGRADED | 65.70 | 98.81 |
| Trajectory | q8/q4 | 73.45 | DEGRADED | 58.42 | 98.90 |
| Trajectory | q4/q8 | 70.93 | DEGRADED | 55.25 | 99.03 |
| GTM | q4/q4 | 91.26 | EXCELLENT | 91.26 | n/a |

In this run, both isolated q4 K and isolated q4 V degrade under Trajectory, with K-only q4 slightly worse than V-only q4.

#### Cross-architecture readout

```txt
dense + turbo3  : V-cache is the suspicious fragile axis
hybrid + q4_0   : K-only q4 is the worse isolated axis in this run
```

Boundary: this is not a universal rule for all dense or hybrid models. It is evidence that the fragile axis depends on architecture, quantization scheme, and metric family.

### 3. sparse-V dequant skip: CUDA dispatch overhead exceeds the gain

Artifact:

- [`bench/sparse-v/results.md`](bench/sparse-v/results.md)

On CUDA, sparse-V dequant skip costs throughput at every tested depth.

| ctx | RTX 4090 delta, sparse on vs off | RTX 3090 delta |
|---:|---:|---:|
| 512 | -0.8% | -0.9% |
| 4096 | -2.8% | -0.3% |
| 8192 | -0.5% | -0.8% |
| 16384 | -0.5% | about -0.5% |

This contrasts with Metal results cited in the artifact, where sparse-V gained at longer depths. The CUDA readout is that dispatch/warp overhead exceeds the dequant-skip gain in this regime. The repo records this as primary evidence behind TheTom disabling sparse-V in PR #105.

### 4. IQ4_NL vs Q4_K_M at long context

Artifact:

- [`bench/iq4nl-repro/results.md`](bench/iq4nl-repro/results.md)

This reproduced the shape of a long-context turbo4 penalty report on SM89.

| ctx | IQ4_NL q8/turbo4 delta vs f16/f16 | Q4_K_M q8/turbo4 delta | IQ4 vs Q4_K_M |
|---:|---:|---:|---:|
| 0 | -2.2% | -3.1% | -5.0% |
| 16K | -18.0% | -19.4% | -3.4% |
| 32K | -29.6% | -31.2% | -2.9% |
| 131K | -54.1% | OOM above 32K | n/a |

IQ4_NL and Q4_K_M share the same degradation curve. The gap between weight quants is small and shrinks with context. In this run, the long-context penalty is dominated by the turbo4 KV dequant kernel rather than the weight quant.

Boundary: this does not say weight quant never matters. It says weight quant is not the main source of this long-context penalty in this measured setup.

### 5. DFlash speculative decoding

Artifacts:

- [`bench/dflash/results.md`](bench/dflash/results.md)
- [`bench/dflash/adaptive-draft-results.md`](bench/dflash/adaptive-draft-results.md)

Adaptive draft tuning on Qwen3.6-27B:

| config | accept % | effective wall-clock t/s |
|---|---:|---:|
| default `--draft-p-min 0.75` | 46.9% | 4.86 |
| fixed `--draft 16` | 62.5% | 6.24 |
| fixed `--draft 8` | 70.0% | 6.92 |
| `--draft-p-min 0.9` | 71.4% | 7.03 |

The default p-min=0.75 is the worst tested configuration. p-min=0.9 cuts each round earlier and wins in this harness. Fixed draft=8 is the robust no-tuning alternative.

The repo also records a self-correction: an earlier 25.7 t/s number was drafter standalone speed, not system effective output. The corrected effective output is about 6 to 7 t/s for these tuned configs.

Named hardware frontier:

```txt
The DFlash drafter is non-causal and requires n_ubatch >= n_prompt.
Beyond about 2K prompt tokens, the compute buffer exceeds 24 GB on a single 4090.
A proper high-depth DFlash test needs an 80 GB A100/H100-class GPU.
```

## Axis II: action-trace fidelity

Axis II asks a different question: not whether the output is plausible, but whether the system preserves the same operational trace when only a runtime/context knob changes.

When the knob is KV-cache format, the lens is KVFidelity: paired action-trace evaluation under KV/V-cache compression or runtime configuration changes.

### 6. KVFidelity same-build severity sweep

Artifact:

- [`bench-public/kvfidelity/kvfidelity-2026-05-07-summary.md`](bench-public/kvfidelity/kvfidelity-2026-05-07-summary.md)

Setup:

```txt
Model: Qwen3.6-35B-A3B
Hardware: RTX 4090
Build: fixed same build
K: q8_0 fixed
V: q8_0, turbo4, turbo3, turbo2
Scenarios: N=28 stateful/tool traces
Decoding: temp=0, seed=42
```

Control discipline is the point: same-config vs same-config is stable across the V formats. That makes cross-KV drift a meaningful signal rather than simple run-to-run noise.

Public boundary:

```txt
KVFidelity is an instrument for reading behavioral drift.
It is not a claim that KV compression globally breaks agents.
It is not a global safety ranking of turbo levels.
```

### 7. CASK x KVFidelity bridge

Artifact:

- [`bench-public/cask-kvfidelity-bridge/RESULTS.md`](bench-public/cask-kvfidelity-bridge/RESULTS.md)

Qwen3-8B CASK runtime, 120 synthetic action-router fixtures. The fixtures demand one machine-readable trace:

```txt
FINAL_ACTION=...;FINAL_TARGET=...;SOURCE_RANK=...
```

Metrics separate action, target, source rank, and exact trace identity.

| run | exact | action | target | rank |
|---|---:|---:|---:|---:|
| FullKV | 119/120 | 119/120 | 119/120 | 120/120 |
| TriAttention 512 | 0/120 | 115/120 | 0/120 | 0/120 |
| TriAttention 1024 | 0/120 | 115/120 | 0/120 | 0/120 |
| TriAttention 2048 | 119/120 | 119/120 | 119/120 | 120/120 |
| CASK 512 | 1/120 | 117/120 | 2/120 | 108/120 |
| CASK 1024 | 109/120 | 119/120 | 109/120 | 120/120 |
| CASK 2048 | 119/120 | 119/120 | 119/120 | 120/120 |

Contribution:

```txt
action fidelity can survive after payload fidelity collapses
source-rank fidelity can survive after target identity fails
budget thresholds can be sharp
```

Boundary: this is one model and one fixture family. It does not claim CASK beats TriAttention or the reverse.

## Axis III: runtime and kernel engineering

### 8. vLLM cross-stack: same prompts, convergent failure shape

Artifacts:

- [`bench-public/vllm-cross-stack/decoy-replay-results.md`](bench-public/vllm-cross-stack/decoy-replay-results.md)
- [`bench-public/vllm-cross-stack/needle-192k-results.md`](bench-public/vllm-cross-stack/needle-192k-results.md)
- [`bench-public/vllm-cross-stack/fp8-vs-turboquant-results.md`](bench-public/vllm-cross-stack/fp8-vs-turboquant-results.md)

The decoy/ranking task from the llama.cpp long-context proxy line was replayed on vLLM with the same spliced prompts.

| handle | llama.cpp 27B turbo4 | vLLM 7B V3 off | vLLM 7B V3 on |
|---|---|---|---|
| brass-river-index | wrong: `DECOY-0616-1` | wrong: `DECOY-0616-1` | wrong: `DECOY-0616-1` |
| glass-orchid-vector | wrong/refusal | wrong: `DECOY-0742-6` | wrong: `DECOY-0742-6` |
| jade-winter-circuit | wrong/refusal | wrong: `DECOY-0725-7` | wrong: `DECOY-0725-7` |
| total | 5/8 | 5/8 | 5/8 |

Three stack conditions land on the same 5/8 result and the same three failing handles. One failure gives the byte-identical wrong literal `DECOY-0616-1`.

Readout:

```txt
The failure shape is more consistent with splice-layer presentation/ranking than with model-specific reasoning.
TriAttention V3 eviction is irrelevant at this prompt size because the budget never fires.
```

Companion needle run:

```txt
128K: 5/5
160K: 5/5 with YaRN factor 6, 3/5 with exact-fit factor 5
192K: 5/5
```

The 160K outlier was traced to YaRN factor selection, not TurboQuant or context length itself.

FP8 boundary:

```txt
This repo bounds a local 7B/16K adversarial exact-match regime.
It does not refute broader FP8 claims on different model sizes or suites.
```

### 9. Evidence-Paged KV kernels v1-v7

Artifact:

- [`bench-public/evidence-paged-kv/RESULTS.md`](bench-public/evidence-paged-kv/RESULTS.md)

Evidence-Paged KV asks whether KV access can be shaped around useful evidence pages rather than only sequence position.

| version | change | honest readout |
|---|---|---|
| v1 | fused gather/page + uint8 dequant + scalar dot | overhead/control receipt |
| v2 | page x head x row-tile mapping | first page-as-execution-geometry win |
| v3 | emits attention-like score tiles | shaped scores, no value path yet |
| v4 | score tiles -> torch.topk/softmax -> custom value accum | best public end-to-end attention-like receipt |
| v5 | custom CUDA top-k/softmax | fastest at K=32, loses at naive K=128 |
| v6 | fused per-page score + local top-k, no full score materialization | correct shape, slow |
| v7 | v6 shape + warp-per-row scoring | best architectural expression |

Selected v4 numbers:

| M rows | K | PyTorch top-k/value | kernel pages score->top-k->value | readout |
|---:|---:|---:|---:|---|
| 8,192 | 32 | 1.3494 ms | 0.1485 ms | about 9.1x faster |
| 32,768 | 32 | 1.3711 ms | 0.3277 ms | about 4.2x faster |
| 131,072 | 128 | 2.9051 ms | 0.2660 ms | about 10.9x faster |

Correctness spot-checks in v4 are within single-digit e-6 max absolute error versus the PyTorch top-k pipeline.

Boundary:

```txt
These are architectural CUDA receipts.
They are not production attention.
They are not a vLLM integration.
They are not answer-quality proof.
They are not a serving-speedup claim.
```

## What this body of work supports

```txt
Axis I: KV-cache quantization fidelity
1. Hadamard/turbo3 generalizes better than planar3/iso3 across the two tested head dimensions.
2. RotorQuant's PPL edge is real in the 128-dim-head test, but did not generalize to the 256-dim-head test.
3. The planar3/iso3 implementation did not realize compression or throughput benefits in these harnesses.
4. The fragile cache axis depends on architecture, quant scheme, and metric family.
5. KLD/token-match can pass while generation trajectory has diverged.
6. On CUDA, sparse-V dequant skip is net-negative in the tested regimes.
7. Long-context turbo4 degradation is dominated by the KV dequant kernel in the IQ4_NL/Q4_K_M reproduction.
8. DFlash needs different tuning than its default and larger-memory hardware for a proper high-depth bench.

Axis II: action-trace fidelity
9. KVFidelity controls are stable enough for cross-KV action-trace drift to be real signal.
10. Fidelity decomposes into action, target, rank, and exact trace identity.

Axis III: runtime and kernel engineering
11. Cross-stack decoy failures converge across llama.cpp and vLLM in a way that points at presentation/ranking.
12. Evidence-Paged KV kernels are real architectural receipts with clear boundaries.
```

## What this body of work does not claim

```txt
- That any KV scheme is best outside the tested models, head dimensions, hardware, and harnesses.
- That turbo3 is safe for V-cache on dense models at scale.
- That REFRACT Trajectory bands map directly to downstream task accuracy.
- That single-GPU 24 GB results transfer to 80 GB serving regimes.
- That weight quant choice is irrelevant in general.
- That CASK beats TriAttention or TriAttention beats CASK globally.
- That KV compression breaks agents globally.
- That the EPKV kernels are production attention.
- That EPKV, verifier gates, or sampler control improve natural RealRAG quality.
- That the N=500 no-delta erases the Axis I, Axis II, or Axis III receipts.
```

## Directed reproductions and upstream-adjacent contributions

```txt
- RotorQuant planar3/iso3 PPL, throughput, and cache-size claims retested across head dimensions.
- llama.cpp q4_0 hybrid `lossless` style claims complemented with a Trajectory lens.
- Long-context turbo4 slowdown reproduced on SM89 after an SM86 report.
- sparse-V CUDA overhead measured and used as evidence for disabling sparse-V in CUDA.
- FP8 KV local adversarial exact-match behavior bounded against TurboQuant K8V4.
- Long-context decoy task replayed across llama.cpp and vLLM.
- Needle retrieval checked from 128K to 192K, with a YaRN factor outlier isolated.
```
