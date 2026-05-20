#!/usr/bin/env node
/**
 * RealRAG R3E: human/independent adjudication packet.
 *
 * Builds a balanced review packet from R3C/R3D artifacts. The output is meant
 * for human or independent-judge labeling, not automatic publication of labels.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function parseArgs(argv) {
  const args = {
    r3cSamples: 'bench/evidence-utilization-realrag-hotpotqa-r3c-metric-audit-2026-05-20/samples.jsonl',
    r3dJudge: 'bench/evidence-utilization-realrag-hotpotqa-r3d-local-judge-2026-05-20/judge-records.jsonl',
    out: null,
    perCategory: 20,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--r3c-samples') args.r3cSamples = argv[++i];
    else if (a === '--r3d-judge') args.r3dJudge = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--per-category') args.perCategory = Number(argv[++i]);
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.out) throw new Error('--out is required');
  return args;
}
function usage() { console.log('Usage: node build-realrag-hotpotqa-r3e-human-adjudication-pack.mjs --out bench/...'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function readJsonl(p) { return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); }
function short(s, n = 900) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function taskKey(qid, condition) { return `${qid}\t${condition}`; }
function isJudgePositive(label, condition) { return ['correct', 'partial', 'metric_false_negative'].includes(label) || (condition === 'no_support' && label === 'prior_knowledge_or_leakage'); }
function categoryFor(j) {
  const metricClosed = !!j.metrics?.closure;
  const label = j.judge?.label || 'unknown';
  const positive = isJudgePositive(label, j.condition);
  if (j.condition === 'no_support' && label === 'prior_knowledge_or_leakage') return 'no_support_prior_or_leakage';
  if (metricClosed && !positive) return 'metric_closed_judge_negative';
  if (!metricClosed && positive) return 'metric_open_judge_positive';
  if (j.condition === 'no_support' && metricClosed) return 'no_support_metric_closed';
  if (j.condition === 'bge_rerank_top10' && label === 'wrong') return 'bge_wrong_support_present';
  if (j.condition === 'oracle_first' && label === 'wrong') return 'oracle_wrong_support_first';
  if (j.condition === 'bm25_top10' && label === 'wrong') return 'bm25_wrong_support_present';
  if (metricClosed && positive) return 'metric_closed_judge_positive_control';
  return 'metric_open_judge_negative_control';
}
function sampleDeterministic(rows, n) {
  return rows
    .slice()
    .sort((a, b) => sha256(`${a.qid}\t${a.condition}\t${a.review_category}`).localeCompare(sha256(`${b.qid}\t${b.condition}\t${b.review_category}`)))
    .slice(0, n);
}
function loadSampleIndex(samples) {
  const byKey = new Map();
  for (const s of samples) {
    for (const [condition, rec] of Object.entries(s.conditions || {})) {
      const key = taskKey(s.qid, condition);
      if (!byKey.has(key)) {
        byKey.set(key, {
          qid: s.qid,
          bucket_memberships: [],
          question: s.question,
          gold_answer: s.gold_answer,
          supporting_facts: s.supporting_facts,
          condition,
          condition_record: rec,
        });
      }
      byKey.get(key).bucket_memberships.push(s.bucket);
    }
  }
  return byKey;
}
function reviewRow(j, sampleInfo, idx) {
  const facts = (sampleInfo?.supporting_facts || j.supporting_facts || []).map(sf => ({ title: sf.title, sent_idx: sf.sent_idx, sentence: sf.sentence }));
  return {
    schema: 'realrag.hotpotqa.r3e.human_adjudication_item.v1',
    review_id: `r3e-${String(idx).padStart(4, '0')}`,
    review_status: 'unreviewed',
    human_label: '',
    human_confidence: '',
    human_notes: '',
    allowed_labels: ['correct', 'partial', 'wrong', 'ambiguous_dataset', 'metric_false_positive', 'metric_false_negative', 'prior_knowledge_or_leakage'],
    review_category: categoryFor(j),
    bucket_memberships: sampleInfo?.bucket_memberships || [],
    qid: j.qid,
    condition: j.condition,
    question: j.question,
    gold_answer: j.gold_answer,
    prediction: j.prediction,
    automatic_metrics: j.metrics,
    local_judge: j.judge,
    derived_metric_agreement: j.derived_metric_agreement,
    metric_risk: j.metric_risk,
    support: j.support,
    sentence_audit: j.sentence_audit,
    context_titles: j.context_titles,
    supporting_facts: facts,
    reviewer_instruction: 'Label the prediction against the question, gold answer, and supporting facts. Do not assume the local judge is correct.',
  };
}
function csvEscape(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function writeCsv(file, rows) {
  const cols = ['review_id', 'review_status', 'human_label', 'human_confidence', 'human_notes', 'review_category', 'qid', 'condition', 'question', 'gold_answer', 'prediction', 'metric_closure', 'local_judge_label', 'local_judge_rationale', 'derived_metric_agreement', 'bucket_memberships'];
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map(c => {
      if (c === 'metric_closure') return csvEscape(r.automatic_metrics?.closure ?? '');
      if (c === 'local_judge_label') return csvEscape(r.local_judge?.label ?? '');
      if (c === 'local_judge_rationale') return csvEscape(r.local_judge?.rationale ?? '');
      if (c === 'bucket_memberships') return csvEscape((r.bucket_memberships || []).join('|'));
      return csvEscape(r[c]);
    }).join(','));
  }
  fs.writeFileSync(file, lines.join('\n') + '\n');
}
function writeMarkdown(file, summary, rows) {
  const lines = [];
  lines.push('# RealRAG HotpotQA R3E — human/independent adjudication packet', '');
  lines.push('Status: **review packet generated; labels unreviewed**', '');
  lines.push('## Boundary', '');
  for (const b of summary.interpretation_boundary) lines.push(`- ${b}.`);
  lines.push('', '## Label schema', '');
  lines.push('- `correct` — prediction is semantically equivalent to the gold answer.');
  lines.push('- `partial` — prediction is related but incomplete/overbroad/underspecified.');
  lines.push('- `wrong` — prediction is not the answer.');
  lines.push('- `ambiguous_dataset` — question/gold/prediction conflict is genuinely ambiguous or alias-sensitive.');
  lines.push('- `metric_false_positive` — automatic closure counted it closed but reviewer says wrong.');
  lines.push('- `metric_false_negative` — automatic closure missed an acceptable answer.');
  lines.push('- `prior_knowledge_or_leakage` — no-support condition answered correctly/plausibly without support in prompt.');
  lines.push('', '## Category counts', '');
  lines.push('| category | selected | available |');
  lines.push('|---|---:|---:|');
  for (const c of summary.categories) lines.push(`| ${c.category} | ${c.selected} | ${c.available} |`);
  lines.push('', '## Review files', '');
  lines.push('- `review-items.jsonl` — canonical machine-readable packet with blank human labels.');
  lines.push('- `review-items.csv` — spreadsheet-friendly view with blank human labels.');
  lines.push('- `review-items.md` — readable packet for manual review.');
  lines.push('', '## Preview', '');
  for (const r of rows.slice(0, 20)) {
    lines.push(`### ${r.review_id} — ${r.review_category}`, '');
    lines.push(`- qid: \`${r.qid}\` / condition: \`${r.condition}\``);
    lines.push(`- question: ${r.question}`);
    lines.push(`- gold: \`${r.gold_answer}\``);
    lines.push(`- prediction: \`${short(r.prediction, 260)}\``);
    lines.push(`- metric closure: \`${r.automatic_metrics?.closure}\`; local judge: \`${r.local_judge?.label}\` — ${r.local_judge?.rationale || ''}`);
    lines.push(`- human_label: **UNREVIEWED**`, '');
  }
  fs.writeFileSync(file, lines.join('\n') + '\n');
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(args.out);
  const samplesRaw = fs.readFileSync(args.r3cSamples, 'utf8');
  const judgeRaw = fs.readFileSync(args.r3dJudge, 'utf8');
  const samples = samplesRaw.split('\n').filter(Boolean).map(JSON.parse);
  const judge = judgeRaw.split('\n').filter(Boolean).map(JSON.parse);
  const sampleIndex = loadSampleIndex(samples);
  const grouped = new Map();
  for (const j of judge) {
    const cat = categoryFor(j);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat).push(j);
  }
  const preferredCategories = [
    'metric_closed_judge_negative',
    'metric_open_judge_positive',
    'no_support_metric_closed',
    'no_support_prior_or_leakage',
    'bge_wrong_support_present',
    'oracle_wrong_support_first',
    'bm25_wrong_support_present',
    'metric_closed_judge_positive_control',
    'metric_open_judge_negative_control',
  ];
  const picked = [];
  const categories = [];
  for (const cat of preferredCategories) {
    const rows = grouped.get(cat) || [];
    const selected = sampleDeterministic(rows, args.perCategory);
    categories.push({ category: cat, available: rows.length, selected: selected.length });
    picked.push(...selected.map(j => ({ ...j, review_category: cat })));
  }
  const seen = new Set();
  const unique = [];
  for (const j of picked) {
    if (seen.has(j.key)) continue;
    seen.add(j.key);
    unique.push(j);
  }
  const rows = unique.map((j, i) => reviewRow(j, sampleIndex.get(j.key), i + 1));
  const summary = {
    schema: 'realrag.hotpotqa.r3e.human_adjudication_pack.summary.v1',
    created_at: new Date().toISOString(),
    r3c_samples_path: args.r3cSamples,
    r3c_samples_sha256: sha256(samplesRaw),
    r3d_judge_path: args.r3dJudge,
    r3d_judge_sha256: sha256(judgeRaw),
    source_sample_rows: samples.length,
    source_judge_records: judge.length,
    review_items: rows.length,
    per_category_requested: args.perCategory,
    categories,
    interpretation_boundary: [
      'review packet only; no human labels have been assigned',
      'local judge labels are included as triage hints, not ground truth',
      'designed for human or independent judge adjudication before broader claims',
      'do not treat R3E as additional benchmark evidence until reviewed',
    ],
  };
  fs.writeFileSync(path.join(args.out, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(args.out, 'review-items.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(path.join(args.out, 'review-items.json'), JSON.stringify(rows, null, 2));
  writeCsv(path.join(args.out, 'review-items.csv'), rows);
  writeMarkdown(path.join(args.out, 'review-items.md'), summary, rows);
  writeMarkdown(path.join(args.out, 'RESULTS.md'), summary, rows);
  console.log(JSON.stringify({ out: args.out, review_items: rows.length, categories }, null, 2));
}
main();
