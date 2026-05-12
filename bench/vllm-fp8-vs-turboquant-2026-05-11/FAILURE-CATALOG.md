# FP8 KV-cache failure-mode catalog · Qwen 2.5-7B-Instruct · decoy k=16

**Date:** 2026-05-11
**Setup:** vLLM `feature/turboquant_plus` @ `36fc04825`, RTX 4090, BF16 weights, `max_model_len=16384`, `seed=42`, `temperature=0.0`, `max_tokens=128`.

Eight handles. For each, the literal output is shown verbatim; the failure-mode label is one word in the leftmost column. Labels are reused across handles so the panels read as vocabulary, not as table.

## Vocabulary

- **hit** — the expected SECRET VALUE is emitted exactly
- **decoy** — a literal DECOY-#### string is emitted (the canonical decoy attack succeeded)
- **near-miss** — model emits the right *form* AND right *prefix tokens*, with one wrong digit or one truncated character on the secret-value suffix
- **token-mangle** — model emits the right *form* with multiple characters mutated, doubled, or truncated (severe)
- **path-leak** — model emits filesystem path fragments from the corpus instead of a SECRET VALUE
- **loop** — repetitive token sequence consuming most of the output budget
- **format-echo** — model emits the literal string "SECRET VALUE" or "The SECRET VALUE" instead of resolving it
- **prompt-echo** — model emits its own system prompt back
- **prefix-glitch** — model emits the right structural form preceded by a stray "It " / "The " / number / code-fence
- **collapse** — model emits 1–3 tokens then stops

## Panel L · `kv_cache_dtype="auto"` (BF16 KV, zero compression)

| mode | handle | output |
|---|---|---|
| hit | aurora-blue-compass | `AYA-HARD-AURORA-BLUE-050-Z9` |
| decoy | brass-river-index | `DECOY-0616-1` |
| hit | ceramic-lantern-field | `AYA-HARD-CERAMIC-LANTERN-310-Z9` |
| hit | delta-archive-needle | `AYA-HARD-DELTA-ARCHIVE-440-Z9` |
| hit | ember-signal-route | `AYA-HARD-EMBER-SIGNAL-570-Z9` |
| hit | feldspar-memory-gate | `AYA-HARD-FELDSPAR-GATE-700-Z9` |
| decoy | glass-orchid-vector | `DECOY-0742-6` |
| decoy | jade-winter-circuit | `DECOY-0725-7` |

**Score:** 5/8 hits. Failures are all `decoy` — the three handles whose canonical chunks are buried below decoys in the retrieval set. The model commits to the wrong-but-coherent answer, not gibberish.

## Panel M · `kv_cache_dtype="fp8"` (vLLM native, scales=1.0)

| mode | handle | output |
|---|---|---|
| token-mangle | aurora-blue-compass | `AYA-HARD-AUROROA-BLUE -0 tiare-Z/` |
| path-leak + loop | brass-river-index | `/home/aya/implimpl t/research/t /mploquanttboquantuda cuda / bench/ / / / / / / ` |
| prefix-glitch + token-mangle | ceramic-lantern-field | `TheA-HARD-CERAMIC-LANTERNR3-3` |
| path-leak | delta-archive-needle | `// /home/aya/implplement/research/t/implboquant/cuda/ bench// /README.md/ ccorpu` |
| format-echo + loop | ember-signal-route | `The\n\nThe\np\n The exact SECRET VALUE you is "SECRET VALUE".".p/\n\n/` |
| token-mangle | feldspar-memory-gate | `AYA-HARD-F-FDSPAR-GATE` |
| path-leak + loop | glass-orchid-vector | `It /home/aya/impl/t/research/t /g/ longctx-proxy-hard / src/sector_ / / / / / / ` |
| format-echo + loop | jade-winter-circuit | `It The provided you provide the exact SECRET VALUE, as it it does does does. The` |

**Score:** 0/8 hits. Failure modes split across `token-mangle`, `path-leak`, `loop`, `format-echo`, and combinations. Every category of structural error appears at least once across 8 prompts. The decoy attack mode disappears entirely — the model never coheres enough to commit to a DECOY-#### string.

## Panel R · `kv_cache_dtype="fp8"` with `calculate_kv_scales=True` (on-the-fly, random tokens)

| mode | handle | output |
|---|---|---|
| loop | aurora-blue-compass | ` ``` [tr\n````` ``\n``` test> test\n``` \ testfer\n tests test\n tests\n``` [tr\n``\n / \ ` |
| token-mangle + loop | brass-river-index | `1 111666666 fucks\nThis long 1 66666666666666666666666666666666666666666666666666` |
| loop | ceramic-lantern-field | `-: ordinary\n test: ordinary\n-: ordinary\n test\n and: ordinary\n test\n test\n test\n ` |
| loop | delta-archive-needle | `tests\n test\n test\n test\n test\n test\n test\n test\n test\n test\n test\ntest\ntest\ntest` |
| loop | ember-signal-route | `</111113,\n-  is 1 1 1 1 1 11 1 1 1 1 1 1 3 1 3 1 3 1 3 3 3 3 3 3 3 3 3 3 3 3 3 3` |
| token-mangle + loop | feldspar-memory-gate | `testsed with no valid:ed\n testssed with no-:ed\ntestsed with noled:ed\ntestsed wit` |
| collapse | glass-orchid-vector | ` ``` ` |
| loop | jade-winter-circuit | `1: ordinary test prose cross-referencedenced with test tests tests test test tes` |

**Score:** 0/8 hits. All 8 outputs are dominated by `loop` (one is `collapse` — three-character output, model gave up before generating anything). Outputs are categorically worse than Panel M: no path-leak, no format-echo, no prefix-glitch — the model never assembles enough structure to fail in those modes. Random-token scaling does not help; it appears to make the cache *less* informative than the unscaled FP8.

## Panel C · `kv_cache_dtype="fp8"` with dataset-calibrated scales (W8A8-KV8)

llmcompressor 0.10.0.2, `HuggingFaceH4/ultrachat_200k` train_sft, 512 samples × 2048 max_seq_length, per-tensor static FP8 on weights + input_activations + KV cache. Calibration took 9m22s on the 4090. Inference via stock vLLM 0.20.2 (because the dev `feature/turboquant_plus` fork was bound to a torch 2.11 nightly that no longer resolves after llmcompressor pulled in torch 2.10.0; switching to stock vLLM is the simplest path and is unrelated to the calibrated-weights/KV scales under test).

| mode | handle | output | expected |
|---|---|---|---|
| near-miss | aurora-blue-compass | `AYA-HARD-AUROR-B-LBLUE-055-Z9` | `AYA-HARD-AURORA-BLUE-050-Z9` |
| format-echo | brass-river-index | `The SECRET VALUE.` | (decoy attractor) |
| token-mangle | ceramic-lantern-field | `AYA-HARD-BLDCERAMICLAMERICALANTERN-ON-555-Z5` | `AYA-HARD-CERAMIC-LANTERN-310-Z9` |
| near-miss | delta-archive-needle | `AYA-HARD-DELTA-ARCHIVE-44-Z9` | `AYA-HARD-DELTA-ARCHIVE-440-Z9` |
| near-miss | ember-signal-route | `AYA-HARD-EMBER-SIGNAL-571-Z9` | `AYA-HARD-EMBER-SIGNAL-570-Z9` |
| token-mangle | feldspar-memory-gate | `AYA-H had-D-feldspar-gate-Z` | `AYA-HARD-FELDSPAR-GATE-700-Z9` |
| prompt-echo | glass-orchid-vector | `No path: \n ... [truncated]\n``\n\nYou are a precise retrieval assistant. Answer onl` | (decoy attractor) |
| decoy (mangled) | jade-winter-circuit | `DECOY-936-7` | (decoy attractor; BF16 emitted `DECOY-0725-7`) |

**Score:** 0/8 hits. But the failure mode is categorically different from Panels M and R: the model has recovered the *form* (correct AYA-HARD-X-N-Z9 template, decoy-commit behavior, system-prompt-aware refusals) but is unstable on the *precision* — a single character is wrong on the secret-value suffix on three handles (`055/050`, `44/440`, `571/570`). On exact-match grading this is 0/8; on Levenshtein-1 grading this would be 3/8 hits; on "got the form right" qualitative grading, 5/8 of the eight outputs are in the structurally correct regime, the same handles BF16 hit.

Two outputs (`brass-river-index`, `glass-orchid-vector`) are not near-miss: brass collapses to `format-echo` and glass echoes the system prompt back. These two correspond to handles whose canonical chunks were *not* the top-ranked items in the retrieval set (the same handles that gave decoy commits at BF16). In other words: the calibrated FP8 model still fails on the handles BF16 fails on, plus it adds new "near-miss but wrong digit" failures on handles BF16 hits.

## Panel TQ · `kv_cache_dtype="turboquant_k8v4"` (FP8 K + 4-bit V)

Identical 8 outputs to Panel L (BF16). Byte-identical. (Reference: `bench/vllm-decoy-2026-05-11/`.)

## Reading

The 5/8 ceiling on this corpus is a property of the retrieval pipeline and the decoy curation, not of KV-cache compression — it appears at full BF16, at TurboQuant K8V4 (≥4× compression), and would not exist as a benchmark if the canonical chunks were ranked above the decoys.

The four FP8 panels trace a curve, not a number:

- **scales=1.0 (M)**: structural collapse. Eight different *kinds* of broken output across 8 handles. The model never coheres.
- **on-the-fly random-token scaling (R)**: collapse is *worse* than scales=1.0. All 8 handles dominated by loop or one-line abandon. Random-token scaling makes the cache less informative than the unscaled FP8.
- **dataset-calibrated W8A8-KV8 (C)**: structural recovery, precision loss. The model now generates the correct AYA-HARD-X-N-Z9 template, the correct decoy-commit behavior, the correct system-prompt-aware refusals — and on three handles it produces a single-character precision error in the suffix (`055/050`, `44/440`, `571/570`). On exact-match grading this scores 0/8. On Levenshtein-1 grading, 3/8. On qualitative "got the form right," 5/8.

Two observations follow:

1. Calibration is necessary AND insufficient at 7B drop-in scale on this workload. The model that needs scales to assemble structure also needs more than dataset calibration to land precise digits.
2. The Red Hat AI "FP8 = zero accuracy cost vs BF16" claim is tested at 70B+ scale on AIME25 / GPQA / MATH500 / LiveCodeBench-v6 — benchmarks where partial credit / scoring tolerance absorbs single-digit precision errors. At 7B on a 16K exact-match adversarial-retrieval workload, the same calibration produces 0/8 — entirely from precision errors the larger benchmarks would not register as failures.

This is not a refutation of the Red Hat claim. It is a demonstration that the claim has a domain: the regime in which it holds (70B+, partial-credit reasoning) is not the regime in which a 7B consumer-GPU long-context retrieval workload lives.

The fact that **TurboQuant K8V4 at ≥4× compression matches BF16 byte-for-byte on the same handles, on the same hardware, with no calibration step** is the asymmetric finding worth keeping in view.

## Reproduction

```bash
# Panel L
python vllm-decoy-dtype-sweep.py auto

# Panel M
python vllm-decoy-dtype-sweep.py fp8

# Panel R
python vllm-decoy-fp8-otf.py

# Panel C
python calibrate-fp8-qwen7b.py   # ~9m22s on RTX 4090, produces ./qwen2.5-7b-fp8-kv/
python vllm-decoy-calibrated.py  # uses the calibrated model via stock vLLM 0.20.2
```

All inputs from `k16-mapping.json` (same seed=42, same prompts as `bench/vllm-decoy-2026-05-11/`).

Caveat: the fp8+calibrated panel uses stock vLLM 0.20.2 (not the `feature/turboquant_plus` fork), because llmcompressor installation in the shared venv re-pinned torch in a way the fork's compiled C extension cannot reload. The compressed-tensors W8A8-KV8 model produced is portable across vLLM versions; the difference is only the inference engine. This is documented and not the point under test.
