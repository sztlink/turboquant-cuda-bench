#!/usr/bin/env node
/**
 * EPKV audit-join v1.1.
 *
 * Joins:
 *   - v0.9 bridge target queue
 *   - v1.0 materialized records/events
 *   - v1.0 telemetry validator report
 *
 * Emits target-level action states for the next autonomous work packet.
 * Boundary: planning/audit state only. No runtime hook, serving, model call,
 * model attention, or evidence-use proof.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const QUEUE = path.join(ROOT, 'bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/bridge-target-queue.json');
const MATERIALIZED = path.join(ROOT, 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/materialized-records.jsonl');
const EVENTS = path.join(ROOT, 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/events.jsonl');
const VALIDATION = path.join(ROOT, 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/validation-report.json');
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-audit-join-2026-05-19');
const ACTIONS = path.join(OUT, 'target-action-table.jsonl');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function actionState(target, mat, event, validatorOk) {
  if (!mat || !event) return { state: 'blocked', reason: 'missing materialized record or event' };
  if (!validatorOk) return { state: 'blocked', reason: 'schema validator failed for event pack' };
  if (mat.boundary?.serving !== false || mat.boundary?.model_attention !== false || mat.boundary?.evidence_use_proof !== false) {
    return { state: 'blocked', reason: 'boundary flags are unsafe or ambiguous' };
  }
  if (event.schema !== 'epkv.runtime.telemetry.v1') return { state: 'blocked', reason: 'event schema is not telemetry v1' };
  if (event.mode !== 'dry-run' || event.reason_code !== 'hook_disabled') return { state: 'blocked', reason: 'event is not hook-off dry-run projection' };
  if (mat.dominant_region === 'decoy' && target.bridge_family?.risk === 'decoy_capture_risk') {
    return { state: 'bridge-ready', reason: 'decoy-risk target has schema-valid decoy-dominant synthetic geometry' };
  }
  if (mat.dominant_region === 'neither') {
    return { state: 'needs-fixture-detail', reason: 'geometry is neither-dominant; add canonical/decoy detail before bridge replay' };
  }
  if (mat.dominant_region === 'canonical' && target.bridge_family?.risk === 'evidence_nonclosure_risk') {
    return { state: 'needs-fixture-detail', reason: 'nonclosure target needs contrastive neither/decoy geometry, not only canonical geometry' };
  }
  return { state: 'needs-fixture-detail', reason: 'target/materialized geometry mismatch requires fixture refinement' };
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
  const materialized = readJsonl(MATERIALIZED);
  const events = readJsonl(EVENTS);
  const validation = JSON.parse(fs.readFileSync(VALIDATION, 'utf8'));
  const matByTarget = new Map(materialized.map((r) => [r.target_id, r]));
  const eventByFixture = new Map(events.map((e) => [e.selection_geometry?.fixture_id, e]));
  const validatorOk = validation.valid === true && validation.errors === 0;

  const actions = queue.targets.map((target) => {
    const mat = matByTarget.get(target.target_id);
    const event = mat ? eventByFixture.get(mat.fixture_id) : null;
    const a = actionState(target, mat, event, validatorOk);
    return {
      action_schema: 'epkv.target_action.v1.1',
      target_id: target.target_id,
      action_state: a.state,
      action_reason: a.reason,
      priority_score: target.priority_score,
      risk: target.bridge_family?.risk,
      distractor_type: target.bridge_family?.distractor_type,
      canonical_rank: target.bridge_family?.canonical_rank,
      decoys_before: target.bridge_family?.decoys_before,
      source_hit_rate: target.source_audit_record?.hit_rate,
      source_wrong_rate: target.source_audit_record?.wrong_rate,
      materialized: Boolean(mat),
      telemetry_event: Boolean(event),
      validator_pack_passed: validatorOk,
      dominant_region: mat?.dominant_region || null,
      audit_projection: mat?.audit_projection || null,
      next_packet: a.state === 'bridge-ready'
        ? 'run hook-off bridge replay pack over this target family'
        : a.state === 'needs-fixture-detail'
          ? 'refine fixture layout before replay pack'
          : 'do not advance until blocking issue fixed',
      boundary: {
        planning_only: true,
        synthetic_layout: true,
        serving: false,
        runtime_hook: false,
        model_call: false,
        model_attention: false,
        evidence_use_proof: false,
      },
    };
  });

  fs.writeFileSync(ACTIONS, actions.map((x) => JSON.stringify(x)).join('\n') + '\n');
  const byState = {};
  const byRisk = {};
  const byDistractor = {};
  for (const a of actions) {
    byState[a.action_state] = (byState[a.action_state] || 0) + 1;
    byRisk[a.risk] = (byRisk[a.risk] || 0) + 1;
    byDistractor[a.distractor_type] = (byDistractor[a.distractor_type] || 0) + 1;
  }
  const ready = actions.filter((a) => a.action_state === 'bridge-ready').sort((a, b) => b.priority_score - a.priority_score);
  const needs = actions.filter((a) => a.action_state === 'needs-fixture-detail').sort((a, b) => b.priority_score - a.priority_score);
  const blocked = actions.filter((a) => a.action_state === 'blocked').sort((a, b) => b.priority_score - a.priority_score);
  const summary = {
    audit_join_version: 'v1.1-target-action-table',
    targets: actions.length,
    by_state: byState,
    by_risk: byRisk,
    by_distractor: byDistractor,
    validator_pack_passed: validatorOk,
    ready_top_8: ready.slice(0, 8),
    needs_fixture_detail: needs,
    blocked,
    artifacts: {
      actions: path.relative(ROOT, ACTIONS),
      summary: path.relative(ROOT, SUMMARY),
    },
    boundary: {
      planning_only: true,
      synthetic_layout: true,
      serving: false,
      runtime_hook: false,
      model_call: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));

  const rows = ready.slice(0, 12).map((a) => `| ${a.target_id} | ${a.risk} | ${a.distractor_type} | ${a.canonical_rank ?? 'any'} | ${a.source_hit_rate.toFixed(3)} | ${a.source_wrong_rate.toFixed(3)} | ${a.dominant_region} | ${a.action_state} |`).join('\n');
  fs.writeFileSync(RESULTS, [
    '# EPKV audit-join v1.1 — 2026-05-19',
    '',
    '> Joins target queue + materialized synthetic telemetry + validator report into a target-level action table.',
    '',
    '## Boundary',
    '',
    '```txt',
    'planning only: yes',
    'synthetic layout: yes',
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
    path.relative(ROOT, ACTIONS),
    path.relative(ROOT, SUMMARY),
    '```',
    '',
    '## Result',
    '',
    '```txt',
    `targets: ${actions.length}`,
    `by_state: ${JSON.stringify(byState)}`,
    `validator_pack_passed: ${validatorOk}`,
    '```',
    '',
    '## Bridge-ready targets',
    '',
    '| target | risk | distractor | rank | hit_rate | wrong_rate | dominant_region | state |',
    '|---|---|---|---:|---:|---:|---|---|',
    rows || '| — | — | — | — | — | — | — | — |',
    '',
    '## Decision',
    '',
    '```txt',
    'The high-risk decoy target pack is bridge-ready as synthetic hook-off telemetry.',
    'Next autonomous packet: build a bridge replay pack over the bridge-ready target families.',
    'Keep all states as planning/audit states, not evidence-use claims.',
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
