# Evidence-Paged KV Phase 1 — vLLM layout harness — 2026-05-19

> Offline harness against the real vLLM TurboQuant cache layout captured by the observe-only hook.

## Boundary

```txt
kv_cache: [num_blocks, block_size, Hk, slot_size] uint8
observed production shape: [15442, 16, 4, 196]
harness layout: turboquant_k8v4 = FP8-K + 4-bit-V uniform values
slot_size = 128 key bytes + 64 value-index bytes + 4 value scale/zero bytes = 196
```

## Correctness / deltas

| M rows | K | pattern | check | max abs | mean abs |
|---:|---:|---|---|---:|---:|
| 8192 |  | contiguous_pages | dequant_full_softmax_vs_original_tq_decode | 0.000244 | 0.000003 |
| 8192 | 32 | contiguous_pages | topk_selected_vs_full_softmax_selected | 0.633423 | 0.144146 |
| 8192 | 128 | contiguous_pages | topk_selected_vs_full_softmax_selected | 0.318115 | 0.070249 |
| 8192 |  | sparse_pages | dequant_full_softmax_vs_original_tq_decode | 0.000244 | 0.000003 |
| 8192 | 32 | sparse_pages | topk_selected_vs_full_softmax_selected | 0.739990 | 0.145828 |
| 8192 | 128 | sparse_pages | topk_selected_vs_full_softmax_selected | 0.364990 | 0.069342 |
| 32768 |  | contiguous_pages | dequant_full_softmax_vs_original_tq_decode | 0.000122 | 0.000001 |
| 32768 | 32 | contiguous_pages | topk_selected_vs_full_softmax_selected | 0.615051 | 0.145437 |
| 32768 | 128 | contiguous_pages | topk_selected_vs_full_softmax_selected | 0.306519 | 0.072217 |
| 32768 |  | sparse_pages | dequant_full_softmax_vs_original_tq_decode | 0.000122 | 0.000001 |
| 32768 | 32 | sparse_pages | topk_selected_vs_full_softmax_selected | 0.643677 | 0.144966 |
| 32768 | 128 | sparse_pages | topk_selected_vs_full_softmax_selected | 0.337036 | 0.071992 |
| 65536 |  | contiguous_pages | dequant_full_softmax_vs_original_tq_decode | 0.000122 | 0.000001 |
| 65536 | 32 | contiguous_pages | topk_selected_vs_full_softmax_selected | 0.625397 | 0.147554 |
| 65536 | 128 | contiguous_pages | topk_selected_vs_full_softmax_selected | 0.350159 | 0.072607 |
| 65536 |  | sparse_pages | dequant_full_softmax_vs_original_tq_decode | 0.000122 | 0.000001 |
| 65536 | 32 | sparse_pages | topk_selected_vs_full_softmax_selected | 0.625397 | 0.147554 |
| 65536 | 128 | sparse_pages | topk_selected_vs_full_softmax_selected | 0.350159 | 0.072607 |

## Timings

| mode | M rows | K | pattern | p50 ms | p90 ms | temp KV MiB | temp scores MiB |
|---|---:|---:|---|---:|---:|---:|---:|
| original_turboquant_decode_full_softmax | 8192 |  | contiguous_pages | 0.1167 | 0.1828 | 0.00 | 0.00 |
| layout_full_dequant_KV | 8192 |  | contiguous_pages | 0.0725 | 0.1042 | 16.00 | 0.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 8192 | 32 | contiguous_pages | 6.9660 | 7.1913 | 16.00 | 0.88 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 8192 | 128 | contiguous_pages | 2.8509 | 6.4770 | 16.00 | 0.88 |
| original_turboquant_decode_full_softmax | 8192 |  | sparse_pages | 0.1123 | 0.1270 | 0.00 | 0.00 |
| layout_full_dequant_KV | 8192 |  | sparse_pages | 0.0471 | 0.1044 | 16.00 | 0.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 8192 | 32 | sparse_pages | 6.7479 | 7.2927 | 16.00 | 0.88 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 8192 | 128 | sparse_pages | 6.4737 | 6.5413 | 16.00 | 0.88 |
| original_turboquant_decode_full_softmax | 32768 |  | contiguous_pages | 0.2601 | 0.2664 | 0.00 | 0.00 |
| layout_full_dequant_KV | 32768 |  | contiguous_pages | 0.1505 | 0.1795 | 64.00 | 0.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 32768 | 32 | contiguous_pages | 7.9584 | 8.0579 | 64.00 | 3.50 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 32768 | 128 | contiguous_pages | 8.0903 | 12.9354 | 64.00 | 3.50 |
| original_turboquant_decode_full_softmax | 32768 |  | sparse_pages | 0.2578 | 0.2641 | 0.00 | 0.00 |
| layout_full_dequant_KV | 32768 |  | sparse_pages | 0.1597 | 0.1842 | 64.00 | 0.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 32768 | 32 | sparse_pages | 12.9514 | 13.0532 | 64.00 | 3.50 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 32768 | 128 | sparse_pages | 12.8225 | 12.9429 | 64.00 | 3.50 |
| original_turboquant_decode_full_softmax | 65536 |  | contiguous_pages | 0.4454 | 0.4961 | 0.00 | 0.00 |
| layout_full_dequant_KV | 65536 |  | contiguous_pages | 0.2783 | 0.2889 | 128.00 | 0.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 65536 | 32 | contiguous_pages | 12.2692 | 12.3021 | 128.00 | 7.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 65536 | 128 | contiguous_pages | 12.1547 | 12.2714 | 128.00 | 7.00 |
| original_turboquant_decode_full_softmax | 65536 |  | sparse_pages | 0.4247 | 0.4543 | 0.00 | 0.00 |
| layout_full_dequant_KV | 65536 |  | sparse_pages | 0.2600 | 0.2857 | 128.00 | 0.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 65536 | 32 | sparse_pages | 12.2470 | 12.4348 | 128.00 | 7.00 |
| epkv_v4_style_materialized_topk_from_vllm_layout | 65536 | 128 | sparse_pages | 12.1643 | 12.1906 | 128.00 | 7.00 |

## Readout

- The real vLLM cache boundary is usable offline via `block_table + packed TQ slots`.
- The harness validates the FP8-K / 4-bit-V unpack path by comparing dequant+full-softmax against original TurboQuant decode.
- The current v4-style top-k path still materializes selected K/V and scores; this is a layout bridge, not the final kernel.
- The top-k timing rows are intentionally Python/Torch-loop reference paths over dequanted K/V; they are **not** evidence that Evidence-Paged KV is slow as a kernel.
- The important positive result is layout/correctness: dequant+full-softmax matches original TurboQuant decode at ~1e-4 max abs error.
- Next Phase 2 should only insert an experimental selected-page path after replacing the Python/Torch-loop top-k reference with a guarded CUDA/Triton selected-page path.

## Non-claims

- Not production attention.
- Not a serving speedup claim.
- Not a model-quality or evidence-utilization claim.
- Not a comparison against PagedAttention/FlashAttention.
