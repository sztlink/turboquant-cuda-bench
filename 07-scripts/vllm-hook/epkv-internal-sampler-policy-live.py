#!/usr/bin/env python3
"""Live internal-sampler EPKV policy runner.

Builds a dynamic sampler policy JSON from an EPKV span map, copies it to the
4090 vLLM policy-file path, sends a normal OpenAI-compatible request WITHOUT API
`logit_bias`, then restores the remote policy file to disabled.

This exercises the live vLLM sampler hook:

    vllm/v1/sample/sampler.py
    VLLM_EPKV_LOGIT_POLICY_FILE=/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path
from typing import Any


def sh(cmd: list[str], *, timeout: int = 120) -> str:
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"command failed {p.returncode}: {' '.join(cmd)}\nSTDOUT={p.stdout}\nSTDERR={p.stderr}")
    return p.stdout


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def copy_policy_to_remote(local_policy: Path, host: str, windows_tmp: str, remote_policy_path: str) -> None:
    sh(["scp", str(local_policy), f"{host}:{windows_tmp}"], timeout=120)
    # Convert C:/temp/foo.json to /mnt/c/temp/foo.json for WSL.
    wsl_tmp = windows_tmp.replace("C:/", "/mnt/c/").replace("C:\\", "/mnt/c/").replace("\\", "/")
    sh(["ssh", host, "wsl.exe", "-d", "Ubuntu-24.04", "-u", "felipe", "--", "cp", wsl_tmp, remote_policy_path], timeout=120)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-map", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--host", default="4090")
    p.add_argument("--remote-policy-path", default="/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json")
    p.add_argument("--candidate-source", choices=["auto", "terminal-object", "answer", "gold"], default="auto")
    p.add_argument("--bias", type=float, default=3.0)
    p.add_argument("--suppress-scaffold", action="store_true")
    p.add_argument("--max-events", type=int, default=256)
    p.add_argument("--max-tokens", type=int, default=16)
    p.add_argument("--timeout", type=int, default=120)
    args = p.parse_args()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    span_map = json.loads(Path(args.span_map).read_text(encoding="utf-8"))
    user = span_map["messages"][0]["content"]

    with tempfile.TemporaryDirectory(prefix="epkv-policy-") as td:
        td_path = Path(td)
        policy_path = td_path / "logit-policy.json"
        off_path = td_path / "logit-policy-off.json"
        builder_cmd = [
            sys.executable,
            "07-scripts/vllm-hook/epkv-build-logit-policy-file.py",
            "--span-map", args.span_map,
            "--candidate-source", args.candidate_source,
            "--bias", str(args.bias),
            "--max-events", str(args.max_events),
            "--tag", f"internal-live-{span_map.get('qid', 'case')}",
            "--out", str(policy_path),
        ]
        if args.suppress_scaffold:
            builder_cmd.append("--suppress-scaffold")
        sh(builder_cmd, timeout=180)
        off_path.write_text(json.dumps({"enabled": False, "tag": "default-off"}, ensure_ascii=False) + "\n", encoding="utf-8")

        t0 = time.time()
        response = None
        restore_error = None
        try:
            copy_policy_to_remote(policy_path, args.host, "C:/temp/logit-policy.json", args.remote_policy_path)
            payload = {
                "model": args.model,
                "messages": [{"role": "user", "content": user}],
                "temperature": 0,
                "max_tokens": args.max_tokens,
            }
            response = request_json(args.endpoint, payload, args.timeout)
        finally:
            try:
                copy_policy_to_remote(off_path, args.host, "C:/temp/logit-policy.json", args.remote_policy_path)
            except Exception as exc:  # noqa: BLE001
                restore_error = str(exc)

        policy = json.loads(policy_path.read_text(encoding="utf-8"))
        result = {
            "schema": "epkv.internal_sampler_policy_live.v0",
            "span_map": args.span_map,
            "elapsed_sec": time.time() - t0,
            "policy": policy,
            "output": content_of(response or {}),
            "response": response,
            "restore_error": restore_error,
        }
        out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({"output": result["output"], "candidate": policy.get("candidate"), "restore_error": restore_error}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
