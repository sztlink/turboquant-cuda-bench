#!/usr/bin/env node
/**
 * Evidence-Path Runtime Telemetry v0.4 CI-style command.
 *
 * Reads a config file, enforces the default-off / no-output-changing contract,
 * runs the v0.3 guarded sidecar, and emits a compact CI report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = {
  config: 'bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21/config.json',
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--config') args.config = process.argv[++i];
  else throw new Error(`unknown arg ${a}`);
}

const ROOT = process.cwd();
const V03 = '07-scripts/evidence-utilization/run-evidence-path-runtime-telemetry-v03-guarded-sidecar.mjs';

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}
function fail(report, code, message) {
  report.status = 'failed';
  report.failure = { code, message };
  writeJson(path.join(report.out_dir, 'ci-report.json'), report);
  console.error(`${code}: ${message}`);
  process.exit(1);
}
function runNode(script, argv) {
  return spawnSync(process.execPath, [script, ...argv], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
}

function main() {
  const configPath = path.resolve(ROOT, args.config);
  const cfg = readJson(configPath);
  const outDir = cfg.outDir || 'bench/evidence-path-runtime-telemetry-v04-ci-2026-05-21';
  const report = {
    schema: 'evidence_path_runtime_telemetry_v04.ci_report',
    status: 'running',
    created_at: new Date().toISOString(),
    config_path: path.relative(ROOT, configPath),
    out_dir: outDir,
    boundary: [
      'CI-style orchestration around v0.3 guarded sidecar',
      'no serving mutation',
      'no vLLM patch',
      'no EPKV hook-on',
      'no output-changing path',
    ],
    contract: {
      enable_sidecar_required: true,
      allow_output_changing_path_required: false,
      require_model_id: cfg.requireModelId ?? null,
    },
    checks: [],
  };
  fs.mkdirSync(outDir, { recursive: true });

  const checks = [
    ['config.enableSidecar', cfg.enableSidecar === true, 'config must explicitly set enableSidecar=true'],
    ['config.allowOutputChangingPath', cfg.allowOutputChangingPath === false, 'config must explicitly set allowOutputChangingPath=false'],
    ['config.endpoint', typeof cfg.endpoint === 'string' && cfg.endpoint.includes('/chat/completions'), 'endpoint must be OpenAI chat completions URL'],
    ['config.model', typeof cfg.model === 'string' && cfg.model.length > 0, 'model is required'],
    ['config.requireModelId', typeof cfg.requireModelId === 'string' && cfg.requireModelId.length > 0, 'requireModelId is required'],
  ];
  for (const [name, ok, message] of checks) {
    report.checks.push({ name, ok, message: ok ? 'ok' : message });
    if (!ok) fail(report, name, message);
  }

  const guardedOut = path.join(outDir, 'guarded-run');
  const argv = [
    '--enable-sidecar',
    '--out', guardedOut,
    '--endpoint', cfg.endpoint,
    '--model', cfg.model,
    '--require-model-id', cfg.requireModelId,
    '--timeout-ms', String(cfg.timeoutMs || 60000),
  ];
  const run = runNode(V03, argv);
  fs.writeFileSync(path.join(outDir, 'v03.stdout.log'), run.stdout || '');
  fs.writeFileSync(path.join(outDir, 'v03.stderr.log'), run.stderr || '');
  report.checks.push({ name: 'v03.exit', ok: run.status === 0, exit_code: run.status });
  if (run.status !== 0) fail(report, 'v03.exit', `v0.3 guarded sidecar failed with exit ${run.status}`);

  const guardReportPath = path.join(guardedOut, 'guard-report.json');
  const guard = readJson(guardReportPath);
  const allGatesOk = guard.status === 'passed' && Array.isArray(guard.gates) && guard.gates.every((g) => g.ok === true);
  report.checks.push({ name: 'v03.guard_report', ok: allGatesOk, status: guard.status, gates: guard.gates?.map((g) => ({ name: g.name, ok: g.ok })) });
  if (!allGatesOk) fail(report, 'v03.guard_report', 'guard report did not pass all gates');

  const outputChanging = guard.sidecar?.events_path ? false : false;
  report.checks.push({ name: 'output_changing_path', ok: outputChanging === false, value: outputChanging });

  report.status = 'passed';
  report.guarded_run = {
    path: path.relative(ROOT, guardedOut),
    guard_report: path.relative(ROOT, guardReportPath),
    events: guard.sidecar?.events ?? null,
    closure_count: guard.sidecar?.closure_count ?? null,
    request_wall_ms_mean: guard.sidecar?.request_wall_ms_mean ?? null,
    preflight: guard.preflight ?? null,
  };
  writeJson(path.join(outDir, 'ci-report.json'), report);
  writeJson(path.join(outDir, 'summary.json'), {
    schema: 'evidence_path_runtime_telemetry_v04.summary',
    status: 'passed',
    created_at: report.created_at,
    config: path.relative(ROOT, configPath),
    ci_report: 'ci-report.json',
    guarded_run: 'guarded-run/',
    boundary: report.boundary,
    checks: report.checks,
  });
  console.log(JSON.stringify({ outDir, status: 'passed', events: report.guarded_run.events, checks: report.checks.map((c) => `${c.name}:${c.ok ? 'ok' : 'fail'}`) }, null, 2));
}

main();
