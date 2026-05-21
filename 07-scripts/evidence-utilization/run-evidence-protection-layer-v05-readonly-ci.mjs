#!/usr/bin/env node
/** Read-only verifier for Evidence Protection Layer artifacts. */
import fs from 'node:fs';
import path from 'node:path';

const args = { outDir: 'bench/evidence-protection-layer-v05-readonly-ci-2026-05-21' };
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--out') args.outDir = process.argv[++i];
  else throw new Error(`unknown arg ${process.argv[i]}`);
}
const DOCS = [
  'bench-public/evidence-utilization/EVIDENCE-PROTECTION-LAYER-INDEX.md',
  'bench-public/evidence-utilization/EVIDENCE-PROTECTION-LAYER-v0-SPAN-PROVENANCE.md',
  'bench-public/evidence-utilization/EVIDENCE-PROTECTION-LAYER-v0.1-PACKING-INVARIANCE.md',
  'bench-public/evidence-utilization/EVIDENCE-PROTECTION-LAYER-v0.2-ANSWER-EQUIVALENCE.md',
  'bench-public/evidence-utilization/EVIDENCE-PROTECTION-LAYER-v0.3-REPLAY-COMPATIBILITY.md',
];
const REPORTS = [
  ['v0', 'bench/evidence-protection-layer-v0-span-provenance-2026-05-21/summary.json', (j) => j.status === 'passed' && j.failures === 0],
  ['v0.1', 'bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/summary.json', (j) => j.status === 'passed' && j.failures === 0],
  ['v0.2', 'bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/summary.json', (j) => j.status === 'passed' && j.checks?.all_fail_closed === true],
  ['v0.3', 'bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21/summary.json', (j) => j.status === 'passed' && j.checks?.all_reorder_transforms_blocked === true],
];
const JSONL = [
  'bench/evidence-protection-layer-v0-span-provenance-2026-05-21/span-provenance.jsonl',
  'bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/packing-invariance.jsonl',
  'bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21/answer-equivalence.jsonl',
  'bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21/replay-compatibility.jsonl',
];
const BOUNDARY = ['serving mutation: no', 'EPKV hook-on: no', 'output-changing'];
const LEAK_RX = /Question: What|For handle SIGNAL|completion_text|prompt_text|raw_token_ids|gold_answer|prediction"|LIME-741|RIVER-209|ORCHID-884|BASALT-317|EMBER-552|GLASS-026|COPPER-690/i;
function writeJson(p, x) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(x, null, 2) + '\n'); }
function countJsonl(p) { let n = 0; for (const line of fs.readFileSync(p, 'utf8').split('\n')) if (line.trim()) { JSON.parse(line); n++; } return n; }
function scanLeak(p) { const out=[]; const lines=fs.readFileSync(p,'utf8').split(/\r?\n/); lines.forEach((line,i)=>{ if(LEAK_RX.test(line)) out.push({line:i+1}); }); return out; }
const checks = [];
for (const doc of DOCS) {
  const text = fs.existsSync(doc) ? fs.readFileSync(doc, 'utf8') : '';
  checks.push({ name: `doc:${doc}`, ok: fs.existsSync(doc) && BOUNDARY.every((b) => text.toLowerCase().includes(b.toLowerCase())) });
}
for (const [name, file, pred] of REPORTS) {
  let ok=false, status=null, error=null; try { const j=JSON.parse(fs.readFileSync(file,'utf8')); ok=pred(j); status=j.status; } catch(e){ error=e.message; }
  checks.push({ name:`report:${name}`, file, ok, status, error });
}
for (const file of JSONL) {
  let ok=false, rows=null, leaks=[]; try { rows=countJsonl(file); leaks=scanLeak(file); ok=rows>0 && leaks.length===0; } catch(e){ checks.push({ name:`jsonl:${file}`, ok:false, error:e.message }); continue; }
  checks.push({ name:`jsonl:${file}`, ok, rows, leaks:leaks.length });
}
const status = checks.every((c)=>c.ok) ? 'passed' : 'failed';
const summary = { schema:'evidence_protection_layer.v05.readonly_ci.summary', status, created_at:new Date().toISOString(), boundary:['read-only PROTECT artifact verification','no endpoint required','no model inference','no serving mutation'], docs_checked:DOCS.length, reports_checked:REPORTS.length, jsonl_checked:JSONL.length, checks };
writeJson(path.join(args.outDir,'summary.json'), summary);
writeJson(path.join(args.outDir,'readonly-ci-report.json'), { status, checks });
console.log(JSON.stringify({ outDir: args.outDir, status, checks: checks.length, failed: checks.filter(c=>!c.ok).map(c=>c.name) }, null, 2));
process.exit(status==='passed'?0:1);
