#!/usr/bin/env node
/**
 * Evidence-Path Runtime Telemetry v0.3 guarded sidecar.
 *
 * Integrates:
 * - explicit default-off switch (--enable-sidecar required)
 * - preflight v0.2 fail-closed/privacy regression tests
 * - served-model guard
 * - v0.1 sidecar runtime emitter
 * - postflight schema validation
 * - postflight privacy scan
 *
 * No vLLM patch, no EPKV hook-on, no output-changing path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = {
  outDir: 'bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21',
  endpoint: 'http://192.168.15.133:11435/v1/chat/completions',
  model: 'local-vllm',
  requireModelId: 'local-vllm',
  enableSidecar: false,
  timeoutMs: 60000,
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--endpoint') args.endpoint = process.argv[++i];
  else if (a === '--model') args.model = process.argv[++i];
  else if (a === '--require-model-id') args.requireModelId = process.argv[++i];
  else if (a === '--enable-sidecar') args.enableSidecar = true;
  else if (a === '--timeout-ms') args.timeoutMs = Number(process.argv[++i]);
  else throw new Error(`unknown arg ${a}`);
}

const ROOT = process.cwd();
const V02 = '07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v02-security-tests.mjs';
const V01 = '07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v01.mjs';
const VALIDATOR = '07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs';
const FORBIDDEN_TEXT = [
  /prompt_text\s*[:=]\s*(?!false)/i,
  /raw_token_ids\s*[:=]\s*(?!false)/i,
  /completion_text/i,
  /LEAKED/i,
  /Question: What is the value/i,
  /For handle SIGNAL/i,
  /LIME-741|RIVER-209|ORCHID-884|BASALT-317|EMBER-552|GLASS-026|COPPER-690/,
];

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function runNode(script, argv, opts = {}) {
  const res = spawnSync(process.execPath, [script, ...argv], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
    ...opts,
  });
  return { exitCode: res.status ?? 1, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function runValidator(eventsPath, reportPath) {
  const res = runNode(VALIDATOR, ['--json', eventsPath]);
  let full;
  try {
    full = JSON.parse(res.stdout);
  } catch (error) {
    full = { valid: false, parse_error: error.message, stdout: res.stdout, stderr: res.stderr, exitCode: res.exitCode };
  }
  const compact = {
    valid: full.valid === true,
    exit_code: res.exitCode,
    files: full.files ?? null,
    events: full.events ?? null,
    errors: full.errors ?? null,
    file_reports: Array.isArray(full.file_reports) ? full.file_reports.map((r) => ({
      file: r.file,
      events: r.events,
      errors: r.errors,
      valid: r.valid,
    })) : [],
  };
  writeJson(reportPath, compact);
  return compact;
}

async function servedModelGuard() {
  const url = new URL(args.endpoint);
  url.pathname = url.pathname.replace(/\/chat\/completions\/?$/, '/models');
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), args.timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    const data = JSON.parse(text);
    const ids = (data.data || []).map((m) => m.id);
    return { ok: ids.includes(args.requireModelId), required: args.requireModelId, served: ids };
  } catch (error) {
    return { ok: false, error: error.message, required: args.requireModelId, served: [] };
  } finally {
    clearTimeout(timer);
  }
}

function privacyScan(files) {
  const findings = [];
  for (const file of files) {
    const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const lines = text.split(/\r?\n/);
    for (const [i, line] of lines.entries()) {
      for (const rx of FORBIDDEN_TEXT) {
        if (rx.test(line)) findings.push({ file, line: i + 1, pattern: String(rx) });
      }
    }
  }
  return { ok: findings.length === 0, findings };
}

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  const guardReport = {
    schema: 'evidence_path_runtime_telemetry_v03.guard_report',
    created_at: new Date().toISOString(),
    default_off: true,
    enable_sidecar_flag: args.enableSidecar,
    boundary: [
      'guarded sidecar orchestration only',
      'no serving mutation',
      'no vLLM patch',
      'no EPKV hook-on',
      'no output-changing path',
    ],
    gates: [],
  };

  if (!args.enableSidecar) {
    guardReport.status = 'blocked_default_off';
    guardReport.gates.push({ name: 'default_off', ok: false, message: 'rerun with --enable-sidecar to emit telemetry' });
    writeJson(path.join(args.outDir, 'guard-report.json'), guardReport);
    console.log(JSON.stringify({ outDir: args.outDir, status: guardReport.status }, null, 2));
    process.exit(2);
  }
  guardReport.gates.push({ name: 'default_off', ok: true, message: '--enable-sidecar supplied' });

  const preflightDir = path.join(args.outDir, 'preflight-security');
  const pre = runNode(V02, ['--out', preflightDir]);
  let preSummary = null;
  try { preSummary = JSON.parse(fs.readFileSync(path.join(preflightDir, 'summary.json'), 'utf8')); } catch {}
  const preOk = pre.exitCode === 0 && preSummary?.status === 'passed';
  guardReport.gates.push({ name: 'preflight_security_v02', ok: preOk, exit_code: pre.exitCode, status: preSummary?.status ?? null });
  if (!preOk) {
    guardReport.status = 'failed_preflight_security';
    writeJson(path.join(args.outDir, 'guard-report.json'), guardReport);
    process.exit(1);
  }

  const modelGuard = await servedModelGuard();
  guardReport.gates.push({ name: 'served_model_guard', ok: modelGuard.ok, required: modelGuard.required, served: modelGuard.served, error: modelGuard.error ?? null });
  if (!modelGuard.ok) {
    guardReport.status = 'failed_served_model_guard';
    writeJson(path.join(args.outDir, 'guard-report.json'), guardReport);
    process.exit(1);
  }

  const sidecarDir = path.join(args.outDir, 'sidecar');
  const sidecar = runNode(V01, ['--out', sidecarDir, '--endpoint', args.endpoint, '--model', args.model, '--require-model-id', args.requireModelId, '--timeout-ms', String(args.timeoutMs)]);
  let sidecarSummary = null;
  try { sidecarSummary = JSON.parse(fs.readFileSync(path.join(sidecarDir, 'summary.json'), 'utf8')); } catch {}
  const sidecarEventsPath = path.join(sidecarDir, 'events.jsonl');
  const sidecarOk = sidecar.exitCode === 0 && sidecarSummary?.events > 0 && fs.existsSync(sidecarEventsPath);
  guardReport.gates.push({ name: 'sidecar_emit_v01', ok: sidecarOk, exit_code: sidecar.exitCode, events: sidecarSummary?.events ?? null, status: sidecarSummary?.status ?? null });
  if (!sidecarOk) {
    guardReport.status = 'failed_sidecar_emit';
    writeJson(path.join(args.outDir, 'guard-report.json'), guardReport);
    process.exit(1);
  }

  const eventsPath = sidecarEventsPath;
  const postReport = runValidator(eventsPath, path.join(args.outDir, 'postflight-validation-report.json'));
  guardReport.gates.push({ name: 'postflight_schema_validation', ok: postReport.valid, events: postReport.events, errors: postReport.errors, exit_code: postReport.exit_code });
  if (!postReport.valid) {
    guardReport.status = 'failed_postflight_validation';
    writeJson(path.join(args.outDir, 'guard-report.json'), guardReport);
    process.exit(1);
  }

  const privacy = privacyScan([
    eventsPath,
    path.join(sidecarDir, 'summary.json'),
    path.join(args.outDir, 'postflight-validation-report.json'),
  ]);
  writeJson(path.join(args.outDir, 'privacy-scan-report.json'), privacy);
  guardReport.gates.push({ name: 'privacy_scan', ok: privacy.ok, findings: privacy.findings.length });
  if (!privacy.ok) {
    guardReport.status = 'failed_privacy_scan';
    writeJson(path.join(args.outDir, 'guard-report.json'), guardReport);
    process.exit(1);
  }

  guardReport.status = 'passed';
  guardReport.sidecar = {
    events: sidecarSummary.events,
    closure_count: sidecarSummary.closure_count,
    request_wall_ms_mean: sidecarSummary.request_wall_ms_mean,
    summary_path: 'sidecar/summary.json',
    events_path: 'sidecar/events.jsonl',
  };
  guardReport.preflight = {
    status: preSummary.status,
    valid_events: preSummary.fixtures?.valid_events,
    invalid_events: preSummary.fixtures?.invalid_events,
    invalid_errors: preSummary.reports?.invalid?.errors,
  };
  writeJson(path.join(args.outDir, 'guard-report.json'), guardReport);
  writeJson(path.join(args.outDir, 'summary.json'), {
    schema: 'evidence_path_runtime_telemetry_v03.summary',
    status: 'passed',
    created_at: guardReport.created_at,
    guard_report: 'guard-report.json',
    preflight_security: 'preflight-security/summary.json',
    sidecar_summary: 'sidecar/summary.json',
    sidecar_events: 'sidecar/events.jsonl',
    postflight_validation: 'postflight-validation-report.json',
    privacy_scan: 'privacy-scan-report.json',
    boundary: guardReport.boundary,
    gates: guardReport.gates,
  });
  console.log(JSON.stringify({ outDir: args.outDir, status: 'passed', events: sidecarSummary.events, gates: guardReport.gates.map((g) => `${g.name}:${g.ok ? 'ok' : 'fail'}`) }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
