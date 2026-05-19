#!/usr/bin/env node
// Serving baseline B0 for the EPKV bridge gate.
//
// Boundary:
// - calls existing vLLM OpenAI-compatible endpoint with hook OFF / no EPKV env changes;
// - no service restart, no model mutation, no hook-on dry-run;
// - synthetic prompts only; response content is discarded except short smoke text.

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import url from 'url';

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.env.OUT || path.join(REPO_ROOT, 'bench', 'evidence-utilization-epkv-serving-baseline-b0-2026-05-19');
const BASE_URL = (process.env.BASE_URL || 'http://192.168.15.133:11435/v1').replace(/\/$/, '');
const MODEL = process.env.MODEL || 'local-vllm';
const TARGET_PROMPT_TOKENS = (process.env.TARGET_PROMPT_TOKENS || '512,1024,1536,2048').split(',').map((x) => Number(x.trim())).filter(Boolean);
const REPEATS = Number(process.env.REPEATS || 3);
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 32);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 180000);

fs.mkdirSync(OUT, { recursive: true });
const recordsPath = path.join(OUT, 'records.jsonl');
const summaryPath = path.join(OUT, 'summary.json');
const resultsPath = path.join(OUT, 'RESULTS.md');
const runLogPath = path.join(OUT, 'run.log');
fs.writeFileSync(recordsPath, '');
fs.writeFileSync(runLogPath, '');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(runLogPath, line + '\n');
}

function syntheticContext(targetTokens) {
  // Qwen BPE tokenization is not used here; endpoint usage.prompt_tokens is the source of truth.
  // This text is deliberately boring and public-safe.
  const approxChars = Math.max(256, Math.round(targetTokens * 4.0));
  const base = 'Synthetic bridge baseline context. ordinary studio record. cable label. archive note. no secret outside this synthetic test. ';
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
      {
        role: 'system',
        content: 'You are a deterministic benchmark responder. Answer with exactly: BASELINE-OK',
      },
      {
        role: 'user',
        content: `${context}\n\nBenchmark request ${targetTokens}/${rep}. Answer with exactly BASELINE-OK and no explanation.`,
      },
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

function summarizeGroup(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, rs]) => {
    const lat = rs.map((r) => r.elapsed_ms);
    const perCompletion = rs.map((r) => r.ms_per_completion_token).filter(Number.isFinite);
    const perTotal = rs.map((r) => r.ms_per_total_token).filter(Number.isFinite);
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
      ms_per_total_token_p50: percentile(perTotal, 0.5),
      ms_per_total_token_p90: percentile(perTotal, 0.9),
    };
  }).sort((a, b) => Number(a.key) - Number(b.key));
}

function writeResults(summary) {
  const lines = [
    '# EPKV bridge path B0 — serving baseline hook-off',
    '',
    '> Status: synthetic serving baseline. Existing vLLM service only; no hook-on, no dry-run, no service restart.',
    '',
    '## Boundary',
    '',
    '```txt',
    `base_url: ${summary.base_url}`,
    `model: ${summary.model}`,
    'VLLM_EPKV_RUNTIME_HOOK: not enabled by this script',
    'prompts: synthetic benchmark contexts',
    '```',
    '',
    '## Why this exists',
    '',
    'Track A showed the synthetic micro-kernel ratio gate was structurally mismatched. B0 measures the real serving latency scale with hook OFF so any future dry-run trace can be budgeted against serving latency, not against a tiny micro-kernel baseline.',
    '',
    '## Summary by target prompt length',
    '',
    '| target prompt tokens | runs | mean actual prompt tokens | elapsed p50 ms | elapsed p90 ms | p50 ms/completion token | p90 ms/completion token |',
    '|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const g of summary.groups_by_target) {
    lines.push(`| ${g.key} | ${g.runs} | ${g.prompt_tokens_mean.toFixed(1)} | ${g.elapsed_ms_p50.toFixed(1)} | ${g.elapsed_ms_p90.toFixed(1)} | ${g.ms_per_completion_token_p50.toFixed(2)} | ${g.ms_per_completion_token_p90.toFixed(2)} |`);
  }
  lines.push('', '## Gate implication', '', summary.gate_implication, '', '## Non-claims', '', '- no EPKV hook-on result', '- no quality result', '- no serving speedup claim', '- no production attention claim', '- no comparison to PagedAttention/FlashAttention', '');
  fs.writeFileSync(resultsPath, lines.join('\n'));
}

async function main() {
  log('B0_SERVING_BASELINE_START');
  const healthStart = await fetch(BASE_URL.replace(/\/v1$/, '') + '/health', { signal: AbortSignal.timeout(10000) }).then((r) => r.status).catch((e) => `ERROR ${e}`);
  log(`health_start=${healthStart}`);

  const rows = [];
  for (const target of TARGET_PROMPT_TOKENS) {
    for (let rep = 0; rep < REPEATS; rep += 1) {
      const payload = payloadFor(target, rep);
      const t0 = performance.now();
      let row;
      try {
        const r = await requestJson(`${BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const elapsed = performance.now() - t0;
        const usage = r.json?.usage || null;
        const content = (r.json?.choices?.[0]?.message?.content || '').trim();
        const completionTokens = usage?.completion_tokens || usage?.output_tokens || null;
        const totalTokens = usage?.total_tokens || ((usage?.prompt_tokens || 0) + (completionTokens || 0)) || null;
        row = {
          status: r.status === 200 ? 'ok' : 'http_error',
          http_status: r.status,
          target_prompt_tokens: target,
          rep,
          elapsed_ms: elapsed,
          usage,
          answer_prefix: content.slice(0, 64),
          ms_per_completion_token: completionTokens ? elapsed / completionTokens : null,
          ms_per_total_token: totalTokens ? elapsed / totalTokens : null,
          timings: r.json?.timings || null,
        };
      } catch (err) {
        row = {
          status: 'error',
          target_prompt_tokens: target,
          rep,
          elapsed_ms: performance.now() - t0,
          error: String(err?.stack || err).slice(0, 1000),
        };
      }
      rows.push(row);
      fs.appendFileSync(recordsPath, JSON.stringify(row) + '\n');
      log(`RESULT ${JSON.stringify(row)}`);
    }
  }

  const healthEnd = await fetch(BASE_URL.replace(/\/v1$/, '') + '/health', { signal: AbortSignal.timeout(10000) }).then((r) => r.status).catch((e) => `ERROR ${e}`);
  log(`health_end=${healthEnd}`);

  const groups = summarizeGroup(rows, (r) => r.target_prompt_tokens);
  const allCompletionP90 = percentile(rows.map((r) => r.ms_per_completion_token).filter(Number.isFinite), 0.9);
  const budget15 = allCompletionP90 == null ? null : allCompletionP90 * 0.15;
  const summary = {
    created_at: new Date().toISOString(),
    base_url: BASE_URL,
    model: MODEL,
    runs: rows.length,
    errors: rows.filter((r) => r.status !== 'ok').length,
    target_prompt_tokens: TARGET_PROMPT_TOKENS,
    repeats: REPEATS,
    max_tokens: MAX_TOKENS,
    health_start: healthStart,
    health_end: healthEnd,
    groups_by_target: groups,
    all_ms_per_completion_token_p90: allCompletionP90,
    proposed_trace_overhead_budget_15pct_ms: budget15,
    gate_implication: budget15 == null
      ? 'No budget computed because completion token usage was unavailable.'
      : `If future hook-on dry-run uses a 15% per-completion-token overhead budget, the current B0 p90 gives ~${budget15.toFixed(2)} ms. Compare this against Track A trace overhead before any hook-on serving probe.`,
    boundary: {
      hook_on: false,
      service_mutation: false,
      synthetic_prompts_only: true,
    },
    non_claims: [
      'no EPKV hook-on result',
      'no quality result',
      'no serving speedup claim',
      'no production attention claim',
    ],
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');
  writeResults(summary);
  log('B0_SERVING_BASELINE_DONE');
}

main().catch((err) => {
  log(`B0_SERVING_BASELINE_FAILED ${err?.stack || err}`);
  process.exit(1);
});
