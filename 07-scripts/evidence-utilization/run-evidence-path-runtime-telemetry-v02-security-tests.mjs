#!/usr/bin/env node
/**
 * Evidence-Path Runtime Telemetry v0.2 security tests.
 *
 * Generates fail-closed and privacy-regression fixtures for the sidecar emitter
 * contract, then runs the runtime telemetry validator. No serving, no model
 * inference, no prompt text, no raw token ids.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = {
  outDir: 'bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21',
  validator: '07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs',
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--validator') args.validator = process.argv[++i];
  else throw new Error(`unknown arg ${a}`);
}

function baseEvent(overrides = {}) {
  return {
    schema: 'epkv.runtime.telemetry.v1',
    phase: 'evidence_path_runtime_telemetry_v02_security_tests',
    source: 'sidecar_contract_fixture',
    mode: 'dry-run',
    decision: 'fixture_no_runtime_mutation',
    reason_code: 'dry_run_telemetry_only',
    seq_len: 256,
    Hq: 40,
    Hk: 8,
    D: 128,
    global_k: 32,
    probe_local_top: 16,
    fallback_local_top: 32,
    num_chunks: 16,
    flagged_head_count: 4,
    flagged_head_rate: 0.1,
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
      event_index: 0,
      event_cap: 99,
      cap_hit: false,
      bucket: 'fixture',
    },
    privacy: {
      prompt_text: false,
      raw_token_ids: false,
      selected_positions_only: true,
      synthetic_only: true,
    },
    sidecar_runtime: {
      output_changing_path: false,
      request_wall_ms: 0,
      response_hash: 'fixture-response-hash',
      response_chars: 0,
    },
    replay_geometry: {
      page_size_tokens_est: 16,
      condition: 'fixture',
      canonical_rank: 1,
      canonical_page_count_est: 2,
      selected_page_count_est: 8,
      canonical_page_overlap_est: 2,
    },
    ...overrides,
  };
}

function withCoverage(e, i, bucket) {
  return { ...e, coverage: { ...e.coverage, event_index: i, bucket } };
}

const validEvents = [
  withCoverage(baseEvent(), 0, 'dry_run_sidecar_ok'),
  withCoverage(baseEvent({ mode: 'degraded-fallback', decision: 'fail_closed_privacy_guard', reason_code: 'privacy_guard' }), 1, 'fail_closed_privacy_guard'),
  withCoverage(baseEvent({ mode: 'degraded-fallback', decision: 'fail_closed_cuda_error', reason_code: 'cuda_error' }), 2, 'fail_closed_cuda_error'),
  withCoverage(baseEvent({ mode: 'degraded-fallback', decision: 'manual_kill_switch_exact_fallback', reason_code: 'manual_kill_switch' }), 3, 'fail_closed_manual_kill_switch'),
  withCoverage(baseEvent({ mode: 'exact-only', decision: 'seq_guard_exact_only', reason_code: 'seq_guard_exact_only' }), 4, 'exact_only_seq_guard'),
];

const invalidEvents = [
  withCoverage(baseEvent({ prompt_text: 'LEAKED PROMPT PLACEHOLDER' }), 0, 'privacy_prompt_key_leak'),
  withCoverage(baseEvent({ raw_token_ids: [1, 2, 3] }), 1, 'privacy_raw_token_ids_key_leak'),
  withCoverage(baseEvent({ completion_text: 'LEAKED COMPLETION PLACEHOLDER' }), 2, 'privacy_completion_key_leak'),
  withCoverage(baseEvent({ mode: 'dry-run', decision: 'bad_fail_open_cuda_error', reason_code: 'cuda_error' }), 3, 'fail_open_cuda_error'),
  withCoverage(baseEvent({ mode: 'compact-fallback', decision: 'bad_compact_on_privacy_guard', reason_code: 'privacy_guard' }), 4, 'fail_open_privacy_guard'),
  withCoverage(baseEvent({ privacy: { prompt_text: true, raw_token_ids: false, selected_positions_only: true } }), 5, 'privacy_declaration_violation'),
];

function writeJsonl(file, events) {
  fs.writeFileSync(file, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
}

function validate(file, reportFile, expectValid) {
  const res = spawnSync(process.execPath, [args.validator, '--json', file], { encoding: 'utf8' });
  const stdout = res.stdout.trim();
  const stderr = res.stderr.trim();
  let report;
  try {
    report = JSON.parse(stdout);
  } catch (error) {
    report = { valid: false, parse_error: error.message, stdout, stderr, exitCode: res.status };
  }
  const compact = {
    valid: report.valid === true,
    expected_valid: expectValid,
    exit_code: res.status,
    files: report.files ?? null,
    events: report.events ?? null,
    errors: report.errors ?? null,
    file_reports: Array.isArray(report.file_reports) ? report.file_reports.map((r) => ({
      file: r.file,
      events: r.events,
      errors: r.errors,
      valid: r.valid,
      invalid_lines: Array.isArray(r.event_reports) ? r.event_reports.filter((x) => !x.valid).map((x) => ({
        line: x.line,
        mode: x.mode,
        reason_code: x.reason_code,
        errors: x.errors?.map((e) => e.code) || [],
      })) : [],
    })) : [],
  };
  fs.writeFileSync(reportFile, JSON.stringify(compact, null, 2) + '\n');
  return compact;
}

function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  const validPath = path.join(args.outDir, 'valid-events.jsonl');
  const invalidPath = path.join(args.outDir, 'invalid-events.jsonl');
  const validReportPath = path.join(args.outDir, 'valid-report.json');
  const invalidReportPath = path.join(args.outDir, 'invalid-report.json');
  writeJsonl(validPath, validEvents);
  writeJsonl(invalidPath, invalidEvents);
  const validReport = validate(validPath, validReportPath, true);
  const invalidReport = validate(invalidPath, invalidReportPath, false);

  const summary = {
    schema: 'evidence_path_runtime_telemetry_v02_security_tests.summary',
    status: validReport.valid && !invalidReport.valid ? 'passed' : 'failed',
    created_at: new Date().toISOString(),
    boundary: [
      'security fixture tests only',
      'no serving mutation',
      'no model inference',
      'no prompt text or raw token ids',
      'tests validator behavior for fail-closed and privacy-regression cases',
    ],
    validator: args.validator,
    fixtures: {
      valid_events: validEvents.length,
      invalid_events: invalidEvents.length,
    },
    reports: {
      valid: validReport,
      invalid: invalidReport,
    },
    expected_invalid_error_codes: [
      'privacy.forbidden_key',
      'fail_closed.violation',
      'mode_reason.mismatch',
      'privacy.prompt_text',
    ],
  };
  fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, valid: validReport.valid, invalid_valid: invalidReport.valid, invalid_errors: invalidReport.errors }, null, 2));
  process.exit(summary.status === 'passed' ? 0 : 1);
}

main();
