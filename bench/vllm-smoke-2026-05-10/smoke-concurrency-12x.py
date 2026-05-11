import os, time, json, subprocess
os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

def gpu_used_mib():
    try:
        r = subprocess.run(["nvidia-smi","--query-gpu=memory.used","--format=csv,noheader,nounits"], capture_output=True, text=True, check=True)
        return int(r.stdout.strip().splitlines()[0])
    except Exception:
        return None

def main():
    from vllm import LLM, SamplingParams
    t0 = time.time()
    llm = LLM(
        model="Qwen/Qwen2.5-7B-Instruct",
        kv_cache_dtype="turboquant_k8v4",
        max_model_len=16384,
        max_num_seqs=12,
        gpu_memory_utilization=0.88,
        enforce_eager=True,
    )
    load_time = time.time() - t0
    print(f"[{load_time:.1f}s] LLM loaded", flush=True)
    gpu_after_load = gpu_used_mib()
    print(f"GPU mib after load: {gpu_after_load}", flush=True)

    # 12 prompts, each ~16K tokens (use the 128K prompts truncated to ~16K-ish through max_model_len cap)
    # Simpler: 12 distinct long-ish prompts at modest length to stress concurrency
    long_text = open("/home/felipe/vllm-lab/needle/prompts/128K-p50.txt").read()
    # take first ~15500 chars per prompt then add a question
    chunk = long_text[:70000]  # ~16K tokens-ish in Qwen tokenizer
    prompts = [chunk + f"\n\nWhat is the SECRET CODE that begins with AYA-? Answer with just the code. (variant {i})" for i in range(12)]

    sp = SamplingParams(temperature=0.0, max_tokens=32, seed=42)

    peak_mib = gpu_after_load or 0
    samples = []
    t1 = time.time()
    
    import threading
    stop = threading.Event()
    def sampler():
        nonlocal peak_mib
        while not stop.is_set():
            m = gpu_used_mib()
            if m is not None:
                peak_mib = max(peak_mib, m)
                samples.append((round(time.time()-t1,2), m))
            time.sleep(0.5)
    th = threading.Thread(target=sampler, daemon=True)
    th.start()

    outs = llm.generate(prompts, sp)
    gen_time = time.time() - t1
    stop.set()
    th.join(timeout=2)

    total_in = sum(len(o.prompt_token_ids) for o in outs)
    total_out = sum(len(o.outputs[0].token_ids) for o in outs)
    summary = {
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "kv_cache_dtype": "turboquant_k8v4",
        "max_model_len": 16384,
        "max_num_seqs": 12,
        "n_prompts": len(prompts),
        "load_time_s": round(load_time, 2),
        "generate_time_s": round(gen_time, 2),
        "total_input_tokens": total_in,
        "total_output_tokens": total_out,
        "decode_tok_per_s_aggregate": round(total_out / max(gen_time,0.001), 2),
        "gpu_mib_after_load": gpu_after_load,
        "gpu_mib_peak_during_gen": peak_mib,
        "gpu_mib_total": 24564,
        "vllm_version": __import__("vllm").__version__,
        "vram_samples_first10": samples[:10],
        "vram_samples_last10": samples[-10:],
    }
    print("CONCURRENCY_RESULT_JSON=" + json.dumps(summary, indent=2))

if __name__ == "__main__":
    main()
