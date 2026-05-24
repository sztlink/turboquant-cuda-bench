# Kernel map — TurboQuant CUDA entry, week 1

Date: 2026-05-24  
Scope: map first, no patch. 3090 is busy with the long AIME run; do not launch CUDA jobs there. 4090 is available for the next profiling pass, but this document only reads code.

## Source snapshot

| repo | path inspected | ref |
|---|---|---|
| TheTom TurboQuant+ docs/prototype | `/tmp/pi-github-repos/TheTom/turboquant_plus` | `c46f6b9` |
| TheTom llama.cpp fork | `/tmp/pi-github-repos/TheTom/llama-cpp-turboquant` | branch `feature/turboquant-kv-cache`, commit `2cbfdc6` |

The CUDA kernel work lives primarily in the llama.cpp fork, not the Python `turboquant_plus` prototype. The Python repo is still useful as the algorithm/spec layer: PolarQuant, WHT, Lloyd-Max codebooks, REFRACT quality harness, and documentation.

## Mental model

TurboQuant CUDA touches two different surfaces:

1. **KV-cache runtime types**: `GGML_TYPE_TURBO2_0`, `GGML_TYPE_TURBO3_0`, `GGML_TYPE_TURBO4_0`.
   - Activated by `-ctk/-ctv turbo*` or `--cache-type-k/--cache-type-v turbo*`.
   - Hot path is attention over K/V cache.
   - Primary files: `set-rows.cu`, `fattn-vec.cuh`, `dequantize.cuh`, `turbo-wht.cu`, `turbo-quant.cuh`.
2. **TQ weight types**: `GGML_TYPE_TQ3_1S`, `GGML_TYPE_TQ4_1S`.
   - Activated by loading/quantizing a model with TQ weight type.
   - Hot path is matrix multiply / conversion.
   - Primary file: `mmvq-tq.cu`, plus `convert.cu` and `dequantize.cuh`.

Do not conflate these. KV turbo and weight TQ share WHT/codebook vocabulary but hit different tensors, dispatch paths and quality risks.

## CUDA kernel inventory

### Type definitions and registration

| file | role | notes / risk |
|---|---|---|
| `ggml/include/ggml.h` | Adds `GGML_TYPE_TURBO2_0`, `TURBO3_0`, `TURBO4_0`, `TQ3_1S`, `TQ4_1S`; adds `GGML_OP_TURBO_WHT`. | Public type surface. Any enum mismatch breaks model/cache interpretation. |
| `ggml/src/ggml-common.h` | Defines block layouts: `block_turbo2_0`, `block_turbo3_0`, `block_turbo4_0`, `block_tq3_1s`, `block_tq4_1s`. | Size/layout is sacred. Receipts should record block size and compression claim. |
| `ggml/src/ggml.c` | Type traits and CPU quant/dequant registration. | If type traits disagree with CUDA kernels, symptoms appear as wrong memory size or silent quality loss. |
| `common/arg.cpp` | CLI exposes cache types. | User-facing activation path. |

### KV write / quantize path (`SET_ROWS`)

| file/function | tensor touched | what it does | activation | quality risk | perf risk |
|---|---|---|---|---|---|
| `ggml/src/ggml-cuda/set-rows.cu::k_set_rows_turbo3` | K or V cache row, f32 input → `block_turbo3_0` output | One CUDA block per 64/128-element group. Loads f32, optional InnerQ scale, L2 norm, WHT, 3-bit Lloyd-Max index, pack low 2 bits + sign bit, corrected norm. | `-ctk turbo3` or `-ctv turbo3` when CUDA backend handles `GGML_OP_SET_ROWS`. | K compression can break attention routing; tail/non-128 head dims must preserve dot-product space. | Shared-memory WHT + many syncs; packing path uses shuffles/ballot; occupancy and register pressure likely matter on SM86/SM89. |
| `set-rows.cu::k_set_rows_turbo2` | K/V cache row → `block_turbo2_0` | Same as turbo3 but 2-bit centroids, no sign byte. | `turbo2` cache. | More aggressive compression; likely only safe for V/asymmetric or boundary-layer use. | Similar WHT cost with lower bandwidth output; may or may not repay dequant overhead. |
| `set-rows.cu::k_set_rows_turbo4` | K/V cache row → `block_turbo4_0` | 128-element group, WHT, 4-bit centroid, nibble packing, corrected norm. | `turbo4` cache. | Quality better than turbo3, but K compression still model/weight-quant sensitive. | More bytes than turbo3; simpler nibble path may decode faster. |
| `set-rows.cu::*_tail` | non-full WHT groups | Direct quantization without WHT for tail groups. | Non-128/64 aligned head dims. | Tail space must match graph-side Q handling; easy place for head-dim bugs. | Small, but can hide correctness edge cases. |
| `set-rows.cu::ggml_cuda_op_set_rows` | dispatch | Chooses turbo vs generic set rows. | Backend dispatch. | Wrong dispatch silently disables turbo or writes wrong block type. | Compile/dispatch feature flags affect reproducibility. |

### WHT graph operation

| file/function | tensor touched | what it does | activation | quality risk | perf risk |
|---|---|---|---|---|---|
| `ggml/src/ggml-cuda/turbo-wht.cu::k_turbo_wht_f32` | f32 tensor, usually Q/V graph-side rotation/unrotation | One block per group, 32/64/128 threads, shared-memory WHT with sign arrays; optional InnerQ `scale_inv`. | `GGML_OP_TURBO_WHT` inserted by llama graph when turbo K/V requires query rotation or V unrotation. | Direction/sign mismatch breaks dot-product equivalence. InnerQ scaling must be paired correctly. | Shared-memory sync-heavy but simple. Good first target for Nsight occupancy/bandwidth sanity, not for heroic optimization. |
| `turbo-wht.cu::k_turbo_wht_copy_tail` | tail elements | Identity pass-through for head-dim tails. | Non-divisible head dims. | Tail mismatch with `set_rows` tail logic. | Low. |
| `ggml/src/ggml-cuda/turbo-quant.cuh::turbo_fwht_*` | device helpers | Inline FWHT helpers and sign arrays, centroids, nearest-centroid functions, InnerQ device globals. | Included by CUDA files. | Constants are quality-critical. Any centroid/sign change requires KLD/PPL receipt. | Constant memory / branch chain lookup may matter for hot K/V dequant. |

### Attention / decode path

| file/function | tensor touched | what it does | activation | quality risk | perf risk |
|---|---|---|---|---|---|
| `ggml/src/ggml-cuda/fattn-vec.cuh::flash_attn_ext_vec` | Q, K cache, V cache → attention output | Flash-attn vector kernel. Has special handling for `TURBO2/3/4` K and V. | `-fa on` plus compiled `GGML_CUDA_FA_ALL_QUANTS` or selected template instances. | This is the main correctness surface: K score, softmax, V aggregation. | Main hot path. Turbo K scoring is scalar extraction/LUT; turbo V dequant uses scaled centroid buffers; V sparse skip currently compiled out for turbo. |
| `fattn-vec.cuh` shared `turbo_lut` | K scoring | For turbo3/turbo2 K, precomputes `Q[d] * centroid[c]` in shared memory for `D <= 256`; turbo4 excluded due to shmem budget. | turbo K with `ncols == 1`. | LUT precision uses half; K score error feeds softmax. | Bank conflicts mitigated by stride `n_centroids+1`; needs profiling on SM89. |
| `fattn-vec.cuh` turbo V path | V aggregation | Precomputes `centroid * norm` per block, extracts packed indices, accumulates VKQ. | turbo V. | V compression appears more forgiving, but output drift still needs KLD/answer gates. | Candidate hot spot: scalar byte extraction and register pressure. |
| `ggml/src/ggml-cuda/template-instances/fattn-vec-instance-*.cu` | build/dispatch | Explicit K/V type combinations: turbo↔turbo, q8↔turbo, f16↔turbo, etc. | CMake selects all or subset. | Missing instance = fallback/unsupported path. | Compile time and binary size; feature flag affects run reproducibility. |

### Generic dequant / conversion path

| file/function | tensor touched | what it does | activation | quality risk | perf risk |
|---|---|---|---|---|---|
| `ggml/src/ggml-cuda/dequantize.cuh::dequantize_turbo{2,3,4}_0` | `block_turbo*` → `float2` | Inline dequant helpers using norm + centroid extraction. | Generic dequant consumers, conversion, non-special attention paths. | Element extraction must match packing exactly. | Scalar; likely slower than specialized attention path. |
| `ggml/src/ggml-cuda/convert.cu` turbo cases | quant block → f16/f32 | Dispatches continuous and non-contiguous dequant. | `to_fp16`, debug/conversion/fallback paths. | Good place to catch packing bugs with small deterministic tests. | Cold/medium path except when used for prefill conversions. |
| `convert.cu::k_dequantize_tq4_1s_warp` | TQ4_1S weight block → f16/f32 | Warp-cooperative inverse WHT for TQ4 weight type. | TQ weight conversion. | Weight dequant correctness. | Useful profiler target if TQ weights become a focus. |

### TQ weight kernels

| file/function | tensor touched | what it does | activation | quality risk | perf risk |
|---|---|---|---|---|---|
| `ggml/src/ggml-cuda/mmvq-tq.cu::tq_prerotate_q8_1` | activation f32 → q8_1 | Applies 32-point WHT/signs then quantizes activations for DP4A path. | TQ4_1S NVIDIA path. | Wrong activation rotation breaks all matmul outputs. | Warp-shuffle WHT; likely okay but should be profiled in decode. |
| `mmvq-tq.cu::tq4_cents8_reg` | packed TQ4 weight bytes | Register-only centroid lookup to int8 packs for DP4A. | TQ4_1S NVIDIA DP4A. | Byte perm/nibble bug = silent wrong logits. | Critical microkernel; good candidate for unit vectors/golden tests. |
| `mmvq-tq.cu::mul_mat_tq4_1s_dp4a_multi` | TQ4_1S weights × q8_1 activations | Multi-token DP4A matvec/matmul up to 8 columns. | TQ4_1S, NVIDIA, `ncols_dst <= 8`. | Weight path, not KV path; quality evaluated via perplexity/logits. | Candidate for 4090 profiling; DP4A throughput vs memory. |
| `mmvq-tq.cu::mul_mat_tq3_1s_multi` | TQ3 weights × half activations | Scalar/half multi-token path. | TQ3_1S. | More aggressive weight compression. | Slower scalar path likely. |
| `mmvq-tq.cu::mul_mat_tq4_1s_scalar_multi` | TQ4 weights × half activations | AMD/fallback scalar path. | TQ4_1S fallback. | Cross-vendor divergence. | Lower priority for 4090 except as fallback sanity. |
| `mmvq-tq.cu::k_convert_tq4_1s_to_q8_0` | TQ4 weight → q8_0 | Load-time conversion to q8_0. | `GGML_TQ_CONVERT_Q8=1` path. | Converts away TQ runtime behavior; receipt must say if enabled. | Trades VRAM for faster prefill. |
| `mmvq-tq.cu::ggml_cuda_mul_mat_tq4_1s_cublas` | TQ4 → fp16 scratch + cuBLAS | Large prefill path. | `ncols_dst > 8` large prefill. | Tensor-core path changes numeric surface vs native TQ. | Likely faster prefill but extra scratch allocation. |

### Host-side integration and graph decisions

| file | role | why it matters |
|---|---|---|
| `src/llama-graph.cpp` | Inserts Turbo WHT around attention when K/V types are turbo. | Graph-side rotation must match cache write/dequant; bugs appear as quality collapse, not build failure. |
| `src/llama-kv-cache.cpp` / `.h` | Allocates K/V cache tensors, layer-adaptive/boundary V, InnerQ scale tensor. | Asymmetric K/V and layer-wise types are decided here. Also imports InnerQ state from CUDA TU. |
| `src/llama-context.cpp` | Capability checks for turbo K/V and flash-attn. | Determines whether user command is valid or silently rejected/fallback. |
| `ggml/src/ggml-cuda/CMakeLists.txt` | Controls `GGML_CUDA_FA_ALL_QUANTS` and template instances. | Benchmark receipts must record this; missing all-quant FA changes the kernel path. |
| `ggml/src/ggml-cuda/ggml-cuda.cu` | Dispatch, upload, TQ conversion, op support checks. | Central place to confirm what actually ran. |

## First questions for kernel auditing

1. **Which path did a command actually use?**
   - Verify build features include `FA_ALL_QUANTS` when claiming turbo attention path.
   - Record whether `GGML_TQ_CONVERT_Q8` converted TQ4 weights to q8_0.
2. **Is K compressed or only V compressed?**
   - K compression is quality-sensitive; V compression is expected to be more forgiving.
3. **Is WHT graph-side or cache-write-side?**
   - KV turbo requires a paired story: set_rows writes rotated/quantized cache; graph rotates Q or unrotates V accordingly.
4. **Is the head dimension 64, 128, 256, or odd/tail?**
   - The CUDA kernels have explicit 64/128 WHT group handling and tail paths.
5. **Is the model dense, hybrid/MoE/GatedDeltaNet, or Mamba-adjacent?**
   - Sensitivity differs; Qwen3.6 hybrid paths may not generalize to dense models.

## 4090 week-2 profiling candidates

Do not start these while the 3090 AIME long run is active unless explicitly moving to the 4090. The 4090 status check on 2026-05-24 showed 0% GPU util but high resident VRAM (~22 GB). Runbook context says this is expected for the default `VLLM-AutoStart` service on port `11435` serving Qwen2.5-7B with TurboQuant/TriAttention. Freeing that VRAM means stopping/changing an infra service, so it requires `[CONFIRMAR:INFRA]`; read-only health checks are fine.

### Candidate A — build/path sanity only

Goal: prove which CUDA path is active on 4090.

Command shape to prepare, not yet run:

```bash
llama-server -m <small-qwen-or-llama-gguf> \
  -ngl 99 -fa on -ctk q8_0 -ctv turbo4 \
  -c 32768 --metrics --host 127.0.0.1 --port <port>
```

Receipt should capture:

- build commit;
- `llama-server --help | grep turbo`;
- CUDA features / `FA_ALL_QUANTS`;
- log lines proving cache types;
- one tiny quality smoke.

### Candidate B — `fattn-vec` K/V matrix

Goal: compare asymmetric vs symmetric on 4090 with a small model where quality can be scored quickly.

Matrix:

| K | V | expected use |
|---|---|---|
| q8_0 | q8_0 | baseline |
| q8_0 | turbo4 | V compression check |
| q8_0 | turbo3 | stronger V compression |
| turbo4 | turbo4 | symmetric quality risk |
| turbo3 | turbo3 | known high-risk for low-bit dense/Q4 models |

Metrics:

- llama-bench pp/tg at 0/4K/16K/32K;
- KLD/PPL short context;
- passkey or AIME smoke only if speed result looks interesting.

### Candidate C — WHT micro-profile

Goal: inspect `k_turbo_wht_f32` in Nsight Compute before editing anything.

Counters/questions:

- occupancy and active warps;
- shared-memory bank conflict stalls;
- synchronization overhead;
- achieved memory throughput;
- group size 64 vs 128 differences.

This is a good first profiler target because it is compact and conceptually isolated.

## Immediate non-code deliverables

- [x] Clone/read TheTom llama.cpp TurboQuant CUDA branch.
- [x] Map kernel files and activation surfaces.
- [ ] Build a minimal 4090 command matrix without touching 3090.
- [x] Identify 4090 resident VRAM owner at runbook level: default `VLLM-AutoStart` service (~21.8 GiB idle VRAM). Process-level confirmation still useful before any benchmark.
- [ ] Add a receipt template section: `kernel_path_observed` so CUDA receipts distinguish declared flags from actual dispatch.

## Red lines

- No kernel optimization claim without quality gate.
- No direct `llama-cli` long-context run over SSH.
- No killing 4090 resident process without explicit confirmation.
- No public claim that Bunn/Metal/MLX path was reproduced; local path remains CUDA/GGUF unless explicitly changed.
