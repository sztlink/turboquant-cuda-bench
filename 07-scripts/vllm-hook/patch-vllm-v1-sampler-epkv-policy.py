#!/usr/bin/env python3
"""Canonical one-shot patch for active vLLM v1 sampler EPKV policy.

Target:
    vllm/v1/sample/sampler.py

Adds the final default-off EPKV sampler policy hook in one patch:

- dynamic JSON policy file: `VLLM_EPKV_LOGIT_POLICY_FILE`
- per-token `bias_map` for positive candidate bias + negative scaffold suppression
- JSONL telemetry at `VLLM_EPKV_LOGIT_LOG`
- env fallback: `VLLM_EPKV_LOGIT_BIAS_TOKEN_IDS` + `VLLM_EPKV_LOGIT_BIAS`

Hook point:
    after `apply_logits_processors(...)`, before `self.sample(...)`.
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
_ENV_EPKV_LOGIT_POLICY_FILE = "VLLM_EPKV_LOGIT_POLICY_FILE"


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


def _epkv_load_policy_file() -> dict | None:
    path_s = os.environ.get(_ENV_EPKV_LOGIT_POLICY_FILE, "")
    if not path_s:
        return None
    path = Path(path_s)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"enabled": False, "error": str(exc), "path": str(path)}
    if not isinstance(data, dict):
        return {"enabled": False, "error": "policy file is not an object", "path": str(path)}
    data["path"] = str(path)
    return data


def _epkv_policy_ids(raw: object) -> list[int]:
    if isinstance(raw, str):
        return _epkv_parse_ids(raw)
    if isinstance(raw, list):
        out: list[int] = []
        for x in raw:
            try:
                out.append(int(x))
            except Exception:
                continue
        return out
    return []


def _epkv_apply_env_logit_policy(logits: torch.Tensor) -> tuple[torch.Tensor, dict | None]:
    global _EPKV_V1_LOGIT_SEEN
    policy = _epkv_load_policy_file()
    policy_enabled = bool(policy and policy.get("enabled"))
    bias_pairs: list[tuple[int, float]] = []
    if policy_enabled:
        raw_bias_map = policy.get("bias_map")
        if isinstance(raw_bias_map, dict):
            for k, v in raw_bias_map.items():
                try:
                    bias_pairs.append((int(k), float(v)))
                except Exception:
                    continue
        else:
            token_ids = _epkv_policy_ids(policy.get("token_ids", []))
            try:
                bias = float(policy.get("bias", 0.0))
            except Exception:
                bias = 0.0
            bias_pairs = [(i, bias) for i in token_ids]
        try:
            max_events = int(policy.get("max_events", _epkv_int_env(_ENV_EPKV_LOGIT_MAX_EVENTS, 64)))
        except Exception:
            max_events = _epkv_int_env(_ENV_EPKV_LOGIT_MAX_EVENTS, 64)
        tag = str(policy.get("tag", os.environ.get(_ENV_EPKV_LOGIT_TAG, "")))
    else:
        token_ids = _epkv_parse_ids(os.environ.get(_ENV_EPKV_LOGIT_BIAS_IDS, ""))
        bias = _epkv_float_env(_ENV_EPKV_LOGIT_BIAS, 0.0)
        max_events = _epkv_int_env(_ENV_EPKV_LOGIT_MAX_EVENTS, 64)
        tag = os.environ.get(_ENV_EPKV_LOGIT_TAG, "")
        bias_pairs = [(i, bias) for i in token_ids]
    valid_pairs = [(i, b) for i, b in bias_pairs if b != 0.0 and 0 <= i < logits.shape[-1]]
    if not valid_pairs or _EPKV_V1_LOGIT_SEEN >= max_events:
        return logits, None
    before_top = _epkv_topk(logits, 10)
    for token_id, token_bias in valid_pairs:
        logits[:, token_id] += float(token_bias)
    after_top = _epkv_topk(logits, 10)
    event = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "tag": tag,
        "event_index": int(_EPKV_V1_LOGIT_SEEN),
        "hook": "epkv.v1.sample.sampler.logit_policy.v2.bias_map",
        "policy_file": None if policy is None else policy.get("path"),
        "policy_enabled": policy_enabled,
        "bias_map": {str(i): float(b) for i, b in valid_pairs},
        "token_ids": [int(i) for i, _ in valid_pairs],
        "logits_shape": list(logits.shape),
        "before_top": before_top,
        "after_top": after_top,
    }
    return logits, event


class Sampler(nn.Module):
'''

HOOK_OLD = '''        logits = self.apply_logits_processors(
            logits, sampling_metadata, predict_bonus_token
        )
        # Sample the next token.
        sampled, processed_logprobs = self.sample(logits, sampling_metadata)
'''
HOOK_NEW = r'''        logits = self.apply_logits_processors(
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
    if "epkv.v1.sample.sampler.logit_policy.v2.bias_map" in text:
        return text
    if IMPORT_OLD not in text:
        raise SystemExit("import anchor not found")
    text = text.replace(IMPORT_OLD, IMPORT_NEW, 1)
    if GLOBAL_OLD not in text:
        raise SystemExit("global/class anchor not found")
    text = text.replace(GLOBAL_OLD, GLOBAL_NEW, 1)
    if HOOK_OLD not in text:
        raise SystemExit("forward hook anchor not found")
    return text.replace(HOOK_OLD, HOOK_NEW, 1)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("path")
    p.add_argument("--backup-suffix", default=".bak-epkv-v1-sampler-policy")
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
