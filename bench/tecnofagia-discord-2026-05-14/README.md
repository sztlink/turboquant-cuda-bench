# Tecnofagia Discord decoy scaffold — 2026-05-14

Status: **prepared, not run**.

This scaffold tests whether the longctx decoy invariant survives when synthetic decoys are replaced by real Discord/Waffle chunks.

## Question

The previous vLLM decoy fixture showed a 5/8 invariant on the hit-class handles. Here, the canonical chunk is preserved and the decoys are replaced by deterministic chunks from the local Discord capture corpus.

Question:

```txt
Does the 5/5 hit-class invariant survive real Discord decoys?
```

## Files

```txt
build-tecnofagia-mapping.py   # deterministic fixture builder
vllm-tecnofagia.py            # vLLM runner, same seed/temp fixture shape
tecnofagia-mapping.manifest.json
```

The generated raw fixture is intentionally **not committed**:

```txt
tecnofagia-mapping.json
```

Reason: it contains Discord-derived chunk text. Keep it local until explicit privacy/publication review. The manifest records handle metadata, source filenames/chunk indices, and the SHA256 of the local generated mapping.

## Current blocker

The run was not executed because `llama-server.exe` was holding ~21.8 GiB of VRAM on the 4090. Felipe/Pi explicitly chose not to kill it during session closure.

## How to regenerate locally

```bash
cd /home/aya/implante/research/turboquant-cuda-bench
python bench/tecnofagia-discord-2026-05-14/build-tecnofagia-mapping.py
```

Then copy the generated mapping to the 4090 path expected by the runner:

```txt
/home/felipe/CASK/experiments/tecnofagia/tecnofagia-mapping.json
```

## How to run later

Use vLLM on the 4090 after freeing VRAM:

```bash
python bench/tecnofagia-discord-2026-05-14/vllm-tecnofagia.py auto
```

Do not interpret this as CASK/KVFidelity AIME work. This belongs to the longctx/TurboQuant decoy/retrieval-utilization front.
