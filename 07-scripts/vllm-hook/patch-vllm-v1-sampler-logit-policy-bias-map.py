#!/usr/bin/env python3
"""Extend dynamic EPKV sampler policy file with per-token bias_map.

Supports both:

```json
{"enabled": true, "token_ids": [53], "bias": 3}
```

and:

```json
{"enabled": true, "bias_map": {"53": 3, "28715": -10}}
```

This enables state-aware policies such as positive candidate bias plus negative
scaffold suppression inside the live sampler hook.
"""
from __future__ import annotations

import argparse
from pathlib import Path

FUNC_OLD = r'''def _epkv_apply_env_logit_policy(logits: torch.Tensor) -> tuple[torch.Tensor, dict | None]:
    global _EPKV_V1_LOGIT_SEEN
    policy = _epkv_load_policy_file()
    policy_enabled = bool(policy and policy.get("enabled"))
    if policy_enabled:
        token_ids = _epkv_policy_ids(policy.get("token_ids", []))
        try:
            bias = float(policy.get("bias", 0.0))
        except Exception:
            bias = 0.0
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
        "tag": tag,
        "event_index": int(_EPKV_V1_LOGIT_SEEN),
        "hook": "epkv.v1.sample.sampler.logit_policy.v1.file",
        "policy_file": None if policy is None else policy.get("path"),
        "policy_enabled": policy_enabled,
        "bias": float(bias),
        "token_ids": valid_ids,
        "logits_shape": list(logits.shape),
        "before_top": before_top,
        "after_top": after_top,
    }
    return logits, event
'''

FUNC_NEW = r'''def _epkv_apply_env_logit_policy(logits: torch.Tensor) -> tuple[torch.Tensor, dict | None]:
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
'''


def patch_text(text: str) -> str:
    if "epkv.v1.sample.sampler.logit_policy.v2.bias_map" in text:
        return text
    if FUNC_OLD not in text:
        raise SystemExit("policy function anchor not found")
    return text.replace(FUNC_OLD, FUNC_NEW, 1)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("path")
    p.add_argument("--backup-suffix", default=".bak-epkv-v1-logit-policy-bias-map")
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
