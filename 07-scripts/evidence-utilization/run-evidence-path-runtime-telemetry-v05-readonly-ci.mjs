#!/usr/bin/env node
/**
 * Evidence-Path Runtime Telemetry v0.5 read-only CI verifier.
 *
 * No endpoint required. Verifies committed telemetry artifacts/docs:
 * - v0/v0.1/v0.2/v0.3/v0.4 public docs exist
 * - key machine reports are valid JSON and passed
 * - telemetry event files pass schema validator where applicable
 * - public docs preserve non-claim boundary phrases
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = { outDir: 'bench/evidence-path-runtime-telemetry-v05-readonly-ci-2026-05-21' };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.outDir = process.argv[++i];
  else throw new Error(`unknown arg ${a}`);
}

const ROOT = process.cwd();
const VALIDATOR = '07-scripts/vllm-hook/validate-epkv-runtime-telemetry.mjs';
const DOCS = [
  'bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.md',
  'bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.1.md',
  'bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.2.md',
  'bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.3.md',
  'bench-public/evidence-utilization/EVIDENCE-PATH-RUNTIME-TELEMETRY-v0.4.md',
];
const JSON_REPORTS = [
  ['v0.summary', 'bench/evidence-path-runtime-telemetry-v0-2026-05-21/summary.json', (j) => j.status === 'validated' && j.validation?.valid === true],
  ['v0.validation', 'bench/evidence-path-runtime-telemetry-v0-2026-05-21/validation-report.json', (j) => j.valid === true && j.errors === 0],
  ['v0.1.summary', 'bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/summary.json', (j) => j.status === 'validated' && j.validation?.valid === true],
  ['v0.2.summary', 'bench/evidence-path-runtime-telemetry-v02-security-tests-2026-05-21/summary.json', (j) => j.status === 'passed' && j.reports?.valid?.valid === true && j.reports?.invalid?.valid === false],
  ['v0.3.guard', 'bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/guard-report.json', (j) => j.status === 'passed' && Array.isArray(j.gates) && j.gates.every((g) => g.ok === true)],
  ['v0.4.ci', 'bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/ci-report.json', (j) => j.status === 'passed' && Array.isArray(j.checks) && j.checks.every((c) => c.ok === true)],
];
const EVENT_FILES = [
  'bench/evidence-path-runtime-telemetry-v0-2026-05-21/events.jsonl',
  'bench/evidence-path-runtime-telemetry-v01-sidecar-2026-05-21/events.jsonl',
  'bench/evidence-path-runtime-telemetry-v03-guarded-sidecar-2026-05-21/sidecar/events.jsonl',
  'bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/guarded-run/sidecar/events.jsonl',
];
const REQUIRED_BOUNDARY_PHRASES = [
  'serving mutation: no',
  'output-changing path: no',
  'attention',
];

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}
function runValidator(file) {
  // Use text mode for large JSONL files to avoid buffering the full per-event
  // JSON report. The validator exit code is the contract here.
  const res = spawnSync(process.execPath, [VALIDATOR, file], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 4 });
  const firstLine = (res.stdout || '').split(/\r?\n/)[0] || '';
  const m = firstLine.match(/PASS \((\d+) events, (\d+) errors\)/);
  return { ok: res.status === 0 && /PASS/.test(firstLine), exit_code: res.status, events: m ? Number(m[1]) : null, errors: m ? Number(m[2]) : null, summary: firstLine };
}

function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  const checks = [];

  for (const doc of DOCS) {
    const exists = fs.existsSync(doc);
    const text = exists ? fs.readFileSync(doc, 'utf8') : '';
    const phraseResults = REQUIRED_BOUNDARY_PHRASES.map((phrase) => ({ phrase, ok: text.toLowerCase().includes(phrase.toLowerCase()) }));
    checks.push({ name: `doc:${doc}`, ok: exists && phraseResults.every((x) => x.ok), exists, phraseResults });
  }

  for (const [name, file, predicate] of JSON_REPORTS) {
    let ok = false; let parsed = null; let error = null;
    try { parsed = JSON.parse(fs.readFileSync(file, 'utf8')); ok = predicate(parsed); } catch (e) { error = e.message; }
    checks.push({ name: `json:${name}`, file, ok, error, status: parsed?.status ?? null });
  }

  const eventReports = [];
  for (const file of EVENT_FILES) {
    const report = fs.existsSync(file) ? runValidator(file) : { ok: false, missing: true };
    eventReports.push({ file, ...report });
    checks.push({ name: `events:${file}`, ok: report.ok, events: report.events ?? null, errors: report.errors ?? null });
  }

  const status = checks.every((c) => c.ok) ? 'passed' : 'failed';
  const summary = {
    schema: 'evidence_path_runtime_telemetry_v05.readonly_ci_summary',
    status,
    created_at: new Date().toISOString(),
    boundary: [
      'read-only committed artifact verification',
      'no endpoint required',
      'no serving mutation',
      'no model inference',
      'no output-changing path',
    ],
    docs_checked: DOCS.length,
    json_reports_checked: JSON_REPORTS.length,
    event_files_checked: EVENT_FILES.length,
    checks,
    eventReports,
  };
  writeJson(path.join(args.outDir, 'summary.json'), summary);
  writeJson(path.join(args.outDir, 'readonly-ci-report.json'), { status, checks, eventReports });
  console.log(JSON.stringify({ outDir: args.outDir, status, checks: checks.length, failed: checks.filter((c) => !c.ok).map((c) => c.name) }, null, 2));
  process.exit(status === 'passed' ? 0 : 1);
}

main();
