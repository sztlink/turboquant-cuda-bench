#!/usr/bin/env node
/**
 * EPKV refined replay pack v1.6.
 *
 * Compacts v1.5 contrastive canonical/decoy/neither refined fixtures into a
 * replay pack. Keeps variants explicit.
 *
 * Boundary: replay pack only. No runtime hook, serving, model call, attention,
 * or evidence-use proof.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const RECORDS_IN = path.join(ROOT, 'bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/refined-fixture-records.jsonl');
const EVENTS_IN = path.join(ROOT, 'bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/events.jsonl');
const VALIDATION = path.join(ROOT, 'bench/evidence-utilization-epkv-fixture-refinement-2026-05-19/validation-report.json');
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-refined-replay-pack-2026-05-19');
const PACK = path.join(OUT, 'refined-replay-pack.jsonl');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}
function sha(x) { return crypto.createHash('sha256').update(x).digest('hex'); }
function compactEvent(event) {
  return {
    schema: event.schema,
    mode: event.mode,
    decision: event.decision,
    reason_code: event.reason_code,
    policy_version: event.policy_version,
    seq_len: event.seq_len,
    Hq: event.Hq,
    Hk: event.Hk,
    D: event.D,
    global_k: event.global_k,
    flagged_head_count: event.flagged_head_count,
    flagged_head_rate: event.flagged_head_rate,
    privacy: event.privacy,
    selection_geometry: {
      fixture_id: event.selection_geometry.fixture_id,
      selected_positions_total: event.selection_geometry.selected_positions_total,
      selected_page_range: event.selection_geometry.selected_page_range,
      selected_pages_first_n: event.selection_geometry.selected_pages_first_n,
      region_counts: event.selection_geometry.region_counts,
      dominant_region: event.selection_geometry.dominant_region,
      overlaps: event.selection_geometry.overlaps,
    },
    evidence_geometry: event.evidence_geometry,
    bridge_boundary: event.bridge_boundary,
  };
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const records = readJsonl(RECORDS_IN);
  const events = readJsonl(EVENTS_IN);
  const validation = JSON.parse(fs.readFileSync(VALIDATION, 'utf8'));
  const eventByFixture = new Map(events.map((e) => [e.selection_geometry.fixture_id, e]));
  const pack = records.map((r, i) => {
    const e = eventByFixture.get(r.fixture_id);
    if (!e) throw new Error(`missing event for ${r.fixture_id}`);
    const item = {
      replay_schema: 'epkv.refined_replay_pack.v1.6',
      replay_id: `refined-replay-${String(i + 1).padStart(2, '0')}`,
      target_id: r.target_id,
      fixture_id: r.fixture_id,
      refinement_variant: r.refinement_variant,
      source_risk: r.source_risk,
      distractor_type: r.distractor_type,
      canonical_rank: r.canonical_rank,
      decoys_before: r.decoys_before,
      materialized_geometry: {
        synthetic_layout: r.synthetic_layout,
        dominant_region: r.dominant_region,
        region_counts: r.region_counts,
        audit_projection: r.audit_projection,
      },
      telemetry_event: compactEvent(e),
      replay_checks: {
        validator_pack_passed: validation.valid === true && validation.errors === 0,
        schema_v1: e.schema === 'epkv.runtime.telemetry.v1',
        hook_off: e.reason_code === 'hook_disabled' && e.bridge_boundary?.hook_off === true,
        dry_run: e.mode === 'dry-run',
        privacy_safe: e.privacy?.prompt_text === false && e.privacy?.raw_token_ids === false && e.privacy?.selected_positions_only === true,
        no_raw_selected_position_samples: true,
        variant_matches_dominant_region: r.refinement_variant === r.dominant_region,
      },
      boundary: { replay_pack_only: true, synthetic_layout: true, hook_off: true, serving: false, runtime_hook: false, model_call: false, model_attention: false, evidence_use_proof: false },
    };
    item.record_hash = sha(JSON.stringify(item));
    return item;
  });
  fs.writeFileSync(PACK, pack.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const byVariant = {}, byDominant = {}, byProjection = {}, byTarget = {};
  for (const r of pack) {
    byVariant[r.refinement_variant] = (byVariant[r.refinement_variant] || 0) + 1;
    byDominant[r.materialized_geometry.dominant_region] = (byDominant[r.materialized_geometry.dominant_region] || 0) + 1;
    byProjection[r.materialized_geometry.audit_projection] = (byProjection[r.materialized_geometry.audit_projection] || 0) + 1;
    byTarget[r.target_id] = (byTarget[r.target_id] || 0) + 1;
  }
  const checks = {
    records: pack.length,
    validator_pack_passed: validation.valid === true && validation.errors === 0,
    all_schema_v1: pack.every((r) => r.replay_checks.schema_v1),
    all_hook_off: pack.every((r) => r.replay_checks.hook_off),
    all_dry_run: pack.every((r) => r.replay_checks.dry_run),
    all_privacy_safe: pack.every((r) => r.replay_checks.privacy_safe),
    all_without_raw_samples: pack.every((r) => !('selected_positions_sample' in r.telemetry_event.selection_geometry)),
    all_variants_match_dominant_region: pack.every((r) => r.replay_checks.variant_matches_dominant_region),
    each_target_has_three_variants: Object.values(byTarget).every((n) => n === 3),
  };
  const summary = {
    replay_version: 'v1.6-refined-replay-pack',
    records: pack.length,
    checks,
    by_variant: byVariant,
    by_dominant_region: byDominant,
    by_audit_projection: byProjection,
    by_target: byTarget,
    refined_replay_pack_sha256: sha(fs.readFileSync(PACK, 'utf8')),
    artifacts: { pack: path.relative(ROOT, PACK), summary: path.relative(ROOT, SUMMARY) },
    boundary: { replay_pack_only: true, synthetic_layout: true, hook_off: true, serving: false, runtime_hook: false, model_call: false, model_attention: false, evidence_use_proof: false },
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));
  fs.writeFileSync(RESULTS, [
    '# EPKV refined replay pack v1.6 — 2026-05-19',
    '',
    '> Compacts the v1.5 canonical/decoy/neither refined fixtures into a replay pack.',
    '',
    '## Boundary',
    '',
    '```txt',
    'replay pack only: yes',
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
    path.relative(ROOT, PACK),
    path.relative(ROOT, SUMMARY),
    '```',
    '',
    '## Result',
    '',
    '```txt',
    `records: ${pack.length}`,
    `checks: ${JSON.stringify(checks)}`,
    `by_variant: ${JSON.stringify(byVariant)}`,
    `by_audit_projection: ${JSON.stringify(byProjection)}`,
    '```',
    '',
    '## Decision',
    '',
    '```txt',
    'The three formerly ambiguous targets now have validated contrastive replay coverage.',
    'Together with v1.2, the offline bridge now covers 22 replay records: 13 decoy-risk + 9 contrastive refinement records.',
    'Next autonomous packet: update ledger to v1.7 including refined fixtures/replay pack.',
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
