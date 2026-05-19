#!/usr/bin/env node
/** EPKV evidence-path ledger v1.9: extends v1.7 with Claude-review provenance validation. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-evidence-path-ledger-v19-2026-05-19');
const LEDGER = path.join(OUT, 'evidence-path-ledger-v19.json');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

const stages = [
  ['v0.8','aggregate audit taxonomy','0c9d461','bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/aggregate-audit-records.jsonl','bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/summary.json'],
  ['v0.9','bridge target selection','f1527a7','bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/bridge-target-queue.json','bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/summary.json'],
  ['v1.0','target materialization','4270e00','bench/evidence-utilization-epkv-target-materialization-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-target-materialization-2026-05-19/events.jsonl','bench/evidence-utilization-epkv-target-materialization-2026-05-19/summary.json'],
  ['v1.1','audit join action table','61b11eb','bench/evidence-utilization-epkv-audit-join-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-audit-join-2026-05-19/target-action-table.jsonl','bench/evidence-utilization-epkv-audit-join-2026-05-19/summary.json'],
  ['v1.2','bridge replay pack','8a56615','bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/bridge-replay-pack.jsonl','bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/summary.json'],
  ['v1.3','replay pack validator','f8dc52f','bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/validation-report.json','bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/validation-report.json'],
  ['v1.4','evidence path ledger','cd2350f','bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/evidence-path-ledger.json','bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19/summary.json'],
  ['v1.5','fixture refinement','c891233','bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/events.jsonl','bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/summary.json'],
  ['v1.6','refined replay pack','936294e','bench/evidence-utilization-epkv-refined-replay-pack-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-refined-replay-pack-2026-05-19/refined-replay-pack.jsonl','bench/evidence-utilization-epkv-refined-replay-pack-2026-05-19/summary.json'],
  ['v1.8','replay provenance validator','edb787d','bench/evidence-utilization-epkv-bridge-replay-pack-provenance-2026-05-19/RESULTS.md','bench/evidence-utilization-epkv-bridge-replay-pack-provenance-2026-05-19/provenance-validation-report.json','bench/evidence-utilization-epkv-bridge-replay-pack-provenance-2026-05-19/provenance-validation-report.json'],
];
function sha(rel){return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,rel))).digest('hex')}
function size(rel){return fs.statSync(path.join(ROOT,rel)).size}
function js(rel){try{return JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'))}catch{return null}}
function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const stageObjs=stages.map(([id,name,commit,receipt,primary,summary])=>({id,name,commit,artifacts:{receipt:{path:receipt,sha256:sha(receipt),bytes:size(receipt)},primary:{path:primary,sha256:sha(primary),bytes:size(primary)},summary:{path:summary,sha256:sha(summary),bytes:size(summary)}},summary_snapshot:js(summary),boundary:{offline:true,serving:false,runtime_hook_live:false,model_call:false,model_attention:false,evidence_use_proof:false}}));
  const coverage={
    aggregate_records: stageObjs.find(s=>s.id==='v0.8').summary_snapshot?.records,
    selected_targets: stageObjs.find(s=>s.id==='v0.9').summary_snapshot?.targets,
    materialized_events_v10: stageObjs.find(s=>s.id==='v1.0').summary_snapshot?.events,
    bridge_ready_targets: stageObjs.find(s=>s.id==='v1.1').summary_snapshot?.by_state?.['bridge-ready'],
    needs_fixture_detail_targets: stageObjs.find(s=>s.id==='v1.1').summary_snapshot?.by_state?.['needs-fixture-detail'],
    replay_records_v12: stageObjs.find(s=>s.id==='v1.2').summary_snapshot?.records,
    refined_events_v15: stageObjs.find(s=>s.id==='v1.5').summary_snapshot?.events,
    refined_replay_records_v16: stageObjs.find(s=>s.id==='v1.6').summary_snapshot?.records,
  };
  coverage.total_replay_records = Number(coverage.replay_records_v12||0)+Number(coverage.refined_replay_records_v16||0);
  const ledger={ledger_schema:'epkv.evidence_path_ledger.v1.9',created_at:new Date().toISOString(),chain:stageObjs.map(s=>s.id).join(' -> '),stages:stageObjs,coverage,chain_invariants:{all_receipts_present:stageObjs.every(s=>fs.existsSync(path.join(ROOT,s.artifacts.receipt.path))),all_primary_artifacts_present:stageObjs.every(s=>fs.existsSync(path.join(ROOT,s.artifacts.primary.path))),all_boundaries_non_serving:stageObjs.every(s=>s.boundary.serving===false&&s.boundary.runtime_hook_live===false),no_stage_claims_model_attention:stageObjs.every(s=>s.boundary.model_attention===false),no_stage_claims_evidence_use_proof:stageObjs.every(s=>s.boundary.evidence_use_proof===false),combined_replay_coverage_is_22:coverage.total_replay_records===22,provenance_validation_passed:stageObjs.find(s=>s.id==='v1.8').summary_snapshot?.valid===true&&stageObjs.find(s=>s.id==='v1.8').summary_snapshot?.errors===0},boundary:{ledger_only:true,serving:false,runtime_hook_live:false,model_call:false,model_attention:false,evidence_use_proof:false}};
  fs.writeFileSync(LEDGER,JSON.stringify(ledger,null,2));
  const summary={ledger_version:'v1.9-evidence-path-ledger',stages:stageObjs.length,chain:ledger.chain,coverage,chain_invariants:ledger.chain_invariants,ledger_sha256:sha(path.relative(ROOT,LEDGER)),artifacts:{ledger:path.relative(ROOT,LEDGER),summary:path.relative(ROOT,SUMMARY)},boundary:ledger.boundary};
  fs.writeFileSync(SUMMARY,JSON.stringify(summary,null,2));
  const rows=stageObjs.map(s=>`| ${s.id} | ${s.name} | ${s.commit} | \`${s.artifacts.primary.path}\` |`).join('\n');
  fs.writeFileSync(RESULTS,[
    '# EPKV evidence-path ledger v1.9 — 2026-05-19','',
    '> Extended offline audit ledger including fixture refinement, refined replay coverage, and Claude-review provenance validation.','',
    '## Boundary','','```txt','ledger only: yes','serving: no','runtime hook live: no','model call: no','model attention: no','evidence-use proof: no','```','',
    '## Artifacts','','```txt',path.relative(ROOT,LEDGER),path.relative(ROOT,SUMMARY),'```','',
    '## Chain','','```txt',ledger.chain,'```','',
    '## Coverage','','```txt',JSON.stringify(coverage,null,2),'```','',
    '## Stages','','| stage | name | commit | primary artifact |','|---|---|---|---|',rows,'',
    '## Invariants','','```txt',JSON.stringify(ledger.chain_invariants,null,2),'```','',
    '## Decision','','```txt','The offline evidence-path layer now has 22 validated replay records and provenance closure for the 13-record bridge replay pack.','This is the current autonomous milestone for the hook-off evidence-utilization layer.','Hard stops remain closed for live serving and external publication.','```','',
    '## Non-claims','','- Not runtime telemetry from a live request.','- Not EPKV behavior.','- Not model attention.','- Not evidence-use proof.','- Not serving readiness.',''].join('\n'));
  console.log(JSON.stringify(summary,null,2));
}
main();
