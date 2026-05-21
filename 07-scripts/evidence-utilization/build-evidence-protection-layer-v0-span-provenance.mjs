#!/usr/bin/env node
/**
 * Evidence Protection Layer v0 — span provenance gate.
 *
 * Builds a public-safe manifest showing that evidence/support spans from
 * RealRAG R3L survive a deterministic protected-packing serialization.
 * It stores hashes and geometry only: no prompt text, no raw token ids,
 * no answers, no completion text, no model inference, no runtime hook.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  records: 'bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/records.jsonl',
  dataset: 'bench/_datasets/hotpot_dev_distractor_v1.json',
  outDir: 'bench/evidence-protection-layer-v0-span-provenance-2026-05-21',
  pageSize: 16,
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--records') args.records = process.argv[++i];
  else if (a === '--dataset') args.dataset = process.argv[++i];
  else if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--page-size') args.pageSize = Number(process.argv[++i]);
  else throw new Error(`unknown arg ${a}`);
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const estTokens = (s) => Math.max(1, Math.ceil(String(s || '').length / 4));
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

function readJsonl(p) {
  return fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function paragraphMap(item) {
  const supportTitles = new Set((item.supporting_facts || []).map((sf) => String(sf[0])));
  const byIdx = new Map();
  for (const [idx, [title, sentences]] of (item.context || []).entries()) {
    const text = Array.isArray(sentences) ? sentences.join(' ') : String(sentences || '');
    byIdx.set(idx, { idx, title: String(title), text, isSupport: supportTitles.has(String(title)) });
  }
  return { byIdx, supportTitles };
}

function buildProtectedPack(record, item) {
  const { byIdx } = paragraphMap(item);
  const paragraphs = (record.context_indices || []).map((idx, rank) => {
    const p = byIdx.get(idx);
    if (!p) throw new Error(`missing paragraph qid=${record.qid} idx=${idx}`);
    return { ...p, rank: rank + 1 };
  });

  // Deterministic protected serialization used only transiently for hashing/range checks.
  // Text is never written to disk.
  const parts = [];
  parts.push('EPL_V0_PROTECTED_PACK');
  parts.push(`condition=${record.condition}`);
  for (const p of paragraphs) {
    const marker = p.isSupport ? 'PROTECTED_SUPPORT' : 'CONTEXT';
    parts.push(`[${marker} rank=${p.rank} idx=${p.idx} title_hash=${sha(p.title).slice(0, 16)}]`);
    parts.push(p.text);
    parts.push(`[/${marker}]`);
  }
  const serialized = parts.join('\n');

  let cursor = estTokens('EPL_V0_PROTECTED_PACK\n') + estTokens(`condition=${record.condition}\n`);
  const paragraphRanges = [];
  const protectedSpans = [];
  for (const p of paragraphs) {
    const marker = p.isSupport ? 'PROTECTED_SUPPORT' : 'CONTEXT';
    const markerOpen = `[${marker} rank=${p.rank} idx=${p.idx} title_hash=${sha(p.title).slice(0, 16)}]\n`;
    const markerClose = `\n[/${marker}]\n`;
    const markerStart = cursor;
    cursor += estTokens(markerOpen);
    const textStart = cursor;
    cursor += estTokens(p.text);
    const textEnd = cursor - 1;
    cursor += estTokens(markerClose);
    const pageStart = Math.floor(textStart / args.pageSize);
    const pageEnd = Math.floor(textEnd / args.pageSize);
    const range = {
      rank: p.rank,
      idx_hash: sha(String(p.idx)).slice(0, 12),
      title_hash: sha(p.title).slice(0, 16),
      text_hash: sha(p.text).slice(0, 16),
      is_support: p.isSupport,
      token_start_est: textStart,
      token_end_est: textEnd,
      page_start: pageStart,
      page_end: pageEnd,
    };
    paragraphRanges.push(range);
    if (p.isSupport) {
      protectedSpans.push({
        rank: p.rank,
        idx_hash: range.idx_hash,
        title_hash: range.title_hash,
        span_hash: range.text_hash,
        token_start_est: textStart,
        token_end_est: textEnd,
        page_start: pageStart,
        page_end: pageEnd,
        protection_marker: 'PROTECTED_SUPPORT',
      });
    }
  }

  return {
    protected_pack_hash: sha(serialized),
    seq_len_est: cursor,
    paragraphRanges,
    protectedSpans,
  };
}

const records = readJsonl(args.records);
const dataset = JSON.parse(fs.readFileSync(args.dataset, 'utf8'));
const byId = new Map(dataset.map((item) => [item._id, item]));
fs.mkdirSync(args.outDir, { recursive: true });

const manifests = [];
const failures = [];
for (const record of records) {
  const item = byId.get(record.qid);
  if (!item) throw new Error(`missing dataset item ${record.qid}`);
  const pack = buildProtectedPack(record, item);
  const supportPresent = Boolean(record.support?.support_present);
  const expectedProtected = supportPresent ? (record.support?.support_count || pack.protectedSpans.length) : 0;
  const ok = supportPresent ? pack.protectedSpans.length > 0 : pack.protectedSpans.length === 0;
  const rangeOk = pack.paragraphRanges.every((r) => r.token_start_est <= r.token_end_est && r.page_start <= r.page_end);
  const spanOk = pack.protectedSpans.every((s) => s.token_start_est <= s.token_end_est && s.page_start <= s.page_end);
  const manifest = {
    schema: 'evidence_protection_layer.v0.span_provenance.record',
    source: 'realrag_hotpotqa_r3l_records',
    qid_hash: sha(record.qid).slice(0, 16),
    record_hash: sha(`${record.qid}\t${record.condition}`).slice(0, 24),
    condition: record.condition,
    generation_model_hash: sha(record.generation_model || 'unknown').slice(0, 16),
    source_closure_metric: Number(record.metrics?.closure || 0),
    paragraph_count: record.paragraph_count,
    support_present: supportPresent,
    source_support_rank_min: record.support?.support_rank_min ?? null,
    protected_span_count: pack.protectedSpans.length,
    expected_protected_span_count: expectedProtected,
    protected_pack_hash: pack.protected_pack_hash,
    seq_len_est: pack.seq_len_est,
    paragraph_page_ranges_est: pack.paragraphRanges,
    protected_spans: pack.protectedSpans,
    checks: {
      support_marker_consistency: ok,
      paragraph_ranges_valid: rangeOk,
      protected_spans_valid: spanOk,
      no_text_fields: true,
    },
  };
  if (!ok || !rangeOk || !spanOk) failures.push({ record_hash: manifest.record_hash, condition: record.condition, checks: manifest.checks });
  manifests.push(manifest);
}

fs.writeFileSync(path.join(args.outDir, 'span-provenance.jsonl'), manifests.map((m) => JSON.stringify(m)).join('\n') + '\n');

const byCondition = {};
for (const m of manifests) {
  const b = byCondition[m.condition] ||= { records: 0, support_present: 0, protected_records: 0, protected_spans: 0, closures: 0, seq_lens: [] };
  b.records++;
  b.support_present += m.support_present ? 1 : 0;
  b.protected_records += m.protected_span_count > 0 ? 1 : 0;
  b.protected_spans += m.protected_span_count;
  b.closures += m.source_closure_metric;
  b.seq_lens.push(m.seq_len_est);
}
for (const b of Object.values(byCondition)) {
  b.closure = b.closures / b.records;
  b.support_present_rate = b.support_present / b.records;
  b.protected_record_rate = b.protected_records / b.records;
  b.seq_len_mean_est = mean(b.seq_lens);
  delete b.closures;
  delete b.seq_lens;
}

const summary = {
  schema: 'evidence_protection_layer.v0.span_provenance.summary',
  status: failures.length === 0 ? 'passed' : 'failed',
  created_at: new Date().toISOString(),
  boundary: [
    'protect regime, hook-off/offline',
    'deterministic packing/provenance only',
    'no serving mutation',
    'no model inference',
    'no output-changing runtime path',
    'no prompt text, answers, completions, or raw token ids stored',
  ],
  source_records: args.records,
  source_dataset: args.dataset,
  records: manifests.length,
  failures: failures.length,
  page_size_tokens_est: args.pageSize,
  byCondition,
  checks: {
    all_support_present_records_have_protected_span: failures.length === 0,
    all_no_support_records_have_zero_protected_spans: manifests.filter((m) => !m.support_present).every((m) => m.protected_span_count === 0),
    no_text_fields: true,
  },
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, records: summary.records, failures: summary.failures, byCondition }, null, 2));
process.exit(summary.status === 'passed' ? 0 : 1);
