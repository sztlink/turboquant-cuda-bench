#!/usr/bin/env node
/**
 * EPKV bridge target materialization v1.0.
 *
 * Takes v0.9 target skeletons and emits concrete synthetic span/page records
 * plus schema-valid hook-off telemetry events.
 *
 * Boundary: synthetic hook-off geometry only. No runtime hook, serving, model call,
 * model attention, or evidence-use proof.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const IN = path.join(ROOT, 'bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/bridge-fixture-skeletons.jsonl');
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-target-materialization-2026-05-19');
const RECORDS = path.join(OUT, 'materialized-records.jsonl');
const EVENTS = path.join(OUT, 'events.jsonl');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function rangePages(range) {
  const [a, b] = range;
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

function positionsForPages(pages, count, block = 16) {
  const out = [];
  let cursor = 0;
  while (out.length < count) {
    const page = pages[cursor % pages.length];
    const offset = (cursor * 7 + 3) % block;
    out.push(page * block + offset);
    cursor += 1;
  }
  return out;
}

function makeSamples(layout, mode) {
  const canonicalPages = rangePages(layout.canonical_page_range);
  const decoyPages = layout.decoy_page_ranges.flatMap(rangePages);
  const neutralPages = layout.neutral_page_ranges.flatMap(rangePages);
  const Hq = 28;
  const K = 32;
  const samples = [];
  for (let h = 0; h < Hq; h++) {
    let pages;
    if (mode === 'decoy') pages = h < 20 ? decoyPages : h < 24 ? canonicalPages : neutralPages;
    else if (mode === 'canonical') pages = h < 18 ? canonicalPages : h < 22 ? decoyPages : neutralPages;
    else pages = h < 20 ? neutralPages : h < 24 ? decoyPages : canonicalPages;
    samples.push(positionsForPages(pages.length ? pages : canonicalPages, K));
  }
  return samples;
}

function classifyPosition(pos, layout) {
  const page = Math.floor(pos / 16);
  const inRange = ([a, b]) => page >= a && page <= b;
  if (inRange(layout.canonical_page_range)) return 'canonical';
  if (layout.decoy_page_ranges.some(inRange)) return 'decoy';
  return 'neither';
}

function countRegions(samples, layout) {
  const counts = { canonical_positions: 0, decoy_positions: 0, neither_positions: 0 };
  for (const head of samples) {
    for (const pos of head) {
      const region = classifyPosition(pos, layout);
      counts[`${region}_positions`] += 1;
    }
  }
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0].replace('_positions', '');
  return { counts, dominant };
}

function pageSet(samples) {
  return [...new Set(samples.flat().map((p) => Math.floor(p / 16)))].sort((a, b) => a - b);
}

function overlaps(pages, ranges) {
  const set = new Set(pages);
  return ranges.some(([a, b]) => {
    for (let p = a; p <= b; p++) if (set.has(p)) return true;
    return false;
  });
}

function materialize(s, i) {
  const layout = s.synthetic_layout;
  const risk = s.fixture_id.includes('stale_record') || s.fixture_id.includes('conflicting') || s.fixture_id.includes('near_duplicate') || s.decoys_before > 0 ? 'decoy' : 'neither';
  const samples = makeSamples(layout, risk);
  const pages = pageSet(samples);
  const { counts, dominant } = countRegions(samples, layout);
  const seqLen = (Math.max(...pages) + 3) * 16;
  const selectedTotal = samples.length * samples[0].length;
  const event = {
    schema: 'epkv.runtime.telemetry.v1',
    tag: 'target-materialization-v10-2026-05-19',
    mode: 'dry-run',
    decision: 'hookoff_target_materialization',
    reason_code: 'hook_disabled',
    policy_version: 'epkv.target_materialization.v1.0.synthetic_hookoff_2026_05_19',
    seq_len: seqLen,
    Hq: 28,
    Hk: 4,
    D: 64,
    global_k: 32,
    probe_local_top: 8,
    fallback_local_top: 32,
    num_chunks: Math.ceil(seqLen / 512),
    flagged_head_count: dominant === 'decoy' ? 20 : dominant === 'canonical' ? 4 : 0,
    flagged_head_rate: dominant === 'decoy' ? 20 / 28 : dominant === 'canonical' ? 4 / 28 : 0,
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
      event_index: i + 1,
      event_cap: 16,
      cap_hit: false,
      bucket: `target_materialization:${s.distractor_type}:rank:${s.canonical_rank}`,
    },
    privacy: {
      prompt_text: false,
      raw_token_ids: false,
      selected_positions_only: true,
    },
    selection_geometry: {
      source_bridge_version: 'v1.0-target-materialization',
      fixture_id: s.fixture_id,
      block_size: 16,
      selected_positions_total: selectedTotal,
      selected_positions_sample: samples,
      selected_page_range: [Math.min(...pages), Math.max(...pages)],
      selected_pages_first_n: pages.slice(0, 64),
      region_counts: counts,
      dominant_region: dominant,
      overlaps: {
        selected_pages_overlap_canonical_page_range: overlaps(pages, [layout.canonical_page_range]),
        selected_pages_overlap_any_decoy_page_range: overlaps(pages, layout.decoy_page_ranges),
      },
    },
    evidence_geometry: {
      canonical_rank: s.canonical_rank,
      distractor_type: s.distractor_type,
      decoys_before: s.decoys_before,
      canonical_page_range: layout.canonical_page_range,
      decoy_count: layout.decoy_page_ranges.length,
      decoy_page_ranges: layout.decoy_page_ranges,
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
  const record = {
    record_schema: 'epkv.materialized_bridge_target.v1.0',
    target_id: s.target_id,
    fixture_id: s.fixture_id,
    source_skeleton_schema: s.skeleton_schema,
    canonical_rank: s.canonical_rank,
    distractor_type: s.distractor_type,
    decoys_before: s.decoys_before,
    synthetic_layout: layout,
    telemetry_event_index: i + 1,
    selected_positions_total: selectedTotal,
    dominant_region: dominant,
    region_counts: counts,
    audit_projection: dominant === 'decoy'
      ? 'red_decoy_geometry_risk'
      : dominant === 'canonical'
        ? 'green_canonical_geometry_compatible'
        : 'yellow_neither_geometry_inconclusive',
    boundary: {
      synthetic_layout: true,
      hook_off: true,
      serving: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  };
  return { record, event };
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const skeletons = readJsonl(IN);
  const materialized = skeletons.map(materialize);
  fs.writeFileSync(RECORDS, materialized.map((x) => JSON.stringify(x.record)).join('\n') + '\n');
  fs.writeFileSync(EVENTS, materialized.map((x) => JSON.stringify(x.event)).join('\n') + '\n');
  const byDominant = {};
  const byAudit = {};
  const byDistractor = {};
  for (const { record } of materialized) {
    byDominant[record.dominant_region] = (byDominant[record.dominant_region] || 0) + 1;
    byAudit[record.audit_projection] = (byAudit[record.audit_projection] || 0) + 1;
    byDistractor[record.distractor_type] = (byDistractor[record.distractor_type] || 0) + 1;
  }
  const summary = {
    materialization_version: 'v1.0-target-materialization',
    records: materialized.length,
    events: materialized.length,
    source_skeletons: path.relative(ROOT, IN),
    output_records: path.relative(ROOT, RECORDS),
    output_events: path.relative(ROOT, EVENTS),
    by_dominant_region: byDominant,
    by_audit_projection: byAudit,
    by_distractor: byDistractor,
    boundary: {
      synthetic_layout: true,
      hook_off: true,
      serving: false,
      runtime_hook: false,
      model_call: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));
  fs.writeFileSync(RESULTS, [
    '# EPKV target materialization v1.0 — 2026-05-19',
    '',
    '> Converts v0.9 bridge target skeletons into concrete synthetic span/page records and schema-valid hook-off telemetry events.',
    '',
    '## Boundary',
    '',
    '```txt',
    'synthetic layout: yes',
    'hook-off: yes',
    'serving: no',
    'runtime hook: no',
    'model call: no',
    'model attention: no',
    'evidence-use proof: no',
    '```',
    '',
    '## Artifacts',
    '',
    '```txt',
    path.relative(ROOT, RECORDS),
    path.relative(ROOT, EVENTS),
    path.relative(ROOT, SUMMARY),
    '```',
    '',
    '## Result',
    '',
    '```txt',
    `records: ${materialized.length}`,
    `events: ${materialized.length}`,
    `by_dominant_region: ${JSON.stringify(byDominant)}`,
    `by_audit_projection: ${JSON.stringify(byAudit)}`,
    `by_distractor: ${JSON.stringify(byDistractor)}`,
    '```',
    '',
    '## Decision',
    '',
    '```txt',
    'The v0.9 target queue now has materialized synthetic hook-off events.',
    'These events are ready for schema validation and downstream audit-join tooling.',
    'They remain synthetic planning/bridge artifacts, not runtime behavior.',
    '```',
    '',
    '## Non-claims',
    '',
    '- Not runtime telemetry from a live request.',
    '- Not EPKV behavior.',
    '- Not model attention.',
    '- Not evidence-use proof.',
    '- Not serving readiness.',
  ].join('\n') + '\n');
  console.log(JSON.stringify(summary, null, 2));
}

main();
