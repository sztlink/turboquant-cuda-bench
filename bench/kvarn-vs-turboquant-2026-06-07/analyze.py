import json, glob, os, re
RD="/home/felipe/kvarn-lab/campaign-results"

def load_results(model,config,bench):
    fs=glob.glob(f"{RD}/json-{model}-{config}-{bench}/spikemodel/results_*.json")
    if not fs: return None
    d=json.load(open(sorted(fs)[-1]))
    res=d.get("results",{})
    # pega a chave da task principal
    key=bench if bench in res else (("minerva_math" if bench=="math" else bench))
    r=res.get(key) or (list(res.values())[0] if res else {})
    return r

def metric(model,config,bench):
    r=load_results(model,config,bench)
    if not r: return "—"
    if bench=="gsm8k":
        fx=r.get("exact_match,flexible-extract"); st=r.get("exact_match,strict-match")
        return f"{fx:.3f}/{st:.3f}" if fx is not None else "?"
    if bench=="math":
        for k in r:
            if k.startswith("exact_match"): return f"{r[k]:.3f}"
        return "?"
    if bench=="humaneval":
        for k in r:
            if "pass@1" in k: return f"{r[k]:.3f}"
        return "?"
    return "?"

print("=== METRICAS PRECISAS (gsm8k=flex/strict, math=exact, humaneval=pass@1) ===")
print(f"{'model/config':24} {'gsm8k':14} {'math':8} {'humaneval':10}")
for m in ["q4","q7"]:
    for c in ["fp16-tq","fp16-kv","tq-k8v4","tq-k4v2","kvarn-k4v2"]:
        print(f"{m+'/'+c:24} {metric(m,c,'gsm8k'):14} {metric(m,c,'math'):8} {metric(m,c,'humaneval'):10}")

print("\n=== DEGENERACAO: KVarN q4 math (amostras) ===")
sfs=glob.glob(f"{RD}/json-q4-kvarn-k4v2-math/spikemodel/samples_*.jsonl")
texts=[]
for sf in sfs:
    for l in open(sf):
        x=json.loads(l)
        rp=x.get("resps") or x.get("filtered_resps")
        t = rp[0][0] if isinstance(rp,list) and rp and isinstance(rp[0],list) else (rp[0] if isinstance(rp,list) else str(rp))
        texts.append(t)
def degenerate(t):
    words=t.split()
    if not words: return False
    # palavra repetida >=20x OU char repetido >=60x
    from collections import Counter
    mc=Counter(words).most_common(1)[0][1] if words else 0
    charrun=max((len(s) for s in re.findall(r'(.)\1{40,}', t)), default=0)
    longtok=max((len(w) for w in words), default=0)
    return mc>=20 or charrun>=40 or longtok>=40
n=len(texts)
deg=sum(degenerate(t) for t in texts)
boxed=sum('\\boxed' in t for t in texts)
import statistics
lens=[len(t) for t in texts]
print(f"n_samples={n}")
print(f"degeneram (repeticao/lixo): {deg} ({100*deg/n:.0f}%)")
print(f"produzem \\boxed: {boxed} ({100*boxed/n:.0f}%)")
print(f"len chars: mean={statistics.mean(lens):.0f} median={statistics.median(lens):.0f} max={max(lens)}")
# comparacao: fp16-kv math (7B) tem samples — baseline 'normal'
sfs2=glob.glob(f"{RD}/json-q7-fp16-kv-math/spikemodel/samples_*.jsonl")
t2=[]
for sf in sfs2:
    for l in open(sf):
        x=json.loads(l); rp=x.get("resps") or x.get("filtered_resps")
        t=rp[0][0] if isinstance(rp,list) and rp and isinstance(rp[0],list) else (rp[0] if isinstance(rp,list) else str(rp))
        t2.append(t)
if t2:
    d2=sum(degenerate(t) for t in t2); l2=[len(t) for t in t2]
    print(f"\n[baseline fp16-kv 7B math] n={len(t2)} degeneram={d2}({100*d2/len(t2):.0f}%) len_mean={statistics.mean(l2):.0f}")
