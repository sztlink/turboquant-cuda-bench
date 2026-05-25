# vLLM TurboQuant runtime lineage — AYA-4090

Date: 2026-05-25

Purpose: separate the TheTom upstream baseline from the local `sztlink` runtime overlay. This prevents live-service drift, EPKV patches, and operational scripts from being mistaken for upstream TurboQuant behavior.

## Decision

The current live AYA-4090 vLLM service is **not** a clean upstream baseline.

It is:

```txt
TheTom/vllm-turboquant @ 36fc048
+ local WSL2/cu130 build recipe
+ sztlink runtime service wrapper
+ TriAttention environment policy
+ EPKV/sampler/backend research overlays
```

Therefore it remains useful as a **sztlink overlay lab**, but it should not be used as direct evidence for an upstream bug unless the behavior is reproduced on a clean TheTom checkout.

## 1. Upstream layer

```txt
Repo:   https://github.com/TheTom/vllm-turboquant
Branch: feature/turboquant_plus
Commit: 36fc048255d0bbdab05811d667182a965fe05936
Version observed: 0.1.dev1+g36fc04825
```

Upstream provides the vLLM TurboQuant/TriAttention implementation family used by the 4090 runtime:

- TurboQuant KV dtype support, including `turboquant_k8v4`.
- Triton/Python TurboQuant attention path.
- TriAttention V3 modules.
- vLLM OpenAI-compatible serving surface.

This is the only layer that may be treated as upstream evidence.

## 2. Local build layer

The local build was created by `sztlink`/Pi on the AYA-4090 WSL2 environment.

Evidence:

```txt
Script: /home/aya/implante/tmp/fresh-tq-venv-tecnofagia-2026-05-15.sh
Log:    /home/aya/implante/tmp/fresh-tq-venv-tecnofagia-2026-05-15.log
Host:   AYA-4090 / DESKTOP-CTAHC6D
GPU:    RTX 4090, driver 595.79
WSL:    Ubuntu-24.04
Venv:   /home/felipe/vllm-lab/venv-tq-fresh-20260515
Source: /home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
```

Build facts from the preserved log:

```txt
BUILD_VLLM_BEGIN 2026-05-15T08:07:18-03:00
Building vllm @ file:///home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
Built vllm @ file:///home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
BUILD_VLLM_END 2026-05-15T09:06:44-03:00
vllm_after 0.1.dev1+g36fc04825
```

Local build adaptations included:

- Python 3.12.3 virtualenv.
- PyTorch `2.11.0+cu130`.
- pip-distributed CUDA 13.0 toolchain.
- WSL CUDA library symlinks, including `libcuda.so` and `lib64 -> lib`.
- `MAX_JOBS=4`.
- `TORCH_CUDA_ARCH_LIST=8.9`.
- editable install from the local checkout.

This layer is suitable for a build-recipe/documentation contribution, but it is not itself a bug report.

## 3. sztlink overlay layer

The live checkout has local research changes and backup files. Read-only inspection on 2026-05-24 showed modifications including:

```txt
M  vllm/v1/attention/backends/turboquant_attn.py
M  vllm/v1/sample/sampler.py
M  vllm/v1/worker/gpu/sample/sampler.py
?? vllm/v1/attention/evidence_paged_kv/
?? *.bak-epkv-*
```

The service start script also exports EPKV-related environment variables:

```txt
VLLM_EPKV_HOOK=1
VLLM_EPKV_RUNTIME_HOOK=0
VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS=
VLLM_EPKV_LOGIT_BIAS=0
VLLM_EPKV_LOGIT_POLICY_FILE=/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json
```

Interpretation:

- This overlay is part of the `sztlink` RealRAG/EPKV research history.
- It is not the right baseline for current TheTom contribution work.
- It should be archived and qualified as `sztlink-overlay`, not erased.

## 4. Live service layer

Canonical live service as of the latest read-only checks:

```txt
Task:       VLLM-AutoStart
Endpoint:   http://192.168.15.133:11435
Local:      http://127.0.0.1:11435 on Windows host
Repo:       /home/felipe/vllm-lab/vllm-turboquant-fresh-20260515
Venv:       /home/felipe/vllm-lab/venv-tq-fresh-20260515
Model:      Qwen/Qwen2.5-7B-Instruct
Aliases:    local-vllm, qwen2.5-7b-tq
KV dtype:   turboquant_k8v4
Context:    65536
TriAtt V3:  enabled via env vars
VRAM idle:  ~22 GiB resident, 0% util observed
```

Runbook drift noted:

- `sistema/runbooks/4090-vllm-server.md` previously listed alias `q36_35b`.
- Live `/v1/models` no longer serves that alias.

## 5. Attribution rule

Use this rule for any public claim, Discord message, GitHub issue, or receipt:

> Only call something an upstream TheTom bug if it reproduces on a clean `TheTom/vllm-turboquant@36fc048` checkout without the `sztlink` EPKV/sampler/backend overlays.

If it reproduces only on the live service, classify it as one of:

- `sztlink-overlay` bug,
- service/start-script bug,
- runbook drift,
- measurement/harness artifact,
- or unresolved.

## 6. Contribution posture

Current contribution mode should be:

```txt
build recipe + runtime map + validation receipts
```

Not yet:

```txt
upstream bug report
kernel patch
performance claim
quality claim
```

Candidate contribution sequence:

1. Archive the current live overlay state.
2. Establish a clean TheTom baseline in parallel.
3. Produce a minimal build/validation receipt.
4. Ask in Discord whether the build notes or runtime map are useful upstream.
5. Open GitHub issue/PR only with a clean repro or doc patch.
6. Post on X only after explicit Felipe approval.

## 7. Infra boundary

Safe without `[CONFIRMAR:INFRA]`:

- local documentation in this repo;
- read-only health checks;
- read-only git/status/file inspection;
- creating a plan for a clean baseline.

Requires `[CONFIRMAR:INFRA]`:

- stopping/restarting/disabling `VLLM-AutoStart`;
- changing the live service start script, model, context, aliases, port, firewall, or scheduled task;
- installing/building a new clean vLLM baseline on the 4090;
- running benchmarks that consume the 4090 service or require freeing VRAM.
