# Boring Receipts — Glossary

Plain definitions for the terms that show up *in a receipt*. If a number in a
receipt uses a word you don't know, it's defined here. This is the human-readable
layer: it exists so a beginner can **distrust a number before delegating it**.

Research-side vocabulary (TurboQuant, KVFidelity, decoy, TriAttention, REFRACT,
evidence utilization…) lives in the parent [`../GLOSSARY.md`](../GLOSSARY.md).

## tok/s (tokens per second)

How many tokens the model moves per second. The headline number. Always say
*which* tok/s — prompt or generation — because they differ by ~30×.

## pp — prompt processing (prefill)

Reading the prompt. The model ingests all input tokens in parallel before it
writes anything. `pp512` = processing a 512-token prompt. Fast and
compute-bound; expect thousands of tok/s on a modern GPU.

## tg — token generation (decode)

Writing the answer, one token at a time. `tg128` = generating 128 tokens.
Slower and memory-bandwidth-bound; tens to low-hundreds of tok/s. This is what a
chat user actually feels.

## TTFT — time to first token

Wall-clock time from sending the request to seeing the first output token.
Dominated by prefill. For a single stream it ≈ `prompt_tokens / pp_tok_s`.

## ITL — inter-token latency

Time between consecutive output tokens during generation. The "smoothness" of a
stream. Reported as a median in serving benchmarks.

## single-stream vs serving (regime)

The two regimes a receipt must never mix:

- **single-stream** — one request at a time (what `llama-bench` measures). pp/tg tok/s.
- **serving** — many concurrent requests (vLLM/SGLang). Aggregate output tok/s,
  requests/s, TTFT and ITL *under load*. A serving engine looks slow single-stream
  and fast under concurrency — comparing across regimes is apples to oranges.

## concurrency

Number of requests in flight at once in a serving benchmark. Throughput usually
rises with concurrency until VRAM or compute saturates; latency rises too.

## quantization (quant)

Storing model weights at lower precision to shrink size and speed up memory-bound
decode, trading a little quality. Names like `Q4_K_M` mean: 4 bits per weight,
`K`-quant scheme, `M`(edium) variant. Rough ladder: `Q8_0` (near-lossless, big) →
`Q5_K_M` → `Q4_K_M` (common sweet spot) → lower (faster, more quality loss).

## GGUF

The single-file model format llama.cpp loads. A quantized model ships as one
`.gguf` you download and point the binary at.

## ngl / n-gpu-layers

`-ngl N` = how many model layers to offload to the GPU. `-ngl 99` means "all of
them" (full GPU). Fewer layers spills to CPU/RAM and is much slower.

## context (n_ctx)

How many tokens of prompt+history the run allows. Bigger context costs more
KV-cache memory (see [`../GLOSSARY.md`](../GLOSSARY.md) → KV cache).

## VRAM peak

The highest GPU memory in use during the run, in MiB. Tells you whether the run
fits a given card and how much headroom is left for bigger context or batch.

## power draw / TDP

Watts the GPU pulls. **TDP** is its rated ceiling (e.g. 350 W on a 3090). A run
is **power-limited** if it sits at the ceiling (raise nothing, the card is maxed)
or **thermal-limited** if it throttles on heat first. A receipt says which.

## llama-bench

llama.cpp's built-in benchmark tool. Reports pp and tg tok/s with a standard
deviation over N repetitions. The canonical single-stream number the community
compares.

## prebuilt vs source build

- **prebuilt** — the official release binary (no compiling). Flags are whatever
  upstream ships. The reproducible floor.
- **source build** — you compile it yourself with chosen flags (e.g. flash-attn).
  Can be faster, but the receipt must list the flags or the number is unrepeatable.

## reps / stddev

How many times a measurement was repeated, and the spread (`± x`). Low stddev =
stable number. A receipt with no reps is a single sample, not a measurement.

## quality smoke

A minimal correctness check (or a reproduced failure) proving the run produced
*right* output, not just fast output. Speed without a quality smoke is half a receipt.

## node

A specific machine that produces receipts (e.g. `AYA-3090`). Named so a receipt
ties to exact hardware, driver and OS — and so a second node can try to reproduce it.

## command shape

The exact command line (plus environment) that regenerates a receipt. The
receipt's source of truth: hand the `command` to a fresh agent on another GPU and
a faithful receipt should regenerate. If it doesn't reproduce, it self-denounces.
