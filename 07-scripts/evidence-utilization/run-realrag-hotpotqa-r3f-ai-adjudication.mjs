#!/usr/bin/env node
/**
 * RealRAG R3F: AI-assisted adjudication draft over R3E review packet.
 *
 * Important boundary: this is not human adjudication or ground truth. It uses
 * a stricter prompt and hides local-judge/metric labels from the adjudicator,
 * but still calls the same local endpoint family.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_ENDPOINT = process.env.REALRAG_ENDPOINT || 'http://192.168.15.133:11435/v1/chat/completions';
const DEFAULT_MODEL = process.env.REALRAG_MODEL || 'local-vllm';
const LABELS = ['correct', 'partial', 'wrong', 'ambiguous_dataset', 'metric_false_positive', 'metric_false_negative', 'prior_knowledge_or_leakage'];

function parseArgs(argv) {
  const args = {
    reviewItems: 'bench/evidence-utilization-realrag-hotpotqa-r3e-human-adjudication-pack-2026-05-20/review-items.jsonl',
    out: null,
    endpoint: DEFAULT_ENDPOINT,
    model: DEFAULT_MODEL,
    concurrency: 2,
    maxTokens: 192,
    timeoutMs: 120000,
    retries: 2,
    logEvery: 25,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--review-items') args.reviewItems = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--endpoint') args.endpoint = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--max-tokens') args.maxTokens = Number(argv[++i]);
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
    else if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--log-every') args.logEvery = Number(argv[++i]);
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.out) throw new Error('--out is required');
  args.concurrency = Math.max(1, Math.min(8, Math.trunc(args.concurrency || 1)));
  return args;
}
function usage() { console.log('Usage: node run-realrag-hotpotqa-r3f-ai-adjudication.mjs --out bench/...'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function readJsonl(p) { return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); }
function cleanJsonText(s) { return String(s || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(); }
function safeParse(s) { const t = cleanJsonText(s); try { return JSON.parse(t); } catch {} const m = t.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch {} } return null; }
function canonicalLabel(label) {
  label = String(label || '').trim().toLowerCase();
  if (LABELS.includes(label)) return label;
  if (label.includes('false_positive')) return 'metric_false_positive';
  if (label.includes('false_negative')) return 'metric_false_negative';
  if (label.includes('correct')) return 'correct';
  if (label.includes('partial')) return 'partial';
  if (label.includes('ambig')) return 'ambiguous_dataset';
  if (label.includes('prior') || label.includes('leak')) return 'prior_knowledge_or_leakage';
  return 'wrong';
}
function isPositive(label, condition) { return ['correct', 'partial', 'metric_false_negative'].includes(label) || (condition === 'no_support' && label === 'prior_knowledge_or_leakage'); }
function agreement(metricClosure, label, condition) {
  if (label === 'ambiguous_dataset') return 'unclear';
  return (!!metricClosure) === isPositive(label, condition) ? 'agree' : 'disagree';
}
function promptFor(item) {
  const facts = (item.supporting_facts || []).map((sf, i) => `[${i + 1}] ${sf.title} sentence ${sf.sent_idx}: ${sf.sentence}`).join('\n') || '(no gold supporting facts shown)';
  const system = `You are an independent adjudicator for a QA benchmark. You must label whether a prediction answers the question, using only the question, gold answer, and gold supporting facts. You are stricter than a keyword metric but allow true aliases. Return JSON only.`;
  const user = `Allowed labels:
- correct: semantically equivalent to gold.
- partial: related but incomplete, overbroad, underspecified, or missing required granularity.
- wrong: not the answer; UNKNOWN is wrong if gold is known.
- ambiguous_dataset: question/gold is genuinely ambiguous or alias-sensitive enough that correctness is unclear.
- metric_false_positive: prediction was counted by metric but should be wrong/partial at best.
- metric_false_negative: prediction was not counted by metric but is semantically correct.
- prior_knowledge_or_leakage: no-support condition answers correctly/plausibly without support.

Do not see or use any previous judge label. Do not reward long rationales unless the final answer is clearly present.

Review id: ${item.review_id}
Category: ${item.review_category}
Condition: ${item.condition}
Question: ${item.question}
Gold answer: ${item.gold_answer}
Prediction: ${item.prediction}
Supporting facts:
${facts}

Return exactly:
{"label":"...","confidence":0.0,"rationale":"short reason under 25 words"}`;
  return [{ role: 'system', content: system }, { role: 'user', content: user }];
}
async function postChat(args, messages) {
  const payload = { model: args.model, messages, temperature: 0, top_p: 1, max_tokens: args.maxTokens };
  let lastErr;
  for (let attempt = 0; attempt <= args.retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), args.timeoutMs);
    try {
      const res = await fetch(args.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: ac.signal });
      clearTimeout(timer);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
      const j = JSON.parse(text);
      return { response_text: j.choices?.[0]?.message?.content ?? '', usage: j.usage || null, finish_reason: j.choices?.[0]?.finish_reason || null, attempts: attempt + 1 };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < args.retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastErr;
}
function loadDone(p) { const s = new Set(); if (!fs.existsSync(p)) return s; for (const line of fs.readFileSync(p, 'utf8').split('\n').filter(Boolean)) { try { s.add(JSON.parse(line).review_id); } catch {} } return s; }
function readRecords(p) { if (!fs.existsSync(p)) return []; return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); }
function agg(records) {
  const byCategory = {}, byCondition = {}, confusion = {}, localAgreement = {};
  for (const r of records) {
    add(byCategory, r.review_category, r);
    add(byCondition, r.condition, r);
    const mk = `${r.automatic_metrics?.closure ? 'metric_closed' : 'metric_open'}:${isPositive(r.ai_adjudication.label, r.condition) ? 'ai_positive' : 'ai_negative'}`;
    confusion[mk] = (confusion[mk] || 0) + 1;
    const lk = `${r.local_judge?.label || 'none'}:${r.ai_adjudication.label}`;
    localAgreement[lk] = (localAgreement[lk] || 0) + 1;
  }
  return { byCategory: finish(byCategory), byCondition: finish(byCondition), confusion, localJudgeVsAi: localAgreement };
}
function add(obj, key, r) { obj[key] ||= { key, n: 0, labels: {}, metricClosed: 0, aiPositive: 0, metricAgree: 0, localSame: 0, parseErrors: 0 }; const a = obj[key]; a.n++; const l = r.ai_adjudication?.label || 'parse_error'; a.labels[l] = (a.labels[l] || 0) + 1; if (r.automatic_metrics?.closure) a.metricClosed++; if (isPositive(l, r.condition)) a.aiPositive++; if (r.derived_metric_agreement_ai === 'agree') a.metricAgree++; if (r.local_judge?.label === l) a.localSame++; if (r.ai_parse_error) a.parseErrors++; }
function finish(obj) { return Object.values(obj).sort((a,b)=>a.key.localeCompare(b.key)).map(a => ({ ...a, metricClosedRate: a.metricClosed / a.n, aiPositiveRate: a.aiPositive / a.n, metricAgreementRate: a.metricAgree / a.n, localSameRate: a.localSame / a.n })); }
function writeSummary(outDir, args, reviewRaw, items, records, startedAt, finishedAt, status) {
  const summary = { schema: 'realrag.hotpotqa.r3f.ai_adjudication.summary.v1', status, started_at: startedAt, finished_at: finishedAt || null, endpoint: args.endpoint, model: args.model, review_items_path: args.reviewItems, review_items_sha256: sha256(reviewRaw), review_items: items.length, completed_records: records.length, aggregate: agg(records), interpretation_boundary: ['AI-assisted adjudication draft, not human ground truth', 'adjudicator prompt hides local judge and metric labels but uses same local endpoint family', 'use only to prioritize human/independent review', 'do not treat as final semantic labels'] };
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}
function writeResults(outDir, summary) {
  const lines = [];
  lines.push('# RealRAG HotpotQA R3F — AI-assisted adjudication draft', '', `Status: **${summary.status}**`, `Started: ${summary.started_at}`, `Finished: ${summary.finished_at || 'running'}`, '', '## Boundary', '');
  for (const b of summary.interpretation_boundary) lines.push(`- ${b}.`);
  lines.push('', '## Metric vs AI adjudication', '', '| metric/AI | n |', '|---|---:|');
  for (const [k,v] of Object.entries(summary.aggregate.confusion).sort()) lines.push(`| ${k} | ${v} |`);
  lines.push('', '## By category', '', '| category | n | metric closure | AI positive | metric agreement | labels |', '|---|---:|---:|---:|---:|---|');
  for (const a of summary.aggregate.byCategory) lines.push(`| ${a.key} | ${a.n} | ${(a.metricClosedRate*100).toFixed(1)}% | ${(a.aiPositiveRate*100).toFixed(1)}% | ${(a.metricAgreementRate*100).toFixed(1)}% | ${Object.entries(a.labels).map(([k,v])=>`${k}:${v}`).join('; ')} |`);
  lines.push('', '## By condition', '', '| condition | n | metric closure | AI positive | labels |', '|---|---:|---:|---:|---|');
  for (const a of summary.aggregate.byCondition) lines.push(`| ${a.key} | ${a.n} | ${(a.metricClosedRate*100).toFixed(1)}% | ${(a.aiPositiveRate*100).toFixed(1)}% | ${Object.entries(a.labels).map(([k,v])=>`${k}:${v}`).join('; ')} |`);
  fs.writeFileSync(path.join(outDir, 'RESULTS.md'), lines.join('\n') + '\n');
}
async function main() {
  const args = parseArgs(process.argv.slice(2)); ensureDir(args.out);
  const startedAt = new Date().toISOString();
  const reviewRaw = fs.readFileSync(args.reviewItems, 'utf8'); const items = reviewRaw.split('\n').filter(Boolean).map(JSON.parse);
  const recordsPath = path.join(args.out, 'ai-adjudication-records.jsonl'); const logPath = path.join(args.out, 'run.log');
  const log = line => { const msg = `[${new Date().toISOString()}] ${line}`; console.log(msg); fs.appendFileSync(logPath, msg + '\n'); };
  log(`REALRAG_R3F_START model=${args.model} items=${items.length} concurrency=${args.concurrency}`);
  const done = loadDone(recordsPath); const pending = items.filter(x => !done.has(x.review_id)); let cursor = 0; let completed = done.size;
  async function runItem(item) {
    const messages = promptFor(item); const base = { schema: 'realrag.hotpotqa.r3f.ai_adjudication.record.v1', ...item, prompt_sha256: sha256(messages.map(m => `${m.role}: ${m.content}`).join('\n')), adjudicated_at: new Date().toISOString() };
    try {
      const t0 = Date.now(); const response = await postChat(args, messages); const parsed = safeParse(response.response_text);
      let label = parsed ? canonicalLabel(parsed.label) : 'wrong';
      if (item.condition === 'no_support' && ['correct','partial','metric_false_negative'].includes(label)) label = 'prior_knowledge_or_leakage';
      const rec = { ...base, ai_adjudication: { label, raw_label: parsed ? canonicalLabel(parsed.label) : 'wrong', confidence: Number(parsed?.confidence ?? 0), rationale: String(parsed?.rationale || 'parse failure').slice(0, 240) }, ai_raw: response.response_text, ai_parse_error: !parsed, derived_metric_agreement_ai: agreement(item.automatic_metrics?.closure, label, item.condition), latency_ms: Date.now() - t0, usage: response.usage, finish_reason: response.finish_reason, attempts: response.attempts };
      fs.appendFileSync(recordsPath, JSON.stringify(rec) + '\n'); return rec;
    } catch (err) {
      const rec = { ...base, error: String(err?.stack || err), ai_adjudication: { label: 'wrong', raw_label: 'wrong', confidence: 0, rationale: 'request failure' }, ai_parse_error: true, derived_metric_agreement_ai: agreement(item.automatic_metrics?.closure, 'wrong', item.condition) };
      fs.appendFileSync(recordsPath, JSON.stringify(rec) + '\n'); return rec;
    }
  }
  async function worker() { while (cursor < pending.length) { const item = pending[cursor++]; const rec = await runItem(item); completed++; if (completed % args.logEvery === 0 || completed === items.length) { const records = readRecords(recordsPath); const summary = writeSummary(args.out, args, reviewRaw, items, records, startedAt, null, 'running'); writeResults(args.out, summary); log(`progress completed=${completed}/${items.length} last=${rec.review_id} label=${rec.ai_adjudication?.label}`); } } }
  try { await Promise.all(Array.from({ length: args.concurrency }, () => worker())); const finishedAt = new Date().toISOString(); const records = readRecords(recordsPath); const summary = writeSummary(args.out, args, reviewRaw, items, records, startedAt, finishedAt, 'done'); writeResults(args.out, summary); log(`REALRAG_R3F_DONE completed=${records.length}/${items.length}`); }
  catch (err) { const finishedAt = new Date().toISOString(); const records = readRecords(recordsPath); const summary = writeSummary(args.out, args, reviewRaw, items, records, startedAt, finishedAt, 'failed'); writeResults(args.out, summary); fs.writeFileSync(path.join(args.out, 'ERROR.md'), String(err?.stack || err)); log(`REALRAG_R3F_FAILED ${String(err?.message || err)}`); process.exit(1); }
}
main().catch(err => { console.error(err); process.exit(1); });
