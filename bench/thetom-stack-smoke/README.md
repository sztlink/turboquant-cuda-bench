# TheTom stack smoke

Local smoke adapter for incorporating public TheTom tools into this repo's validation workflow.

Current receipt:

- [latest/RESULTS.md](latest/RESULTS.md)
- [latest/receipt.json](latest/receipt.json)

Prepare minimal longctx web dependencies in a local pip target if needed:

```bash
mkdir -p /home/aya/implante/tmp/python-deps/longctx-svc-smoke
python3 -m pip install --target /home/aya/implante/tmp/python-deps/longctx-svc-smoke \
  fastapi 'uvicorn[standard]' pydantic httpx pathspec watchdog rank_bm25
```

Run:

```bash
node scripts/thetom-stack-smoke.mjs \
  --longctx-deps-dir /home/aya/implante/tmp/python-deps/longctx-svc-smoke
```

Expected local clones, unless overridden by env vars:

```text
/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/tqkit-clone
/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/turboquant_plus-clone
/home/aya/implante/tmp/turboquant-build-context-2026-05-09/github/longctx-clone
```

Env overrides:

```bash
TQKIT_DIR=/path/to/tqkit \
TURBOQUANT_PLUS_DIR=/path/to/turboquant_plus \
LONGCTX_DIR=/path/to/longctx \
LONGCTX_DEPS_DIR=/path/to/pip-target \
node scripts/thetom-stack-smoke.mjs
```

This is intentionally a smoke, not a benchmark. It checks that the adapters can be called and that their outputs can be captured as receipts.
