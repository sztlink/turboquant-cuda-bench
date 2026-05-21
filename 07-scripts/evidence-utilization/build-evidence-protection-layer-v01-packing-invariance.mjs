#!/usr/bin/env node
/**
 * Evidence Protection Layer v0.1 — structural packing invariance.
 *
 * Takes EPL v0 span provenance manifests and verifies deterministic packing
 * transforms preserve paragraph multiset, support span hashes, no-support
 * emptiness, and public-safe no-text properties.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  source: 'bench/evidence-protection-layer-v0-span-provenance-2026-05-21/span-provenance.jsonl',
  outDir: 'bench/evidence-protection-layer-v01-packing-invariance-2026-05-21',
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--source') args.source = process.argv[++i];
  else if (a === '--out') args.outDir = process.argv[++i];
  else throw new Error(`unknown arg ${a}`);
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const readJsonl = (p) => fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const keyList = (xs) => xs.map((x) => `${x.idx_hash}:${x.title_hash}:${x.text_hash}:${x.is_support ? 1 : 0}`).sort();
const spanList = (xs) => xs.map((x) => `${x.idx_hash}:${x.title_hash}:${x.span_hash}`).sort();
const eqArray = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

function transformRecord(m, mode) {
  const paras = [...m.paragraph_page_ranges_est];
  let ordered;
  if (mode === 'stable') ordered = paras;
  else if (mode === 'support_first_stable') ordered = [...paras.filter((p) => p.is_support), ...paras.filter((p) => !p.is_support)];
  else if (mode === 'support_last_stable') ordered = [...paras.filter((p) => !p.is_support), ...paras.filter((p) => p.is_support)];
  else throw new Error(`unknown mode ${mode}`);

  // Recompute synthetic structural ranges without text. Length is inferred from
  // original estimated token lengths. No original text is needed or stored.
  let cursor = 8;
  const transformedParas = [];
  const transformedSpans = [];
  for (const [i, p] of ordered.entries()) {
    const len = Math.max(1, p.token_end_est - p.token_start_est + 1);
    const start = cursor;
    const end = cursor + len - 1;
    cursor += len + 2;
    const out = {
      rank: i + 1,
      idx_hash: p.idx_hash,
      title_hash: p.title_hash,
      text_hash: p.text_hash,
      is_support: p.is_support,
      token_start_est: start,
      token_end_est: end,
      page_start: Math.floor(start / 16),
      page_end: Math.floor(end / 16),
    };
    transformedParas.push(out);
    if (p.is_support) transformedSpans.push({
      rank: i + 1,
      idx_hash: p.idx_hash,
      title_hash: p.title_hash,
      span_hash: p.text_hash,
      token_start_est: start,
      token_end_est: end,
      page_start: out.page_start,
      page_end: out.page_end,
      protection_marker: 'PROTECTED_SUPPORT',
    });
  }

  const originalParaKeys = keyList(m.paragraph_page_ranges_est);
  const transformedParaKeys = keyList(transformedParas);
  const originalSpanKeys = spanList(m.protected_spans || []);
  const transformedSpanKeys = spanList(transformedSpans);
  const checks = {
    paragraph_multiset_preserved: eqArray(originalParaKeys, transformedParaKeys),
    support_span_hashes_preserved: eqArray(originalSpanKeys, transformedSpanKeys),
    no_support_emptiness_preserved: m.support_present ? transformedSpans.length > 0 : transformedSpans.length === 0,
    ranges_valid: transformedParas.every((p) => p.token_start_est <= p.token_end_est && p.page_start <= p.page_end),
    no_text_fields: true,
  };
  return {
    transform: mode,
    transformed_pack_hash: sha(JSON.stringify({ mode, paragraphs: transformedParas.map((p) => [p.idx_hash, p.title_hash, p.text_hash, p.is_support]) })),
    transformed_protected_span_count: transformedSpans.length,
    transformed_support_rank_min: transformedSpans.length ? Math.min(...transformedSpans.map((s) => s.rank)) : null,
    checks,
  };
}

const source = readJsonl(args.source);
fs.mkdirSync(args.outDir, { recursive: true });
const modes = ['stable', 'support_first_stable', 'support_last_stable'];
const records = [];
const failures = [];
for (const m of source) {
  const transforms = modes.map((mode) => transformRecord(m, mode));
  const ok = transforms.every((t) => Object.values(t.checks).every(Boolean));
  const rec = {
    schema: 'evidence_protection_layer.v01.packing_invariance.record',
    source_record_hash: m.record_hash,
    qid_hash: m.qid_hash,
    condition: m.condition,
    support_present: m.support_present,
    protected_span_count: m.protected_span_count,
    original_support_rank_min: m.source_support_rank_min,
    source_closure_metric: m.source_closure_metric,
    transforms,
    record_pass: ok,
  };
  if (!ok) failures.push({ source_record_hash: m.record_hash, condition: m.condition, transforms: transforms.filter((t) => !Object.values(t.checks).every(Boolean)) });
  records.push(rec);
}
fs.writeFileSync(path.join(args.outDir, 'packing-invariance.jsonl'), records.map((r) => JSON.stringify(r)).join('\n') + '\n');

const byCondition = {};
for (const r of records) {
  const b = byCondition[r.condition] ||= { records: 0, passed: 0, support_present: 0, protected_spans: 0, support_first_rank_mean: [], support_last_rank_mean: [] };
  b.records++;
  b.passed += r.record_pass ? 1 : 0;
  b.support_present += r.support_present ? 1 : 0;
  b.protected_spans += r.protected_span_count;
  const sf = r.transforms.find((t) => t.transform === 'support_first_stable')?.transformed_support_rank_min;
  const sl = r.transforms.find((t) => t.transform === 'support_last_stable')?.transformed_support_rank_min;
  if (sf != null) b.support_first_rank_mean.push(sf);
  if (sl != null) b.support_last_rank_mean.push(sl);
}
for (const b of Object.values(byCondition)) {
  b.pass_rate = b.passed / b.records;
  b.support_present_rate = b.support_present / b.records;
  b.support_first_rank_mean = mean(b.support_first_rank_mean);
  b.support_last_rank_mean = mean(b.support_last_rank_mean);
}

const summary = {
  schema: 'evidence_protection_layer.v01.packing_invariance.summary',
  status: failures.length === 0 ? 'passed' : 'failed',
  created_at: new Date().toISOString(),
  boundary: [
    'protect regime, hook-off/offline',
    'structural packing invariance only',
    'no serving mutation',
    'no model inference',
    'no output-changing runtime path',
    'no text fields',
  ],
  source: args.source,
  records: records.length,
  transforms: modes,
  failures: failures.length,
  byCondition,
  checks: {
    all_records_passed: failures.length === 0,
    paragraph_multiset_preserved: failures.length === 0,
    support_span_hashes_preserved: failures.length === 0,
    no_support_emptiness_preserved: failures.length === 0,
    no_text_fields: true,
  },
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, records: summary.records, failures: summary.failures, byCondition }, null, 2));
process.exit(summary.status === 'passed' ? 0 : 1);
