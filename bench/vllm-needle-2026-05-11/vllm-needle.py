import os, time, json, sys
os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

def main():
    from vllm import LLM, SamplingParams

    manifest = json.load(open("/home/felipe/vllm-lab/needle/prompt_manifest.json"))

    target_depths = {os.environ.get("NEEDLE_DEPTH", "128K")}
    items = [m for m in manifest if m["label"] in target_depths]
    max_ctx = {"128K": 131072, "160K": 163840, "192K": 196608}[list(target_depths)[0]]

    print(f"# starting load, target_depths={target_depths}, max_model_len={max_ctx}", flush=True)
    t0 = time.time()
    llm = LLM(
        model="Qwen/Qwen2.5-7B-Instruct",
        kv_cache_dtype="turboquant_k8v4",
        max_model_len=max_ctx,
        gpu_memory_utilization=0.88,
        enforce_eager=True,
        hf_overrides={
            "rope_scaling": {
                "rope_type": "yarn",
                "factor": float(os.environ.get("NEEDLE_FACTOR") or max(1.0, max_ctx / 32768)),
                "original_max_position_embeddings": 32768,
            }
        },
    )
    load_time = time.time() - t0
    print(f"[{load_time:.1f}s] LLM loaded", flush=True)

    sp = SamplingParams(temperature=0.0, max_tokens=64, seed=42)

    results = []
    for item in items:
        prompt_path = f"/home/felipe/vllm-lab/needle/prompts/{item['file']}"
        prompt_text = open(prompt_path).read()
        expected = item["key"]

        t1 = time.time()
        outs = llm.generate([prompt_text], sp)
        gen_time = time.time() - t1

        answer = outs[0].outputs[0].text
        hit = expected in answer
        out_tokens = len(outs[0].outputs[0].token_ids)
        prompt_tokens = len(outs[0].prompt_token_ids)

        result = {
            "context": item["label"],
            "pos": item["posLabel"],
            "key": expected,
            "hit": hit,
            "prompt_tok": prompt_tokens,
            "out_tok": out_tokens,
            "gen_time_s": round(gen_time, 2),
            "decode_tok_per_s": round(out_tokens / max(gen_time, 0.001), 2),
            "answer_excerpt": answer.strip()[:200],
        }
        results.append(result)
        print(f"[{item['label']}/{item['posLabel']}] hit={hit} tok={prompt_tokens} gen={gen_time:.1f}s ans={answer.strip()[:80]!r}", flush=True)

    print()
    print("=== AGGREGATE ===")
    summary = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "kv_cache_dtype": "turboquant_k8v4",
        "max_model_len": max_ctx,
        "depth_label": list(target_depths)[0],
        "load_time_s": round(load_time, 2),
        "n_prompts": len(results),
        "n_hits": sum(r["hit"] for r in results),
        "results": results,
        "vllm_version": __import__("vllm").__version__,
    }
    print(json.dumps(summary, indent=2))
    print(f"NEEDLE_RESULT_JSON_OK n_hits={summary['n_hits']}/{summary['n_prompts']}")

if __name__ == "__main__":
    main()
