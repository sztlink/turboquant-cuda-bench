#!/usr/bin/env node
// Offline metadata bridge v0 between the evidence-utilization fixtures and the
// guarded Evidence-Paged KV runtime hook.
//
// Boundary:
//   - no network, no vLLM, no GPU, no real prompts beyond synthetic vocabulary
//     already present in the public phase / distractor-taxonomy generators;
//   - no real EPKV selection: runtime layer is recorded as offline_metadata_only
//     with schema_validation against Track A event fields;
//   - no answer observation: answer.observed=false, with aggregate proxy stats
//     attached from the promoted bench-public aggregates.
//
// Output:
//   bench/evidence-utilization-epkv-bridge-2026-05-19/
//     records.jsonl
//     summary.json
//     RESULTS.md
//
// Usage:
//   node 07-scripts/evidence-utilization/build-epkv-bridge-v0.mjs
//   OUT=/tmp/foo node 07-scripts/evidence-utilization/build-epkv-bridge-v0.mjs

import fs from 'fs';
import path from 'path';
import url from 'url';

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_OUT = path.join(REPO_ROOT, 'bench', 'evidence-utilization-epkv-bridge-2026-05-19');
const OUT = process.env.OUT || DEFAULT_OUT;
const DATE_STAMP = process.env.DATE_STAMP || '2026-05-19';

const AGG_PHASE = path.join(REPO_ROOT, 'bench-public', 'evidence-utilization', 'phase-aggregate.json');
const AGG_DISTRACTOR = path.join(REPO_ROOT, 'bench-public', 'evidence-utilization', 'distractor-taxonomy-aggregate.json');
const SPEC = path.join(REPO_ROOT, 'bench-public', 'evidence-utilization', 'EPKV-BRIDGE-SPEC.md');
const RUNTIME_BENCH = path.join(REPO_ROOT, 'bench', 'evidence-paged-kv-runtime-benchmark-2026-05-19', 'RESULTS.md');

const CHARS_PER_TOKEN = 3.6; // Llama-class heuristic; explicitly documented as estimate.

// --- Vocabulary (deterministic, public-safe; matches taxonomy sweep pattern) ----
function makeHandle(i) {
  const ii = String(i).padStart(2, '0');
  return {
    i,
    alias: `bridge taxonomy handle ${i}`,
    code: `AYA-BRIDGE-${ii}-${2000 + i * 23}-OK`,
    old: `AYA-BRIDGE-${ii}-OLD-${3000 + i}-NO`,
  };
}

function canonicalBlock(h) {
  return [
    'CANONICAL RECORD',
    `ALIAS: ${h.alias}`,
    `SECRET VALUE: ${h.code}`,
    'RULE: This is the valid current record.',
  ].join('\n');
}

function distractorBlock(h, type, j) {
  if (type === 'explicit_decoy') {
    return [
      'DECOY LOOKUP',
      `ALIAS: ${h.alias}`,
      `INVALID VALUE: DECOY-BRIDGE-${h.i}-${j}`,
      'This is not the canonical record.',
    ].join('\n');
  }
  if (type === 'stale_record') {
    return [
      'ARCHIVED RECORD',
      `ALIAS: ${h.alias}`,
      `SECRET VALUE: ${h.old}`,
      'This record may be old. Timestamp: previous batch.',
    ].join('\n');
  }
  if (type === 'conflicting_correction') {
    return [
      'CORRECTION THREAD',
      `ALIAS: ${h.alias}`,
      `Earlier value: ${h.old}`,
      'A later update might exist elsewhere.',
    ].join('\n');
  }
  if (type === 'near_duplicate') {
    return [
      'CANONICAL RECORD',
      `ALIAS: ${h.alias} alternate`,
      `SECRET VALUE: DECOY-BRIDGE-NEAR-${h.i}-${j}`,
      'This is for a near-duplicate alias, not the requested alias.',
    ].join('\n');
  }
  throw new Error(`unknown distractor type ${type}`);
}

function fillerBlock(label, sizeChars) {
  const base = `FILLER ${label}. ordinary studio context. archive label. sensor calibration. retrieval note. no canonical value. `;
  return base.repeat(Math.max(1, Math.ceil(sizeChars / base.length))).slice(0, sizeChars);
}

// Phase-style retrieved section with both decoys-before and distractor-type knobs.
// 16 chunks total: `before` distractors before canonical, fillers padding to
// canonical position, canonical at index `rank`, then more distractors / fillers
// to reach 16.
function buildRetrievedSection(handle, rank, decoysBefore, distractorType) {
  const chunks = [];
  const before = Math.min(decoysBefore, rank - 1);
  for (let i = 0; i < before; i += 1) {
    chunks.push({ kind: 'distractor', content: distractorBlock(handle, distractorType, i), distractor_index: i });
  }
  while (chunks.length < rank - 1) {
    chunks.push({ kind: 'filler', content: fillerBlock(`pre-${chunks.length}`, 420), distractor_index: null });
  }
  chunks.push({ kind: 'canonical', content: canonicalBlock(handle), distractor_index: null });
  let j = before;
  while (chunks.length < 16) {
    if (j < 18) {
      chunks.push({ kind: 'distractor', content: distractorBlock(handle, distractorType, j), distractor_index: j });
      j += 1;
    } else {
      chunks.push({ kind: 'filler', content: fillerBlock(`post-${chunks.length}`, 420), distractor_index: null });
    }
  }
  return chunks;
}

function renderRetrievedSection(chunks) {
  // Same wrapper format as the phase generator: `// retrieved_chunk_rank_${i}\n```\n...\n``` `.
  return chunks
    .map((c, i) => `// retrieved_chunk_rank_${i + 1}\n\`\`\`\n${c.content}\n\`\`\``)
    .join('\n\n');
}

function buildSystemPrompt() {
  return 'You answer retrieval questions. Answer only the exact SECRET VALUE. No explanation.';
}

function buildUserPrompt(retrievedText, handle) {
  return `${retrievedText}\n\nQuestion: Which SECRET VALUE belongs to ${handle.alias}? Answer only the exact value.`;
}

function estimateTokenSpanFromCharSpan(start, end) {
  return [Math.floor(start / CHARS_PER_TOKEN), Math.floor(end / CHARS_PER_TOKEN)];
}

function estimateTokenCountFromChars(chars) {
  return Math.ceil(chars / CHARS_PER_TOKEN);
}

function computeChunkSpans(chunks) {
  // Char spans within the rendered retrieved-section string.
  const spans = [];
  let cursor = 0;
  for (let i = 0; i < chunks.length; i += 1) {
    const header = `// retrieved_chunk_rank_${i + 1}\n\`\`\`\n`;
    const tail = `\n\`\`\``;
    const sep = i === chunks.length - 1 ? '' : '\n\n';
    const fullChunkLen = header.length + chunks[i].content.length + tail.length;
    spans.push({
      chunk_index: i + 1,
      kind: chunks[i].kind,
      distractor_index: chunks[i].distractor_index,
      char_span: [cursor, cursor + fullChunkLen],
      content_char_span: [cursor + header.length, cursor + header.length + chunks[i].content.length],
    });
    cursor += fullChunkLen + sep.length;
  }
  return spans;
}

// --- Aggregate proxies (sourced from bench-public, frozen at write time) -------
function loadAggregates() {
  const phase = JSON.parse(fs.readFileSync(AGG_PHASE, 'utf8'));
  const tax = JSON.parse(fs.readFileSync(AGG_DISTRACTOR, 'utf8'));
  return { phase, tax };
}

function proxyAnswerStats({ distractorType, rank }, { tax }) {
  const row = tax.groups.by_distractor_rank.find(
    (r) => r.keys.distractor === distractorType && r.keys.canonical_rank === rank,
  );
  if (!row) {
    return null;
  }
  return {
    source: 'bench-public/evidence-utilization/distractor-taxonomy-aggregate.json',
    key: { distractor: distractorType, canonical_rank: rank },
    runs: row.runs,
    hits: row.hits,
    wrong_distractor: row.wrong_distractor,
    hit_rate: row.hit_rate,
    wrong_distractor_rate: row.wrong_distractor / row.runs,
  };
}

// --- Runtime layer schema reference (offline_metadata_only) --------------------
const TRACK_A_EVENT_FIELDS = [
  'ts',
  'tag',
  'event_index',
  'hook',
  'mode',
  'decision',
  'elapsed_ms_sync_timing',
  'elapsed_ms_wall',
  'query_shape',
  'kv_cache_shape',
  'block_table_shape',
  'seq_len',
  'K',
  'temp_scores_bytes',
  'fallback_after_max_events',
  'selected_positions_sample',
];

const TRACK_A_SELECTION_SUMMARY_FIELDS = [
  'heads',
  'K',
  'trace_top_n',
  'positions_by_head_first_n',
  'position_histogram_bin_size',
  'position_histogram',
  'min_position',
  'max_position',
  'seq_len',
];

function runtimeLayerOffline({ K }) {
  return {
    hook: 'evidence_paged_kv.runtime.phase2a.v0',
    mode: 'offline_metadata_only',
    enabled_in_serving: false,
    no_real_selection: true,
    K,
    layout_reference: 'turboquant_k8v4 packed slot_size=196 (Track A)',
    track_a_runtime_results: 'bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md',
    track_a_runtime_decision: 'cost_ratio_gate_fail; bridge proceeds via metadata-only path',
    schema_validation: {
      expected_event_fields: TRACK_A_EVENT_FIELDS,
      expected_selection_summary_fields: TRACK_A_SELECTION_SUMMARY_FIELDS,
      validation_at_record_time: 'event schema referenced, not emitted',
    },
    token_estimate_method: `chars_per_token=${CHARS_PER_TOKEN} (offline heuristic; not from real tokenizer)`,
  };
}

// --- Case design (16 deterministic hard cases) ---------------------------------
const RANKS = [8, 16];
const DECOYS_BEFORE = [3, 7];
const DISTRACTORS = ['explicit_decoy', 'stale_record', 'conflicting_correction', 'near_duplicate'];

function enumerateCases() {
  const out = [];
  let idx = 0;
  for (const rank of RANKS) {
    for (const decoysBefore of DECOYS_BEFORE) {
      for (const distractor of DISTRACTORS) {
        out.push({
          case_index: idx,
          handle_index: idx % 24,
          rank,
          decoys_before: decoysBefore,
          distractor,
        });
        idx += 1;
      }
    }
  }
  return out;
}

function buildRecord(spec, aggregates) {
  const handle = makeHandle(spec.handle_index);
  const chunks = buildRetrievedSection(handle, spec.rank, spec.decoys_before, spec.distractor);
  const retrievedText = renderRetrievedSection(chunks);
  const sysText = buildSystemPrompt();
  const userText = buildUserPrompt(retrievedText, handle);
  const totalPromptChars = sysText.length + userText.length;
  const totalPromptTokens = estimateTokenCountFromChars(totalPromptChars);

  const sectionSpans = computeChunkSpans(chunks);
  const sectionOffsetInUser = userText.indexOf(retrievedText);
  if (sectionOffsetInUser < 0) {
    throw new Error('retrieved section not found in user prompt');
  }

  const canonicalSpan = sectionSpans.find((s) => s.kind === 'canonical');
  const decoySpans = sectionSpans.filter((s) => s.kind === 'distractor');

  function toUserSpan(localSpan) {
    return [sectionOffsetInUser + localSpan[0], sectionOffsetInUser + localSpan[1]];
  }

  const canonicalUserCharSpan = toUserSpan(canonicalSpan.content_char_span);
  const decoyUserCharSpans = decoySpans.map((s) => ({
    chunk_index: s.chunk_index,
    distractor_index: s.distractor_index,
    char_span: toUserSpan(s.content_char_span),
    token_span_estimate: estimateTokenSpanFromCharSpan(...toUserSpan(s.content_char_span)),
  }));

  const fixtureId = [
    `bridge-v0`,
    `r${spec.rank}`,
    `d${spec.decoys_before}`,
    `${spec.distractor}`,
    `h${String(spec.handle_index).padStart(2, '0')}`,
  ].join('-');

  const proxy = proxyAnswerStats({ distractorType: spec.distractor, rank: spec.rank }, aggregates);

  return {
    fixture_id: fixtureId,
    bridge_version: 'v0',
    bridge_layer: 'offline_metadata_only',
    date_stamp: DATE_STAMP,
    evidence: {
      handle: {
        index: handle.i,
        alias: handle.alias,
        canonical_code: handle.code,
        archived_or_decoy_code: handle.old,
      },
      canonical_rank: spec.rank,
      decoys_before: spec.decoys_before,
      distractor_type: spec.distractor,
      total_chunks: 16,
      prompt_scaffold: 'baseline',
      zone: 'no_zone_padding',
      estimated_total_prompt_chars: totalPromptChars,
      estimated_total_prompt_tokens: totalPromptTokens,
      canonical_chunk_index: canonicalSpan.chunk_index,
      canonical_char_span_in_user_prompt: canonicalUserCharSpan,
      canonical_token_span_estimate: estimateTokenSpanFromCharSpan(...canonicalUserCharSpan),
      decoy_spans: decoyUserCharSpans,
      token_estimate_method: `chars_per_token=${CHARS_PER_TOKEN} (offline heuristic)`,
    },
    runtime: runtimeLayerOffline({ K: 32 }),
    answer: {
      observed: false,
      reason_not_observed: 'offline metadata bridge v0 — no inference executed',
      expected_class_when_observed: 'canonical',
      aggregate_proxy: proxy,
    },
    non_claims: [
      'not a serving claim',
      'not a model-quality claim',
      'not a real EPKV selection trace',
      'not a tokenizer-accurate span',
      'not a leaderboard score',
    ],
  };
}

// --- Summary -------------------------------------------------------------------
function buildSummary(records, aggregates) {
  const groupCounts = (key) => {
    const m = {};
    for (const r of records) {
      const k = r.evidence[key];
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  };

  const proxiedRecords = records.filter((r) => r.answer.aggregate_proxy);
  const meanProxyHitRate = proxiedRecords.length
    ? proxiedRecords.reduce((a, r) => a + r.answer.aggregate_proxy.hit_rate, 0) / proxiedRecords.length
    : null;
  const meanProxyWrongRate = proxiedRecords.length
    ? proxiedRecords.reduce((a, r) => a + r.answer.aggregate_proxy.wrong_distractor_rate, 0) / proxiedRecords.length
    : null;

  return {
    created_at: new Date().toISOString(),
    bridge_version: 'v0',
    bridge_layer: 'offline_metadata_only',
    date_stamp: DATE_STAMP,
    sources: {
      spec: 'bench-public/evidence-utilization/EPKV-BRIDGE-SPEC.md',
      phase_aggregate: 'bench-public/evidence-utilization/phase-aggregate.json',
      distractor_aggregate: 'bench-public/evidence-utilization/distractor-taxonomy-aggregate.json',
      runtime_results: 'bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md',
      runtime_hook_module: '07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py',
    },
    total_records: records.length,
    by_distractor_type: groupCounts('distractor_type'),
    by_canonical_rank: groupCounts('canonical_rank'),
    by_decoys_before: groupCounts('decoys_before'),
    token_estimate_method: `chars_per_token=${CHARS_PER_TOKEN} (offline heuristic)`,
    mean_estimated_prompt_tokens:
      records.reduce((a, r) => a + r.evidence.estimated_total_prompt_tokens, 0) / records.length,
    answer_observed: false,
    aggregate_proxy: {
      coverage: `${proxiedRecords.length}/${records.length}`,
      mean_proxy_hit_rate: meanProxyHitRate,
      mean_proxy_wrong_distractor_rate: meanProxyWrongRate,
    },
    runtime_layer_summary: {
      mode: 'offline_metadata_only',
      no_real_selection: true,
      schema_reference_only: true,
      track_a_decision: 'cost_ratio_gate_fail; bridge proceeds via metadata-only path',
    },
    non_claims: [
      'no serving claim',
      'no model-quality claim',
      'no real EPKV selection trace',
      'no tokenizer-accurate spans',
      'no leaderboard score',
    ],
  };
}

// --- RESULTS.md ----------------------------------------------------------------
function buildResultsMd(records, summary) {
  const lines = [];
  lines.push('# Evidence-utilization ↔ Evidence-Paged KV bridge — offline metadata v0');
  lines.push('');
  lines.push('> Status: offline metadata bridge. No serving, no real prompts run, no real EPKV selection.');
  lines.push('>');
  lines.push('> Purpose: produce a deterministic 16-case fixture record set that wires evidence-utilization');
  lines.push('> spans into the Track A runtime hook event schema, so the next bridge step (telemetry or');
  lines.push('> intervention) has a frozen target before it runs.');
  lines.push('');
  lines.push('## Boundary');
  lines.push('');
  lines.push('```txt');
  lines.push('bridge_version: v0');
  lines.push('bridge_layer:   offline_metadata_only');
  lines.push('no real EPKV selection, no real inference, no tokenizer call');
  lines.push('runtime hook event schema referenced from Track A receipt only');
  lines.push('```');
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push('- Spec: [`bench-public/evidence-utilization/EPKV-BRIDGE-SPEC.md`](../../bench-public/evidence-utilization/EPKV-BRIDGE-SPEC.md)');
  lines.push('- Track A receipt: [`bench/evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md`](../evidence-paged-kv-runtime-benchmark-2026-05-19/RESULTS.md)');
  lines.push('- Aggregates:');
  lines.push('  - [`bench-public/evidence-utilization/phase-aggregate.json`](../../bench-public/evidence-utilization/phase-aggregate.json)');
  lines.push('  - [`bench-public/evidence-utilization/distractor-taxonomy-aggregate.json`](../../bench-public/evidence-utilization/distractor-taxonomy-aggregate.json)');
  lines.push('- Hook module: [`07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py`](../../07-scripts/vllm-hook/evidence_paged_kv/runtime_hook.py)');
  lines.push('');
  lines.push('## Case matrix');
  lines.push('');
  lines.push('Deterministic 16 hard cases:');
  lines.push('');
  lines.push('| axis | values |');
  lines.push('|---|---|');
  lines.push('| canonical rank | 8, 16 |');
  lines.push('| decoys before  | 3, 7 |');
  lines.push('| distractor     | explicit_decoy, stale_record, conflicting_correction, near_duplicate |');
  lines.push('| prompt scaffold | baseline |');
  lines.push('| zone           | no_zone_padding (retrieved section only) |');
  lines.push('| total          | 16 |');
  lines.push('');
  lines.push(`Mean estimated prompt tokens (heuristic, chars/token=${CHARS_PER_TOKEN}): ${summary.mean_estimated_prompt_tokens.toFixed(1)}`);
  lines.push('');
  lines.push('## Aggregate proxy (answer class when this fixture would be run)');
  lines.push('');
  lines.push('Proxy stats come from the public distractor-taxonomy aggregate (`by_distractor_rank`). They are not');
  lines.push('measurements of these specific bridge records; they are the closest published hit-rate band for the');
  lines.push('(distractor, rank) cell. No claim of identity between the proxy and a real run.');
  lines.push('');
  lines.push('Proxy is keyed on `(distractor, canonical_rank)`; the same value applies across both');
  lines.push('`decoys_before` cells in this matrix.');
  lines.push('');
  lines.push('| distractor | rank | proxy hit rate | proxy wrong-distractor rate | proxy runs |');
  lines.push('|---|---:|---:|---:|---:|');
  const seenProxyKeys = new Set();
  const rows = records
    .map((r) => ({
      distractor: r.evidence.distractor_type,
      rank: r.evidence.canonical_rank,
      proxy: r.answer.aggregate_proxy,
    }))
    .sort((a, b) => a.distractor.localeCompare(b.distractor) || a.rank - b.rank);
  for (const row of rows) {
    if (!row.proxy) continue;
    const key = `${row.distractor}|${row.rank}`;
    if (seenProxyKeys.has(key)) continue;
    seenProxyKeys.add(key);
    lines.push(
      `| ${row.distractor} | ${row.rank} | ${(100 * row.proxy.hit_rate).toFixed(1)}% | ${(100 * row.proxy.wrong_distractor_rate).toFixed(1)}% | ${row.proxy.runs} |`,
    );
  }
  lines.push('');
  lines.push('## Runtime layer (offline)');
  lines.push('');
  lines.push('Each record carries a runtime stanza marked `offline_metadata_only`:');
  lines.push('');
  lines.push('```txt');
  lines.push('hook:                  evidence_paged_kv.runtime.phase2a.v0');
  lines.push('mode:                  offline_metadata_only');
  lines.push('enabled_in_serving:    false');
  lines.push('no_real_selection:     true');
  lines.push('K (would-be):          32');
  lines.push('layout_reference:      turboquant_k8v4 packed slot_size=196 (Track A)');
  lines.push('track_a_runtime_decision: cost_ratio_gate_fail; bridge proceeds via metadata-only path');
  lines.push('schema_validation:     event + selection-summary fields referenced, not emitted');
  lines.push('```');
  lines.push('');
  lines.push('Expected Track A event fields (referenced for downstream wiring, not produced here):');
  lines.push('');
  lines.push('```txt');
  for (const f of TRACK_A_EVENT_FIELDS) lines.push(`- ${f}`);
  lines.push('```');
  lines.push('');
  lines.push('## Evidence layer spans');
  lines.push('');
  lines.push('Each record records:');
  lines.push('');
  lines.push('- `canonical_chunk_index` (1..16) — position of canonical record in the retrieved section;');
  lines.push('- `canonical_char_span_in_user_prompt` — exact char range of the canonical block content;');
  lines.push('- `canonical_token_span_estimate` — char span divided by chars/token heuristic;');
  lines.push('- `decoy_spans[]` — same shape for each non-canonical chunk;');
  lines.push('- `total_chunks` is always 16 (matches phase fixture);');
  lines.push('- `zone` is `no_zone_padding`: no top/bottom filler added around the section, so spans stay tight.');
  lines.push('');
  lines.push('Spans are computed from the rendered user prompt string deterministically. No tokenizer was');
  lines.push('called; tokens are estimated via `chars/token` heuristic and explicitly labeled as such.');
  lines.push('');
  lines.push('## Output files');
  lines.push('');
  lines.push('```txt');
  lines.push('records.jsonl    16 records, one per case');
  lines.push('summary.json     aggregate counts + proxy summary + non-claims');
  lines.push('RESULTS.md       this file');
  lines.push('```');
  lines.push('');
  lines.push('## Non-claims');
  lines.push('');
  for (const c of summary.non_claims) lines.push(`- ${c}`);
  lines.push('');
  lines.push('## Next step');
  lines.push('');
  lines.push('When the cost-ratio gate is redesigned or passed, the bridge can graduate from v0 (offline');
  lines.push('metadata) to v1 (telemetry-only Option A under `VLLM_EPKV_RUNTIME_DRY_RUN=1`). At that point');
  lines.push('these records can be re-emitted with real `selected_positions_sample` blocks attached to the');
  lines.push('same fixture ids, allowing direct alignment of evidence spans against runtime selected positions.');
  lines.push('');
  return lines.join('\n');
}

// --- Driver --------------------------------------------------------------------
function main() {
  if (!fs.existsSync(AGG_PHASE)) {
    throw new Error(`missing aggregate ${AGG_PHASE}`);
  }
  if (!fs.existsSync(AGG_DISTRACTOR)) {
    throw new Error(`missing aggregate ${AGG_DISTRACTOR}`);
  }
  if (!fs.existsSync(SPEC)) {
    throw new Error(`missing spec ${SPEC}`);
  }
  if (!fs.existsSync(RUNTIME_BENCH)) {
    throw new Error(`missing runtime benchmark results ${RUNTIME_BENCH}`);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const aggregates = loadAggregates();
  const cases = enumerateCases();
  const records = cases.map((c) => buildRecord(c, aggregates));

  const recordsPath = path.join(OUT, 'records.jsonl');
  fs.writeFileSync(recordsPath, records.map((r) => JSON.stringify(r)).join('\n') + '\n');

  const summary = buildSummary(records, aggregates);
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

  const md = buildResultsMd(records, summary);
  fs.writeFileSync(path.join(OUT, 'RESULTS.md'), md);

  console.log(`wrote ${records.length} records to ${OUT}`);
}

main();
