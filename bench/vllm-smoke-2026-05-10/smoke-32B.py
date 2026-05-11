import os, time, json
os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

def main():
    from vllm import LLM, SamplingParams
    t0 = time.time()
    llm = LLM(
        model="Qwen/Qwen2.5-32B-Instruct-AWQ",
        kv_cache_dtype="turboquant_k8v4",
        max_model_len=16384,
        max_num_seqs=4,
        gpu_memory_utilization=0.92,
        enforce_eager=True,
        trust_remote_code=False,
        quantization="awq_marlin",
    )
    load_time = time.time() - t0
    print(f"[{load_time:.1f}s] LLM loaded", flush=True)

    prompts = [
        "Compute 17 * 23 step by step. Show your work in 2 lines, then give the final answer.",
        "Explain in three sentences what KV cache compression buys you in transformer inference. Each sentence should add a distinct angle: memory, latency, accuracy.",
        "Read this snippet (Python) and tell me what is unusual about it:\n\n```\ndef f(x, cache={}):\n    if x not in cache:\n        cache[x] = x * x\n    return cache[x]\n```",
    ]
    sp = SamplingParams(temperature=0.0, max_tokens=300, seed=42)
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
        "model": "Qwen/Qwen2.5-32B-Instruct-AWQ",
        "kv_cache_dtype": "turboquant_k8v4",
        "max_model_len": 16384,
        "max_num_seqs": 4,
        "quantization": "awq_marlin",
        "gpu_memory_utilization": 0.88,
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
