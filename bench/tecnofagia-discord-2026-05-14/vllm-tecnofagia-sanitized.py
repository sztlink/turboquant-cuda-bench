"""
Tecnofagia bench, sanitized runner.

Same fixture intent as vllm-tecnofagia.py, but does not print or persist model
answers, system prompts, or Discord-derived chunks. It only records hit/miss,
token counts, timing, and decoy source metadata.

Use for unattended/commit-safe overnight runs. Raw mapping remains local/ignored.
"""
import json
import os
import sys
import time
from pathlib import Path

os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

MAPPING = os.environ.get(
    "TECNOFAGIA_MAPPING",
    "/home/felipe/CASK/experiments/tecnofagia/tecnofagia-mapping.json",
)
OUT_DIR = Path(os.environ.get(
    "TECNOFAGIA_OUT_DIR",
    "/home/felipe/CASK/experiments/tecnofagia/results",
))


def main():
    from vllm import LLM, SamplingParams
    import vllm

    kv_dtype = sys.argv[1] if len(sys.argv) > 1 else "auto"
    mapping = json.load(open(MAPPING, encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"# {len(mapping)} payloads · kv_cache_dtype={kv_dtype} · TECNOFAGIA sanitized", flush=True)
    print(f"# mapping={MAPPING}", flush=True)
    print(f"# out_dir={OUT_DIR}", flush=True)

    t0 = time.time()
    llm = LLM(
        model="Qwen/Qwen2.5-7B-Instruct",
        kv_cache_dtype=kv_dtype,
        max_model_len=16384,
        gpu_memory_utilization=0.85,
        enforce_eager=True,
    )
    print(f"[{time.time()-t0:.1f}s] LLM loaded", flush=True)

    sp = SamplingParams(temperature=0.0, max_tokens=128, seed=42)

    results = []
    for r in mapping:
        handle = r["handle"]
        expected = r["expected"]
        messages = r["messages"]
        t1 = time.time()
        out = llm.chat(messages, sp)
        gen_time = time.time() - t1
        answer = out[0].outputs[0].text.strip()
        hit = expected in answer
        prompt_tok = len(out[0].prompt_token_ids)
        out_tok = len(out[0].outputs[0].token_ids)
        rec = {
            "handle": handle,
            "expected_sha256": __import__("hashlib").sha256(expected.encode()).hexdigest(),
            "hit": hit,
            "gen_time_s": round(gen_time, 2),
            "prompt_tok": prompt_tok,
            "out_tok": out_tok,
            "answer_chars": len(answer),
            "decoy_sources": r.get("_tecnofagia", {}).get("decoy_sources", []),
        }
        results.append(rec)
        print(
            f"[tecnofagia·{kv_dtype}] {handle:25s} hit={hit} "
            f"gen={gen_time:.1f}s tok_in={prompt_tok} tok_out={out_tok} answer_chars={len(answer)}",
            flush=True,
        )

    summary = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "kv_cache_dtype": kv_dtype,
        "fixture": "tecnofagia (Discord Waffle decoys, canonical preserved)",
        "privacy": "sanitized: no prompts, no Discord chunks, no model answers",
        "max_model_len": 16384,
        "n_prompts": len(results),
        "n_hits": sum(r["hit"] for r in results),
        "results": results,
        "vllm_version": vllm.__version__,
    }

    out_path = OUT_DIR / f"results-{kv_dtype}-{time.strftime('%Y%m%d-%H%M%S')}.json"
    out_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"SANITIZED_RESULTS {out_path}", flush=True)
    print(f"DECOY_RESULT_OK kv={kv_dtype} hits={summary['n_hits']}/{summary['n_prompts']} (tecnofagia)", flush=True)


if __name__ == "__main__":
    main()
