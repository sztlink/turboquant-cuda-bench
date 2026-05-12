"""
Run decoy k=16 with the FP8-calibrated Qwen2.5-7B model produced by
calibrate-fp8-qwen7b.py.

Uses the same mapping, seed, and SamplingParams as vllm-decoy-dtype-sweep.py
to keep the comparison clean.
"""
import os, time, json

os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

CALIBRATED_MODEL = "/home/felipe/vllm-lab/qwen2.5-7b-fp8-kv"

def main():
    from vllm import LLM, SamplingParams

    mapping = json.load(open("/home/felipe/vllm-lab/decoy/k16-mapping.json"))
    print(f"# {len(mapping)} payloads · model={CALIBRATED_MODEL} · kv_cache_dtype=fp8 (calibrated W8A8-KV8)", flush=True)

    t0 = time.time()
    llm = LLM(
        model=CALIBRATED_MODEL,
        kv_cache_dtype="fp8",
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
        }
        results.append(rec)
        print(f"[fp8+cal] {handle:25s} hit={hit}  gen={gen_time:.1f}s tok_in={prompt_tok} tok_out={out_tok}  answer={answer[:80]!r}", flush=True)

    summary = {
        "model_path": CALIBRATED_MODEL,
        "kv_cache_dtype": "fp8",
        "weights_quant": "W8A8 static per-tensor FP8 (llmcompressor)",
        "calibration_dataset": "HuggingFaceH4/ultrachat_200k train_sft 512 samples × 2048 max_seq_len",
        "max_model_len": 16384,
        "n_prompts": len(results),
        "n_hits": sum(r["hit"] for r in results),
        "results": results,
        "vllm_version": __import__("vllm").__version__,
    }
    print()
    print(json.dumps(summary, indent=2))
    print(f"DECOY_RESULT_OK kv=fp8+calibrated hits={summary['n_hits']}/{summary['n_prompts']}")

if __name__ == "__main__":
    main()
