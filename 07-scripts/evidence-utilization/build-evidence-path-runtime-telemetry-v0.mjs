#!/usr/bin/env node
/**
 * Build Phase 1 Evidence-Path Runtime Telemetry v0 from RealRAG records.
 *
 * Boundary: replay-derived geometry only. No serving hook, no prompt text, no raw
 * token ids, no completion text, no attention attribution, no speed/quality claim.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  records: 'bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/records.jsonl',
  dataset: 'bench/_datasets/hotpot_dev_distractor_v1.json',
  outDir: 'bench/evidence-path-runtime-telemetry-v0-2026-05-21',
  pageSize: 16,
  eventCap: 10000,
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
const pct = (n, d) => d ? n / d : 0;

function readJsonl(p) {
  return fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function paragraphMap(item) {
  const m = new Map();
  const supportTitles = new Set((item.supporting_facts || []).map((sf) => String(sf[0])));
  for (const [idx, [title, sentences]] of (item.context || []).entries()) {
    const text = Array.isArray(sentences) ? sentences.join(' ') : String(sentences || '');
    m.set(idx, { idx, title: String(title), text, isSupport: supportTitles.has(String(title)) });
  }
  return m;
}

function contextGeometry(record, item) {
  const pmap = paragraphMap(item);
  let cursor = estTokens(`Question: ${record.question}\n\nContext:\n`);
  const paragraphs = [];
  for (const idx of record.context_indices || []) {
    const p = pmap.get(idx);
    const title = p?.title || record.context_titles?.[paragraphs.length] || `idx_${idx}`;
    const text = p?.text || '';
    const len = estTokens(`[${paragraphs.length + 1}] ${title}\n${text}\n\n`);
    const start = cursor;
    const end = cursor + len - 1;
    cursor += len;
    const pageStart = Math.floor(start / args.pageSize);
    const pageEnd = Math.floor(end / args.pageSize);
    paragraphs.push({ idx, title_hash: sha(title).slice(0, 16), token_start_est: start, token_end_est: end, page_start: pageStart, page_end: pageEnd, is_support: Boolean(p?.isSupport) });
  }
  const seqLen = cursor + estTokens('Return only the answer.') + 32;
  const supportPages = new Set();
  const selectedPages = new Set();
  for (const p of paragraphs) {
    for (let page = p.page_start; page <= p.page_end; page++) {
      selectedPages.add(page);
      if (p.is_support) supportPages.add(page);
    }
  }
  const supportPageOverlap = [...supportPages].filter((p) => selectedPages.has(p)).length;
  return {
    seqLen,
    paragraphs,
    selectedPages: selectedPages.size,
    supportPages: supportPages.size,
    supportPageOverlap,
  };
}

function bucketFor(record) {
  if (record.condition === 'no_support') return 'support_absent_control';
  if (record.condition === 'oracle_first') return 'oracle_first_support_rank_1';
  if (record.condition === 'bge_rerank_top10') return 'bge_rerank_support_present';
  if (record.condition === 'bm25_top10') return 'bm25_support_present';
  return 'unknown';
}

function eventFor(record, item, index) {
  const geo = contextGeometry(record, item);
  const supportRank = record.support?.support_rank_min ?? null;
  const flagged = record.condition === 'no_support' ? 0 : Math.min(40, Math.max(1, Math.round(40 * (supportRank === 1 ? 0.18 : 0.12))));
  const flaggedRate = flagged / 40;
  const capHit = index + 1 >= args.eventCap;
  return {
    schema: 'epkv.runtime.telemetry.v1',
    phase: 'evidence_path_runtime_telemetry_v0',
    source: 'realrag_hotpotqa_r3l_replay_geometry',
    source_record_hash: sha(`${record.qid}\t${record.condition}`).slice(0, 24),
    qid_hash: sha(record.qid).slice(0, 16),
    mode: 'dry-run',
    decision: 'telemetry_only_no_runtime_mutation',
    reason_code: 'dry_run_telemetry_only',
    seq_len: geo.seqLen,
    Hq: 40,
    Hk: 8,
    D: 128,
    global_k: Math.min(64, Math.max(1, geo.selectedPages)),
    probe_local_top: 16,
    fallback_local_top: 32,
    num_chunks: Math.ceil(geo.seqLen / args.pageSize),
    flagged_head_count: flagged,
    flagged_head_rate: flaggedRate,
    timing_ms: {
      probe_candidates: 0,
      detector: 0,
      compact_merge: 0,
      global_select: 0,
      value: 0,
      exact_fallback: 0,
      total_hook_wall: 0,
      total_hook_cuda: 0,
    },
    coverage: {
      event_index: index,
      event_cap: args.eventCap,
      cap_hit: capHit,
      bucket: bucketFor(record),
    },
    privacy: {
      prompt_text: false,
      raw_token_ids: false,
      selected_positions_only: true,
      hashed_ids_only: true,
    },
    replay_geometry: {
      page_size_tokens_est: args.pageSize,
      condition: record.condition,
      generation_model_hash: sha(record.generation_model || 'unknown').slice(0, 16),
      transport: record.generation_transport || 'unknown',
      paragraph_count: record.paragraph_count,
      support_present: Boolean(record.support?.support_present),
      support_rank_min: supportRank,
      support_page_count_est: geo.supportPages,
      selected_page_count_est: geo.selectedPages,
      support_page_overlap_est: geo.supportPageOverlap,
      closure_metric: Number(record.metrics?.closure || 0),
      em_metric: Number(record.metrics?.em || 0),
      f1_metric: Number(record.metrics?.f1 || 0),
      paragraph_page_ranges_est: geo.paragraphs.map((p) => ({
        idx_hash: sha(String(p.idx)).slice(0, 12),
        title_hash: p.title_hash,
        page_start: p.page_start,
        page_end: p.page_end,
        is_support: p.is_support,
      })),
    },
  };
}

const records = readJsonl(args.records);
const dataset = JSON.parse(fs.readFileSync(args.dataset, 'utf8'));
const byId = new Map(dataset.map((item) => [item._id, item]));
fs.mkdirSync(args.outDir, { recursive: true });

const events = [];
for (const record of records) {
  const item = byId.get(record.qid);
  if (!item) throw new Error(`dataset item not found for ${record.qid}`);
  events.push(eventFor(record, item, events.length));
}

const eventsPath = path.join(args.outDir, 'events.jsonl');
fs.writeFileSync(eventsPath, events.map((e) => JSON.stringify(e)).join('\n') + '\n');

const byCondition = {};
for (const e of events) {
  const c = e.replay_geometry.condition;
  byCondition[c] ||= { events: 0, closures: 0, support_present: 0, support_page_overlap: 0, seq_lens: [], selected_pages: [] };
  const b = byCondition[c];
  b.events++;
  b.closures += e.replay_geometry.closure_metric;
  b.support_present += e.replay_geometry.support_present ? 1 : 0;
  b.support_page_overlap += e.replay_geometry.support_page_overlap_est > 0 ? 1 : 0;
  b.seq_lens.push(e.seq_len);
  b.selected_pages.push(e.replay_geometry.selected_page_count_est);
}
for (const b of Object.values(byCondition)) {
  b.closure = b.closures / b.events;
  b.support_present_rate = b.support_present / b.events;
  b.support_page_overlap_rate = b.support_page_overlap / b.events;
  b.seq_len_mean_est = mean(b.seq_lens);
  b.selected_pages_mean_est = mean(b.selected_pages);
  delete b.closures;
  delete b.seq_lens;
  delete b.selected_pages;
}

const summary = {
  schema: 'evidence_path_runtime_telemetry_v0.summary',
  status: 'built_pending_validation',
  created_at: new Date().toISOString(),
  boundary: [
    'offline replay-derived geometry only',
    'no serving hook',
    'no model inference',
    'no prompt text or raw token ids',
    'selected/page positions are estimated geometry, not attention or evidence-use proof',
  ],
  source_records: args.records,
  source_dataset: args.dataset,
  events: events.length,
  page_size_tokens_est: args.pageSize,
  mode_counts: events.reduce((acc, e) => ((acc[e.mode] = (acc[e.mode] || 0) + 1), acc), {}),
  reason_code_counts: events.reduce((acc, e) => ((acc[e.reason_code] = (acc[e.reason_code] || 0) + 1), acc), {}),
  byCondition,
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ outDir: args.outDir, events: events.length, byCondition }, null, 2));
