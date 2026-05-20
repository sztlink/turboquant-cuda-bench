#!/usr/bin/env node
/**
 * RealRAG R1: HotpotQA distractor answer-closure under evidence placement.
 *
 * Purpose: test whether public multi-hop QA exhibits an answer-closure gap
 * when gold supporting evidence is present but placed/ranked differently.
 *
 * This is a read-only benchmark against an existing OpenAI-compatible endpoint.
 * It does not patch/restart/deploy vLLM and does not use EPKV runtime hooks.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_ENDPOINT = process.env.REALRAG_ENDPOINT || 'http://192.168.15.133:11435/v1/chat/completions';
const DEFAULT_MODEL = process.env.REALRAG_MODEL || 'local-vllm';
const DEFAULT_DATASET = process.env.REALRAG_HOTPOTQA_PATH || path.join(process.cwd(), 'bench', '_datasets', 'hotpot_dev_distractor_v1.json');
const CONDITIONS = ['oracle_first', 'oracle_last', 'bm25_retrieved', 'distractor_first', 'no_support'];

function parseArgs(argv) {
  const args = {
    dataset: DEFAULT_DATASET,
    out: null,
    limit: 20,
    offset: 0,
    seed: 20260520,
    endpoint: DEFAULT_ENDPOINT,
    model: DEFAULT_MODEL,
    concurrency: 1,
    maxParagraphs: 10,
    maxTokens: 32,
    timeoutMs: 120000,
    retries: 2,
    conditions: CONDITIONS,
    stopOnNoSupportLeak: false,
    noSupportLeakAbortRate: 0.45,
    logEvery: 10,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') args.dataset = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--offset') args.offset = Number(argv[++i]);
    else if (a === '--seed') args.seed = Number(argv[++i]);
    else if (a === '--endpoint') args.endpoint = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--max-paragraphs') args.maxParagraphs = Number(argv[++i]);
    else if (a === '--max-tokens') args.maxTokens = Number(argv[++i]);
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
    else if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--conditions') args.conditions = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--stop-on-no-support-leak') args.stopOnNoSupportLeak = true;
    else if (a === '--no-support-leak-abort-rate') args.noSupportLeakAbortRate = Number(argv[++i]);
    else if (a === '--log-every') args.logEvery = Number(argv[++i]);
    else if (a === '--help' || a === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`unknown arg: ${a}`);
    }
  }
  if (!args.out) throw new Error('--out is required');
  for (const c of args.conditions) if (!CONDITIONS.includes(c)) throw new Error(`unknown condition: ${c}`);
  args.concurrency = Math.max(1, Math.min(8, Math.trunc(args.concurrency || 1)));
  return args;
}

function usage() {
  console.log(`Usage:
node 07-scripts/evidence-utilization/run-realrag-hotpotqa-r1.mjs \\
  --dataset bench/_datasets/hotpot_dev_distractor_v1.json \\
  --out bench/evidence-utilization-realrag-hotpotqa-r1-YYYY-MM-DD \\
  --limit 300 --concurrency 2
`);
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledIndices(n, seed) {
  const arr = Array.from({ length: n }, (_, i) => i);
  const rnd = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(s) {
  const n = normText(s);
  return n ? n.split(' ') : [];
}

function f1(pred, gold) {
  const p = tokenize(pred);
  const g = tokenize(gold);
  if (!p.length && !g.length) return 1;
  if (!p.length || !g.length) return 0;
  const counts = new Map();
  for (const tok of g) counts.set(tok, (counts.get(tok) || 0) + 1);
  let common = 0;
  for (const tok of p) {
    const c = counts.get(tok) || 0;
    if (c > 0) { common++; counts.set(tok, c - 1); }
  }
  if (common === 0) return 0;
  const prec = common / p.length;
  const rec = common / g.length;
  return 2 * prec * rec / (prec + rec);
}

function exact(pred, gold) {
  return normText(pred) === normText(gold) ? 1 : 0;
}

function containsAnswer(pred, gold) {
  const p = normText(pred);
  const g = normText(gold);
  if (!g) return 0;
  if (g === 'yes' || g === 'no') return p.split(/\s+/).includes(g) ? 1 : 0;
  return p.includes(g) ? 1 : 0;
}

function cleanPrediction(s) {
  return String(s || '')
    .replace(/^\s*(final answer|answer|resposta)\s*[:：-]\s*/i, '')
    .split('\n')[0]
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .slice(0, 300);
}

function paragraphRecords(item) {
  const supportTitleSet = new Set((item.supporting_facts || []).map(sf => String(sf[0])));
  return (item.context || []).map(([title, sentences], idx) => {
    const text = Array.isArray(sentences) ? sentences.join(' ') : String(sentences || '');
    return {
      idx,
      title: String(title),
      text,
      isSupport: supportTitleSet.has(String(title)),
    };
  });
}

function bm25Order(question, paragraphs) {
  const docs = paragraphs.map(p => tokenize(`${p.title} ${p.text}`));
  const q = tokenize(question).filter(t => t.length > 1);
  const N = docs.length || 1;
  const df = new Map();
  for (const doc of docs) {
    for (const t of new Set(doc)) df.set(t, (df.get(t) || 0) + 1);
  }
  const avgdl = docs.reduce((a, d) => a + d.length, 0) / N || 1;
  const k1 = 1.2;
  const b = 0.75;
  return paragraphs.map((p, i) => {
    const doc = docs[i];
    const tf = new Map();
    for (const t of doc) tf.set(t, (tf.get(t) || 0) + 1);
    let score = 0;
    for (const t of q) {
      const f = tf.get(t) || 0;
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) || 0) + 0.5) / ((df.get(t) || 0) + 0.5));
      score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * doc.length / avgdl));
    }
    return { p, score };
  }).sort((a, b) => b.score - a.score || a.p.idx - b.p.idx).map(x => x.p);
}

function orderForCondition(item, condition, maxParagraphs) {
  const paras = paragraphRecords(item);
  const support = paras.filter(p => p.isSupport);
  const distractors = paras.filter(p => !p.isSupport);
  const bm25 = bm25Order(item.question, paras);
  const bm25Distractors = bm25.filter(p => !p.isSupport);
  let ordered;
  if (condition === 'oracle_first') ordered = [...support, ...distractors];
  else if (condition === 'oracle_last') ordered = [...distractors, ...support];
  else if (condition === 'bm25_retrieved') ordered = bm25;
  else if (condition === 'distractor_first') ordered = [...bm25Distractors.slice(0, 6), ...support, ...bm25Distractors.slice(6)];
  else if (condition === 'no_support') ordered = [...bm25Distractors];
  else throw new Error(`unknown condition: ${condition}`);
  const seen = new Set();
  const deduped = [];
  for (const p of ordered) {
    if (seen.has(p.idx)) continue;
    seen.add(p.idx);
    deduped.push(p);
  }
  return deduped.slice(0, maxParagraphs);
}

function promptFor(item, condition, ordered) {
  const context = ordered.map((p, i) => `[${i + 1}] ${p.title}\n${p.text}`).join('\n\n');
  return [
    { role: 'system', content: 'You answer questions using only the provided context. Return the shortest correct answer string. If the answer is not in the context, answer UNKNOWN.' },
    { role: 'user', content: `Question: ${item.question}\n\nContext:\n${context}\n\nReturn only the answer.` },
  ];
}

function supportStats(ordered) {
  const ranks = ordered.map((p, i) => p.isSupport ? i + 1 : null).filter(Boolean);
  return {
    support_present: ranks.length > 0,
    support_rank_min: ranks.length ? Math.min(...ranks) : null,
    support_rank_all: ranks,
    support_count: ranks.length,
  };
}

async function postChat(args, messages) {
  const payload = {
    model: args.model,
    messages,
    temperature: 0,
    top_p: 1,
    max_tokens: args.maxTokens,
  };
  let lastErr;
  for (let attempt = 0; attempt <= args.retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), args.timeoutMs);
    try {
      const res = await fetch(args.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
      const j = JSON.parse(text);
      return {
        raw_response: j,
        response_text: j.choices?.[0]?.message?.content ?? '',
        usage: j.usage || null,
        finish_reason: j.choices?.[0]?.finish_reason || null,
        attempts: attempt + 1,
      };
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
  const lines = fs.readFileSync(recordsPath, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const r = JSON.parse(line);
      done.add(`${r.qid}\t${r.condition}`);
    } catch {}
  }
  return done;
}

function aggregate(records) {
  const byCondition = {};
  const byRankBucket = {};
  for (const r of records) {
    const c = r.condition;
    byCondition[c] ||= { n: 0, em: 0, f1: 0, contains: 0, closure: 0, supportPresent: 0, errors: 0 };
    const b = byCondition[c];
    b.n++;
    b.em += r.metrics?.em || 0;
    b.f1 += r.metrics?.f1 || 0;
    b.contains += r.metrics?.contains_answer || 0;
    b.closure += r.metrics?.closure || 0;
    b.supportPresent += r.support?.support_present ? 1 : 0;
    b.errors += r.error ? 1 : 0;
    const rank = r.support?.support_rank_min;
    const bucket = rank == null ? 'none' : rank === 1 ? '1' : rank <= 3 ? '2-3' : rank <= 8 ? '4-8' : '>8';
    const key = `${c}:${bucket}`;
    byRankBucket[key] ||= { condition: c, bucket, n: 0, closure: 0, f1: 0 };
    byRankBucket[key].n++;
    byRankBucket[key].closure += r.metrics?.closure || 0;
    byRankBucket[key].f1 += r.metrics?.f1 || 0;
  }
  for (const obj of Object.values(byCondition)) {
    for (const k of ['em', 'f1', 'contains', 'closure', 'supportPresent', 'errors']) obj[k] = obj.n ? obj[k] / obj.n : 0;
  }
  for (const obj of Object.values(byRankBucket)) {
    obj.closure = obj.n ? obj.closure / obj.n : 0;
    obj.f1 = obj.n ? obj.f1 / obj.n : 0;
  }
  return { byCondition, byRankBucket: Object.values(byRankBucket).sort((a, b) => a.condition.localeCompare(b.condition) || a.bucket.localeCompare(b.bucket)) };
}

function readRecords(recordsPath) {
  if (!fs.existsSync(recordsPath)) return [];
  return fs.readFileSync(recordsPath, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function writeSummary(outDir, args, records, selectedItems, startedAt, finishedAt, status = 'running') {
  const agg = aggregate(records);
  const by = agg.byCondition;
  const deltas = {};
  function rate(c) { return by[c]?.closure ?? null; }
  if (rate('oracle_first') != null && rate('oracle_last') != null) deltas.oracle_first_minus_oracle_last = rate('oracle_first') - rate('oracle_last');
  if (rate('oracle_first') != null && rate('no_support') != null) deltas.oracle_first_minus_no_support = rate('oracle_first') - rate('no_support');
  if (rate('oracle_first') != null && rate('bm25_retrieved') != null) deltas.oracle_first_minus_bm25_retrieved = rate('oracle_first') - rate('bm25_retrieved');
  const summary = {
    schema: 'realrag.hotpotqa.r1.summary.v1',
    status,
    started_at: startedAt,
    finished_at: finishedAt || null,
    endpoint: args.endpoint,
    model: args.model,
    dataset_path: args.dataset,
    dataset_sha256: fs.existsSync(args.dataset) ? sha256(fs.readFileSync(args.dataset)) : null,
    limit: args.limit,
    offset: args.offset,
    seed: args.seed,
    conditions: args.conditions,
    selected_questions: selectedItems.length,
    expected_records: selectedItems.length * args.conditions.length,
    completed_records: records.length,
    aggregate: agg,
    deltas,
    interpretation_boundary: [
      'public HotpotQA distractor evidence-placement benchmark',
      'answer closure is EM/contains/F1 over gold answers, not proof of model evidence use',
      'no runtime hook, no serving mutation, no attention claim',
    ],
  };
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}

function writeResults(outDir, summary) {
  const lines = [];
  lines.push('# RealRAG HotpotQA R1 — evidence placement and answer closure');
  lines.push('');
  lines.push(`Status: **${summary.status}**`);
  lines.push(`Started: ${summary.started_at}`);
  lines.push(`Finished: ${summary.finished_at || 'running'}`);
  lines.push('');
  lines.push('## Boundary');
  lines.push('');
  lines.push('- Public HotpotQA distractor benchmark, not a synthetic in-house fixture.');
  lines.push('- Measures answer closure over gold answers (EM/contains/F1), not proof of model evidence use.');
  lines.push('- No EPKV runtime hook, no vLLM patch/restart/deploy, no attention claim.');
  lines.push('');
  lines.push('## Conditions');
  lines.push('');
  lines.push('- `oracle_first`: gold supporting paragraphs first, then distractors.');
  lines.push('- `oracle_last`: distractors first, gold supporting paragraphs last.');
  lines.push('- `bm25_retrieved`: lexical BM25 order over HotpotQA candidate paragraphs.');
  lines.push('- `distractor_first`: top BM25 distractors first, then gold support.');
  lines.push('- `no_support`: gold supporting paragraphs removed.');
  lines.push('');
  lines.push('## Aggregate');
  lines.push('');
  lines.push('| condition | n | closure | EM | contains | F1 | support present | error rate |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const [condition, v] of Object.entries(summary.aggregate.byCondition)) {
    lines.push(`| ${condition} | ${v.n} | ${(v.closure * 100).toFixed(1)}% | ${(v.em * 100).toFixed(1)}% | ${(v.contains * 100).toFixed(1)}% | ${(v.f1 * 100).toFixed(1)}% | ${(v.supportPresent * 100).toFixed(1)}% | ${(v.errors * 100).toFixed(1)}% |`);
  }
  lines.push('');
  lines.push('## Paired closure deltas');
  lines.push('');
  for (const [k, v] of Object.entries(summary.deltas)) lines.push(`- ${k}: ${(v * 100).toFixed(1)} pp`);
  lines.push('');
  lines.push('## Rank buckets');
  lines.push('');
  lines.push('| condition | support rank bucket | n | closure | F1 |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const r of summary.aggregate.byRankBucket) {
    lines.push(`| ${r.condition} | ${r.bucket} | ${r.n} | ${(r.closure * 100).toFixed(1)}% | ${(r.f1 * 100).toFixed(1)}% |`);
  }
  lines.push('');
  lines.push('## Files');
  lines.push('');
  lines.push('- `records.jsonl` — per question/condition record.');
  lines.push('- `summary.json` — machine-readable aggregate.');
  lines.push('- `run.log` — run log.');
  fs.writeFileSync(path.join(outDir, 'RESULTS.md'), lines.join('\n') + '\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  ensureDir(args.out);
  ensureDir(path.join(args.out, 'samples'));
  const recordsPath = path.join(args.out, 'records.jsonl');
  const logPath = path.join(args.out, 'run.log');
  const log = (line) => {
    const msg = `[${new Date().toISOString()}] ${line}`;
    console.log(msg);
    fs.appendFileSync(logPath, msg + '\n');
  };

  log(`REALRAG_R1_START model=${args.model} endpoint=${args.endpoint} limit=${args.limit} concurrency=${args.concurrency}`);
  if (!fs.existsSync(args.dataset)) throw new Error(`dataset missing: ${args.dataset}`);
  const raw = fs.readFileSync(args.dataset, 'utf8');
  const dataset = JSON.parse(raw);
  log(`dataset_loaded records=${dataset.length} sha256=${sha256(raw)}`);

  const indices = shuffledIndices(dataset.length, args.seed).slice(args.offset, args.offset + args.limit);
  const selectedItems = indices.map(i => dataset[i]).filter(item => {
    const paras = paragraphRecords(item);
    return item?._id && item.question && item.answer && paras.some(p => p.isSupport) && paras.some(p => !p.isSupport);
  });
  fs.writeFileSync(path.join(args.out, 'selected-ids.json'), JSON.stringify(selectedItems.map(x => x._id), null, 2));

  const tasks = [];
  for (const item of selectedItems) {
    for (const condition of args.conditions) tasks.push({ item, condition });
  }
  const done = loadDone(recordsPath);
  const pending = tasks.filter(t => !done.has(`${t.item._id}\t${t.condition}`));
  log(`selected_questions=${selectedItems.length} tasks=${tasks.length} pending=${pending.length} already_done=${done.size}`);

  let completed = done.size;
  let noSupportDone = 0;
  let noSupportClosure = 0;

  async function runTask(task) {
    const { item, condition } = task;
    const ordered = orderForCondition(item, condition, args.maxParagraphs);
    const support = supportStats(ordered);
    const messages = promptFor(item, condition, ordered);
    const promptText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const base = {
      schema: 'realrag.hotpotqa.r1.record.v1',
      qid: item._id,
      question: item.question,
      gold_answer: item.answer,
      condition,
      paragraph_count: ordered.length,
      context_titles: ordered.map(p => p.title),
      support,
      prompt_sha256: sha256(promptText),
      created_at: new Date().toISOString(),
    };
    try {
      const t0 = Date.now();
      const response = await postChat(args, messages);
      const latencyMs = Date.now() - t0;
      const pred = cleanPrediction(response.response_text);
      const metrics = {
        em: exact(pred, item.answer),
        f1: f1(pred, item.answer),
        contains_answer: containsAnswer(pred, item.answer),
      };
      metrics.closure = (metrics.em || metrics.contains_answer || metrics.f1 >= 0.8) ? 1 : 0;
      const rec = {
        ...base,
        prediction: pred,
        raw_response_text: response.response_text,
        metrics,
        latency_ms: latencyMs,
        usage: response.usage,
        finish_reason: response.finish_reason,
        attempts: response.attempts,
      };
      fs.appendFileSync(recordsPath, JSON.stringify(rec) + '\n');
      if (condition === 'no_support') {
        noSupportDone++;
        noSupportClosure += metrics.closure;
      }
      return rec;
    } catch (err) {
      const rec = { ...base, error: String(err?.stack || err), metrics: { em: 0, f1: 0, contains_answer: 0, closure: 0 } };
      fs.appendFileSync(recordsPath, JSON.stringify(rec) + '\n');
      return rec;
    }
  }

  let cursor = 0;
  async function worker(id) {
    while (cursor < pending.length) {
      const task = pending[cursor++];
      const rec = await runTask(task);
      completed++;
      if (completed % args.logEvery === 0 || completed === tasks.length) {
        const records = readRecords(recordsPath);
        const summary = writeSummary(args.out, args, records, selectedItems, startedAt, null, 'running');
        writeResults(args.out, summary);
        log(`progress completed=${completed}/${tasks.length} last=${rec.qid}/${rec.condition} closure=${rec.metrics?.closure ?? 0}`);
      }
      if (args.stopOnNoSupportLeak && noSupportDone >= 20) {
        const leakRate = noSupportClosure / noSupportDone;
        if (leakRate > args.noSupportLeakAbortRate) {
          throw new Error(`abort: no_support closure leak rate ${(leakRate * 100).toFixed(1)}% > ${(args.noSupportLeakAbortRate * 100).toFixed(1)}%`);
        }
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: args.concurrency }, (_, i) => worker(i + 1)));
    const finishedAt = new Date().toISOString();
    const records = readRecords(recordsPath);
    const summary = writeSummary(args.out, args, records, selectedItems, startedAt, finishedAt, 'done');
    writeResults(args.out, summary);
    log(`REALRAG_R1_DONE completed=${records.length}/${tasks.length}`);
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const records = readRecords(recordsPath);
    const summary = writeSummary(args.out, args, records, selectedItems, startedAt, finishedAt, 'failed');
    writeResults(args.out, summary);
    fs.writeFileSync(path.join(args.out, 'ERROR.md'), `# RealRAG R1 failed\n\n\`\`\`\n${String(err?.stack || err)}\n\`\`\`\n`);
    log(`REALRAG_R1_FAILED ${String(err?.message || err)}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
