#!/usr/bin/env node
/**
 * RealRAG R4B — build blinded human-calibration batch for Google Sheets.
 *
 * Input: R4A LLM judge panel. Output: 150-row review batch CSV/JSONL plus
 * instructions and a machine summary. LLM labels/conditions are placed in
 * hidden-trailing columns for sheet import; humans should judge visible columns
 * first.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  input: 'bench/evidence-utilization-realrag-r4a-llm-judge-panel-2026-05-21/panel-records.jsonl',
  outDir: 'bench/evidence-utilization-realrag-r4b-human-calibration-batch-2026-05-21',
  n: 150,
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--input') args.input = process.argv[++i];
  else if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--n') args.n = Number(process.argv[++i]);
  else throw new Error(`unknown arg ${a}`);
}
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const readJsonl = (p) => fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const csvEscape = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const labelPositive = (l) => l === 'correct' || l === 'partial';
function datasetOf(r) { return String(r.source || '').includes('2wiki') ? '2wiki' : 'hotpotqa'; }
function facts(r) { return (r.supporting_facts || []).slice(0, 4).map((f) => `[${f.title ?? ''}] ${f.sentence ?? ''}`); }
function score(r) {
  const labels = r.panel.map((p) => p.label);
  let s = 0;
  if (!r.panel_summary.unanimous) s += 6;
  if (r.panel_summary.metric_error_majority !== 'none') s += 5;
  if (labels.includes('parse_error')) s += 2;
  if (r.condition === 'no_support' && Number(r.automatic_metrics?.closure || 0) === 1) s += 5;
  if (r.bucket?.includes('no_support')) s += 4;
  if (r.bucket?.includes('metric_open') || r.bucket?.includes('metric_closed')) s += 3;
  if (r.panel_summary.unique_labels.length >= 3) s += 3;
  if (r.panel.some((p) => p.label === 'partial')) s += 2;
  if (r.support?.support_present === false) s += 2;
  if (r.metric_state === 'metric_open' && labelPositive(r.panel_summary.majority_label)) s += 3;
  if (r.metric_state === 'metric_closed' && !labelPositive(r.panel_summary.majority_label)) s += 3;
  return s;
}
function choose(records, n) {
  const sorted = records.map((r) => ({ r, score: score(r) })).sort((a, b) => b.score - a.score || a.r.review_id.localeCompare(b.r.review_id));
  const selected = [];
  const seen = new Set();
  const counts = { dataset: {}, condition: {}, bucket: {}, metricState: {}, majority: {} };
  const add = (x, phase) => {
    if (seen.has(x.r.review_id) || selected.length >= n) return false;
    seen.add(x.r.review_id);
    x.phase = phase;
    selected.push(x);
    const r = x.r;
    counts.dataset[datasetOf(r)] = (counts.dataset[datasetOf(r)] || 0) + 1;
    counts.condition[r.condition] = (counts.condition[r.condition] || 0) + 1;
    counts.bucket[r.bucket] = (counts.bucket[r.bucket] || 0) + 1;
    counts.metricState[r.metric_state] = (counts.metricState[r.metric_state] || 0) + 1;
    counts.majority[r.panel_summary.majority_label] = (counts.majority[r.panel_summary.majority_label] || 0) + 1;
    return true;
  };
  // 1) all high-value disagreement / metric-error cases, capped by bucket.
  for (const x of sorted) {
    const r = x.r;
    if (x.score < 7) continue;
    if ((counts.bucket[r.bucket] || 0) >= 28) continue;
    add(x, 'high_value');
  }
  // 2) force coverage for dataset x condition cells.
  for (const ds of ['hotpotqa', '2wiki']) {
    for (const cond of ['bm25_top10', 'bge_rerank_top10', 'oracle_first', 'no_support']) {
      const cell = sorted.filter((x) => datasetOf(x.r) === ds && x.r.condition === cond && !seen.has(x.r.review_id));
      for (const x of cell.slice(0, 12)) add(x, 'stratified_cell');
    }
  }
  // 3) fill with next highest value while avoiding only one bucket dominating.
  for (const x of sorted) {
    if (selected.length >= n) break;
    if ((counts.bucket[x.r.bucket] || 0) >= 35) continue;
    add(x, 'fill_high_score');
  }
  for (const x of sorted) {
    if (selected.length >= n) break;
    add(x, 'final_fill');
  }
  return selected.slice(0, n);
}
const records = readJsonl(args.input);
const selected = choose(records, args.n);
fs.mkdirSync(args.outDir, { recursive: true });
const header = [
  'r4_review_id', 'question', 'gold_answer', 'model_answer', 'support_fact_1', 'support_fact_2', 'support_fact_3', 'support_fact_4',
  'human_label', 'human_confidence', 'human_notes', 'reviewer_id', 'reviewed_at',
  'hidden_source_review_id', 'hidden_dataset', 'hidden_bucket', 'hidden_condition', 'hidden_metric_state', 'hidden_em', 'hidden_f1', 'hidden_closure',
  'hidden_panel_majority', 'hidden_panel_unanimous', 'hidden_panel_labels', 'hidden_metric_error_majority', 'hidden_selection_score', 'hidden_selection_phase', 'hidden_qid_hash'
];
const rows = selected.map((x, i) => {
  const r = x.r;
  const fs4 = facts(r);
  while (fs4.length < 4) fs4.push('');
  return {
    r4_review_id: `r4b-${String(i + 1).padStart(4, '0')}`,
    question: r.question,
    gold_answer: r.gold_answer,
    model_answer: r.prediction,
    support_fact_1: fs4[0],
    support_fact_2: fs4[1],
    support_fact_3: fs4[2],
    support_fact_4: fs4[3],
    human_label: '',
    human_confidence: '',
    human_notes: '',
    reviewer_id: '',
    reviewed_at: '',
    hidden_source_review_id: r.review_id,
    hidden_dataset: datasetOf(r),
    hidden_bucket: r.bucket,
    hidden_condition: r.condition,
    hidden_metric_state: r.metric_state,
    hidden_em: r.automatic_metrics?.em ?? '',
    hidden_f1: r.automatic_metrics?.f1 ?? '',
    hidden_closure: r.automatic_metrics?.closure ?? '',
    hidden_panel_majority: r.panel_summary.majority_label,
    hidden_panel_unanimous: r.panel_summary.unanimous ? 'TRUE' : 'FALSE',
    hidden_panel_labels: r.panel.map((p) => `${p.rubric}:${p.label}`).join(';'),
    hidden_metric_error_majority: r.panel_summary.metric_error_majority,
    hidden_selection_score: x.score,
    hidden_selection_phase: x.phase,
    hidden_qid_hash: sha(r.qid).slice(0, 16),
  };
});
fs.writeFileSync(path.join(args.outDir, 'human-calibration-batch.csv'), [header.join(','), ...rows.map((row) => header.map((h) => csvEscape(row[h])).join(','))].join('\n') + '\n');
fs.writeFileSync(path.join(args.outDir, 'human-calibration-batch.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
const counts = { dataset: {}, condition: {}, bucket: {}, metricState: {}, panelMajority: {}, selectionPhase: {} };
for (const row of rows) {
  for (const [k, field] of Object.entries({ dataset: 'hidden_dataset', condition: 'hidden_condition', bucket: 'hidden_bucket', metricState: 'hidden_metric_state', panelMajority: 'hidden_panel_majority', selectionPhase: 'hidden_selection_phase' })) {
    counts[k][row[field]] = (counts[k][row[field]] || 0) + 1;
  }
}
const instructions = `# RealRAG R4B — human calibration instructions\n\nJudge whether the model answer answers the question. Use the gold answer and support facts as reference.\n\nDo **not** judge whether the model internally used the evidence.\n\nAllowed labels:\n\n- correct — semantically answers the question\n- partial — contains a useful but incomplete/ambiguous answer\n- wrong — does not answer correctly or contradicts the answer\n- parse_error — invalid/truncated/non-answer output\n- unclear — cannot decide from the provided information\n\nRecommended confidence: 1 low / 2 medium / 3 high.\n\nVisible columns should be judged first. Hidden columns contain condition/metric/LLM panel metadata for analysis after review.\n`;
fs.writeFileSync(path.join(args.outDir, 'INSTRUCTIONS.md'), instructions);
const summary = {
  schema: 'realrag.r4b.human_calibration_batch.summary.v1',
  status: rows.length === args.n ? 'ready' : 'partial',
  created_at: new Date().toISOString(),
  input: args.input,
  input_sha256: sha(fs.readFileSync(args.input)),
  requested_n: args.n,
  selected_n: rows.length,
  boundary: ['human calibration batch', 'LLM panel used only for triage', 'condition and automatic labels should remain hidden from reviewer'],
  counts,
  files: ['human-calibration-batch.csv', 'human-calibration-batch.jsonl', 'INSTRUCTIONS.md'],
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
fs.writeFileSync(path.join(args.outDir, 'RESULTS.md'), `# RealRAG R4B — human calibration batch\n\nStatus: ${summary.status}\nDate: 2026-05-21\n\n\`\`\`txt\nselected rows: ${rows.length}\nsource records: ${records.length}\n\`\`\`\n\nFiles:\n\n\`\`\`txt\nhuman-calibration-batch.csv\nhuman-calibration-batch.jsonl\nINSTRUCTIONS.md\nsummary.json\n\`\`\`\n\nThe batch is designed for Google Sheets. Visible columns come first; condition/metric/LLM metadata columns are trailing hidden_* fields and should be hidden before review.\n`);
console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, selected_n: rows.length, counts }, null, 2));
