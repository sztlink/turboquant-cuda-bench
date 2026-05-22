#!/usr/bin/env python3
"""Patch vLLM v1 GPU sampler with a default-off EPKV logit policy hook.

The patch is intentionally narrow and reversible. It adds env-controlled token
bias and compact top-k telemetry near the sampler/LM-head layer, after regular
sampling params and before gumbel sampling.

Expected target:
    vllm/v1/worker/gpu/sample/sampler.py
"""
from __future__ import annotations

import argparse
from pathlib import Path

IMPORT_OLD = "import numpy as np\nimport torch\n"
IMPORT_NEW = "import json\nimport os\nimport time\nfrom pathlib import Path\n\nimport numpy as np\nimport torch\n"

GLOBAL_OLD = "from vllm.v1.worker.gpu.states import RequestState\n\n\nclass Sampler:\n"
GLOBAL_NEW = r'''from vllm.v1.worker.gpu.states import RequestState

_EPKV_LOGIT_SEEN = 0
_ENV_EPKV_LOGIT_BIAS_IDS = "VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS"
_ENV_EPKV_LOGIT_BIAS = "VLLM_EPKV_LOGIT_BIAS"
_ENV_EPKV_LOGIT_LOG = "VLLM_EPKV_LOGIT_LOG"
_ENV_EPKV_LOGIT_MAX_EVENTS = "VLLM_EPKV_LOGIT_MAX_EVENTS"
_ENV_EPKV_LOGIT_TAG = "VLLM_EPKV_LOGIT_TAG"


def _epkv_parse_ids(spec: str) -> list[int]:
    out: list[int] = []
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            out.append(int(part))
        except Exception:
            continue
    return out


def _epkv_float_env(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, str(default)))
    except Exception:
        return default


def _epkv_int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except Exception:
        return default


def _epkv_topk(logits: torch.Tensor, k: int = 10) -> list[dict[str, float | int]]:
    if logits.numel() == 0:
        return []
    kk = min(k, int(logits.shape[-1]))
    vals, idx = torch.topk(logits[0].detach().float(), kk, dim=-1)
    return [
        {"token_id": int(i), "logit": float(v)}
        for i, v in zip(idx.cpu().tolist(), vals.cpu().tolist())
    ]


def _epkv_write_logit_event(event: dict) -> None:
    path_s = os.environ.get(_ENV_EPKV_LOGIT_LOG)
    if not path_s:
        return
    path = Path(path_s)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, sort_keys=True) + "\n")


class Sampler:
'''

SAMPLE_OLD = '''        # Sample the next token.
        sampled = gumbel_sample(
            processed_logits,
            expanded_idx_mapping,
            self.sampling_states.temperature.gpu,
            self.sampling_states.seeds.gpu,
            pos,
            apply_temperature=False,
        )
        return sampled, processed_logits
'''

SAMPLE_NEW = r'''        global _EPKV_LOGIT_SEEN
        epkv_token_ids = _epkv_parse_ids(os.environ.get(_ENV_EPKV_LOGIT_BIAS_IDS, ""))
        epkv_bias = _epkv_float_env(_ENV_EPKV_LOGIT_BIAS, 0.0)
        epkv_max_events = _epkv_int_env(_ENV_EPKV_LOGIT_MAX_EVENTS, 64)
        epkv_event = None
        if epkv_token_ids and epkv_bias != 0.0 and _EPKV_LOGIT_SEEN < epkv_max_events:
            before_top = _epkv_topk(processed_logits, 10)
            valid_ids = [i for i in epkv_token_ids if 0 <= i < processed_logits.shape[-1]]
            if valid_ids:
                ids_t = torch.tensor(valid_ids, device=processed_logits.device, dtype=torch.long)
                processed_logits[:, ids_t] += float(epkv_bias)
            after_top = _epkv_topk(processed_logits, 10)
            epkv_event = {
                "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                "tag": os.environ.get(_ENV_EPKV_LOGIT_TAG, ""),
                "event_index": int(_EPKV_LOGIT_SEEN),
                "hook": "epkv.sampler.logit_policy.v0",
                "bias": float(epkv_bias),
                "token_ids": valid_ids,
                "logits_shape": list(processed_logits.shape),
                "before_top": before_top,
                "after_top": after_top,
            }

        # Sample the next token.
        sampled = gumbel_sample(
            processed_logits,
            expanded_idx_mapping,
            self.sampling_states.temperature.gpu,
            self.sampling_states.seeds.gpu,
            pos,
            apply_temperature=False,
        )
        if epkv_event is not None:
            epkv_event["sampled_token_ids"] = [int(x) for x in sampled.detach().view(-1).cpu().tolist()]
            _epkv_write_logit_event(epkv_event)
            _EPKV_LOGIT_SEEN += 1
        return sampled, processed_logits
'''


def patch_text(text: str) -> str:
    if "epkv.sampler.logit_policy.v0" in text:
        return text
    if IMPORT_OLD not in text:
        raise SystemExit("import anchor not found")
    text = text.replace(IMPORT_OLD, IMPORT_NEW, 1)
    if GLOBAL_OLD not in text:
        raise SystemExit("global/class anchor not found")
    text = text.replace(GLOBAL_OLD, GLOBAL_NEW, 1)
    if SAMPLE_OLD not in text:
        raise SystemExit("sample anchor not found")
    text = text.replace(SAMPLE_OLD, SAMPLE_NEW, 1)
    return text


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("path")
    p.add_argument("--backup-suffix", default=".bak-epkv-logit-policy")
    args = p.parse_args()
    path = Path(args.path)
    text = path.read_text(encoding="utf-8")
    new = patch_text(text)
    if new == text:
        print("already patched")
        return
    backup = path.with_name(path.name + args.backup_suffix)
    if not backup.exists():
        backup.write_text(text, encoding="utf-8")
    path.write_text(new, encoding="utf-8")
    print(f"patched {path} backup={backup}")


if __name__ == "__main__":
    main()
