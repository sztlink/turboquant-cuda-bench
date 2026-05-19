#!/usr/bin/env node
/**
 * EPKV fixture refinement v1.5.
 *
 * Refines the v1.1 needs-fixture-detail targets into contrastive synthetic
 * hook-off telemetry events: canonical, decoy, and neither variants.
 *
 * Boundary: synthetic fixture refinement only. No runtime hook, serving, model
 * call, attention, or evidence-use proof.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const ACTIONS = path.join(ROOT, 'bench/evidence-utilization-epkv-audit-join-2026-05-19/target-action-table.jsonl');
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-fixture-refinement-2026-05-19');
const RECORDS = path.join(OUT, 'refined-fixture-records.jsonl');
const EVENTS = path.join(OUT, 'events.jsonl');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function positionsForPages(pages, count, block = 16) {
  const out = [];
  let cursor = 0;
  while (out.length < count) {
    const page = pages[cursor % pages.length];
    const offset = (cursor * 5 + 1) % block;
    out.push(page * block + offset);
    cursor++;
  }
  return out;
}

function layoutFor(action) {
  const decoys = action.decoys_before ?? Math.max(0, (action.canonical_rank ?? 8) - 1);
  const canonicalStart = Math.max(6, decoys + 4);
  return {
    page_size_tokens: 16,
    canonical_page_range: [canonicalStart, canonicalStart + 2],
    decoy_page_ranges: Array.from({ length: Math.min(decoys, 10) }, (_, i) => [i + 1, i + 1]),
    neutral_page_ranges: [[canonicalStart + 6, canonicalStart + 12]],
  };
}

function pages(range) {
  const [a, b] = range;
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

function samples(layout, variant) {
  const Hq = 28, K = 32;
  const canonical = pages(layout.canonical_page_range);
  const decoy = layout.decoy_page_ranges.flatMap(pages);
  const neutral = layout.neutral_page_ranges.flatMap(pages);
  const out = [];
  for (let h = 0; h < Hq; h++) {
    const p = variant === 'canonical'
      ? (h < 20 ? canonical : h < 24 ? decoy : neutral)
      : variant === 'decoy'
        ? (h < 20 ? decoy : h < 24 ? canonical : neutral)
        : (h < 20 ? neutral : h < 24 ? canonical : decoy);
    out.push(positionsForPages(p.length ? p : canonical, K));
  }
  return out;
}

function classify(pos, layout) {
  const page = Math.floor(pos / 16);
  const inRange = ([a, b]) => page >= a && page <= b;
  if (inRange(layout.canonical_page_range)) return 'canonical';
  if (layout.decoy_page_ranges.some(inRange)) return 'decoy';
  return 'neither';
}

function region(samples, layout) {
  const counts = { canonical_positions: 0, decoy_positions: 0, neither_positions: 0 };
  for (const head of samples) for (const pos of head) counts[`${classify(pos, layout)}_positions`]++;
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0].replace('_positions', '');
  return { counts, dominant };
}

function pageSet(samples) {
  return [...new Set(samples.flat().map((p) => Math.floor(p / 16)))].sort((a, b) => a - b);
}

function overlapPages(selected, ranges) {
  const set = new Set(selected);
  return ranges.some(([a, b]) => {
    for (let p = a; p <= b; p++) if (set.has(p)) return true;
    return false;
  });
}

function auditProjection(dominant) {
  if (dominant === 'canonical') return 'green_canonical_geometry_compatible';
  if (dominant === 'decoy') return 'red_decoy_geometry_risk';
  return 'yellow_neither_geometry_inconclusive';
}

function make(action, variant, index) {
  const layout = layoutFor(action);
  const s = samples(layout, variant);
  const p = pageSet(s);
  const r = region(s, layout);
  const fixtureId = `${action.target_id}-${variant}-refined`;
  const event = {
    schema: 'epkv.runtime.telemetry.v1',
    tag: 'fixture-refinement-v15-2026-05-19',
    mode: 'dry-run',
    decision: 'hookoff_fixture_refinement',
    reason_code: 'hook_disabled',
    policy_version: 'epkv.fixture_refinement.v1.5.synthetic_hookoff_2026_05_19',
    seq_len: (Math.max(...p) + 3) * 16,
    Hq: 28,
    Hk: 4,
    D: 64,
    global_k: 32,
    probe_local_top: 8,
    fallback_local_top: 32,
    num_chunks: 1,
    flagged_head_count: r.dominant === 'decoy' ? 20 : 0,
    flagged_head_rate: r.dominant === 'decoy' ? 20 / 28 : 0,
    seq_guard: 4096,
    flag_rate_threshold: 0.75,
    timing_ms: { probe_candidates: 0, detector: 0, compact_merge: 0, global_select: 0, value: 0, exact_fallback: 0, total_hook_wall: 0, total_hook_cuda: 0 },
    coverage: { event_index: index + 1, event_cap: 9, cap_hit: false, bucket: `fixture_refinement:${variant}` },
    privacy: { prompt_text: false, raw_token_ids: false, selected_positions_only: true },
    selection_geometry: {
      source_bridge_version: 'v1.5-fixture-refinement',
      fixture_id: fixtureId,
      block_size: 16,
      selected_positions_total: 28 * 32,
      selected_positions_sample: s,
      selected_page_range: [Math.min(...p), Math.max(...p)],
      selected_pages_first_n: p.slice(0, 64),
      region_counts: r.counts,
      dominant_region: r.dominant,
      overlaps: {
        selected_pages_overlap_canonical_page_range: overlapPages(p, [layout.canonical_page_range]),
        selected_pages_overlap_any_decoy_page_range: overlapPages(p, layout.decoy_page_ranges),
      },
    },
    evidence_geometry: {
      canonical_rank: action.canonical_rank,
      distractor_type: action.distractor_type,
      decoys_before: action.decoys_before,
      canonical_page_range: layout.canonical_page_range,
      decoy_count: layout.decoy_page_ranges.length,
      decoy_page_ranges: layout.decoy_page_ranges,
    },
    bridge_boundary: { hook_off: true, serving_mutation: false, model_inference: false, runtime_trace_from_live_request: false, selected_positions_are_attention: false, behavioral_evidence: false },
  };
  const record = {
    record_schema: 'epkv.refined_fixture.v1.5',
    target_id: action.target_id,
    fixture_id: fixtureId,
    source_action_state: action.action_state,
    refinement_variant: variant,
    source_risk: action.risk,
    distractor_type: action.distractor_type,
    canonical_rank: action.canonical_rank,
    decoys_before: action.decoys_before,
    synthetic_layout: layout,
    telemetry_event_index: index + 1,
    dominant_region: r.dominant,
    region_counts: r.counts,
    audit_projection: auditProjection(r.dominant),
    boundary: { synthetic_layout: true, hook_off: true, serving: false, model_attention: false, evidence_use_proof: false },
  };
  return { record, event };
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const actions = readJsonl(ACTIONS).filter((a) => a.action_state === 'needs-fixture-detail');
  const variants = ['canonical', 'decoy', 'neither'];
  const pairs = [];
  for (const action of actions) for (const variant of variants) pairs.push({ action, variant });
  const materialized = pairs.map((x, i) => make(x.action, x.variant, i));
  fs.writeFileSync(RECORDS, materialized.map((x) => JSON.stringify(x.record)).join('\n') + '\n');
  fs.writeFileSync(EVENTS, materialized.map((x) => JSON.stringify(x.event)).join('\n') + '\n');
  const byVariant = {}, byDominant = {}, byProjection = {};
  for (const { record } of materialized) {
    byVariant[record.refinement_variant] = (byVariant[record.refinement_variant] || 0) + 1;
    byDominant[record.dominant_region] = (byDominant[record.dominant_region] || 0) + 1;
    byProjection[record.audit_projection] = (byProjection[record.audit_projection] || 0) + 1;
  }
  const summary = {
    refinement_version: 'v1.5-fixture-refinement',
    source_targets: actions.length,
    records: materialized.length,
    events: materialized.length,
    by_variant: byVariant,
    by_dominant_region: byDominant,
    by_audit_projection: byProjection,
    output_records: path.relative(ROOT, RECORDS),
    output_events: path.relative(ROOT, EVENTS),
    boundary: { synthetic_layout: true, hook_off: true, serving: false, runtime_hook: false, model_call: false, model_attention: false, evidence_use_proof: false },
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));
  fs.writeFileSync(RESULTS, [
    '# EPKV fixture refinement v1.5 — 2026-05-19',
    '',
    '> Refines the 3 needs-fixture-detail targets into canonical/decoy/neither synthetic hook-off variants.',
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
    `source_targets: ${actions.length}`,
    `records: ${materialized.length}`,
    `events: ${materialized.length}`,
    `by_variant: ${JSON.stringify(byVariant)}`,
    `by_dominant_region: ${JSON.stringify(byDominant)}`,
    `by_audit_projection: ${JSON.stringify(byProjection)}`,
    '```',
    '',
    '## Decision',
    '',
    '```txt',
    'The 3 ambiguous targets now have contrastive canonical/decoy/neither synthetic layouts.',
    'Next autonomous packet: validate these refined events and fold them into a second replay pack.',
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
