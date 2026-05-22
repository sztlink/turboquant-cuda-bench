#!/usr/bin/env python3
"""Extend active vLLM v1 sampler EPKV hook with a dynamic policy file.

The env-only hook proves the internal sampler path, but env changes require a
service restart. This patch adds:

    VLLM_EPKV_LOGIT_POLICY_FILE=/path/policy.json

On every sampled token the hook can read a tiny JSON policy, so the integrated
runner can enable/disable candidate bias without restarting vLLM.

Policy example:

```json
{"enabled": true, "token_ids": [53, 647, 36125], "bias": 3, "max_events": 8, "tag": "adv2"}
```
"""
from __future__ import annotations

import argparse
from pathlib import Path

CONST_OLD = '_ENV_EPKV_LOGIT_TAG = "VLLM_EPKV_LOGIT_TAG"\n'
CONST_NEW = '_ENV_EPKV_LOGIT_TAG = "VLLM_EPKV_LOGIT_TAG"\n_ENV_EPKV_LOGIT_POLICY_FILE = "VLLM_EPKV_LOGIT_POLICY_FILE"\n'

HELPER_ANCHOR = '''def _epkv_write_logit_event(event: dict) -> None:
    path_s = os.environ.get(_ENV_EPKV_LOGIT_LOG)
    if not path_s:
        return
    path = Path(path_s)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, sort_keys=True) + "\\n")


'''
HELPER_NEW = HELPER_ANCHOR + r'''def _epkv_load_policy_file() -> dict | None:
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


'''

FUNC_OLD = r'''def _epkv_apply_env_logit_policy(logits: torch.Tensor) -> tuple[torch.Tensor, dict | None]:
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
'''

FUNC_NEW = r'''def _epkv_apply_env_logit_policy(logits: torch.Tensor) -> tuple[torch.Tensor, dict | None]:
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


def patch_text(text: str) -> str:
    if "epkv.v1.sample.sampler.logit_policy.v1.file" in text:
        return text
    if CONST_OLD not in text:
        raise SystemExit("constant anchor not found")
    text = text.replace(CONST_OLD, CONST_NEW, 1)
    if HELPER_ANCHOR not in text:
        raise SystemExit("helper anchor not found")
    text = text.replace(HELPER_ANCHOR, HELPER_NEW, 1)
    if FUNC_OLD not in text:
        raise SystemExit("policy function anchor not found")
    return text.replace(FUNC_OLD, FUNC_NEW, 1)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("path")
    p.add_argument("--backup-suffix", default=".bak-epkv-v1-logit-policy-file")
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
