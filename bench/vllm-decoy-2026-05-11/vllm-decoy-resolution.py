import os, time, json
os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

def main():
    from vllm import LLM, SamplingParams

    mapping = json.load(open("/home/felipe/vllm-lab/decoy/res-mapping.json"))
    print(f"# {len(mapping)} payloads", flush=True)

    t0 = time.time()
    llm = LLM(
        model="Qwen/Qwen2.5-7B-Instruct",
        kv_cache_dtype="turboquant_k8v4",
        max_model_len=16384,
        gpu_memory_utilization=0.85,
        enforce_eager=True,
    )
    print(f"[{time.time()-t0:.1f}s] LLM loaded", flush=True)

    sp = SamplingParams(temperature=0.0, max_tokens=128, seed=42)

    results = []
    for r in mapping:
        t1 = time.time()
        out = llm.chat(r["messages"], sp)
        gen_time = time.time() - t1
        answer = out[0].outputs[0].text.strip()
        hit = r["expected"] in answer
        v3 = os.environ.get("VLLM_TRIATT_ENABLED","0")
        results.append({
            "op": r["op"],
            "handle": r["handle"],
            "expected": r["expected"],
            "answer": answer[:300],
            "hit": hit,
            "llama_cpp_answer": r["llama_cpp_answer"],
            "gen_time_s": round(gen_time, 2),
            "prompt_tok": len(out[0].prompt_token_ids),
            "out_tok": len(out[0].outputs[0].token_ids),
        })
        print(f"[V3={v3}] {r['op']:35s} {r['handle']:25s} hit={hit}  gen={gen_time:.1f}s  answer={answer[:80]!r}", flush=True)

    summary = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "kv_cache_dtype": "turboquant_k8v4",
        "max_model_len": 16384,
        "v3_enabled": os.environ.get("VLLM_TRIATT_ENABLED","0"),
        "n_prompts": len(results),
        "n_hits": sum(r["hit"] for r in results),
        "by_op": {},
        "results": results,
        "vllm_version": __import__("vllm").__version__,
    }
    for r in results:
        summary["by_op"].setdefault(r["op"], {"hits": 0, "n": 0})
        summary["by_op"][r["op"]]["n"] += 1
        if r["hit"]:
            summary["by_op"][r["op"]]["hits"] += 1
    print()
    print(json.dumps(summary, indent=2))
    print(f"RESOLUTION_RESULT_OK hits={summary['n_hits']}/{summary['n_prompts']}")

if __name__ == "__main__":
    main()
