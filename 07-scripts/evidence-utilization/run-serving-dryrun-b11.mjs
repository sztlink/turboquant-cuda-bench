#!/usr/bin/env node
// Serving dry-run B1.1 for the EPKV bridge gate.
//
// Boundary:
// - assumes vLLM service is temporarily restarted with EPKV HOOK=1,
//   DRY_RUN=1, TRACE_SELECTION=1 and a sufficiently high MAX_EVENTS;
// - synthetic prompts only;
// - supports separate warmup and steady phases via PHASE env.

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import url from 'url';

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.env.OUT || path.join(REPO_ROOT, 'bench', 'evidence-utilization-epkv-serving-dryrun-b11-2026-05-19');
const BASE_URL = (process.env.BASE_URL || 'http://192.168.15.133:11435/v1').replace(/\/$/, '');
const MODEL = process.env.MODEL || 'local-vllm';
const PHASE = process.env.PHASE || 'steady';
const RESET = process.env.RESET === '1';
const TARGET_PROMPT_TOKENS = (process.env.TARGET_PROMPT_TOKENS || '512,1024,1536,2048').split(',').map((x) => Number(x.trim())).filter(Boolean);
const REPEATS = Number(process.env.REPEATS || (PHASE === 'warmup' ? 1 : 4));
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 32);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 180000);
const REMOTE_EVENT_LOG = process.env.REMOTE_EVENT_LOG || '/home/felipe/vllm-lab/evidence-utilization-epkv-serving-dryrun-b11-2026-05-19/events.jsonl';

fs.mkdirSync(OUT, { recursive: true });
const recordsPath = path.join(OUT, 'records.jsonl');
const summaryPath = path.join(OUT, 'summary.json');
const resultsPath = path.join(OUT, 'RESULTS.md');
const runLogPath = path.join(OUT, 'run.log');
if (RESET) {
  fs.writeFileSync(recordsPath, '');
  fs.writeFileSync(runLogPath, '');
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(runLogPath, line + '\n');
}

function syntheticContext(targetTokens) {
  const approxChars = Math.max(256, Math.round(targetTokens * 4.0));
  const base = `Synthetic bridge B1.1 ${PHASE} context. ordinary studio record. cable label. archive note. no secret outside this synthetic test. `;
  return base.repeat(Math.ceil(approxChars / base.length)).slice(0, approxChars);
}

function payloadFor(targetTokens, rep) {
  const context = syntheticContext(targetTokens);
  return {
    model: MODEL,
    temperature: 0,
    max_tokens: MAX_TOKENS,
    stream: false,
    messages: [
      { role: 'system', content: 'You are a deterministic benchmark responder. Answer with exactly: DRYRUN-B11-OK' },
      { role: 'user', content: `${context}\n\nBenchmark B1.1 ${PHASE} request ${targetTokens}/${rep}. Answer with exactly DRYRUN-B11-OK and no explanation.` },
    ],
  };
}

async function requestJson(endpoint, options = {}) {
  const res = await fetch(endpoint, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, text, json };
}

function percentile(values, q) {
  const xs = [...values].sort((a, b) => a - b);
  if (!xs.length) return null;
  return xs[Math.min(xs.length - 1, Math.max(0, Math.floor(xs.length * q)))];
}

function loadRecords() {
  if (!fs.existsSync(recordsPath)) return [];
  return fs.readFileSync(recordsPath, 'utf8').split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function summarizeGroup(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, rs]) => {
    const lat = rs.map((r) => r.elapsed_ms).filter(Number.isFinite);
    const perCompletion = rs.map((r) => r.ms_per_completion_token).filter(Number.isFinite);
    const promptTokens = rs.map((r) => r.usage?.prompt_tokens).filter(Number.isFinite);
    const completionTokens = rs.map((r) => r.usage?.completion_tokens).filter(Number.isFinite);
    return {
      key,
      runs: rs.length,
      errors: rs.filter((r) => r.status !== 'ok').length,
      prompt_tokens_mean: promptTokens.reduce((a, b) => a + b, 0) / (promptTokens.length || 1),
      completion_tokens_mean: completionTokens.reduce((a, b) => a + b, 0) / (completionTokens.length || 1),
      elapsed_ms_p50: percentile(lat, 0.5),
      elapsed_ms_p90: percentile(lat, 0.9),
      ms_per_completion_token_p50: percentile(perCompletion, 0.5),
      ms_per_completion_token_p90: percentile(perCompletion, 0.9),
    };
  }).sort((a, b) => String(a.key).localeCompare(String(b.key), undefined, { numeric: true }));
}

function writeResults(summary) {
  const steadyGroups = summary.groups_by_phase_and_target.filter((g) => g.phase === 'steady');
  const lines = [
    '# EPKV bridge path B1.1 — serving synthetic dry-run with warmup separation',
    '',
    '> Status: synthetic serving dry-run. Hook expected ON with DRY_RUN=1; warmup and steady phases separated.',
    '',
    '## Boundary',
    '',
    '```txt',
    `base_url: ${summary.base_url}`,
    `model: ${summary.model}`,
    'expected env: VLLM_EPKV_RUNTIME_HOOK=1, DRY_RUN=1, TRACE_SELECTION=1, K=32, MAX_EVENTS=4096',
    'prompts: synthetic benchmark contexts',
    `remote_event_log: ${summary.remote_event_log}`,
    '```',
    '',
    '## Steady summary by target prompt length',
    '',
    '| target prompt tokens | runs | mean actual prompt tokens | elapsed p50 ms | elapsed p90 ms | p50 ms/completion token | p90 ms/completion token |',
    '|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const g of steadyGroups) {
    lines.push(`| ${g.target_prompt_tokens} | ${g.runs} | ${g.prompt_tokens_mean.toFixed(1)} | ${g.elapsed_ms_p50.toFixed(1)} | ${g.elapsed_ms_p90.toFixed(1)} | ${g.ms_per_completion_token_p50.toFixed(2)} | ${g.ms_per_completion_token_p90.toFixed(2)} |`);
  }
  lines.push('', '## Current event summary', '', summary.event_summary_note || 'Events are copied and summarized by the orchestration step after the run.', '', '## Service health', '', '```txt', `/health start latest phase: ${summary.health_start_latest}`, `/health end latest phase: ${summary.health_end_latest}`, '```', '', '## Non-claims', '', '- no real prompts', '- no quality result', '- no serving speedup claim', '- no production attention claim', '- no comparison to PagedAttention/FlashAttention', '');
  fs.writeFileSync(resultsPath, lines.join('\n'));
}

async function runPhase() {
  log(`B11_PHASE_START phase=${PHASE} repeats=${REPEATS}`);
  const healthStart = await fetch(BASE_URL.replace(/\/v1$/, '') + '/health', { signal: AbortSignal.timeout(10000) }).then((r) => r.status).catch((e) => `ERROR ${e}`);
  log(`health_start phase=${PHASE} ${healthStart}`);

  for (const target of TARGET_PROMPT_TOKENS) {
    for (let rep = 0; rep < REPEATS; rep += 1) {
      const payload = payloadFor(target, rep);
      const t0 = performance.now();
      let row;
      try {
        const r = await requestJson(`${BASE_URL}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        const elapsed = performance.now() - t0;
        const usage = r.json?.usage || null;
        const content = (r.json?.choices?.[0]?.message?.content || '').trim();
        const completionTokens = usage?.completion_tokens || null;
        row = {
          phase: PHASE,
          status: r.status === 200 ? 'ok' : 'http_error',
          http_status: r.status,
          target_prompt_tokens: target,
          rep,
          elapsed_ms: elapsed,
          usage,
          answer_prefix: content.slice(0, 64),
          answer_ok: content.includes('DRYRUN-B11-OK'),
          ms_per_completion_token: completionTokens ? elapsed / completionTokens : null,
          timings: r.json?.timings || null,
        };
      } catch (err) {
        row = { phase: PHASE, status: 'error', target_prompt_tokens: target, rep, elapsed_ms: performance.now() - t0, error: String(err?.stack || err).slice(0, 1000) };
      }
      fs.appendFileSync(recordsPath, JSON.stringify(row) + '\n');
      log(`RESULT ${JSON.stringify(row)}`);
    }
  }

  const healthEnd = await fetch(BASE_URL.replace(/\/v1$/, '') + '/health', { signal: AbortSignal.timeout(10000) }).then((r) => r.status).catch((e) => `ERROR ${e}`);
  log(`health_end phase=${PHASE} ${healthEnd}`);

  const records = loadRecords();
  const phaseTargetGroups = summarizeGroup(records, (r) => `${r.phase}|${r.target_prompt_tokens}`).map((g) => {
    const [phase, target] = String(g.key).split('|');
    return { phase, target_prompt_tokens: Number(target), ...g };
  });
  const steadyRows = records.filter((r) => r.phase === 'steady');
  const allSteadyP90 = percentile(steadyRows.map((r) => r.ms_per_completion_token).filter(Number.isFinite), 0.9);
  const summary = {
    created_at: new Date().toISOString(),
    base_url: BASE_URL,
    model: MODEL,
    runs_total: records.length,
    runs_by_phase: Object.fromEntries(['warmup', 'steady'].map((p) => [p, records.filter((r) => r.phase === p).length])),
    errors_total: records.filter((r) => r.status !== 'ok').length,
    answer_ok_total: records.filter((r) => r.answer_ok).length,
    target_prompt_tokens: TARGET_PROMPT_TOKENS,
    repeats_this_phase: REPEATS,
    latest_phase: PHASE,
    max_tokens: MAX_TOKENS,
    health_start_latest: healthStart,
    health_end_latest: healthEnd,
    remote_event_log: REMOTE_EVENT_LOG,
    groups_by_phase_and_target: phaseTargetGroups,
    all_steady_ms_per_completion_token_p90: allSteadyP90,
    event_summary_note: 'Events are copied and summarized by the orchestration step after the run.',
    boundary: { hook_on_expected: true, dry_run_expected: true, synthetic_prompts_only: true, warmup_separated: true },
    non_claims: ['no real prompts', 'no quality result', 'no serving speedup claim', 'no production attention claim'],
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');
  writeResults(summary);
  log(`B11_PHASE_DONE phase=${PHASE}`);
}

runPhase().catch((err) => { log(`B11_PHASE_FAILED phase=${PHASE} ${err?.stack || err}`); process.exit(1); });
