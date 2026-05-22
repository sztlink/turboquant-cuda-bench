#!/usr/bin/env python3
"""Patch vLLM v1/sample/sampler.py with default-off EPKV logit policy.

The earlier GPU-worker sampler hook is not necessarily on the active serving
path. This patch targets the nn.Module sampler used by vLLM v1:

    vllm/v1/sample/sampler.py

It applies env-controlled token bias after built-in logits processors and before
`sample()`, so greedy decoding sees the modified LM-head surface.
"""
from __future__ import annotations

import argparse
from pathlib import Path

IMPORT_OLD = '"""A layer that samples the next tokens from the model\'s outputs."""\n\nimport torch\nimport torch.nn as nn\n'
IMPORT_NEW = '"""A layer that samples the next tokens from the model\'s outputs."""\n\nimport json\nimport os\nimport time\nfrom pathlib import Path\n\nimport torch\nimport torch.nn as nn\n'

GLOBAL_OLD = "_SAMPLING_EPS = 1e-5\n\n\nclass Sampler(nn.Module):\n"
GLOBAL_NEW = r'''_SAMPLING_EPS = 1e-5

_EPKV_V1_LOGIT_SEEN = 0
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


def _epkv_apply_env_logit_policy(logits: torch.Tensor) -> tuple[torch.Tensor, dict | None]:
    global _EPKV_V1_LOGIT_SEEN
    token_ids = _epkv_parse_ids(os.environ.get(_ENV_EPKV_LOGIT_BIAS_IDS, ""))
    bias = _epkv_float_env(_ENV_EPKV_LOGIT_BIAS, 0.0)
    max_events = _epkv_int_env(_ENV_EPKV_LOGIT_MAX_EVENTS, 64)
    if not token_ids or bias == 0.0 or _EPKV_V1_LOGIT_SEEN >= max_events:
        return logits, None
    before_top = _epkv_topk(logits, 10)
    valid_ids = [i for i in token_ids if 0 <= i < logits.shape[-1]]
    if valid_ids:
        ids_t = torch.tensor(valid_ids, device=logits.device, dtype=torch.long)
        logits[:, ids_t] += float(bias)
    after_top = _epkv_topk(logits, 10)
    event = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "tag": os.environ.get(_ENV_EPKV_LOGIT_TAG, ""),
        "event_index": int(_EPKV_V1_LOGIT_SEEN),
        "hook": "epkv.v1.sample.sampler.logit_policy.v0",
        "bias": float(bias),
        "token_ids": valid_ids,
        "logits_shape": list(logits.shape),
        "before_top": before_top,
        "after_top": after_top,
    }
    return logits, event


class Sampler(nn.Module):
'''

ANCHOR_OLD = '''        logits = self.apply_logits_processors(
            logits, sampling_metadata, predict_bonus_token
        )
        # Sample the next token.
        sampled, processed_logprobs = self.sample(logits, sampling_metadata)
'''
ANCHOR_NEW = r'''        logits = self.apply_logits_processors(
            logits, sampling_metadata, predict_bonus_token
        )
        epkv_event = None
        logits, epkv_event = _epkv_apply_env_logit_policy(logits)
        # Sample the next token.
        sampled, processed_logprobs = self.sample(logits, sampling_metadata)
        if epkv_event is not None:
            global _EPKV_V1_LOGIT_SEEN
            epkv_event["sampled_token_ids"] = [int(x) for x in sampled.detach().view(-1).cpu().tolist()]
            _epkv_write_logit_event(epkv_event)
            _EPKV_V1_LOGIT_SEEN += 1
'''


def patch_text(text: str) -> str:
    if "epkv.v1.sample.sampler.logit_policy.v0" in text:
        return text
    if IMPORT_OLD not in text:
        raise SystemExit("import anchor not found")
    text = text.replace(IMPORT_OLD, IMPORT_NEW, 1)
    if GLOBAL_OLD not in text:
        raise SystemExit("global/class anchor not found")
    text = text.replace(GLOBAL_OLD, GLOBAL_NEW, 1)
    if ANCHOR_OLD not in text:
        raise SystemExit("forward/sample anchor not found")
    text = text.replace(ANCHOR_OLD, ANCHOR_NEW, 1)
    return text


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("path")
    p.add_argument("--backup-suffix", default=".bak-epkv-v1-logit-policy")
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
