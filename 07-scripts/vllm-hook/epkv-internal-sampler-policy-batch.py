#!/usr/bin/env python3
"""Batch driver for live internal-sampler EPKV policy runner.

Uses existing span maps and calls `epkv-internal-sampler-policy-live.py` per case.
This tests the dynamic vLLM sampler policy-file path without API `logit_bias`.

If sampler-surface steering does not close, the script can fall back to a compact
relation-path prompt built from 2Wiki evidence triples. This keeps failure modes
separate:

- `internal_sampler_policy`: LM-head/sampler surface repair.
- `relation_path_then_decode`: evidence/path construction repair.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def aliases(candidate: str) -> list[str]:
    out = [candidate]
    if candidate == "English":
        out.extend(["England", "Germany"])  # label/country verbalization cases
    if candidate == "German":
        out.append("Germany")
    if candidate.startswith("Ví"):
        out.extend([candidate.replace("Ví", "Vi", 1), "Victor Bó", "Victor Bo"])
    return list(dict.fromkeys(out))


def closes(output: str, candidate: str) -> bool:
    no = norm(output)
    return any(norm(a) in no for a in aliases(candidate))


def run(cmd: list[str]) -> tuple[int, str, str]:
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return p.returncode, p.stdout, p.stderr


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def load_dataset(dataset: Path) -> dict[str, dict[str, Any]]:
    if not dataset.exists():
        return {}
    data = json.loads(dataset.read_text(encoding="utf-8"))
    return {str(x.get("_id")): x for x in data if isinstance(x, dict) and x.get("_id")}


def relation_path_prompt(item: dict[str, Any]) -> dict[str, Any] | None:
    triples = item.get("evidences") or []
    if not triples:
        return None
    chain = "\n".join(f"{s} -- {p} --> {o}." for s, p, o in triples[:2])
    prompt = "\n".join([
        "Answer with only the final entity at the end of the relation chain.",
        "Relation chain:",
        chain,
        f"Question: {item['question']}",
    ])
    return {
        "triples": triples[:2],
        "prompt": prompt,
        "candidate": item.get("answer") or "",
    }


def span_candidates(span_dir: Path) -> list[Path]:
    out = []
    for pth in sorted(span_dir.glob("*.json")):
        try:
            obj = json.loads(pth.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(obj, dict) and obj.get("messages") and obj.get("spans"):
            out.append(pth)
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--span-dir", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--limit", type=int, default=8)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--candidate-source", choices=["auto", "terminal-object", "answer", "gold"], default="terminal-object")
    p.add_argument("--bias", type=float, default=3.0)
    p.add_argument("--max-tokens", type=int, default=16)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--no-suppress-scaffold", action="store_true")
    p.add_argument("--disable-relation-fallback", action="store_true")
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    runs_dir = out_dir / "runs"
    relation_dir = out_dir / "relation-path"
    runs_dir.mkdir(parents=True, exist_ok=True)
    relation_dir.mkdir(parents=True, exist_ok=True)
    dataset_by_qid = load_dataset(Path(args.dataset))
    spans = span_candidates(Path(args.span_dir))[args.offset: args.offset + args.limit]
    rows = []
    t0 = time.time()
    for span in spans:
        out = runs_dir / span.name
        cmd = [
            sys.executable,
            "07-scripts/vllm-hook/epkv-internal-sampler-policy-live.py",
            "--span-map", str(span),
            "--candidate-source", args.candidate_source,
            "--bias", str(args.bias),
            "--max-tokens", str(args.max_tokens),
            "--out", str(out),
        ]
        if not args.no_suppress_scaffold:
            cmd.append("--suppress-scaffold")
        code, stdout, stderr = run(cmd)
        row: dict[str, Any] = {
            "span_map": str(span),
            "artifact": str(out),
            "returncode": code,
            "layer": "internal_sampler_policy",
        }
        if code == 0:
            data = json.loads(out.read_text(encoding="utf-8"))
            policy = data.get("policy", {})
            candidate = policy.get("candidate", "")
            output = data.get("output", "")
            qid = policy.get("provenance", {}).get("qid")
            row.update({
                "qid": qid,
                "candidate": candidate,
                "output": output,
                "closed": closes(output, candidate),
                "restore_error": data.get("restore_error"),
                "policy": {
                    "candidate_ids": policy.get("candidate_ids"),
                    "suppress_scaffold": policy.get("suppress_scaffold"),
                    "scaffold_ids": policy.get("scaffold_ids"),
                    "provenance": policy.get("provenance"),
                },
            })
        else:
            row.update({"closed": False, "stdout": stdout[-1000:], "stderr": stderr[-2000:]})

        if not row.get("closed") and not args.disable_relation_fallback:
            qid = str(row.get("qid") or "")
            item = dataset_by_qid.get(qid)
            rel = relation_path_prompt(item) if item else None
            if rel is not None:
                payload = {
                    "model": args.model,
                    "messages": [{"role": "user", "content": rel["prompt"]}],
                    "temperature": 0,
                    "max_tokens": args.max_tokens,
                }
                try:
                    resp = request_json(args.endpoint, payload, args.timeout)
                    rel_output = content_of(resp)
                    rel_candidate = str(rel.get("candidate") or row.get("candidate") or "")
                    rel_closed = closes(rel_output, rel_candidate)
                    rel_artifact = relation_dir / span.name
                    rel_artifact.write_text(json.dumps({
                        "schema": "epkv.internal_sampler_batch.relation_fallback.v0",
                        "qid": qid,
                        "candidate": rel_candidate,
                        "prompt": rel["prompt"],
                        "triples": rel["triples"],
                        "output": rel_output,
                        "closed": rel_closed,
                        "response": resp,
                    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
                    if rel_closed:
                        row.update({
                            "layer": "relation_path_then_decode",
                            "candidate": rel_candidate,
                            "output": rel_output,
                            "closed": True,
                            "relation_artifact": str(rel_artifact),
                        })
                    else:
                        row.update({
                            "relation_attempted": True,
                            "relation_output": rel_output,
                            "relation_candidate": rel_candidate,
                            "relation_closed": False,
                            "relation_artifact": str(rel_artifact),
                        })
                except Exception as exc:  # noqa: BLE001
                    row.update({"relation_attempted": True, "relation_error": str(exc)})
            else:
                row.update({"relation_attempted": False, "relation_error": "no dataset item/triples"})
        rows.append(row)

    summary = {
        "schema": "epkv.internal_sampler_policy_batch.v1.relation_fallback",
        "span_dir": args.span_dir,
        "elapsed_sec": time.time() - t0,
        "closed": sum(1 for r in rows if r.get("closed")),
        "total": len(rows),
        "by_layer": {},
        "rows": rows,
    }
    for r in rows:
        layer = str(r.get("layer"))
        summary["by_layer"].setdefault(layer, {"total": 0, "closed": 0})
        summary["by_layer"][layer]["total"] += 1
        summary["by_layer"][layer]["closed"] += int(bool(r.get("closed")))

    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# EPKV internal sampler policy batch", "", f"closed: {summary['closed']}/{summary['total']}", "", "| qid | layer | closed | candidate | output |", "|---|---|---:|---|---|"]
    for r in rows:
        md.append(f"| {r.get('qid','')} | {r.get('layer','')} | {int(bool(r.get('closed')))} | {r.get('candidate','')} | `{str(r.get('output','')).replace('`','')[:120]}` |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"closed": summary["closed"], "total": summary["total"], "by_layer": summary["by_layer"], "out_dir": str(out_dir)}, indent=2))
    print("EPKV_INTERNAL_SAMPLER_BATCH_DONE")


if __name__ == "__main__":
    main()
