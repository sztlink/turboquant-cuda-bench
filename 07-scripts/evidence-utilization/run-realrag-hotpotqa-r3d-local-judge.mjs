#!/usr/bin/env node
/**
 * RealRAG R3D: local semantic judge over R3C audit samples.
 *
 * Uses the existing OpenAI-compatible local endpoint to classify sampled
 * predictions as correct / partial / wrong / ambiguous / metric_artifact / etc.
 *
 * Boundary: this is judge-triage, not ground truth. The judge model is local
 * Qwen2.5-7B, overlapping the evaluated model family/setup, so results are for
 * prioritization and metric debugging, not final adjudication.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_ENDPOINT = process.env.REALRAG_ENDPOINT || 'http://192.168.15.133:11435/v1/chat/completions';
const DEFAULT_MODEL = process.env.REALRAG_MODEL || 'local-vllm';
const CONDITIONS = ['bm25_top10', 'bge_rerank_top10', 'oracle_first', 'no_support'];
const LABELS = ['correct', 'partial', 'wrong', 'ambiguous_dataset', 'metric_false_positive', 'metric_false_negative', 'prior_knowledge_or_leakage'];

function parseArgs(argv) {
  const args = {
    samples: 'bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/samples.jsonl',
    out: null,
    endpoint: DEFAULT_ENDPOINT,
    model: DEFAULT_MODEL,
    concurrency: 2,
    maxTokens: 192,
    timeoutMs: 120000,
    retries: 2,
    logEvery: 50,
    limitTasks: 0,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--samples') args.samples = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--endpoint') args.endpoint = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--max-tokens') args.maxTokens = Number(argv[++i]);
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
    else if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--log-every') args.logEvery = Number(argv[++i]);
    else if (a === '--limit-tasks') args.limitTasks = Number(argv[++i]);
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.out) throw new Error('--out is required');
  args.concurrency = Math.max(1, Math.min(8, Math.trunc(args.concurrency || 1)));
  return args;
}
function usage() { console.log('Usage: node run-realrag-hotpotqa-r3d-local-judge.mjs --out bench/...'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function readJsonl(p) { return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); }
function short(s, n = 1200) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function cleanJsonText(s) { return String(s || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim(); }
function safeParseJudge(s) {
  const t = cleanJsonText(s);
  try { return JSON.parse(t); } catch {}
  const m = t.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}
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
function isJudgePositiveForMetric(r) {
  const label = r.judge?.label;
  return ['correct', 'partial', 'metric_false_negative'].includes(label) || (r.condition === 'no_support' && label === 'prior_knowledge_or_leakage');
}
function derivedMetricAgreement(r) {
  if (r.judge?.label === 'ambiguous_dataset') return 'unclear';
  const metricClosed = !!r.metrics?.closure;
  const judgePositive = isJudgePositiveForMetric(r);
  return metricClosed === judgePositive ? 'agree' : 'disagree';
}
function makeTasks(samples) {
  const taskByKey = new Map();
  const memberships = [];
  for (const sample of samples) {
    for (const condition of CONDITIONS) {
      const rec = sample.conditions?.[condition];
      if (!rec) continue;
      const key = `${sample.qid}\t${condition}`;
      if (!taskByKey.has(key)) {
        taskByKey.set(key, {
          key,
          qid: sample.qid,
          question: sample.question,
          gold_answer: sample.gold_answer,
          supporting_facts: sample.supporting_facts || [],
          condition,
          prediction: rec.prediction,
          metrics: rec.metrics,
          metric_risk: rec.metric_risk,
          support: rec.support,
          sentence_audit: rec.sentence_audit,
          context_titles: rec.context_titles,
        });
      }
      memberships.push({ bucket: sample.bucket, qid: sample.qid, condition, key });
    }
  }
  return { tasks: [...taskByKey.values()], memberships };
}
function promptFor(task) {
  const facts = (task.supporting_facts || []).map((sf, i) => `[${i + 1}] ${sf.title} #${sf.sent_idx}: ${sf.sentence}`).join('\n');
  const system = `You are auditing HotpotQA answer evaluation. Classify the prediction using the question, gold answer, and gold supporting-fact sentences. Do not infer hidden context beyond the supporting facts. Return JSON only.`;
  const user = `Labels: correct, partial, wrong, ambiguous_dataset, metric_false_positive, metric_false_negative, prior_knowledge_or_leakage.

Definitions:
- correct: prediction is semantically equivalent to the gold answer.
- partial: prediction is related but incomplete/overbroad/underspecified.
- wrong: prediction is not the answer. If prediction is UNKNOWN while the gold answer is known, label wrong.
- ambiguous_dataset: gold/prediction conflict because the question or gold answer is genuinely ambiguous or alias-sensitive. Do not use this for UNKNOWN.
- metric_false_positive: the automatic closure metric counted it as closed but the prediction is not semantically correct/partial.
- metric_false_negative: the automatic closure metric failed but the prediction is semantically correct/acceptable.
- prior_knowledge_or_leakage: no-support condition answered correctly or plausibly without provided supporting facts.

Question: ${task.question}
Gold answer: ${task.gold_answer}
Prediction: ${task.prediction}
Condition: ${task.condition}
Automatic metrics: ${JSON.stringify(task.metrics)}
Metric risk heuristic: ${JSON.stringify(task.metric_risk)}
Supporting facts:
${facts || '(none)'}

Return exactly:
{"label":"...","confidence":0.0,"metric_agreement":"agree|disagree|unclear","rationale":"short reason under 25 words"}`;
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
function loadDone(recordsPath) {
  const done = new Set();
  if (!fs.existsSync(recordsPath)) return done;
  for (const line of fs.readFileSync(recordsPath, 'utf8').split('\n').filter(Boolean)) {
    try { done.add(JSON.parse(line).key); } catch {}
  }
  return done;
}
function readRecords(recordsPath) {
  if (!fs.existsSync(recordsPath)) return [];
  return fs.readFileSync(recordsPath, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
}
function aggregate(records, memberships) {
  const byKey = new Map(records.map(r => [r.key, r]));
  const byCondition = {};
  const byBucket = {};
  const confusion = {};
  for (const r of records) {
    addAgg(byCondition, r.condition, r);
    const metricClosed = !!r.metrics?.closure;
    const judgePositive = isJudgePositiveForMetric(r);
    const ck = `${metricClosed ? 'metric_closed' : 'metric_open'}:${judgePositive ? 'judge_positive' : 'judge_negative'}`;
    confusion[ck] = (confusion[ck] || 0) + 1;
  }
  for (const m of memberships) {
    const r = byKey.get(m.key);
    if (!r) continue;
    addAgg(byBucket, m.bucket, r);
  }
  return { byCondition: finishAgg(byCondition), byBucket: finishAgg(byBucket), confusion };
}
function addAgg(obj, key, r) {
  obj[key] ||= { key, n: 0, labels: {}, metricClosed: 0, judgePositive: 0, metricAgreementAgree: 0, parseErrors: 0 };
  const a = obj[key];
  a.n++;
  const label = r.judge?.label || 'parse_error';
  a.labels[label] = (a.labels[label] || 0) + 1;
  if (r.metrics?.closure) a.metricClosed++;
  if (isJudgePositiveForMetric(r)) a.judgePositive++;
  if (r.derived_metric_agreement === 'agree') a.metricAgreementAgree++;
  if (r.judge_parse_error) a.parseErrors++;
}
function finishAgg(obj) {
  return Object.values(obj).sort((a, b) => a.key.localeCompare(b.key)).map(a => ({ ...a, metricClosedRate: a.metricClosed / a.n, judgePositiveRate: a.judgePositive / a.n, metricAgreementAgreeRate: a.metricAgreementAgree / a.n }));
}
function writeSummary(outDir, args, samplesRaw, tasks, memberships, records, startedAt, finishedAt, status) {
  const summary = {
    schema: 'realrag.hotpotqa.r3d.local_judge.summary.v1',
    status,
    started_at: startedAt,
    finished_at: finishedAt || null,
    endpoint: args.endpoint,
    model: args.model,
    samples_path: args.samples,
    samples_sha256: sha256(samplesRaw),
    sample_rows: readJsonl(args.samples).length,
    unique_tasks: tasks.length,
    completed_tasks: records.length,
    membership_rows: memberships.length,
    aggregate: aggregate(records, memberships),
    interpretation_boundary: [
      'local Qwen judge triage, not ground-truth adjudication',
      'judge model overlaps the evaluated setup and may share biases',
      'use for metric debugging and manual review prioritization',
      'no vLLM mutation, no serving claim, no internal evidence-use proof',
    ],
  };
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}
function writeResults(outDir, summary) {
  const lines = [];
  lines.push('# RealRAG HotpotQA R3D — local semantic judge audit', '', `Status: **${summary.status}**`, `Started: ${summary.started_at}`, `Finished: ${summary.finished_at || 'running'}`, '');
  lines.push('## Boundary', '');
  for (const b of summary.interpretation_boundary) lines.push(`- ${b}.`);
  lines.push('', '## Metric vs judge confusion', '', '| metric/judge | n |', '|---|---:|');
  for (const [k, v] of Object.entries(summary.aggregate.confusion).sort()) lines.push(`| ${k} | ${v} |`);
  lines.push('', '## By condition', '', '| condition | n | metric closure | judge-positive | labels |', '|---|---:|---:|---:|---|');
  for (const a of summary.aggregate.byCondition) lines.push(`| ${a.key} | ${a.n} | ${(a.metricClosedRate * 100).toFixed(1)}% | ${(a.judgePositiveRate * 100).toFixed(1)}% | ${Object.entries(a.labels).map(([k, v]) => `${k}:${v}`).join('; ')} |`);
  lines.push('', '## By bucket', '', '| bucket | n | metric closure | judge-positive | labels |', '|---|---:|---:|---:|---|');
  for (const a of summary.aggregate.byBucket) lines.push(`| ${a.key} | ${a.n} | ${(a.metricClosedRate * 100).toFixed(1)}% | ${(a.judgePositiveRate * 100).toFixed(1)}% | ${Object.entries(a.labels).map(([k, v]) => `${k}:${v}`).join('; ')} |`);
  fs.writeFileSync(path.join(outDir, 'RESULTS.md'), lines.join('\n') + '\n');
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(args.out);
  const startedAt = new Date().toISOString();
  const samplesRaw = fs.readFileSync(args.samples, 'utf8');
  const samples = samplesRaw.split('\n').filter(Boolean).map(line => JSON.parse(line));
  const { tasks: allTasks, memberships } = makeTasks(samples);
  const tasks = args.limitTasks ? allTasks.slice(0, args.limitTasks) : allTasks;
  fs.writeFileSync(path.join(args.out, 'memberships.json'), JSON.stringify(memberships, null, 2));
  fs.writeFileSync(path.join(args.out, 'tasks.json'), JSON.stringify(tasks, null, 2));
  const recordsPath = path.join(args.out, 'judge-records.jsonl');
  const logPath = path.join(args.out, 'run.log');
  const log = line => { const msg = `[${new Date().toISOString()}] ${line}`; console.log(msg); fs.appendFileSync(logPath, msg + '\n'); };
  log(`REALRAG_R3D_START model=${args.model} tasks=${tasks.length} concurrency=${args.concurrency}`);
  const done = loadDone(recordsPath);
  const pending = tasks.filter(t => !done.has(t.key));
  let cursor = 0;
  let completed = done.size;
  async function runTask(task) {
    const messages = promptFor(task);
    const base = { schema: 'realrag.hotpotqa.r3d.local_judge.record.v1', ...task, prompt_sha256: sha256(messages.map(m => `${m.role}: ${m.content}`).join('\n')), created_at: new Date().toISOString() };
    try {
      const t0 = Date.now();
      const response = await postChat(args, messages);
      const parsed = safeParseJudge(response.response_text);
      const rawLabel = parsed ? canonicalLabel(parsed.label) : 'wrong';
      const label = task.condition === 'no_support' && ['correct', 'partial', 'metric_false_negative'].includes(rawLabel)
        ? 'prior_knowledge_or_leakage'
        : rawLabel;
      const judge = parsed ? {
        label,
        raw_label: rawLabel,
        confidence: Number(parsed.confidence ?? 0),
        metric_agreement: ['agree', 'disagree', 'unclear'].includes(String(parsed.metric_agreement)) ? String(parsed.metric_agreement) : 'unclear',
        rationale: short(parsed.rationale, 200),
      } : { label: 'wrong', raw_label: 'wrong', confidence: 0, metric_agreement: 'unclear', rationale: 'parse failure' };
      const rec = { ...base, judge, judge_raw: response.response_text, judge_parse_error: !parsed, latency_ms: Date.now() - t0, usage: response.usage, finish_reason: response.finish_reason, attempts: response.attempts };
      rec.derived_metric_agreement = derivedMetricAgreement(rec);
      fs.appendFileSync(recordsPath, JSON.stringify(rec) + '\n');
      return rec;
    } catch (err) {
      const rec = { ...base, error: String(err?.stack || err), judge: { label: 'wrong', confidence: 0, metric_agreement: 'unclear', rationale: 'request failure' }, judge_parse_error: true };
      rec.derived_metric_agreement = derivedMetricAgreement(rec);
      fs.appendFileSync(recordsPath, JSON.stringify(rec) + '\n');
      return rec;
    }
  }
  async function worker() {
    while (cursor < pending.length) {
      const task = pending[cursor++];
      const rec = await runTask(task);
      completed++;
      if (completed % args.logEvery === 0 || completed === tasks.length) {
        const records = readRecords(recordsPath);
        const summary = writeSummary(args.out, args, samplesRaw, tasks, memberships, records, startedAt, null, 'running');
        writeResults(args.out, summary);
        log(`progress completed=${completed}/${tasks.length} last=${rec.key} label=${rec.judge?.label}`);
      }
    }
  }
  try {
    await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
    const finishedAt = new Date().toISOString();
    const records = readRecords(recordsPath);
    const summary = writeSummary(args.out, args, samplesRaw, tasks, memberships, records, startedAt, finishedAt, 'done');
    writeResults(args.out, summary);
    log(`REALRAG_R3D_DONE completed=${records.length}/${tasks.length}`);
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const records = readRecords(recordsPath);
    const summary = writeSummary(args.out, args, samplesRaw, tasks, memberships, records, startedAt, finishedAt, 'failed');
    writeResults(args.out, summary);
    fs.writeFileSync(path.join(args.out, 'ERROR.md'), `# RealRAG R3D failed\n\n\`\`\`\n${String(err?.stack || err)}\n\`\`\`\n`);
    log(`REALRAG_R3D_FAILED ${String(err?.message || err)}`);
    process.exit(1);
  }
}
main().catch(err => { console.error(err); process.exit(1); });
