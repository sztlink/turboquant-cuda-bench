#!/usr/bin/env python3
"""Install guarded Evidence-Paged KV Phase 2a runtime hook into vLLM.

Run from anywhere:

    python patch-turboquant-runtime-hook.py --vllm-root /path/to/vllm

This modifies vLLM source. Keep VLLM_EPKV_RUNTIME_HOOK=0 unless running a
controlled experiment.
"""
from __future__ import annotations

import argparse
import shutil
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
HOOK_SRC = HERE / "evidence_paged_kv"

IMPORT_SENTINEL = "# Evidence-Paged KV Phase 2a runtime hook (installed by turboquant-cuda-bench)."
IMPORT_BLOCK = f'''\n{IMPORT_SENTINEL}\ntry:\n    from vllm.v1.attention.evidence_paged_kv.runtime_hook import (\n        maybe_decode as _epkv_runtime_maybe_decode,\n    )\nexcept Exception:  # noqa: BLE001 - hook must never prevent vLLM import.\n    _epkv_runtime_maybe_decode = None\n'''

CALL_SENTINEL = "# Evidence-Paged KV Phase 2a runtime hook: guarded by env flag."
CALL_BLOCK = f'''\n        {CALL_SENTINEL}\n        if _epkv_runtime_maybe_decode is not None:\n            _epkv_runtime_out = _epkv_runtime_maybe_decode(\n                impl=self,\n                query=query,\n                kv_cache=kv_cache,\n                attn_metadata=attn_metadata,\n                layer=layer,\n            )\n            if _epkv_runtime_out is not None:\n                return _epkv_runtime_out\n'''


def backup(path: Path) -> None:
    stamp = time.strftime("%Y%m%d-%H%M%S")
    shutil.copy2(path, path.with_suffix(path.suffix + f".bak-epkv-runtime-{stamp}"))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--vllm-root", default=".")
    args = ap.parse_args()
    root = Path(args.vllm_root).resolve()
    target = root / "vllm/v1/attention/backends/turboquant_attn.py"
    if not target.exists():
        raise SystemExit(f"missing target: {target}")

    dst_pkg = root / "vllm/v1/attention/evidence_paged_kv"
    dst_pkg.mkdir(parents=True, exist_ok=True)
    for src in HOOK_SRC.glob("*.py"):
        shutil.copy2(src, dst_pkg / src.name)

    text = target.read_text(encoding="utf-8")
    changed = False
    if IMPORT_SENTINEL not in text:
        marker = "# Evidence-Paged KV observe hook (installed by turboquant-cuda-bench).\n"
        if marker in text:
            text = text.replace(marker, IMPORT_BLOCK + "\n" + marker, 1)
        else:
            marker2 = 'import os as _os  # noqa: E402\n'
            if marker2 not in text:
                raise SystemExit("could not find import insertion marker")
            text = text.replace(marker2, marker2 + IMPORT_BLOCK, 1)
        changed = True

    if CALL_SENTINEL not in text:
        marker = "        # Acquire shared decode scratch buffers from WorkspaceManager.\n"
        if marker not in text:
            raise SystemExit("could not find decode insertion marker")
        text = text.replace(marker, CALL_BLOCK + "\n" + marker, 1)
        changed = True

    if changed:
        backup(target)
        target.write_text(text, encoding="utf-8")
        print(f"installed Phase 2a runtime hook into {target}")
    else:
        print("Phase 2a runtime hook already installed; no source change")
    print(f"hook package installed at {dst_pkg}")


if __name__ == "__main__":
    main()
