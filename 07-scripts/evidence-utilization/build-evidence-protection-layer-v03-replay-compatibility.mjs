#!/usr/bin/env node
/**
 * Evidence Protection Layer v0.3 — real-record replay compatibility.
 *
 * Consumes EPL v0.1 packing invariance records. Applies a conservative
 * compatibility policy: stable protected packing may be allowed; support-first
 * / support-last rewrites remain blocked for real records until real-equivalence
 * or adjudication exists. No model inference, no text fields.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = {
  source: 'bench/evidence-protection-layer-v01-packing-invariance-2026-05-21/packing-invariance.jsonl',
  outDir: 'bench/evidence-protection-layer-v03-replay-compatibility-2026-05-21',
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--source') args.source = process.argv[++i];
  else if (a === '--out') args.outDir = process.argv[++i];
  else throw new Error(`unknown arg ${a}`);
}
const readJsonl = (p) => fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));

function decisionForTransform(record, transform) {
  const structuralPass = Object.values(transform.checks || {}).every(Boolean);
  if (!structuralPass) return { transform: transform.transform, structural_pass: false, allowed: false, reason: 'structural_invariance_failed' };
  if (transform.transform === 'stable') return { transform: transform.transform, structural_pass: true, allowed: true, reason: 'stable_protected_pack_no_reorder' };
  return { transform: transform.transform, structural_pass: true, allowed: false, reason: 'blocked_real_record_reorder_pending_equivalence_or_adjudication' };
}

const source = readJsonl(args.source);
fs.mkdirSync(args.outDir, { recursive: true });
const records = [];
for (const r of source) {
  const decisions = r.transforms.map((t) => decisionForTransform(r, t));
  records.push({
    schema: 'evidence_protection_layer.v03.replay_compatibility.record',
    source_record_hash: r.source_record_hash,
    qid_hash: r.qid_hash,
    condition: r.condition,
    support_present: r.support_present,
    protected_span_count: r.protected_span_count,
    source_closure_metric: r.source_closure_metric,
    decisions,
    allowed_count: decisions.filter((d) => d.allowed).length,
    blocked_count: decisions.filter((d) => !d.allowed).length,
    record_pass: decisions.some((d) => d.allowed) && decisions.every((d) => d.structural_pass),
  });
}
fs.writeFileSync(path.join(args.outDir, 'replay-compatibility.jsonl'), records.map((r) => JSON.stringify(r)).join('\n') + '\n');

const byCondition = {};
for (const r of records) {
  const b = byCondition[r.condition] ||= { records: 0, passed: 0, allowed_decisions: 0, blocked_decisions: 0, support_present: 0 };
  b.records++;
  b.passed += r.record_pass ? 1 : 0;
  b.allowed_decisions += r.allowed_count;
  b.blocked_decisions += r.blocked_count;
  b.support_present += r.support_present ? 1 : 0;
}
for (const b of Object.values(byCondition)) {
  b.pass_rate = b.passed / b.records;
  b.support_present_rate = b.support_present / b.records;
}
const allowed = records.reduce((n, r) => n + r.allowed_count, 0);
const blocked = records.reduce((n, r) => n + r.blocked_count, 0);
const summary = {
  schema: 'evidence_protection_layer.v03.replay_compatibility.summary',
  status: records.every((r) => r.record_pass) ? 'passed' : 'failed',
  created_at: new Date().toISOString(),
  boundary: [
    'protect regime, real-record replay compatibility',
    'no model inference',
    'no serving mutation',
    'no runtime output-changing path',
    'reordering transforms blocked until equivalence/adjudication exists',
    'no text fields',
  ],
  source: args.source,
  records: records.length,
  allowed_decisions: allowed,
  blocked_decisions: blocked,
  policy: {
    stable: 'allow if structural invariance passed',
    support_first_stable: 'block pending equivalence/adjudication',
    support_last_stable: 'block pending equivalence/adjudication',
  },
  byCondition,
  checks: {
    all_records_have_at_least_one_allowed_path: records.every((r) => r.allowed_count > 0),
    all_reorder_transforms_blocked: records.every((r) => r.decisions.filter((d) => d.transform !== 'stable').every((d) => d.allowed === false)),
    all_allowed_paths_structural_pass: records.every((r) => r.decisions.filter((d) => d.allowed).every((d) => d.structural_pass)),
    no_text_fields: true,
  },
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, records: summary.records, allowed, blocked, byCondition }, null, 2));
process.exit(summary.status === 'passed' ? 0 : 1);
