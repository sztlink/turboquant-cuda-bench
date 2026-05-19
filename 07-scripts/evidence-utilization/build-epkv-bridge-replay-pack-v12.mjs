#!/usr/bin/env node
/**
 * EPKV bridge replay pack v1.2.
 *
 * Builds a replay-ready, hook-off pack for bridge-ready targets from v1.1.
 * It joins action states, materialized records, and schema-valid telemetry into
 * compact records that downstream bridge tooling can consume.
 *
 * Boundary: replay pack only. No runtime hook, serving, model call, model
 * attention, or evidence-use proof.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const ACTIONS = path.join(ROOT, 'bench/evidence-utilization-epkv-audit-join-2026-05-19/target-action-table.jsonl');
const MATERIALIZED = path.join(ROOT, 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/materialized-records.jsonl');
const EVENTS = path.join(ROOT, 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/events.jsonl');
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19');
const PACK = path.join(OUT, 'bridge-replay-pack.jsonl');
const MANIFEST = path.join(OUT, 'manifest.json');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

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
    coverage: event.coverage,
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
  const actions = readJsonl(ACTIONS).filter((a) => a.action_state === 'bridge-ready');
  const materialized = readJsonl(MATERIALIZED);
  const events = readJsonl(EVENTS);
  const matByTarget = new Map(materialized.map((m) => [m.target_id, m]));
  const eventByFixture = new Map(events.map((e) => [e.selection_geometry.fixture_id, e]));

  const pack = actions.map((action, i) => {
    const mat = matByTarget.get(action.target_id);
    const event = mat ? eventByFixture.get(mat.fixture_id) : null;
    if (!mat || !event) throw new Error(`missing materialized/event for ${action.target_id}`);
    const replay = {
      replay_schema: 'epkv.bridge_replay_pack.v1.2',
      replay_id: `replay-${String(i + 1).padStart(2, '0')}`,
      target_id: action.target_id,
      fixture_id: mat.fixture_id,
      action_state: action.action_state,
      action_reason: action.action_reason,
      priority_score: action.priority_score,
      source_risk: {
        risk: action.risk,
        distractor_type: action.distractor_type,
        canonical_rank: action.canonical_rank,
        decoys_before: action.decoys_before,
        source_hit_rate: action.source_hit_rate,
        source_wrong_rate: action.source_wrong_rate,
      },
      materialized_geometry: {
        synthetic_layout: mat.synthetic_layout,
        dominant_region: mat.dominant_region,
        region_counts: mat.region_counts,
        audit_projection: mat.audit_projection,
      },
      telemetry_event: compactEvent(event),
      replay_checks: {
        schema_v1: event.schema === 'epkv.runtime.telemetry.v1',
        hook_off: event.reason_code === 'hook_disabled' && event.bridge_boundary?.hook_off === true,
        dry_run: event.mode === 'dry-run',
        privacy_safe: event.privacy?.prompt_text === false && event.privacy?.raw_token_ids === false && event.privacy?.selected_positions_only === true,
        decoy_risk_geometry: mat.dominant_region === 'decoy' && action.risk === 'decoy_capture_risk',
      },
      boundary: {
        replay_pack_only: true,
        synthetic_layout: true,
        hook_off: true,
        serving: false,
        runtime_hook: false,
        model_call: false,
        model_attention: false,
        evidence_use_proof: false,
      },
    };
    replay.record_hash = sha256(JSON.stringify(replay));
    return replay;
  });

  fs.writeFileSync(PACK, pack.map((x) => JSON.stringify(x)).join('\n') + '\n');
  const checks = {
    records_have_schema_v1: pack.every((r) => r.replay_checks.schema_v1),
    records_are_hook_off: pack.every((r) => r.replay_checks.hook_off),
    records_are_dry_run: pack.every((r) => r.replay_checks.dry_run),
    records_privacy_safe: pack.every((r) => r.replay_checks.privacy_safe),
    records_decoy_risk_geometry: pack.every((r) => r.replay_checks.decoy_risk_geometry),
    no_raw_selected_position_samples: pack.every((r) => !('selected_positions_sample' in r.telemetry_event.selection_geometry)),
  };
  const byDistractor = {};
  const byRank = {};
  for (const r of pack) {
    byDistractor[r.source_risk.distractor_type] = (byDistractor[r.source_risk.distractor_type] || 0) + 1;
    const rank = r.source_risk.canonical_rank ?? 'rank_any';
    byRank[rank] = (byRank[rank] || 0) + 1;
  }
  const manifest = {
    manifest_schema: 'epkv.bridge_replay_manifest.v1.2',
    created_at: new Date().toISOString(),
    source_files: {
      actions: path.relative(ROOT, ACTIONS),
      materialized: path.relative(ROOT, MATERIALIZED),
      events: path.relative(ROOT, EVENTS),
    },
    replay_pack: path.relative(ROOT, PACK),
    records: pack.length,
    checks,
    pack_sha256: sha256(fs.readFileSync(PACK, 'utf8')),
    boundary: {
      replay_pack_only: true,
      synthetic_layout: true,
      hook_off: true,
      serving: false,
      runtime_hook: false,
      model_call: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  const summary = {
    replay_version: 'v1.2-bridge-replay-pack',
    records: pack.length,
    checks,
    by_distractor: byDistractor,
    by_rank: byRank,
    artifacts: {
      replay_pack: path.relative(ROOT, PACK),
      manifest: path.relative(ROOT, MANIFEST),
      summary: path.relative(ROOT, SUMMARY),
    },
    boundary: manifest.boundary,
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));
  const rows = pack.slice(0, 12).map((r) => `| ${r.replay_id} | ${r.target_id} | ${r.source_risk.distractor_type} | ${r.source_risk.canonical_rank ?? 'any'} | ${r.source_risk.source_hit_rate.toFixed(3)} | ${r.source_risk.source_wrong_rate.toFixed(3)} | ${r.materialized_geometry.dominant_region} |`).join('\n');
  fs.writeFileSync(RESULTS, [
    '# EPKV bridge replay pack v1.2 — 2026-05-19',
    '',
    '> Builds a replay-ready hook-off pack for the 13 bridge-ready target families.',
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
    path.relative(ROOT, MANIFEST),
    path.relative(ROOT, SUMMARY),
    '```',
    '',
    '## Result',
    '',
    '```txt',
    `records: ${pack.length}`,
    `checks: ${JSON.stringify(checks)}`,
    `by_distractor: ${JSON.stringify(byDistractor)}`,
    `by_rank: ${JSON.stringify(byRank)}`,
    '```',
    '',
    '## Replay records',
    '',
    '| replay | target | distractor | rank | hit_rate | wrong_rate | dominant_region |',
    '|---|---|---|---:|---:|---:|---|',
    rows,
    '',
    '## Decision',
    '',
    '```txt',
    'The 13 bridge-ready decoy-risk targets now have a compact replay pack.',
    'Next autonomous packet: build a replay-pack validator and action summary gate.',
    'Still no live runtime or serving mutation.',
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
