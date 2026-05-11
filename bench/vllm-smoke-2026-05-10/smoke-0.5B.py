import os, time, json
os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")
os.environ.setdefault("VLLM_LOGGING_LEVEL", "INFO")

def main():
    from vllm import LLM, SamplingParams
    t0 = time.time()
    print(f"[{0:.1f}s] starting LLM load...", flush=True)
    llm = LLM(
        model="Qwen/Qwen2.5-0.5B-Instruct",
        kv_cache_dtype="turboquant_k8v4",
        max_model_len=8192,
        gpu_memory_utilization=0.50,
        enforce_eager=True,
        trust_remote_code=False,
    )
    load_time = time.time() - t0
    print(f"[{load_time:.1f}s] LLM loaded", flush=True)

    prompts = [
        "Write one sentence describing the color blue.",
        "What is 17 * 23? Answer with just the number.",
    ]
    sp = SamplingParams(temperature=0.0, max_tokens=64, seed=42)

    t1 = time.time()
    outs = llm.generate(prompts, sp)
    gen_time = time.time() - t1
    print(f"[{gen_time:.2f}s] generation done", flush=True)
    print()
    for i, o in enumerate(outs):
        print(f"--- prompt {i+1} ---")
        print("Q:", o.prompt)
        print("A:", o.outputs[0].text)
        print(f"   tokens out={len(o.outputs[0].token_ids)}, finish={o.outputs[0].finish_reason}")
        print()

    summary = {
        "model": "Qwen/Qwen2.5-0.5B-Instruct",
        "kv_cache_dtype": "turboquant_k8v4",
        "max_model_len": 8192,
        "load_time_s": round(load_time, 2),
        "generate_time_s": round(gen_time, 2),
        "n_prompts": len(prompts),
        "vllm_version": __import__("vllm").__version__,
    }
    print("SMOKE_RESULT_JSON=" + json.dumps(summary))

if __name__ == "__main__":
    main()
