#!/usr/bin/env node
/**
 * RealRAG R4A — LLM judge panel for human-calibration triage.
 *
 * Uses the local default endpoint only. This is still automatic adjudication,
 * not ground truth. It adds two rubric variants to the existing R3K local judge
 * and stores the prompt/answer-bearing review records in bench/ for the human
 * calibration workflow.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  input: 'bench/evidence-utilization-realrag-r3k-adjudication-light-2026-05-20/adjudication-records.jsonl',
  outDir: 'bench/evidence-utilization-realrag-r4a-llm-judge-panel-2026-05-21',
  endpoint: 'http://192.168.15.133:11435/v1/chat/completions',
  model: 'local-vllm',
  timeoutMs: 60000,
  concurrency: 3,
  maxRecords: 0,
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--input') args.input = process.argv[++i];
  else if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--endpoint') args.endpoint = process.argv[++i];
  else if (a === '--model') args.model = process.argv[++i];
  else if (a === '--timeout-ms') args.timeoutMs = Number(process.argv[++i]);
  else if (a === '--concurrency') args.concurrency = Number(process.argv[++i]);
  else if (a === '--max-records') args.maxRecords = Number(process.argv[++i]);
  else throw new Error(`unknown arg ${a}`);
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const readJsonl = (p) => fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const writeJson = (p, x) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(x, null, 2) + '\n'); };
const normLabel = (x) => {
  const s = String(x || '').toLowerCase().trim();
  if (['correct', 'partial', 'wrong', 'unclear', 'parse_error'].includes(s)) return s;
  if (s.includes('correct')) return 'correct';
  if (s.includes('partial')) return 'partial';
  if (s.includes('wrong') || s.includes('incorrect')) return 'wrong';
  if (s.includes('unclear') || s.includes('ambiguous')) return 'unclear';
  return 'parse_error';
};

async function fetchJson(url, options = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), args.timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ac.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}
function modelsEndpoint(chatEndpoint) {
  const u = new URL(chatEndpoint);
  u.pathname = u.pathname.replace(/\/chat\/completions\/?$/, '/models');
  return u.toString();
}
async function servedModelGuard() {
  const data = await fetchJson(modelsEndpoint(args.endpoint));
  const ids = (data?.data || []).map((m) => m.id);
  if (!ids.includes(args.model)) throw new Error(`model ${args.model} not served; served=${ids.join(',')}`);
  return ids;
}

const RUBRICS = [
  {
    id: 'strict_equivalence',
    system: 'You are a strict QA adjudicator. Judge whether the prediction exactly answers the question, allowing aliases/paraphrases only when unambiguous. Do not reward extra contradictory text.',
  },
  {
    id: 'semantic_acceptability',
    system: 'You are a semantic answer-acceptability adjudicator. Judge whether a knowledgeable human would accept the prediction as answering the question, even if wording differs from the gold answer.',
  },
];
function userPrompt(item) {
  const facts = (item.supporting_facts || []).slice(0, 6).map((f, i) => `${i + 1}. [${f.title ?? ''}] ${f.sentence ?? ''}`).join('\n');
  return `Question: ${item.question}\nGold answer: ${item.gold_answer}\nPrediction: ${item.prediction}\nSupporting facts:\n${facts || '(none provided)'}\n\nReturn strict JSON only with keys: label, confidence, metric_error, rationale.\nAllowed label values: correct, partial, wrong, unclear.\nAllowed metric_error values: none, metric_false_positive, metric_false_negative, unclear.\nRationale must be one short sentence.`;
}
function parseJudge(raw) {
  const text = String(raw || '').trim();
  let obj = null;
  try { obj = JSON.parse(text); } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { obj = JSON.parse(m[0]); } catch {} }
  }
  if (!obj) return { label: 'parse_error', confidence: 0, metric_error: 'unclear', rationale: 'parse_error', parse_error: true, raw_hash: sha(text).slice(0, 16) };
  const label = normLabel(obj.label);
  let confidence = Number(obj.confidence);
  if (!Number.isFinite(confidence)) confidence = 0;
  confidence = Math.max(0, Math.min(1, confidence));
  const metric_error = ['none', 'metric_false_positive', 'metric_false_negative', 'unclear'].includes(String(obj.metric_error)) ? String(obj.metric_error) : 'unclear';
  return { label, confidence, metric_error, rationale: String(obj.rationale || '').slice(0, 300), parse_error: false, raw_hash: sha(text).slice(0, 16) };
}
async function judge(item, rubric) {
  const started = Date.now();
  const body = {
    model: args.model,
    temperature: 0,
    max_tokens: 140,
    messages: [
      { role: 'system', content: rubric.system },
      { role: 'user', content: userPrompt(item) },
    ],
  };
  const res = await fetchJson(args.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const raw = res?.choices?.[0]?.message?.content || '';
  return { ...parseJudge(raw), latency_ms: Date.now() - started, finish_reason: res?.choices?.[0]?.finish_reason || null, usage: res?.usage || null };
}
function majority(labels) {
  const counts = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  const order = ['correct', 'partial', 'wrong', 'unclear', 'parse_error'];
  return order.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
}
function metricAgreement(item, label) {
  const metricClosed = Number(item.automatic_metrics?.closure || 0) === 1;
  const judgePositive = label === 'correct' || label === 'partial';
  if (metricClosed && !judgePositive) return 'metric_false_positive';
  if (!metricClosed && judgePositive) return 'metric_false_negative';
  return 'none';
}
async function main() {
  fs.mkdirSync(args.outDir, { recursive: true });
  const served = await servedModelGuard();
  let items = readJsonl(args.input);
  if (args.maxRecords > 0) items = items.slice(0, args.maxRecords);
  const outPath = path.join(args.outDir, 'panel-records.jsonl');
  const existing = fs.existsSync(outPath) ? readJsonl(outPath) : [];
  const done = new Set(existing.map((r) => r.review_id));
  const stream = fs.createWriteStream(outPath, { flags: existing.length ? 'a' : 'w' });
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++];
      if (done.has(item.review_id)) continue;
      const baseline = {
        rubric: 'r3k_existing_local_judge',
        label: normLabel(item.r3k_local_judge?.label),
        confidence: Number(item.r3k_local_judge?.confidence || 0),
        metric_error: item.r3k_local_judge?.metric_error || metricAgreement(item, normLabel(item.r3k_local_judge?.label)),
        parse_error: Boolean(item.r3k_local_judge?.parse_error),
      };
      const calls = [];
      for (const rubric of RUBRICS) {
        let result;
        try { result = await judge(item, rubric); } catch (e) { result = { label: 'parse_error', confidence: 0, metric_error: 'unclear', rationale: e.message, parse_error: true, latency_ms: 0 }; }
        calls.push({ rubric: rubric.id, ...result });
      }
      const panel = [baseline, ...calls];
      const labels = panel.map((p) => p.label);
      const maj = majority(labels);
      const record = {
        schema: 'realrag.r4a.llm_judge_panel.record.v1',
        review_id: item.review_id,
        qid: item.qid,
        source: item.source,
        bucket: item.bucket,
        condition: item.condition,
        question: item.question,
        gold_answer: item.gold_answer,
        prediction: item.prediction,
        supporting_facts: item.supporting_facts || [],
        automatic_metrics: item.automatic_metrics,
        metric_state: item.metric_state,
        support: item.support,
        prior_local_judge: item.prior_local_judge || null,
        prior_ai_adjudication: item.prior_ai_adjudication || null,
        panel,
        panel_summary: {
          majority_label: maj,
          unique_labels: [...new Set(labels)],
          unanimous: new Set(labels).size === 1,
          positive_votes: labels.filter((l) => l === 'correct' || l === 'partial').length,
          negative_votes: labels.filter((l) => l === 'wrong').length,
          metric_error_majority: metricAgreement(item, maj),
        },
        adjudicated_at: new Date().toISOString(),
      };
      stream.write(JSON.stringify(record) + '\n');
      console.log(`${record.review_id} ${labels.join('/')} -> ${maj}`);
    }
  }
  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
  await new Promise((resolve) => stream.end(resolve));
  const records = readJsonl(outPath);
  const byBucket = {};
  const byMajority = {};
  for (const r of records) {
    byBucket[r.bucket] ||= { n: 0, unanimous: 0, metric_false_positive: 0, metric_false_negative: 0 };
    byBucket[r.bucket].n++;
    byBucket[r.bucket].unanimous += r.panel_summary.unanimous ? 1 : 0;
    byBucket[r.bucket].metric_false_positive += r.panel_summary.metric_error_majority === 'metric_false_positive' ? 1 : 0;
    byBucket[r.bucket].metric_false_negative += r.panel_summary.metric_error_majority === 'metric_false_negative' ? 1 : 0;
    byMajority[r.panel_summary.majority_label] = (byMajority[r.panel_summary.majority_label] || 0) + 1;
  }
  const summary = {
    schema: 'realrag.r4a.llm_judge_panel.summary.v1',
    status: records.length === items.length ? 'done' : 'partial',
    created_at: new Date().toISOString(),
    input: args.input,
    input_sha256: sha(fs.readFileSync(args.input)),
    endpoint_hash: sha(args.endpoint).slice(0, 16),
    model: args.model,
    served_model_id_hashes: served.map((id) => sha(id).slice(0, 16)),
    boundary: ['LLM-as-judge triage only', 'not human ground truth', 'not evidence-use proof'],
    records: records.length,
    rubrics: ['r3k_existing_local_judge', ...RUBRICS.map((r) => r.id)],
    byMajority,
    panel_disagreement: records.filter((r) => !r.panel_summary.unanimous).length,
    byBucket,
  };
  writeJson(path.join(args.outDir, 'summary.json'), summary);
  fs.writeFileSync(path.join(args.outDir, 'RESULTS.md'), `# RealRAG R4A — LLM judge panel\n\nStatus: ${summary.status}\nDate: 2026-05-21\n\nBoundary: LLM-as-judge triage only; not human ground truth; not evidence-use proof.\n\n\`\`\`txt\nrecords: ${summary.records}\nrubrics: ${summary.rubrics.join(', ')}\npanel disagreement: ${summary.panel_disagreement}\n\`\`\`\n\nUse this panel to select the blinded human-calibration subset.\n`);
  console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, records: summary.records, panel_disagreement: summary.panel_disagreement, byMajority }, null, 2));
}

main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
