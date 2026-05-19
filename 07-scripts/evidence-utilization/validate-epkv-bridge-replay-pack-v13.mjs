#!/usr/bin/env node
/**
 * Validate EPKV bridge replay pack v1.2.
 *
 * Boundary validator: asserts replay-pack invariants only. It does not validate
 * model behavior, attention, serving readiness, or evidence use.
 */

import fs from 'node:fs';
import path from 'node:path';

function usage(code = 0) {
  const out = code ? console.error : console.log;
  out('Usage: node validate-epkv-bridge-replay-pack-v13.mjs [--json] <bridge-replay-pack.jsonl>');
  process.exit(code);
}

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line, i) => {
    try { return { line: i + 1, record: JSON.parse(line) }; }
    catch (error) { return { line: i + 1, parseError: error.message }; }
  });
}

function err(errors, code, path, message) {
  errors.push({ code, path, message });
}

function validateRecord(r) {
  const errors = [];
  if (r.replay_schema !== 'epkv.bridge_replay_pack.v1.2') err(errors, 'schema.invalid', 'replay_schema', 'expected epkv.bridge_replay_pack.v1.2');
  for (const field of ['replay_id', 'target_id', 'fixture_id', 'action_state', 'source_risk', 'materialized_geometry', 'telemetry_event', 'replay_checks', 'boundary', 'record_hash']) {
    if (!(field in r)) err(errors, 'required.missing', field, `missing ${field}`);
  }
  if (r.action_state !== 'bridge-ready') err(errors, 'action_state.invalid', 'action_state', 'replay pack may only include bridge-ready records');
  const ev = r.telemetry_event || {};
  if (ev.schema !== 'epkv.runtime.telemetry.v1') err(errors, 'event.schema', 'telemetry_event.schema', 'event must be schema v1');
  if (ev.mode !== 'dry-run') err(errors, 'event.mode', 'telemetry_event.mode', 'event must be dry-run');
  if (ev.reason_code !== 'hook_disabled') err(errors, 'event.reason', 'telemetry_event.reason_code', 'event must be hook-off');
  if (ev.privacy?.prompt_text !== false || ev.privacy?.raw_token_ids !== false || ev.privacy?.selected_positions_only !== true) err(errors, 'privacy.invalid', 'telemetry_event.privacy', 'privacy declaration invalid');
  if (ev.selection_geometry && 'selected_positions_sample' in ev.selection_geometry) err(errors, 'privacy.raw_geometry', 'telemetry_event.selection_geometry.selected_positions_sample', 'raw selected-position samples forbidden in replay pack');
  if (r.boundary?.serving !== false) err(errors, 'boundary.serving', 'boundary.serving', 'serving must be false');
  if (r.boundary?.runtime_hook !== false) err(errors, 'boundary.runtime_hook', 'boundary.runtime_hook', 'runtime_hook must be false');
  if (r.boundary?.model_call !== false) err(errors, 'boundary.model_call', 'boundary.model_call', 'model_call must be false');
  if (r.boundary?.model_attention !== false) err(errors, 'boundary.model_attention', 'boundary.model_attention', 'model_attention must be false');
  if (r.boundary?.evidence_use_proof !== false) err(errors, 'boundary.evidence_use_proof', 'boundary.evidence_use_proof', 'evidence_use_proof must be false');
  for (const [key, value] of Object.entries(r.replay_checks || {})) {
    if (value !== true) err(errors, 'check.false', `replay_checks.${key}`, `${key} must be true`);
  }
  if (r.materialized_geometry?.dominant_region !== 'decoy') err(errors, 'geometry.dominant', 'materialized_geometry.dominant_region', 'bridge-ready replay pack currently requires decoy-dominant geometry');
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter((a) => a !== '--json');
  if (files.length !== 1) usage(1);
  const file = files[0];
  const items = readJsonl(file);
  let totalErrors = 0;
  const reports = items.map((item) => {
    if (item.parseError) {
      totalErrors += 1;
      return { line: item.line, valid: false, errors: [{ code: 'parse.error', path: '', message: item.parseError }] };
    }
    const errors = validateRecord(item.record);
    totalErrors += errors.length;
    return { line: item.line, replay_id: item.record.replay_id, target_id: item.record.target_id, valid: errors.length === 0, errors };
  });
  const summary = {
    validator: 'epkv.bridge_replay_pack.validator.v1.3',
    valid: totalErrors === 0,
    file,
    records: items.length,
    errors: totalErrors,
    reports,
    boundary: {
      replay_pack_only: true,
      serving: false,
      runtime_hook: false,
      model_call: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  };
  if (json) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`EPKV bridge replay pack validation: ${summary.valid ? 'PASS' : 'FAIL'} (${summary.records} records, ${summary.errors} errors)`);
    for (const r of reports.filter((x) => !x.valid)) {
      console.log(`line ${r.line}: ${r.errors.length} error(s)`);
      for (const e of r.errors) console.log(`  [${e.code}] ${e.path}: ${e.message}`);
    }
  }
  process.exit(summary.valid ? 0 : 1);
}

main();
