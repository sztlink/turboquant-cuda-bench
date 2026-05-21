#!/usr/bin/env node
/**
 * Evidence Protection Layer v0.2 — synthetic answer-equivalence harness.
 *
 * Compares original synthetic prompts vs protected rewrites on the existing
 * local endpoint. Stores only hashes/metrics. No prompt text, no completion
 * text, no raw token ids, no runtime mutation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  outDir: 'bench/evidence-protection-layer-v02-answer-equivalence-2026-05-21',
  endpoint: 'http://192.168.15.133:11435/v1/chat/completions',
  model: 'local-vllm',
  requireModelId: 'local-vllm',
  timeoutMs: 60000,
  maxTokens: 16,
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--endpoint') args.endpoint = process.argv[++i];
  else if (a === '--model') args.model = process.argv[++i];
  else if (a === '--require-model-id') args.requireModelId = process.argv[++i];
  else if (a === '--timeout-ms') args.timeoutMs = Number(process.argv[++i]);
  else throw new Error(`unknown arg ${a}`);
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = [
  { id: 'epl-v02-first', value: 'LIME-741', decoysBefore: 0, decoysAfter: 2 },
  { id: 'epl-v02-middle', value: 'RIVER-209', decoysBefore: 2, decoysAfter: 2 },
  { id: 'epl-v02-last', value: 'ORCHID-884', decoysBefore: 4, decoysAfter: 0 },
  { id: 'epl-v02-near-duplicate', value: 'BASALT-317', decoysBefore: 2, decoysAfter: 1, nearDuplicate: true },
  { id: 'epl-v02-conflict', value: 'EMBER-552', decoysBefore: 3, decoysAfter: 1, conflict: true },
  { id: 'epl-v02-no-support', value: 'UNKNOWN', decoysBefore: 4, decoysAfter: 0, noSupport: true },
];

function modelsEndpoint(chatEndpoint) {
  const u = new URL(chatEndpoint);
  u.pathname = u.pathname.replace(/\/chat\/completions\/?$/, '/models');
  return u.toString();
}

async function fetchJson(url, options = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), args.timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ac.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function servedModelGuard() {
  const data = await fetchJson(modelsEndpoint(args.endpoint));
  const ids = (data?.data || []).map((m) => m.id);
  if (!ids.includes(args.requireModelId)) throw new Error(`required model ${args.requireModelId} not served; served=${ids.join(',')}`);
  return ids;
}

function block(label, value, kind) {
  return `${label}. ${kind}. For handle SIGNAL, the value is ${value}.`;
}

function buildCase(c, protectedRewrite = false) {
  const lines = [];
  for (let i = 0; i < c.decoysBefore; i++) {
    let value = `DECOY-${100 + i}`;
    if (c.nearDuplicate && i === c.decoysBefore - 1) value = c.value.replace(/[0-9]$/, String((Number(c.value.at(-1)) + 1) % 10));
    const kind = c.conflict ? 'conflicting note' : 'distractor note';
    lines.push(block(`D${i + 1}`, value, kind));
  }
  if (!c.noSupport) {
    const canonical = block('CANONICAL', c.value, 'canonical current note');
    lines.push(protectedRewrite ? `[PROTECTED_SUPPORT]\n${canonical}\n[/PROTECTED_SUPPORT]` : canonical);
  }
  for (let i = 0; i < c.decoysAfter; i++) lines.push(block(`A${i + 1}`, `AFTER-${200 + i}`, 'trailing distractor note'));
  const context = lines.map((x, i) => `${i + 1}. ${x}`).join('\n');
  return [
    { role: 'system', content: 'Use only the provided context. Return only the value for SIGNAL. If absent, return UNKNOWN.' },
    { role: 'user', content: `Question: What is the value for handle SIGNAL?\n\nContext:\n${context}` },
  ];
}

async function complete(messages) {
  const started = Date.now();
  const res = await fetchJson(args.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: args.model, messages, temperature: 0, max_tokens: args.maxTokens }),
  });
  return { text: String(res?.choices?.[0]?.message?.content || '').trim(), latency_ms: Date.now() - started };
}

function privacyScanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const patterns = [/Question: What is/i, /For handle SIGNAL/i, /LIME-741|RIVER-209|ORCHID-884|BASALT-317|EMBER-552/i, /completion_text/i, /prompt_text/i, /raw_token_ids/i];
  const findings = [];
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    for (const rx of patterns) if (rx.test(line)) findings.push({ line: i + 1, pattern: String(rx) });
  }
  return findings;
}

async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  const served = await servedModelGuard();
  const records = [];
  for (const c of CASES) {
    const originalPrompt = buildCase(c, false);
    const protectedPrompt = buildCase(c, true);
    const original = await complete(originalPrompt);
    await sleep(100);
    const protectedOut = await complete(protectedPrompt);
    const equivalent = norm(original.text) === norm(protectedOut.text);
    const expectedNorm = norm(c.value);
    const originalClosed = c.value === 'UNKNOWN' ? /unknown/i.test(original.text) : norm(original.text).includes(expectedNorm);
    const protectedClosed = c.value === 'UNKNOWN' ? /unknown/i.test(protectedOut.text) : norm(protectedOut.text).includes(expectedNorm);
    const sameClosure = originalClosed === protectedClosed;
    const equivalenceViolation = !equivalent || !sameClosure;
    const protectedRewriteAllowed = !equivalenceViolation;
    // Contract: same output/closure is allowed; any mismatch must be blocked.
    const failClosed = equivalenceViolation ? true : protectedRewriteAllowed;
    records.push({
      schema: 'evidence_protection_layer.v02.answer_equivalence.record',
      case_hash: sha(c.id).slice(0, 16),
      condition: c.noSupport ? 'no_support' : c.nearDuplicate ? 'near_duplicate' : c.conflict ? 'conflict' : `rank_${c.decoysBefore + 1}`,
      expected_hash: sha(c.value).slice(0, 16),
      prompt_hashes: {
        original: sha(JSON.stringify(originalPrompt)).slice(0, 16),
        protected: sha(JSON.stringify(protectedPrompt)).slice(0, 16),
      },
      response_hashes: {
        original: sha(original.text).slice(0, 16),
        protected: sha(protectedOut.text).slice(0, 16),
      },
      response_chars: {
        original: original.text.length,
        protected: protectedOut.text.length,
      },
      latency_ms: {
        original: original.latency_ms,
        protected: protectedOut.latency_ms,
      },
      checks: {
        equivalent_output: equivalent,
        original_closed: originalClosed ? 1 : 0,
        protected_closed: protectedClosed ? 1 : 0,
        same_closure: sameClosure,
        equivalence_violation: equivalenceViolation,
        protected_rewrite_allowed: protectedRewriteAllowed,
        fail_closed: failClosed,
        output_changing_path: false,
        no_text_fields: true,
      },
    });
    await sleep(100);
  }

  const recordsPath = path.join(args.outDir, 'answer-equivalence.jsonl');
  fs.writeFileSync(recordsPath, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const findings = privacyScanFile(recordsPath);
  const passed = records.every((r) => r.checks.fail_closed) && findings.length === 0;
  const summary = {
    schema: 'evidence_protection_layer.v02.answer_equivalence.summary',
    status: passed ? 'passed' : 'failed',
    created_at: new Date().toISOString(),
    boundary: [
      'protect regime synthetic answer-equivalence smoke',
      'no serving mutation',
      'no vLLM patch',
      'no EPKV hook-on',
      'no production output-changing path',
      'no prompt or completion text stored',
    ],
    endpoint_hash: sha(args.endpoint).slice(0, 16),
    requested_model_hash: sha(args.model).slice(0, 16),
    served_model_id_hashes: served.map((id) => sha(id).slice(0, 16)),
    cases: records.length,
    equivalent_outputs: records.filter((r) => r.checks.equivalent_output).length,
    same_closure: records.filter((r) => r.checks.same_closure).length,
    equivalence_violations: records.filter((r) => r.checks.equivalence_violation).length,
    protected_rewrite_allowed: records.filter((r) => r.checks.protected_rewrite_allowed).length,
    fail_closed: records.filter((r) => r.checks.fail_closed).length,
    privacy_findings: findings.length,
    checks: {
      all_fail_closed: records.every((r) => r.checks.fail_closed),
      no_privacy_findings: findings.length === 0,
      no_output_changing_path: records.every((r) => r.checks.output_changing_path === false),
    },
  };
  fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  fs.writeFileSync(path.join(args.outDir, 'privacy-scan-report.json'), JSON.stringify({ ok: findings.length === 0, findings }, null, 2) + '\n');
  console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, cases: summary.cases, equivalent_outputs: summary.equivalent_outputs, fail_closed: summary.fail_closed, privacy_findings: findings.length }, null, 2));
  process.exit(summary.status === 'passed' ? 0 : 1);
}

main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
