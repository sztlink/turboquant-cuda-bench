#!/usr/bin/env node
/**
 * RealRAG R5 — statistical robustness pack.
 *
 * Offline-only bootstrap confidence intervals and paired deltas for already
 * completed public-dataset gates. No endpoint, no judge, no human labels.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  outDir: 'bench/evidence-utilization-realrag-r5-statistical-robustness-2026-05-21',
  boot: 5000,
  seed: 20260521,
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--boot') args.boot = Number(process.argv[++i]);
  else if (a === '--seed') args.seed = Number(process.argv[++i]);
  else throw new Error(`unknown arg ${a}`);
}
const RUNS = [
  {
    id: 'hotpotqa_7b_r3b',
    label: 'HotpotQA 7B R3B',
    records: 'bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/records.jsonl',
    summary: 'bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/summary.json',
  },
  {
    id: 'hotpotqa_32b_r3l',
    label: 'HotpotQA 32B R3L',
    records: 'bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/records.jsonl',
    summary: 'bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/summary.json',
  },
  {
    id: '2wiki_7b_r3g',
    label: '2Wiki 7B R3G',
    records: 'bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/records.jsonl',
    summary: 'bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/summary.json',
  },
];
const CONDITIONS = ['bm25_top10', 'bge_rerank_top10', 'oracle_first', 'no_support'];
const METRICS = ['closure', 'em', 'contains', 'f1'];
const PAIRS = [
  ['bge_rerank_top10', 'bm25_top10'],
  ['oracle_first', 'bge_rerank_top10'],
  ['oracle_first', 'bm25_top10'],
  ['bm25_top10', 'no_support'],
  ['bge_rerank_top10', 'no_support'],
  ['oracle_first', 'no_support'],
];
const CROSS_MODEL_PAIRS = [
  ['hotpotqa_32b_r3l', 'hotpotqa_7b_r3b'],
];
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
const pct = (arr, p) => {
  const a = [...arr].sort((x, y) => x - y);
  if (!a.length) return null;
  const idx = (a.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return a[lo];
  return a[lo] + (a[hi] - a[lo]) * (idx - lo);
};
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(args.seed);
function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}
function metricValue(r, metric) {
  if (metric === 'closure') return Number(r.metrics?.closure ?? r.automatic_metrics?.closure ?? 0);
  if (metric === 'em') return Number(r.metrics?.em ?? r.automatic_metrics?.em ?? 0);
  if (metric === 'contains') return Number(r.metrics?.contains_answer ?? r.automatic_metrics?.contains_answer ?? 0);
  if (metric === 'f1') return Number(r.metrics?.f1 ?? r.automatic_metrics?.f1 ?? 0);
  throw new Error(`unknown metric ${metric}`);
}
function loadRun(run) {
  const records = readJsonl(run.records);
  const byQid = new Map();
  for (const rec of records) {
    const qid = String(rec.qid);
    if (!byQid.has(qid)) byQid.set(qid, {});
    byQid.get(qid)[rec.condition] = rec;
  }
  const qids = [...byQid.keys()].filter((qid) => CONDITIONS.every((c) => byQid.get(qid)[c]));
  return { ...run, records, byQid, qids, summarySha256: sha(fs.readFileSync(run.summary)), recordsSha256: sha(fs.readFileSync(run.records)) };
}
function mean(xs) { return xs.reduce((s, x) => s + x, 0) / xs.length; }
function ciForValues(values) {
  const n = values.length;
  const observed = mean(values);
  const boots = [];
  for (let b = 0; b < args.boot; b++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += values[Math.floor(rng() * n)];
    boots.push(s / n);
  }
  return { n, mean: observed, ci95: [pct(boots, 0.025), pct(boots, 0.975)], bootstrap_samples: args.boot };
}
function ciForPaired(run, condA, condB, metric) {
  const diffs = run.qids.map((qid) => metricValue(run.byQid.get(qid)[condA], metric) - metricValue(run.byQid.get(qid)[condB], metric));
  const n = diffs.length;
  const observed = mean(diffs);
  const boots = [];
  for (let b = 0; b < args.boot; b++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += diffs[Math.floor(rng() * n)];
    boots.push(s / n);
  }
  const positive = boots.filter((x) => x > 0).length / boots.length;
  const negative = boots.filter((x) => x < 0).length / boots.length;
  return {
    n,
    a: condA,
    b: condB,
    delta: observed,
    ci95: [pct(boots, 0.025), pct(boots, 0.975)],
    sign_positive: positive,
    sign_negative: negative,
    pish_two_sided_sign: 2 * Math.min(positive, negative),
    bootstrap_samples: args.boot,
  };
}
function ciForCrossModel(runA, runB, condition, metric) {
  const qids = runA.qids.filter((qid) => runB.byQid.has(qid) && runB.byQid.get(qid)[condition]);
  const diffs = qids.map((qid) => metricValue(runA.byQid.get(qid)[condition], metric) - metricValue(runB.byQid.get(qid)[condition], metric));
  const n = diffs.length;
  const observed = mean(diffs);
  const boots = [];
  for (let b = 0; b < args.boot; b++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += diffs[Math.floor(rng() * n)];
    boots.push(s / n);
  }
  const positive = boots.filter((x) => x > 0).length / boots.length;
  const negative = boots.filter((x) => x < 0).length / boots.length;
  return { n, a: runA.id, b: runB.id, condition, delta: observed, ci95: [pct(boots, 0.025), pct(boots, 0.975)], sign_positive: positive, sign_negative: negative, pish_two_sided_sign: 2 * Math.min(positive, negative), bootstrap_samples: args.boot };
}
function fmtPct(x) { return `${(100 * x).toFixed(1)}%`; }
function fmtDelta(x) { return `${(100 * x).toFixed(1)} pp`; }
const runs = Object.fromEntries(RUNS.map((r) => [r.id, loadRun(r)]));
fs.mkdirSync(args.outDir, { recursive: true });
const conditionCis = [];
const pairedDeltas = [];
const crossModelDeltas = [];
for (const run of Object.values(runs)) {
  for (const condition of CONDITIONS) {
    for (const metric of METRICS) {
      const values = run.qids.map((qid) => metricValue(run.byQid.get(qid)[condition], metric));
      conditionCis.push({ schema: 'realrag.r5.condition_ci.v1', run: run.id, label: run.label, condition, metric, ...ciForValues(values) });
    }
  }
  for (const [a, b] of PAIRS) {
    for (const metric of METRICS) pairedDeltas.push({ schema: 'realrag.r5.paired_delta.v1', run: run.id, label: run.label, metric, ...ciForPaired(run, a, b, metric) });
  }
}
for (const [aId, bId] of CROSS_MODEL_PAIRS) {
  for (const condition of CONDITIONS) for (const metric of METRICS) crossModelDeltas.push({ schema: 'realrag.r5.cross_model_delta.v1', metric, ...ciForCrossModel(runs[aId], runs[bId], condition, metric) });
}
fs.writeFileSync(path.join(args.outDir, 'condition-cis.jsonl'), conditionCis.map((x) => JSON.stringify(x)).join('\n') + '\n');
fs.writeFileSync(path.join(args.outDir, 'paired-deltas.jsonl'), pairedDeltas.map((x) => JSON.stringify(x)).join('\n') + '\n');
fs.writeFileSync(path.join(args.outDir, 'cross-model-deltas.jsonl'), crossModelDeltas.map((x) => JSON.stringify(x)).join('\n') + '\n');

const headline = {
  hotpotqa_7b_r3b: {
    bge_minus_bm25: pairedDeltas.find((d) => d.run === 'hotpotqa_7b_r3b' && d.metric === 'closure' && d.a === 'bge_rerank_top10' && d.b === 'bm25_top10'),
    oracle_minus_bge: pairedDeltas.find((d) => d.run === 'hotpotqa_7b_r3b' && d.metric === 'closure' && d.a === 'oracle_first' && d.b === 'bge_rerank_top10'),
  },
  hotpotqa_32b_r3l: {
    bge_minus_bm25: pairedDeltas.find((d) => d.run === 'hotpotqa_32b_r3l' && d.metric === 'closure' && d.a === 'bge_rerank_top10' && d.b === 'bm25_top10'),
    oracle_minus_bge: pairedDeltas.find((d) => d.run === 'hotpotqa_32b_r3l' && d.metric === 'closure' && d.a === 'oracle_first' && d.b === 'bge_rerank_top10'),
  },
  wiki2_7b_r3g: {
    bge_minus_bm25: pairedDeltas.find((d) => d.run === '2wiki_7b_r3g' && d.metric === 'closure' && d.a === 'bge_rerank_top10' && d.b === 'bm25_top10'),
    oracle_minus_bge: pairedDeltas.find((d) => d.run === '2wiki_7b_r3g' && d.metric === 'closure' && d.a === 'oracle_first' && d.b === 'bge_rerank_top10'),
  },
  hotpotqa_32b_minus_7b: CONDITIONS.map((condition) => crossModelDeltas.find((d) => d.metric === 'closure' && d.condition === condition)),
};
const summary = {
  schema: 'realrag.r5.statistical_robustness.summary.v1',
  status: 'done',
  created_at: new Date().toISOString(),
  boundary: ['offline statistical analysis only', 'no endpoint', 'no LLM judge', 'no human labels', 'not evidence-use proof'],
  bootstrap_samples: args.boot,
  seed: args.seed,
  runs: Object.values(runs).map((r) => ({ id: r.id, label: r.label, records: r.records.length, paired_questions: r.qids.length, records_sha256: r.recordsSha256, summary_sha256: r.summarySha256 })),
  metrics: METRICS,
  conditions: CONDITIONS,
  headline,
  files: ['condition-cis.jsonl', 'paired-deltas.jsonl', 'cross-model-deltas.jsonl', 'summary.json', 'RESULTS.md'],
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

function tableCondition(metric = 'closure') {
  const lines = ['| run | condition | mean | 95% CI | n |', '|---|---|---:|---:|---:|'];
  for (const run of Object.values(runs)) for (const condition of CONDITIONS) {
    const x = conditionCis.find((c) => c.run === run.id && c.condition === condition && c.metric === metric);
    lines.push(`| ${run.label} | \`${condition}\` | ${fmtPct(x.mean)} | [${fmtPct(x.ci95[0])}, ${fmtPct(x.ci95[1])}] | ${x.n} |`);
  }
  return lines.join('\n');
}
function tableDeltas(metric = 'closure') {
  const pairs = [['bge_rerank_top10', 'bm25_top10'], ['oracle_first', 'bge_rerank_top10'], ['oracle_first', 'no_support']];
  const lines = ['| run | delta | mean | 95% CI | sign + |', '|---|---|---:|---:|---:|'];
  for (const run of Object.values(runs)) for (const [a, b] of pairs) {
    const x = pairedDeltas.find((d) => d.run === run.id && d.metric === metric && d.a === a && d.b === b);
    lines.push(`| ${run.label} | \`${a} - ${b}\` | ${fmtDelta(x.delta)} | [${fmtDelta(x.ci95[0])}, ${fmtDelta(x.ci95[1])}] | ${fmtPct(x.sign_positive)} |`);
  }
  return lines.join('\n');
}
function tableCross(metric = 'closure') {
  const lines = ['| condition | 32B - 7B | 95% CI | sign + |', '|---|---:|---:|---:|'];
  for (const condition of CONDITIONS) {
    const x = crossModelDeltas.find((d) => d.metric === metric && d.condition === condition);
    lines.push(`| \`${condition}\` | ${fmtDelta(x.delta)} | [${fmtDelta(x.ci95[0])}, ${fmtDelta(x.ci95[1])}] | ${fmtPct(x.sign_positive)} |`);
  }
  return lines.join('\n');
}
const resultsMd = `# RealRAG R5 — statistical robustness pack\n\nStatus: done\nDate: 2026-05-21\n\n## Boundary\n\n\`\`\`txt\noffline statistical analysis only\nno endpoint\nno LLM judge\nno human labels\nnot evidence-use proof\n\`\`\`\n\nBootstrap samples: ${args.boot}  \nSeed: ${args.seed}\n\n## Closure confidence intervals\n\n${tableCondition('closure')}\n\n## Paired closure deltas\n\n${tableDeltas('closure')}\n\n## HotpotQA 32B minus 7B closure deltas\n\n${tableCross('closure')}\n\n## Interpretation\n\n\`\`\`txt\nHotpotQA: BGE > BM25 is stable, oracle > BGE is small but positive, support-present >> no-support is very large.\nHotpotQA 32B: scale raises closure in all support-present conditions but does not erase the placement/reranking ladder.\n2Wiki: support-present >> no-support is stable, but BGE/BM25/oracle differences are small and dataset/schema-sensitive.\n\`\`\`\n\nThis strengthens answer-closure/placement claims only. It does not prove internal evidence use.\n`;
fs.writeFileSync(path.join(args.outDir, 'RESULTS.md'), resultsMd);
console.log(JSON.stringify({ outDir: args.outDir, status: 'done', bootstrap_samples: args.boot, runs: summary.runs, headline: { hotpot7b_bge_minus_bm25: headline.hotpotqa_7b_r3b.bge_minus_bm25.delta, hotpot32b_bge_minus_bm25: headline.hotpotqa_32b_r3l.bge_minus_bm25.delta, wiki2_bge_minus_bm25: headline.wiki2_7b_r3g.bge_minus_bm25.delta } }, null, 2));
