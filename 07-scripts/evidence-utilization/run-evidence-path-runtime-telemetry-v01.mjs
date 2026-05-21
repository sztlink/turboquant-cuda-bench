#!/usr/bin/env node
/**
 * Evidence-Path Runtime Telemetry v0.1 sidecar emitter.
 *
 * Sends a small synthetic/local prompt set to an existing OpenAI-compatible
 * endpoint and emits epkv.runtime.telemetry.v1 sidecar events. It does not
 * patch vLLM, change outputs, enable EPKV, expose prompt text/raw token ids, or
 * store completion text.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  outDir: 'bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21',
  endpoint: 'http://192.168.15.133:11435/v1/chat/completions',
  model: 'local-vllm',
  requireModelId: 'local-vllm',
  maxTokens: 16,
  timeoutMs: 60000,
  pageSize: 16,
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--endpoint') args.endpoint = process.argv[++i];
  else if (a === '--model') args.model = process.argv[++i];
  else if (a === '--require-model-id') args.requireModelId = process.argv[++i];
  else if (a === '--timeout-ms') args.timeoutMs = Number(process.argv[++i]);
  else throw new Error(`unknown arg ${a}`);
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const estTokens = (s) => Math.max(1, Math.ceil(String(s || '').length / 4));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function modelsEndpoint(chatEndpoint) {
  const u = new URL(chatEndpoint);
  u.pathname = u.pathname.replace(/\/chat\/completions\/?$/, '/models');
  return u.toString();
}

async function fetchJson(url, options = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), args.timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ac.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(t);
  }
}

async function assertRequiredModel() {
  if (!args.requireModelId) return null;
  const data = await fetchJson(modelsEndpoint(args.endpoint));
  const ids = (data?.data || []).map((m) => m.id);
  if (!ids.includes(args.requireModelId)) {
    throw new Error(`required model id '${args.requireModelId}' not served; served=${ids.join(',')}`);
  }
  return ids;
}

const CASES = [
  { id: 'synthetic-canonical-first', condition: 'canonical_first', canonicalRank: 1, expected: 'LIME-741', decoysBefore: 0, decoysAfter: 3 },
  { id: 'synthetic-canonical-middle', condition: 'canonical_middle', canonicalRank: 3, expected: 'RIVER-209', decoysBefore: 2, decoysAfter: 2 },
  { id: 'synthetic-canonical-last', condition: 'canonical_last', canonicalRank: 5, expected: 'ORCHID-884', decoysBefore: 4, decoysAfter: 0 },
  { id: 'synthetic-no-support', condition: 'no_support', canonicalRank: null, expected: 'UNKNOWN', decoysBefore: 5, decoysAfter: 0 },
  { id: 'synthetic-near-duplicate', condition: 'near_duplicate_decoy', canonicalRank: 4, expected: 'BASALT-317', decoysBefore: 3, decoysAfter: 1 },
  { id: 'synthetic-conflict-before', condition: 'conflict_before_canonical', canonicalRank: 4, expected: 'EMBER-552', decoysBefore: 3, decoysAfter: 1 },
  { id: 'synthetic-stale-before', condition: 'stale_before_canonical', canonicalRank: 4, expected: 'GLASS-026', decoysBefore: 3, decoysAfter: 1 },
  { id: 'synthetic-canonical-after-long-noise', condition: 'canonical_after_long_noise', canonicalRank: 5, expected: 'COPPER-690', decoysBefore: 4, decoysAfter: 1, longNoise: true },
];

function blockText(label, value, kind, longNoise = false) {
  const extra = longNoise ? ' '.repeat(1) + Array.from({ length: 80 }, (_, i) => `noise-${i}`).join(' ') : '';
  return `[${label}] ${kind}. For handle SIGNAL, the value is ${value}.${extra}`;
}

function buildCase(c) {
  const blocks = [];
  for (let i = 0; i < c.decoysBefore; i++) {
    const value = c.condition === 'near_duplicate_decoy' ? c.expected.replace(/[0-9]$/, String((Number(c.expected.at(-1)) + i + 1) % 10)) : `DECOY-${100 + i}`;
    const kind = c.condition.includes('stale') ? 'stale previous note' : c.condition.includes('conflict') ? 'conflicting note' : 'distractor note';
    blocks.push({ kind: 'decoy', text: blockText(`D${i + 1}`, value, kind, c.longNoise && i === 0) });
  }
  if (c.canonicalRank !== null) blocks.push({ kind: 'canonical', text: blockText('CANONICAL', c.expected, 'canonical current note') });
  for (let i = 0; i < c.decoysAfter; i++) blocks.push({ kind: 'decoy', text: blockText(`A${i + 1}`, `AFTER-${200 + i}`, 'trailing distractor note') });
  const context = blocks.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
  const messages = [
    { role: 'system', content: 'Use only the provided context. Return only the requested value. If absent, return UNKNOWN.' },
    { role: 'user', content: `Question: What is the value for handle SIGNAL?\n\nContext:\n${context}` },
  ];
  return { blocks, messages };
}

function geometryFor(c, blocks, messages) {
  let cursor = estTokens(messages[0].content) + estTokens('Question: What is the value for handle SIGNAL?\n\nContext:\n');
  const ranges = [];
  const selectedPages = new Set();
  const canonicalPages = new Set();
  blocks.forEach((b, i) => {
    const len = estTokens(`${i + 1}. ${b.text}\n`);
    const start = cursor;
    const end = cursor + len - 1;
    cursor += len;
    const pageStart = Math.floor(start / args.pageSize);
    const pageEnd = Math.floor(end / args.pageSize);
    for (let p = pageStart; p <= pageEnd; p++) {
      selectedPages.add(p);
      if (b.kind === 'canonical') canonicalPages.add(p);
    }
    ranges.push({ block_hash: sha(`${c.id}:${i}`).slice(0, 12), page_start: pageStart, page_end: pageEnd, role: b.kind });
  });
  return {
    seqLen: cursor + args.maxTokens,
    ranges,
    selectedPages: selectedPages.size,
    canonicalPages: canonicalPages.size,
    canonicalOverlap: [...canonicalPages].filter((p) => selectedPages.has(p)).length,
  };
}

function eventFor(c, blocks, messages, responseText, requestLatencyMs, servedIds, index) {
  const geo = geometryFor(c, blocks, messages);
  const closed = c.expected === 'UNKNOWN' ? /unknown/i.test(responseText) : responseText.includes(c.expected);
  const flagged = c.canonicalRank === null ? 0 : Math.max(1, Math.round(40 * (c.canonicalRank === 1 ? 0.18 : 0.1)));
  return {
    schema: 'epkv.runtime.telemetry.v1',
    phase: 'evidence_path_runtime_telemetry_v01_sidecar',
    source: 'synthetic_local_runtime_sidecar',
    source_case_hash: sha(c.id).slice(0, 24),
    mode: 'dry-run',
    decision: 'sidecar_telemetry_no_output_mutation',
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
    flagged_head_rate: flagged / 40,
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
      event_cap: CASES.length,
      cap_hit: index + 1 >= CASES.length,
      bucket: c.condition,
    },
    privacy: {
      prompt_text: false,
      raw_token_ids: false,
      selected_positions_only: true,
      synthetic_only: true,
    },
    sidecar_runtime: {
      endpoint_hash: sha(args.endpoint).slice(0, 16),
      requested_model_hash: sha(args.model).slice(0, 16),
      served_model_id_hashes: servedIds.map((id) => sha(id).slice(0, 16)),
      request_wall_ms: requestLatencyMs,
      response_hash: sha(responseText).slice(0, 16),
      response_chars: responseText.length,
      closed_metric: closed ? 1 : 0,
      output_changing_path: false,
    },
    replay_geometry: {
      page_size_tokens_est: args.pageSize,
      condition: c.condition,
      canonical_rank: c.canonicalRank,
      block_count: blocks.length,
      canonical_page_count_est: geo.canonicalPages,
      selected_page_count_est: geo.selectedPages,
      canonical_page_overlap_est: geo.canonicalOverlap,
      block_page_ranges_est: geo.ranges,
    },
  };
}

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  const servedIds = await assertRequiredModel();
  const events = [];
  const caseReports = [];
  for (const c of CASES) {
    const { blocks, messages } = buildCase(c);
    const started = Date.now();
    const body = {
      model: args.model,
      messages,
      temperature: 0,
      max_tokens: args.maxTokens,
    };
    const res = await fetchJson(args.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const latency = Date.now() - started;
    const text = String(res?.choices?.[0]?.message?.content || '').trim();
    events.push(eventFor(c, blocks, messages, text, latency, servedIds || [], events.length));
    caseReports.push({ case_hash: sha(c.id).slice(0, 16), condition: c.condition, response_hash: sha(text).slice(0, 16), response_chars: text.length, closed_metric: events.at(-1).sidecar_runtime.closed_metric, request_wall_ms: latency });
    await sleep(100);
  }
  fs.writeFileSync(path.join(args.outDir, 'events.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  const summary = {
    schema: 'evidence_path_runtime_telemetry_v01.summary',
    status: 'built_pending_validation',
    created_at: new Date().toISOString(),
    boundary: [
      'default-off sidecar runtime emitter',
      'synthetic/local prompts only',
      'no serving hook or vLLM mutation',
      'no prompt text, raw token ids, completion text, or expected value stored',
      'selected/page positions are estimated geometry, not attention',
    ],
    endpoint_hash: sha(args.endpoint).slice(0, 16),
    requested_model_hash: sha(args.model).slice(0, 16),
    served_model_id_hashes: (servedIds || []).map((id) => sha(id).slice(0, 16)),
    events: events.length,
    mode_counts: events.reduce((acc, e) => ((acc[e.mode] = (acc[e.mode] || 0) + 1), acc), {}),
    reason_code_counts: events.reduce((acc, e) => ((acc[e.reason_code] = (acc[e.reason_code] || 0) + 1), acc), {}),
    closure_count: events.reduce((n, e) => n + e.sidecar_runtime.closed_metric, 0),
    request_wall_ms_mean: events.reduce((n, e) => n + e.sidecar_runtime.request_wall_ms, 0) / events.length,
    cases: caseReports,
  };
  fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify({ outDir: args.outDir, events: events.length, closure_count: summary.closure_count, served_model_count: servedIds?.length || 0 }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
