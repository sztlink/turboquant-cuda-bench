"""
Tecnofagia bench: same fixture (seed=42, temp=0, max_tokens=128) as
vllm-decoy-dtype-sweep.py, but with decoys replaced by real Discord chunks.

Pergunta: invariante 5/5 nos 5 handles "hit-class" sobrevive a decoys reais?
"""
import os, sys, time, json

os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

MAPPING = "/home/felipe/CASK/experiments/tecnofagia/tecnofagia-mapping.json"

def main():
    from vllm import LLM, SamplingParams

    kv_dtype = sys.argv[1] if len(sys.argv) > 1 else "auto"
    mapping = json.load(open(MAPPING))
    print(f"# {len(mapping)} payloads · kv_cache_dtype={kv_dtype} · TECNOFAGIA decoy pool", flush=True)

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
            "expected": expected,
            "answer": answer[:300],
            "hit": hit,
            "gen_time_s": round(gen_time, 2),
            "prompt_tok": prompt_tok,
            "out_tok": out_tok,
            "decoy_sources": r.get("_tecnofagia", {}).get("decoy_sources", []),
        }
        results.append(rec)
        print(f"[tecnofagia·{kv_dtype}] {handle:25s} hit={hit}  gen={gen_time:.1f}s tok_in={prompt_tok} tok_out={out_tok}  answer={answer[:80]!r}", flush=True)

    summary = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "kv_cache_dtype": kv_dtype,
        "fixture": "tecnofagia (Discord Waffle decoys, canonical preserved)",
        "max_model_len": 16384,
        "n_prompts": len(results),
        "n_hits": sum(r["hit"] for r in results),
        "results": results,
        "vllm_version": __import__("vllm").__version__,
    }
    print()
    print(json.dumps(summary, indent=2))
    print(f"DECOY_RESULT_OK kv={kv_dtype} hits={summary['n_hits']}/{summary['n_prompts']} (tecnofagia)")

if __name__ == "__main__":
    main()
