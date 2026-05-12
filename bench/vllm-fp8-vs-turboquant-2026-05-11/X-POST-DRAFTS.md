# X post drafts — FP8 vs TurboQuant K8V4, calibration scope receipt

Context: replying (quote-tweet or thread) to the @RedHat_AI / @_EldarKurtic post claiming FP8 KV-cache = BF16 zero accuracy cost. Audience: TheTom + Waffle House + vLLM core + the broader TurboQuant ecosystem.

The receipt is at https://github.com/sztlink/turboquant-cuda-bench/tree/main/bench/vllm-fp8-vs-turboquant-2026-05-11

## Variant 1 — single tweet, one frame (Casey's "uma frase só + link")

> @RedHat_AI's "FP8 = zero accuracy cost vs BF16" holds in their regime (70B+, AIME / GPQA / MATH500 / mrcr).
>
> At 7B / 16K / adversarial exact-match retrieval on a 4090, the same calibration produces 0/8 with characteristic near-miss precision errors. TurboQuant K8V4 matches BF16 byte-for-byte, no calibration step.
>
> Per-handle receipts: github.com/sztlink/turboquant-cuda-bench/tree/main/bench/vllm-fp8-vs-turboquant-2026-05-11

**Character count:** ~470 (will need X premium or split). Frames the contribution as scope, not refutation. Honest about what's tested where.

## Variant 2 — quote-tweet, shorter

> The regime matters. At 7B / 16K / exact-match retrieval on a 4090: calibrated FP8 KV → 0/8 (near-miss precision errors); TurboQuant K8V4 → 5/8 = BF16 byte-for-byte. Different domain, different curve. [link]

**~280 chars.** Single tweet.

## Variant 3 — thread, 3 tweets

**T1:**
> @RedHat_AI's recent post: FP8 KV-cache = BF16 zero accuracy cost. Their setup: Llama-70B / Qwen3-30B / MiniMax / 2-4×H100 / AIME, GPQA, MATH500, mrcr.
>
> Ran the same dtype matrix at 7B / 16K / adversarial exact-match retrieval on a 4090. Different regime, different answer. 🧵

**T2:**
> - BF16 KV: 5/8 hits (3 decoys on this corpus)
> - TurboQuant K8V4: 5/8, byte-identical to BF16
> - FP8 scales=1.0: 0/8 gibberish (token-mangle, path-leak, loop, format-echo)
> - FP8 on-the-fly: 0/8 worse (all loops/collapse)
> - FP8 dataset-calibrated W8A8-KV8: 0/8 near-miss (`055/050`, `44/440`, `571/570`)

**T3:**
> Calibration recovers structure but not precision at 7B drop-in. The Red Hat claim is well-supported in its regime — exact-match retrieval is not in that regime. TurboQuant K8V4 holds an asymmetric advantage here: matches BF16 with no calibration.
>
> Full per-handle outputs, scripts, logs: github.com/sztlink/turboquant-cuda-bench/tree/main/bench/vllm-fp8-vs-turboquant-2026-05-11
>
> cc @TheTom

**Total chars:** ~900. Three tweets. Most rigorous and most defensible against scope-creep crit.

## Variant 4 — image-of-text + caption

(Casey's "díptico" form taken literally)

Post a 4-panel image showing for one representative handle (aurora-blue-compass):
- A · BF16: `AYA-HARD-AURORA-BLUE-050-Z9` ✓
- M · FP8 scales=1.0: `AYA-HARD-AUROROA-BLUE -0 tiare-Z/`
- R · FP8 on-the-fly: ` ``` [tr\n\````````` test> test\n\``` \ testfer\n tests\n test\n``` [tr\n``\n / \ `
- C · FP8 calibrated: `AYA-HARD-AUROR-B-LBLUE-055-Z9`

Caption:
> What @RedHat_AI's "FP8 = BF16 zero accuracy cost" looks like at 7B / 16K / exact-match retrieval. Same prompt, same seed, four FP8 setups. Full receipts: [link]

**Visual impact > text.** The four outputs side-by-side say it instantly. Single tweet + image.

## Recommendation

Casey direction was "díptico, outputs literais, sem tabela summary." Variant 4 follows that most directly. Variant 3 carries more technical weight; variant 1 is the safest posture.

Felipe's call. If posting today (X is currently watching the TheTom / Red Hat thread), Variant 3 reads as the contribution Felipe is actually making: scope-mapping, not denouncement. Variant 4 if you want the visceral hit and trust the image to carry the technical claim.

If choosing not to post: the work stands as a receipt in the repo, linkable in #research, and the diptych is documented in FAILURE-CATALOG.md without performance.

## Anti-patterns we already ruled out

- ❌ Listing benchmarks we didn't run (no AIME / mrcr at 7B) — would be performance-as-data, not data.
- ❌ Framing as "Red Hat is wrong" — they aren't, in their regime. Framing matters.
- ❌ Including unrelated wins (TheTom's K8V4 throughput numbers, longctx 192K results) — clutter that distracts from the specific receipt.
- ❌ Posting before the bench dir is on `main` in `sztlink/turboquant-cuda-bench` (so the link works).
