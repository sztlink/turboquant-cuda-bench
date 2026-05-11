import os, sys, time, json, urllib.request

def query_vllm(endpoint, model, messages, timeout=300):
    body = {
        "model": model, "temperature": 0.0, "max_tokens": 128, "stream": False, "seed": 42,
        "messages": messages,
    }
    t1 = time.time()
    req = urllib.request.Request(
        endpoint, data=json.dumps(body).encode(),
        headers={"content-type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            d = json.loads(resp.read().decode())
            elapsed = time.time() - t1
            return d.get("choices",[{}])[0].get("message",{}).get("content","").strip(), elapsed, None
    except Exception as e:
        return "", time.time()-t1, str(e)

def main():
    mapping_file = sys.argv[1]      # /home/felipe/vllm-lab/decoy/k16-mapping.json or res-mapping.json
    endpoint     = sys.argv[2]      # http://127.0.0.1:8080/v1/chat/completions
    model        = sys.argv[3]      # Qwen/Qwen2.5-32B-Instruct-AWQ
    tag          = sys.argv[4]      # "32b-decoy" or "32b-policy-splice"
    mapping = json.load(open(mapping_file))
    print(f"# {len(mapping)} payloads, model={model}, endpoint={endpoint}", flush=True)
    results = []
    for r in mapping:
        ans, el, err = query_vllm(endpoint, model, r["messages"])
        hit = (not err) and (r["expected"] in ans)
        op = r.get("op", "decoy_k16")
        results.append({"tag":tag, "op":op, "handle":r["handle"], "expected":r["expected"], "answer":ans[:300], "hit":hit, "elapsed_s":round(el,2), "err":err})
        print(f"[{tag}] {op:34s} {r['handle']:25s} hit={hit}  el={el:.2f}s  ans={ans[:90]!r}", flush=True)
    summary = {"tag":tag, "endpoint":endpoint, "model":model, "n":len(results), "hits":sum(r["hit"] for r in results), "results":results}
    print(); print(json.dumps(summary, indent=2))
    print(f"DIRECT_RESULT_OK tag={tag} hits={summary['hits']}/{summary['n']}")

if __name__ == "__main__": main()
