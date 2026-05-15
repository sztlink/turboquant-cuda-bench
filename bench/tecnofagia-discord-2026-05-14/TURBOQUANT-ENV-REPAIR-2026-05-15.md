# TurboQuant K8V4 environment repair attempt — 2026-05-15

Status: **failed before model load**.

This note records the unattended attempt to repair the custom `vllm-turboquant` environment and rerun the Tecnofagia fixture with `kv_cache_dtype=turboquant_k8v4`.

## Context

The sanitized Tecnofagia `auto` run succeeded:

```txt
Qwen/Qwen2.5-7B-Instruct · vLLM 0.20.2 · kv_cache_dtype=auto · 5/5 hits
```

The TurboQuant K8V4 cell remained unmeasured due environment import failure.

## Attempted repair

Local log:

```txt
/home/aya/implante/tmp/rebuild-tq-and-run-tecnofagia-2026-05-15.log
```

Actions:

1. Upgraded/realigned torch in `/home/felipe/vllm-lab/venv`.
2. Rebuilt editable `vllm-turboquant` from source at commit:

```txt
36fc048
```

3. Used the documented build constraints:

```txt
MAX_JOBS=4
TORCH_CUDA_ARCH_LIST=8.9
CUDA_HOME=/home/felipe/vllm-lab/venv/lib/python3.12/site-packages/nvidia/cu13
LD_LIBRARY_PATH=$CUDA_HOME/lib:/usr/lib/wsl/lib
```

Build completed after ~53 minutes and installed:

```txt
torch_after 2.11.0+cu130
vllm_after 0.1.dev1+g36fc04825
```

## Failure

Import smoke failed before any model load:

```txt
ImportError: /home/felipe/vllm-lab/vllm-turboquant/vllm/_C.abi3.so: undefined symbol: _ZNR5torch7Library4_defEON3c1014FunctionSchemaEPNS1_12OperatorNameERKSt6vectorINS_10headeronly3TagESaIS8_EENS_17_RegisterOrVerifyE
```

Earlier probes in the same session saw adjacent ABI/linker failures:

```txt
ImportError: libcudart.so.13: cannot open shared object file
ImportError: undefined symbol: _ZN2at4cuda24getCurrentCUDABlasHandleEv
```

Interpretation:

```txt
The custom TurboQuant vLLM extension is not ABI-aligned with the installed torch/CUDA wheel set. The problem is below the benchmark layer; Tecnofagia K8V4 remains not measured.
```

## Operational state

- `llama-server` was restored.
- 4090 GPU is back to idle/resident-service state.
- No Tecnofagia K8V4 result JSON was produced.

## Next repair direction

Do not rerun Tecnofagia K8V4 until this passes:

```bash
export CUDA_HOME=/home/felipe/vllm-lab/venv/lib/python3.12/site-packages/nvidia/cu13
export LD_LIBRARY_PATH=$CUDA_HOME/lib:/usr/lib/wsl/lib:$LD_LIBRARY_PATH
/home/felipe/vllm-lab/venv/bin/python - <<'PY'
from vllm import LLM, SamplingParams
print('TQ_IMPORT_OK')
PY
```

Recommended next technical step:

1. Create a **fresh venv** instead of mutating the current one.
2. Pin exact versions from a previously working log/commit if recoverable.
3. Rebuild `vllm-turboquant` once.
4. Only then rerun the sanitized Tecnofagia fixture.
