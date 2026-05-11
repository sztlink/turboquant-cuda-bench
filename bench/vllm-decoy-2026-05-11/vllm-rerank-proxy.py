import os, time, json, urllib.request, urllib.error, re
os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

LONGCTX_PROXY = "http://127.0.0.1:8765/v1/chat/completions"
OLD_PATH = "/home/aya/implante/research/turboquant-cuda-bench/bench/longctx-proxy-hard-2026-05-10/corpus/longctx-hard-lab"
NEW_PATH = "/home/felipe/vllm-lab/longctx-corpus/longctx-hard-lab"

def rewrite_path(text):
    return text.replace(OLD_PATH, NEW_PATH)

def main():
    mapping = json.load(open("/home/felipe/vllm-lab/decoy/rerank-mapping.json"))
    print(f"# {len(mapping)} payloads", flush=True)

    results = []
    for r in mapping:
        # Rewrite paths in messages
        msgs = [
            {"role": m["role"], "content": rewrite_path(m["content"])}
            for m in r["messages"]
        ]
        body = {
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "temperature": 0.0,
            "max_tokens": 128,
            "stream": False,
            "longctx_top_k": 16,
            "messages": msgs,
        }
        t1 = time.time()
        try:
            req = urllib.request.Request(
                LONGCTX_PROXY,
                data=json.dumps(body).encode(),
                headers={
                    "content-type": "application/json",
                    "x-session-affinity": f"vllm-rerank-{r['op']}",
                },
                method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=300)
            elapsed = time.time() - t1
            raw = resp.read().decode()
            d = json.loads(raw)
            headers = {k.lower(): v for k, v in resp.getheaders()}
            chunks_used = headers.get("x-longctx-chunks-used")
            scope_status = headers.get("x-longctx-scope-status")
            answer = d.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            hit = r["expected"] in answer
            rec = {
                "op": r["op"], "handle": r["handle"], "expected": r["expected"],
                "hit": hit, "answer": answer[:300],
                "llama_cpp_answer": r["llama_cpp_answer"],
                "elapsed_s": round(elapsed, 2),
                "chunks_used": chunks_used,
                "scope_status": scope_status,
            }
        except Exception as e:
            rec = {
                "op": r["op"], "handle": r["handle"], "expected": r["expected"],
                "hit": False, "answer": f"[error] {e}",
                "llama_cpp_answer": r["llama_cpp_answer"],
                "elapsed_s": round(time.time() - t1, 2),
            }
        results.append(rec)
        print(f"[{r['op']:35s}] {r['handle']:25s} hit={rec['hit']}  el={rec['elapsed_s']}s  chunks={rec.get('chunks_used')}  scope={rec.get('scope_status')}  ans={rec['answer'][:100]!r}", flush=True)

    summary = {
        "endpoint": LONGCTX_PROXY,
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "kv_cache_dtype": "turboquant_k8v4",
        "max_model_len": 16384,
        "longctx_top_k": 16,
        "n_prompts": len(results),
        "n_hits": sum(r["hit"] for r in results),
        "by_op": {},
        "results": results,
    }
    for r in results:
        summary["by_op"].setdefault(r["op"], {"hits": 0, "n": 0})
        summary["by_op"][r["op"]]["n"] += 1
        if r["hit"]: summary["by_op"][r["op"]]["hits"] += 1
    print()
    print(json.dumps(summary, indent=2))
    print(f"RERANK_PROXY_RESULT_OK hits={summary['n_hits']}/{summary['n_prompts']}")

if __name__ == "__main__":
    main()
