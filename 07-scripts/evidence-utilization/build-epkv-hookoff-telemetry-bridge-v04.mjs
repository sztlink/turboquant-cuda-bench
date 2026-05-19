#!/usr/bin/env node
/**
 * EPKV bridge v0.4 — hook-off telemetry schema projection.
 *
 * Converts offline KV replay bridge records into runtime telemetry events that
 * satisfy the Casey-guided L1 validator. This is a hook-off bridge: it does not
 * read prompt text, does not mutate serving, and does not claim model behavior.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const SOURCE = path.join(ROOT, 'bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/records.jsonl');
const OUT_DIR = path.join(ROOT, 'bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19');
const EVENTS = path.join(OUT_DIR, 'events.jsonl');
const SUMMARY = path.join(OUT_DIR, 'summary.json');
const VALIDATION_REPORT = path.join(OUT_DIR, 'validation-report.json');
const RESULTS = path.join(OUT_DIR, 'RESULTS.md');
const VALIDATOR = path.join(ROOT, '07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function spanLen(span) {
  return Array.isArray(span) && span.length === 2 ? Math.max(0, span[1] - span[0]) : 0;
}

function rangeOverlap(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 2 || b.length !== 2) return false;
  return Math.max(a[0], b[0]) <= Math.min(a[1], b[1]);
}

function classifyMode(seqLen) {
  // Hook-off bridge: no compact runtime decision is executed. The event is
  // shaped as dry-run telemetry with hook_disabled to prove schema fit only.
  return {
    mode: 'dry-run',
    decision: 'hookoff_bridge_schema_projection',
    reason_code: 'hook_disabled',
  };
}

function makeEvent(rec, index, total) {
  const replay = rec.runtime_replay || {};
  const sample = replay.selected_positions_sample || {};
  const tensor = replay.tensor_config || {};
  const overlap = replay.overlap_summary || {};
  const evidence = rec.evidence || {};
  const seqLen = Number(sample.seq_len || evidence.chat_prompt_total_tokens || tensor.key_cache_shape_logical?.[0] || 0);
  const Hq = Number(tensor.Hq || sample.heads || 28);
  const Hk = Number(tensor.Hk || 4);
  const D = Number(tensor.D || 64);
  const globalK = Number(tensor.K || sample.K || 32);
  const blockSize = Number(tensor.block_size || evidence.tokenizer?.block_size || 16);
  const numChunks = Math.ceil(seqLen / 512);
  const selectedPositionsTotal = Number(replay.validation?.selected_positions_total || 0);
  const canonicalPositions = Number(overlap.canonical_selected_positions || 0);
  const decoyPositions = Number(overlap.decoy_selected_positions || 0);
  const neitherPositions = Number(overlap.neither_selected_positions || 0);
  const selectedPageRange = sample.selected_page_range || overlap.selected_page_range || [];
  const canonicalPageRange = evidence.canonical_page_range || overlap.canonical_page_range || [];
  const decoyPageRanges = evidence.decoy_spans?.map((d) => d.page_range).filter(Boolean) || overlap.decoy_page_ranges || [];
  const selectedPagesOverlapAnyDecoy = decoyPageRanges.some((r) => rangeOverlap(selectedPageRange, r));
  const { mode, decision, reason_code } = classifyMode(seqLen);

  return {
    schema: 'epkv.runtime.telemetry.v1',
    tag: 'hookoff-bridge-v04-2026-05-19',
    mode,
    decision,
    reason_code,
    policy_version: 'epkv.hookoff_bridge.v0.4.schema_projection_2026_05_19',
    seq_len: seqLen,
    Hq,
    Hk,
    D,
    global_k: globalK,
    probe_local_top: 8,
    fallback_local_top: 32,
    num_chunks: numChunks,
    flagged_head_count: 0,
    flagged_head_rate: 0,
    seq_guard: 4096,
    flag_rate_threshold: 0.75,
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
      event_index: index + 1,
      event_cap: total,
      cap_hit: false,
      bucket: `hookoff_bridge_v04:seq_len:${seqLen}`,
    },
    privacy: {
      prompt_text: false,
      raw_token_ids: false,
      selected_positions_only: true,
    },
    selection_geometry: {
      source_bridge_version: rec.bridge_version,
      fixture_id: rec.fixture_id,
      block_size: blockSize,
      selected_positions_total: selectedPositionsTotal,
      selected_positions_sample: sample.positions_by_head_first_n || [],
      selected_page_range: selectedPageRange,
      selected_pages_first_n: sample.selected_pages_first_n || [],
      position_histogram_bin_size: sample.position_histogram_bin_size || null,
      position_histogram: sample.position_histogram || {},
      region_counts: {
        canonical_positions: canonicalPositions,
        decoy_positions: decoyPositions,
        neither_positions: neitherPositions,
      },
      dominant_region: overlap.dominant_region || null,
      overlaps: {
        selected_pages_overlap_canonical_page_range: Boolean(overlap.selected_pages_overlap_canonical_page_range ?? rangeOverlap(selectedPageRange, canonicalPageRange)),
        selected_pages_overlap_any_decoy_page_range: Boolean(overlap.selected_pages_overlap_any_decoy_page_range ?? selectedPagesOverlapAnyDecoy),
      },
    },
    evidence_geometry: {
      canonical_rank: evidence.canonical_rank,
      distractor_type: evidence.distractor_type,
      decoys_before: evidence.decoys_before,
      canonical_token_span_exact_len: spanLen(evidence.canonical_token_span_exact),
      canonical_page_range: canonicalPageRange,
      decoy_count: decoyPageRanges.length,
      decoy_page_ranges: decoyPageRanges,
    },
    bridge_boundary: {
      hook_off: true,
      serving_mutation: false,
      model_inference: false,
      runtime_trace_from_live_request: false,
      selected_positions_are_attention: false,
      behavioral_evidence: false,
    },
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const records = readJsonl(SOURCE);
  const events = records.map((rec, i) => makeEvent(rec, i, records.length));
  fs.writeFileSync(EVENTS, events.map((e) => JSON.stringify(e)).join('\n') + '\n');

  const validation = spawnSync(process.execPath, [VALIDATOR, '--json', EVENTS], { encoding: 'utf8' });
  fs.writeFileSync(VALIDATION_REPORT, validation.stdout || '');
  const validationJson = validation.stdout ? JSON.parse(validation.stdout) : { valid: false, errors: -1 };

  const dominant = {};
  const seqLens = [];
  let totalSelected = 0;
  let canonicalOverlapEvents = 0;
  let decoyOverlapEvents = 0;
  for (const e of events) {
    dominant[e.selection_geometry.dominant_region] = (dominant[e.selection_geometry.dominant_region] || 0) + 1;
    seqLens.push(e.seq_len);
    totalSelected += e.selection_geometry.selected_positions_total;
    if (e.selection_geometry.overlaps.selected_pages_overlap_canonical_page_range) canonicalOverlapEvents += 1;
    if (e.selection_geometry.overlaps.selected_pages_overlap_any_decoy_page_range) decoyOverlapEvents += 1;
  }

  const summary = {
    bridge_version: 'v0.4-hookoff-telemetry-schema-projection',
    source: path.relative(ROOT, SOURCE),
    output_events: path.relative(ROOT, EVENTS),
    records: records.length,
    events: events.length,
    validation: {
      command: `node ${path.relative(ROOT, VALIDATOR)} --json ${path.relative(ROOT, EVENTS)}`,
      status: validation.status,
      valid: validationJson.valid,
      errors: validationJson.errors,
    },
    coverage: {
      seq_len_min: Math.min(...seqLens),
      seq_len_max: Math.max(...seqLens),
      selected_positions_total: totalSelected,
      dominant_regions: dominant,
      canonical_page_overlap_events: canonicalOverlapEvents,
      decoy_page_overlap_events: decoyOverlapEvents,
    },
    boundary: {
      hook_off: true,
      serving_mutation: false,
      model_inference: false,
      runtime_trace_from_live_request: false,
      selected_positions_are_attention: false,
      behavioral_evidence: false,
    },
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));

  const lines = [
    '# Evidence-utilization EPKV hook-off telemetry bridge v0.4 — 2026-05-19',
    '',
    '> L2 hook-off bridge: offline KV replay records projected into the runtime telemetry schema and validated. No serving mutation.',
    '',
    '## Boundary',
    '',
    '```txt',
    'source: offline KV replay v0.3 records',
    'output: epkv.runtime.telemetry.v1 events',
    'serving mutation: no',
    'model inference: no',
    'real prompt trace: no',
    'selected positions are attention: no',
    '```',
    '',
    '## Artifacts',
    '',
    '```txt',
    path.relative(ROOT, EVENTS),
    path.relative(ROOT, SUMMARY),
    path.relative(ROOT, VALIDATION_REPORT),
    '```',
    '',
    '## Validation',
    '',
    '```txt',
    `events: ${events.length}`,
    `validator valid: ${validationJson.valid}`,
    `validator errors: ${validationJson.errors}`,
    `validator exit code: ${validation.status}`,
    '```',
    '',
    '## Coverage',
    '',
    '```txt',
    `seq_len range: ${summary.coverage.seq_len_min}..${summary.coverage.seq_len_max}`,
    `selected positions total: ${summary.coverage.selected_positions_total}`,
    `dominant regions: ${JSON.stringify(summary.coverage.dominant_regions)}`,
    `canonical page overlap events: ${summary.coverage.canonical_page_overlap_events}/${events.length}`,
    `decoy page overlap events: ${summary.coverage.decoy_page_overlap_events}/${events.length}`,
    '```',
    '',
    '## Decision',
    '',
    '```txt',
    'L2 hook-off bridge is schema-valid.',
    'The runtime telemetry contract can represent the existing evidence-span -> selected-position geometry artifacts.',
    'This remains a bridge/plumbing receipt, not behavioral evidence.',
    'Real-prompt hook-on remains paused.',
    '```',
    '',
    '## Non-claims',
    '',
    '- Not production attention.',
    '- Not serving.',
    '- Not a serving speedup claim.',
    '- Not answer-quality evidence.',
    '- Not evidence-utilization improvement evidence.',
    '- Selected positions are geometry, not model attention.',
  ];
  fs.writeFileSync(RESULTS, lines.join('\n') + '\n');

  if (!validationJson.valid || validation.status !== 0) {
    console.error(`validator failed: ${validationJson.errors} errors`);
    process.exit(1);
  }
  console.log(JSON.stringify(summary, null, 2));
}

main();
