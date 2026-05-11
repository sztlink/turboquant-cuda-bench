import os, time, json
os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

def main():
    from vllm import LLM, SamplingParams
    t0 = time.time()
    llm = LLM(
        model="Qwen/Qwen2.5-7B-Instruct",
        kv_cache_dtype="turboquant_k8v4",
        max_model_len=16384,
        gpu_memory_utilization=0.85,
        enforce_eager=True,
        trust_remote_code=False,
    )
    load_time = time.time() - t0
    print(f"[{load_time:.1f}s] LLM loaded", flush=True)

    prompts = [
        "Compute 17 * 23 step by step. Show your work in 2 lines, then give the final answer.",
        "Write three sentences describing the color blue, each from a different perspective: physicist, painter, poet.",
        "Explain in one short paragraph what KV cache compression means in transformer inference.",
    ]
    sp = SamplingParams(temperature=0.0, max_tokens=200, seed=42)
    t1 = time.time()
    outs = llm.generate(prompts, sp)
    gen_time = time.time() - t1
    print(f"[{gen_time:.2f}s] generation done", flush=True)
    print()
    total_out_tokens = 0
    for i, o in enumerate(outs):
        out_tokens = len(o.outputs[0].token_ids)
        total_out_tokens += out_tokens
        print(f"--- prompt {i+1} ({out_tokens} tok) ---")
        print("Q:", o.prompt)
        print("A:", o.outputs[0].text)
        print()
    summary = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "kv_cache_dtype": "turboquant_k8v4",
        "max_model_len": 16384,
        "load_time_s": round(load_time, 2),
        "generate_time_s": round(gen_time, 2),
        "n_prompts": len(prompts),
        "total_out_tokens": total_out_tokens,
        "decode_tok_per_s": round(total_out_tokens / gen_time, 2),
        "vllm_version": __import__("vllm").__version__,
    }
    print("SMOKE_RESULT_JSON=" + json.dumps(summary))

if __name__ == "__main__":
    main()
