#!/usr/bin/env bash
set -euo pipefail
cd /home/aya/implante/research/turboquant-cuda-bench
ROOT=bench/epkv-live-probe-v0-2026-05-21/sprint-12h
LOG="$ROOT/logs/night-runner.log"
exec > >(tee -a "$LOG") 2>&1

echo "SPRINT12_NIGHT_RUNNER_START $(date -Is)"
python3 -m py_compile 07-scripts/vllm-hook/epkv-decode-policy-harness.py

mkdir -p "$ROOT/evidence-derived-policy"
CASES=(
  "adversarial-layout/span-map-1.json terminal-object adv1"
  "adversarial-layout/span-map-2.json terminal-object adv2"
  "2wiki-multirecord/span-map-1.json auto multi1"
  "2wiki-multirecord/span-map-2.json auto multi2"
  "2wiki-multirecord/span-map-3.json auto multi3"
)
for row in "${CASES[@]}"; do
  set -- $row
  span="bench/epkv-live-probe-v0-2026-05-21/$1"
  source="$2"
  label="$3"
  echo "RUN $label source=$source span=$span $(date -Is)"
  python3 07-scripts/vllm-hook/epkv-decode-policy-harness.py \
    --candidate-source "$source" \
    --span-map "$span" \
    --out "$ROOT/evidence-derived-policy/${label}.json" \
    --max-tokens 16 \
    > "$ROOT/evidence-derived-policy/${label}.stdout.json" || echo "CASE_FAILED $label"
  sleep 2
done

node - <<'NODE'
const fs=require('fs'); const path=require('path'); const dir='bench/epkv-live-probe-v0-2026-05-21/sprint-12h/evidence-derived-policy';
const rows=[];
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&!f.endsWith('.stdout.json')).sort()){
  const j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  rows.push({file:f,qid:j.qid,gold:j.gold_answer,candidate:j.candidate,candidate_source:j.candidate_source, outputs:j.rows.map(r=>({bias:r.bias,content:r.summary.content,first:r.summary.first_token,seen:r.summary.candidate_seen_in_first_top_logprobs}))});
}
fs.writeFileSync(path.join(dir,'summary.json'), JSON.stringify({schema:'epkv.evidence_derived_policy.night_sweep.v0', rows},null,2)+'\n');
let md='# Evidence-derived decode policy night sweep\n\n';
for(const r of rows){md+=`## ${r.file}\n\nqid: ${r.qid}\n\ngold: ${r.gold}\n\ncandidate(${r.candidate_source}): ${r.candidate}\n\n| bias | output | first |\n|---:|---|---|\n`; for(const o of r.outputs){md+=`| ${o.bias} | \`${String(o.content).replace(/`/g,'')}\` | \`${o.first}\` |\n`;} md+='\n';}
fs.writeFileSync(path.join(dir,'RESULTS.md'), md);
console.log(JSON.stringify({rows:rows.length},null,2));
NODE

echo "SPRINT12_DONE $(date -Is)"
