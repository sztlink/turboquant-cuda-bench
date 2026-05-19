# Evidence-Paged KV version taxonomy

This taxonomy is frozen as of 2026-05-19.

| Version | Category | Description | Public role |
|---|---|---|---|
| v1 | Control | Fused gather/page + dequant + scalar dot. | Historical overhead control. |
| v2 | Geometry | `page × head × row-tile`; page becomes execution geometry. | Shows page layout can matter. |
| v3 | Score shape | Emits score tiles `[selected_rows, heads]`. | First attention-shaped score receipt. |
| v4 | Public receipt | Scores → top-k/softmax → value accumulation. Hybrid with Torch top-k/softmax. | **Lead public receipt.** |
| v5 | Hook candidate | Custom staged top-k/softmax + value accumulation. Best current `K=32` custom path. | **Candidate for vLLM hook.** |
| v6 | Architecture proof | Per-page score + local top-k without full score materialization, but serial row scoring. | Proof of shape; not a speed path. |
| v7 | Architecture direction | Page-local top-k with warp-per-row scoring and no full score materialization. | **Best conceptual direction.** |
| v8 | Conditional hypothesis | Not implemented. Must target candidate handling, `K=32/K=128`, and temp memory. | Paused until hypothesis exists. |

## Stable public framing

```txt
v4 = best public receipt
v5 = best current hook candidate
v7 = best architecture direction
v8 = conditional, not automatic
```

## Do not collapse these roles

- Do not present v7 as the fastest path.
- Do not present v5 as the cleanest architecture.
- Do not present v4 as fully custom/fused.
- Do not present v8 as inevitable.
