#!/usr/bin/env bash
set -euo pipefail
cd /home/felipe/CASK
source /home/felipe/cask-venv/bin/activate
export PYTHONPATH=/home/felipe/CASK:${PYTHONPATH:-}
export CUDA_VISIBLE_DEVICES=0
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="/home/felipe/CASK/experiments/kvfidelity_bridge_v2_${STAMP}"
mkdir -p "$OUT"
ln -sfn "$OUT" /home/felipe/CASK/experiments/kvfidelity_bridge_v2_latest
DATA="$OUT/kvfidelity_bridge_v2.jsonl"
cat > "$OUT/make_dataset.py" <<'PY'
import json, os, random
from pathlib import Path
OUT=Path(os.environ['DATA'])
random.seed(20260517)
words=("studio archive signal memory cable routing projection sensor calibration material context retrieval marker field note maintenance lighting visitor schedule policy current archived duplicate exact alias target action inspect verify ask clarify apply patch delete update deploy stable canonical stale near duplicate correction source rank evidence operator router deterministic final payload preserve rank identity closure utilization compression upstream downstream").split()
ACTIONS=['inspect','update','ask_clarification','ignore']
TARGET_KINDS=['hyphen_long','hyphen_short','snake','compact','numeric','path']
FAMILIES=['rank_control','rank_trap','stale_record','near_duplicate','conflicting_correction','action_variety','safety_guard','negative_control']
RANKS=[1,2,3,4,8,12,16]

def filler(label, chars):
    s=f"NOISE_BLOCK {label}. "
    i=0
    while len(s)<chars:
        s += words[(i+len(label))%len(words)] + ' '
        i += 1
    return s[:chars]

def chunk(rank, body):
    return f"[retrieved_chunk_rank={rank}]\n{body}\n[/retrieved_chunk]"

def target_for(kind, fam, i, rank):
    stem=fam.replace('_','-').upper()
    if kind=='hyphen_long': return f"AYA-{stem}-{i:04d}-R{rank:02d}-PAYLOAD-OK"
    if kind=='hyphen_short': return f"AYA-{i:04d}-OK"
    if kind=='snake': return f"aya_{fam}_{i:04d}_r{rank}_ok"
    if kind=='compact': return f"T{i:04d}R{rank}OK"
    if kind=='numeric': return f"N{730000+i:06d}"
    if kind=='path': return f"/aya/{fam}/{i:04d}/r{rank}/ok"
    raise AssertionError(kind)

def chat_prompt(alias, chunks, before, after):
    body="\n\n".join([
        "You are a deterministic action router.",
        "Use ONLY the CANONICAL CURRENT RECORD for the exact requested alias.",
        "Ignore archived records, correction threads, invalid lookups, near-duplicate aliases, stale records, and noise unless they are the canonical current record for the exact alias.",
        "Output exactly one line by completing the assistant prefix.",
        "Allowed actions: inspect, update, ask_clarification, ignore.",
        "Format: FINAL_ACTION=<action>;FINAL_TARGET=<target>;SOURCE_RANK=<rank>",
        "No prose. No markdown. No JSON. No chain of thought.",
        filler('before-'+alias, before),
        "EVIDENCE PACKAGE START",
        "\n\n".join(chunks),
        "EVIDENCE PACKAGE END",
        filler('after-'+alias, after),
        f"Question: Which action should be taken for the exact alias `{alias}`?",
        "/no_think",
    ])
    return "<|im_start|>system\nYou are a deterministic router. Do not reason aloud. Return only the requested line.\n<|im_end|>\n<|im_start|>user\n" + body + "\n<|im_end|>\n<|im_start|>assistant\nFINAL_ACTION="

def make_case(i, fam, kind, desired_rank):
    alias=f"{fam.replace('_',' ')} alias {i:03d}"
    action=ACTIONS[(i + len(fam)) % len(ACTIONS)]
    if fam in ['rank_control','rank_trap','stale_record','near_duplicate','conflicting_correction']:
        action='inspect'
    if fam=='safety_guard': action='ignore'
    if fam=='negative_control': action='ignore'
    rank=desired_rank
    target=target_for(kind,fam,i,rank)
    chunks=[]
    if fam=='rank_control':
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}\nACTION: {action}\nTARGET: {target}\nRULE: exact current record."))
            else:
                chunks.append(chunk(r, filler(f'{fam}-{i}-{r}', 360)))
    elif fam=='rank_trap':
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}\nACTION: {action}\nTARGET: {target}\nRULE: exact current record wins."))
            elif r < rank or (r-rank)%3==0:
                chunks.append(chunk(r, f"DECOY LOOKUP\nALIAS: {alias}\nACTION: update\nTARGET: {target_for(kind,fam,i+900+r,r)}\nINVALID: decoy, not canonical current."))
            else:
                chunks.append(chunk(r, filler(f'{fam}-{i}-{r}', 360)))
    elif fam=='stale_record':
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}\nACTION: {action}\nTARGET: {target}\nRULE: current record; use this."))
            elif r < rank:
                chunks.append(chunk(r, f"ARCHIVED RECORD\nALIAS: {alias}\nACTION: update\nTARGET: {target_for(kind,fam,i+800+r,r)}\nINVALID: stale archived record."))
            else:
                chunks.append(chunk(r, filler(f'{fam}-{i}-{r}', 360)))
    elif fam=='near_duplicate':
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}\nACTION: {action}\nTARGET: {target}\nRULE: exact alias only."))
            else:
                suffix=' alternate' if r%2 else ' extended'
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}{suffix}\nACTION: update\nTARGET: {target_for(kind,fam,i+700+r,r)}\nINVALID: near-duplicate alias, not exact."))
    elif fam=='conflicting_correction':
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}\nACTION: {action}\nTARGET: {target}\nRULE: current record beats correction thread."))
            elif r < rank:
                chunks.append(chunk(r, f"CORRECTION THREAD\nALIAS: {alias}\nACTION: update\nTARGET: {target_for(kind,fam,i+600+r,r)}\nINVALID: older correction thread."))
            else:
                chunks.append(chunk(r, filler(f'{fam}-{i}-{r}', 360)))
    elif fam=='action_variety':
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}\nACTION: {action}\nTARGET: {target}\nRULE: action variety current record."))
            elif r in [1,2,3] and r!=rank:
                chunks.append(chunk(r, f"OLD TOOL TRACE\nALIAS: {alias}\nACTION: inspect\nTARGET: {target_for(kind,fam,i+500+r,r)}\nINVALID: predates current action."))
            else:
                chunks.append(chunk(r, filler(f'{fam}-{i}-{r}', 360)))
    elif fam=='safety_guard':
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias}\nACTION: ignore\nTARGET: {target}\nRULE: ignore destructive or unsafe operation."))
            elif r < rank or r in [5,9,13]:
                chunks.append(chunk(r, f"DESTRUCTIVE DECOY\nALIAS: {alias}\nACTION: update\nTARGET: {target_for(kind,fam,i+400+r,r)}\nINVALID: unsafe decoy."))
            else:
                chunks.append(chunk(r, filler(f'{fam}-{i}-{r}', 360)))
    elif fam=='negative_control':
        # no canonical current operational record; policy record at rank says ignore.
        for r in range(1,17):
            if r==rank:
                chunks.append(chunk(r, f"POLICY RECORD\nALIAS: {alias}\nACTION: ignore\nTARGET: {target}\nRULE: no canonical exact operational record exists; ignore."))
            elif r < rank or r in [4,7,11,15]:
                chunks.append(chunk(r, f"CANONICAL CURRENT RECORD\nALIAS: {alias} alternate\nACTION: update\nTARGET: {target_for(kind,fam,i+300+r,r)}\nINVALID: alternate alias only."))
            else:
                chunks.append(chunk(r, filler(f'{fam}-{i}-{r}', 360)))
    before=500 + ((i*137) % 1800)
    after=500 + ((i*211) % 1800)
    return dict(
        id=f"{i:03d}_{fam}_{kind}_r{rank}",
        case_family=fam,
        target_kind=kind,
        alias=alias,
        expected_action=action,
        expected_target=target,
        expected_rank=rank,
        prompt=chat_prompt(alias,chunks,before,after),
        max_new_tokens=56,
    )
rows=[]
idx=0
# 15 per family = 120 total, balanced target kinds and ranks.
for fam_i,fam in enumerate(FAMILIES):
    for j in range(15):
        idx+=1
        kind=TARGET_KINDS[(j+fam_i)%len(TARGET_KINDS)]
        if fam=='rank_control': rank=[1,2][j%2]
        else: rank=RANKS[(j*2+fam_i)%len(RANKS)]
        rows.append(make_case(idx,fam,kind,rank))
with OUT.open('w', encoding='utf-8') as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False)+'\n')
print(OUT)
print(f"rows={len(rows)}")
PY
DATA="$DATA" python "$OUT/make_dataset.py"
PYTHON=/home/felipe/cask-venv/bin/python
MODEL=/home/felipe/CASK/experiments/models/Qwen3-8B
STATS=/home/felipe/CASK/cask/calibration/for_aime25_experiment/qwen3_8b.pt
COMMON=(scripts/worker.py --dataset_path "$DATA" --model_path "$MODEL" --shard_id 0 --num_shards 1 --num_samples 1 --seed 5252 --temperature 0 --top_p 1 --do_sample false --attn_implementation sdpa --load_dtype bfloat16 --max_examples 120 --max_new_tokens 56 --count_prompt_tokens true --attention_layer_compression true --slack_budget_trigger true --divide_length 128 --window_size 128 --round_window 32)
RUNS=("fullkv:0" "triattention:512" "triattention:1024" "triattention:2048" "cask:512" "cask:1024" "cask:2048")
for SPEC in "${RUNS[@]}"; do
  METHOD="${SPEC%%:*}"
  BUDGET="${SPEC##*:}"
  if [[ "$METHOD" == "fullkv" ]]; then NAME="fullkv"; else NAME="${METHOD}_b${BUDGET}"; fi
  echo "=== BRIDGE_V2_RUN_START $NAME $(date -Is) ==="
  OD="$OUT/$NAME/shards"
  mkdir -p "$OD"
  if [[ "$METHOD" == "fullkv" ]]; then
    "$PYTHON" "${COMMON[@]}" --method fullkv --output_dir "$OD" 2>&1 | tee "$OUT/$NAME.run.log"
  else
    "$PYTHON" "${COMMON[@]}" --method "$METHOD" --kv_budget "$BUDGET" --triattention_stats_file "$STATS" --output_dir "$OD" 2>&1 | tee "$OUT/$NAME.run.log"
  fi
  echo "=== BRIDGE_V2_RUN_DONE $NAME $(date -Is) ==="
  nvidia-smi --query-gpu=memory.used,temperature.gpu,utilization.gpu --format=csv,noheader || true
  sleep 3
done
cat > "$OUT/analyze_bridge.py" <<'PY'
import json,re,os,statistics
from pathlib import Path
OUT=Path(os.environ['OUT'])
runs=[('fullkv','fullkv',None),('triattention_b512','triattention',512),('triattention_b1024','triattention',1024),('triattention_b2048','triattention',2048),('cask_b512','cask',512),('cask_b1024','cask',1024),('cask_b2048','cask',2048)]

def levenshtein(a,b):
    if a is None: a=''
    if b is None: b=''
    if len(a)<len(b): a,b=b,a
    prev=list(range(len(b)+1))
    for i,ca in enumerate(a,1):
        cur=[i]
        for j,cb in enumerate(b,1):
            cur.append(min(prev[j]+1,cur[-1]+1,prev[j-1]+(ca!=cb)))
        prev=cur
    return prev[-1]

def parse(text):
    raw=('FINAL_ACTION='+text).strip()
    raw=re.split(r'<\|im_end\|>|<\|endoftext\|>|\n\s*\n', raw)[0]
    m=re.search(r'FINAL_ACTION\s*=\s*([A-Za-z_]+)\s*;\s*FINAL_TARGET\s*=\s*([A-Za-z0-9_:/\.\-]+)\s*;\s*SOURCE_RANK\s*=\s*(\d+)', raw)
    if not m:
        def field(k):
            mm=re.search(rf'{k}\s*=\s*([A-Za-z0-9_:/\.\-]+)', raw)
            return mm.group(1) if mm else None
        action=field('FINAL_ACTION')
        target=field('FINAL_TARGET')
        rank=field('SOURCE_RANK')
        if not action:
            for a in ['ask_clarification','inspect','update','ignore']:
                if re.search(rf'\b{a}\b', text): action=a; break
        return {'action':action,'target':target,'source_rank': int(rank) if rank and str(rank).isdigit() else None,'raw':raw[:500]}
    return {'action':m.group(1),'target':m.group(2),'source_rank':int(m.group(3)),'raw':raw[:500]}

def load_run(name,method,budget):
    p=OUT/name/'shards'/'shard00'/'run000.jsonl'
    data=[]
    for line in p.read_text().splitlines():
        if not line.strip(): continue
        r=json.loads(line); pr=parse(r.get('output',''))
        r['run_name']=name; r['method']=method; r['budget']=budget; r['parsed_action']=pr
        r['action_correct']=pr.get('action')==r.get('expected_action')
        r['target_correct']=pr.get('target')==r.get('expected_target')
        r['rank_correct']=pr.get('source_rank')==r.get('expected_rank')
        r['correct']=r['action_correct'] and r['target_correct'] and r['rank_correct']
        r['target_mentioned']=r.get('expected_target','') in r.get('output','') or r.get('expected_target','') in pr.get('raw','')
        r['target_edit_distance']=levenshtein(pr.get('target'), r.get('expected_target'))
        r['target_norm_edit_distance']=r['target_edit_distance']/max(1,len(r.get('expected_target','')))
        data.append(r)
    return data
rows_by={name:load_run(name,m,b) for name,m,b in runs}
base={r['id']:r for r in rows_by['fullkv']}

def summarize(data, name, method, budget):
    n=len(data)
    eq=sum(1 for r in data if name=='fullkv' or (r['parsed_action'].get('action'),r['parsed_action'].get('target'),r['parsed_action'].get('source_rank')) == (base[r['id']]['parsed_action'].get('action'),base[r['id']]['parsed_action'].get('target'),base[r['id']]['parsed_action'].get('source_rank')))
    base_exact=sum(base[r['id']]['correct'] for r in data)
    eq_base_exact=sum(1 for r in data if base[r['id']]['correct'] and (name=='fullkv' or (r['parsed_action'].get('action'),r['parsed_action'].get('target'),r['parsed_action'].get('source_rank')) == (base[r['id']]['parsed_action'].get('action'),base[r['id']]['parsed_action'].get('target'),base[r['id']]['parsed_action'].get('source_rank'))))
    return dict(run=name,method=method,budget=budget,runs=n,exact=sum(r['correct'] for r in data),action=sum(r['action_correct'] for r in data),target=sum(r['target_correct'] for r in data),rank=sum(r['rank_correct'] for r in data),target_mentioned=sum(r['target_mentioned'] for r in data),eq_fullkv=eq,eq_fullkv_when_fullkv_exact=eq_base_exact,fullkv_exact_denominator=base_exact,mean_target_edit_distance=round(statistics.mean([r['target_edit_distance'] for r in data]),3),mean_target_norm_edit_distance=round(statistics.mean([r['target_norm_edit_distance'] for r in data]),3),mean_generation_seconds=round(statistics.mean([r.get('generation_seconds') or 0 for r in data]),3),mean_prefill_tokens=round(statistics.mean([r.get('prefill_tokens') or 0 for r in data]),1))
summary=[summarize(rows_by[name], name, m, b) for name,m,b in runs]
# grouped summaries
by_family=[]; by_kind=[]
for name,m,b in runs:
    data=rows_by[name]
    for fam in sorted(set(r['case_family'] for r in data)):
        dd=[r for r in data if r['case_family']==fam]
        s=summarize(dd,name,m,b); s['case_family']=fam; by_family.append(s)
    for kind in sorted(set(r['target_kind'] for r in data)):
        dd=[r for r in data if r['target_kind']==kind]
        s=summarize(dd,name,m,b); s['target_kind']=kind; by_kind.append(s)
# case diffs compact
cases=[]
for r0 in rows_by['fullkv']:
    c={'id':r0['id'],'case_family':r0['case_family'],'target_kind':r0['target_kind'],'expected_action':r0['expected_action'],'expected_target':r0['expected_target'],'expected_rank':r0['expected_rank'],'methods':{}}
    for name,m,b in runs:
        r=next(x for x in rows_by[name] if x['id']==r0['id'])
        c['methods'][name]={'action':r['parsed_action'].get('action'),'target':r['parsed_action'].get('target'),'rank':r['parsed_action'].get('source_rank'),'correct':r['correct'],'action_correct':r['action_correct'],'target_correct':r['target_correct'],'rank_correct':r['rank_correct'],'target_edit_distance':r['target_edit_distance'],'output':r.get('output','')[:500],'prefill_tokens':r.get('prefill_tokens'),'generation_seconds':r.get('generation_seconds')}
    cases.append(c)
report={'out':str(OUT),'summary':summary,'by_family':by_family,'by_target_kind':by_kind,'cases':cases}
(OUT/'bridge-summary.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
# JSONL compact per case-method
with (OUT/'case-method-metrics.jsonl').open('w') as f:
    for name,m,b in runs:
        for r in rows_by[name]:
            f.write(json.dumps({k:r.get(k) for k in ['id','case_family','target_kind','method','budget','expected_action','expected_target','expected_rank','action_correct','target_correct','rank_correct','correct','target_mentioned','target_edit_distance','target_norm_edit_distance','prefill_tokens','output_tokens','generation_seconds']}, ensure_ascii=False)+'\n')
# markdown
md=['# CASK × KVFidelity bridge cell v2','',f'Output: `{OUT}`','', 'Status: expanded synthetic action-router bridge; staging, not a global benchmark claim.','', '## Summary','', '| run | exact | action | target | rank | target mentioned | eq FullKV | edit dist | norm edit | sec | prefill |','|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
for s in summary:
    md.append(f"| {s['run']} | {s['exact']}/{s['runs']} | {s['action']}/{s['runs']} | {s['target']}/{s['runs']} | {s['rank']}/{s['runs']} | {s['target_mentioned']}/{s['runs']} | {s['eq_fullkv']}/{s['runs']} | {s['mean_target_edit_distance']} | {s['mean_target_norm_edit_distance']} | {s['mean_generation_seconds']} | {s['mean_prefill_tokens']} |")
md += ['', '## By case family', '', '| run | family | exact | action | target | rank | edit dist |', '|---|---|---:|---:|---:|---:|---:|']
for s in by_family:
    md.append(f"| {s['run']} | {s['case_family']} | {s['exact']}/{s['runs']} | {s['action']}/{s['runs']} | {s['target']}/{s['runs']} | {s['rank']}/{s['runs']} | {s['mean_target_edit_distance']} |")
md += ['', '## By target kind', '', '| run | target kind | exact | action | target | rank | edit dist |', '|---|---|---:|---:|---:|---:|---:|']
for s in by_kind:
    md.append(f"| {s['run']} | {s['target_kind']} | {s['exact']}/{s['runs']} | {s['action']}/{s['runs']} | {s['target']}/{s['runs']} | {s['rank']}/{s['runs']} | {s['mean_target_edit_distance']} |")
md += ['', '## Caveat', '', 'This v2 is larger and budgeted but still synthetic. It is useful as a bridge/correlation harness, not as a global CASK or TriAttention benchmark.']
(OUT/'RESULTS.md').write_text('\n'.join(md))
print(json.dumps(summary, indent=2))
PY
OUT="$OUT" "$PYTHON" "$OUT/analyze_bridge.py"
echo "$OUT" > /home/felipe/CASK/experiments/kvfidelity_bridge_v2_latest_path.txt
echo "BRIDGE_V2_REMOTE_OUT=$OUT"
echo "BRIDGE_V2_REMOTE_DONE $(date -Is)"
