#!/usr/bin/env node
/**
 * Validate EPKV bridge replay provenance v1.8.
 *
 * Adds referential/provenance checks around the v1.2 replay pack.
 * Boundary: offline artifact validation only.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const DEFAULTS = {
  actions: 'bench/evidence-utilization-epkv-audit-join-2026-05-19/target-action-table.jsonl',
  materialized: 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/materialized-records.jsonl',
  events: 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/events.jsonl',
  replay: 'bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/bridge-replay-pack.jsonl',
  manifest: 'bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/manifest.json',
  results: 'bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/RESULTS.md',
};
function readJsonl(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8').trim().split(/\n/).filter(Boolean).map(l=>JSON.parse(l))}
function sha(rel){return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,rel))).digest('hex')}
function eq(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function add(errors, code, message, detail={}){errors.push({code,message,...detail})}
function tableRows(md){
  const lines=md.split(/\r?\n/); const idx=lines.findIndex(l=>l.trim().startsWith('| replay | target |'));
  if(idx<0) return null; let n=0;
  for(let i=idx+2;i<lines.length;i++){const l=lines[i].trim(); if(!l.startsWith('|')) break; if(l.includes('---')) continue; n++;}
  return n;
}
function main(){
  const errors=[];
  const actions=readJsonl(DEFAULTS.actions);
  const mats=readJsonl(DEFAULTS.materialized);
  const events=readJsonl(DEFAULTS.events);
  const replay=readJsonl(DEFAULTS.replay);
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,DEFAULTS.manifest),'utf8'));
  const results=fs.readFileSync(path.join(ROOT,DEFAULTS.results),'utf8');

  for(const [k,rel] of Object.entries(manifest.source_files||{})){
    if(!manifest.source_sha256?.[k]) add(errors,'source_sha.missing',`missing source_sha256.${k}`);
    else if(sha(rel)!==manifest.source_sha256[k]) add(errors,'source_sha.mismatch',`source sha mismatch for ${k}`,{expected:manifest.source_sha256[k],actual:sha(rel)});
  }
  if(sha(DEFAULTS.replay)!==manifest.pack_sha256) add(errors,'pack_sha.mismatch','pack sha mismatch');

  const ready=actions.filter(a=>a.action_state==='bridge-ready');
  const readyIds=new Set(ready.map(a=>a.target_id));
  const replayIds=new Set(replay.map(r=>r.target_id));
  if(!eq([...readyIds].sort(),[...replayIds].sort())) add(errors,'closure.actions','replay target set differs from bridge-ready action set',{ready:[...readyIds].sort(),replay:[...replayIds].sort()});
  const actionById=new Map(actions.map(a=>[a.target_id,a]));
  const matByTarget=new Map(mats.map(m=>[m.target_id,m]));
  const eventByFixture=new Map(events.map(e=>[e.selection_geometry.fixture_id,e]));
  const seenReplay=new Set();
  replay.forEach((r,i)=>{
    if(seenReplay.has(r.replay_id)) add(errors,'replay_id.duplicate','duplicate replay_id',{replay_id:r.replay_id});
    seenReplay.add(r.replay_id);
    const expected=`replay-${String(i+1).padStart(2,'0')}`;
    if(r.replay_id!==expected) add(errors,'replay_id.dense','replay_id not dense/order-preserving',{expected,actual:r.replay_id});
    const a=actionById.get(r.target_id);
    if(!a) add(errors,'action.missing','target missing from action table',{target_id:r.target_id});
    else {
      const fields=['distractor_type','canonical_rank','source_hit_rate','source_wrong_rate'];
      for(const f of fields){
        const rv = f in r.source_risk ? r.source_risk[f] : undefined;
        const av = a[f];
        if(rv!==av) add(errors,'action.field_mismatch',`field mismatch ${f}`,{target_id:r.target_id,replay:rv,action:av});
      }
    }
    const m=matByTarget.get(r.target_id);
    if(!m) add(errors,'materialized.missing','target missing from materialized records',{target_id:r.target_id});
    else if(m.fixture_id!==r.fixture_id) add(errors,'materialized.fixture_mismatch','fixture mismatch',{target_id:r.target_id});
    const e=eventByFixture.get(r.fixture_id);
    if(!e) add(errors,'event.missing','fixture missing from events',{fixture_id:r.fixture_id});
    else {
      if(e.schema!==r.telemetry_event.schema || e.mode!==r.telemetry_event.mode || e.reason_code!==r.telemetry_event.reason_code || e.seq_len!==r.telemetry_event.seq_len) add(errors,'event.mismatch','compact event does not match source event',{fixture_id:r.fixture_id});
    }
  });
  const rowCount=tableRows(results);
  if(rowCount!==replay.length) add(errors,'results.row_count','RESULTS.md replay table row count mismatch',{rowCount,records:replay.length});
  if(!results.includes('source_hit_rate') || !results.includes('source_wrong_rate')) add(errors,'results.headers','RESULTS.md missing source_hit_rate/source_wrong_rate headers');
  if(!results.includes('rank_any')) add(errors,'results.rank_any_note','RESULTS.md missing rank_any note');
  const summary={validator:'epkv.bridge_replay_provenance.validator.v1.8',valid:errors.length===0,errors:errors.length,records:replay.length,bridge_ready_actions:ready.length,results_table_rows:rowCount,checks:{source_sha256_pinned:Boolean(manifest.source_sha256),target_closure:eq([...readyIds].sort(),[...replayIds].sort()),results_table_complete:rowCount===replay.length},error_reports:errors,boundary:{offline:true,serving:false,runtime_hook:false,model_call:false,model_attention:false,evidence_use_proof:false}};
  console.log(JSON.stringify(summary,null,2));
  process.exit(summary.valid?0:1);
}
main();
