#!/usr/bin/env node
/**
 * RealRAG R4B-v2 — deduplicated human-calibration batch.
 *
 * Builds a 150-row blinded adjudication batch with one row per question/qid.
 * If a previous Google Sheet snapshot is provided/fetched, already-filled
 * human_* review fields are preserved by hidden_source_review_id.
 *
 * Default inputs target the 2026-05-21 R4A/R4B artifacts.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { homedir } from 'node:os';

const args = {
  input: 'bench/evidence-utilization-realrag-r4a-llm-judge-panel-2026-05-21/panel-records.jsonl',
  previous: 'bench/evidence-utilization-realrag-r4b-human-calibration-batch-2026-05-21/human-calibration-batch.jsonl',
  outDir: 'bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21',
  n: 150,
  sheetId: '',
  sheetRange: 'adjudication_batch!A1:AB151',
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--input') args.input = process.argv[++i];
  else if (a === '--previous') args.previous = process.argv[++i];
  else if (a === '--out') args.outDir = process.argv[++i];
  else if (a === '--n') args.n = Number(process.argv[++i]);
  else if (a === '--sheet-id') args.sheetId = process.argv[++i];
  else if (a === '--sheet-range') args.sheetRange = process.argv[++i];
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
function panelSorted(records) {
  return records.map((r) => ({ r, score: score(r) })).sort((a, b) => b.score - a.score || a.r.review_id.localeCompare(b.r.review_id));
}
function rowHasHumanWork(row) {
  return ['human_label', 'human_confidence', 'human_notes', 'reviewer_id', 'reviewed_at'].some((k) => String(row[k] ?? '').trim() !== '');
}
function parseSheetValues(values) {
  if (!values || values.length === 0) return [];
  const header = values[0];
  return values.slice(1).filter((r) => r.some((v) => String(v ?? '').trim() !== '')).map((r, idx) => {
    const obj = { __sheet_row_index: idx + 2 };
    for (let i = 0; i < header.length; i++) obj[header[i]] = r[i] ?? '';
    return obj;
  });
}
async function fetchSheetRows(spreadsheetId, range) {
  const { google } = await import('/home/aya/.pi/agent/skills/aya/aya-google-drive/node_modules/googleapis/build/src/index.js');
  const credentialsPath = path.join(homedir(), '.pi', 'agent', 'credentials', 'aya-dashboard-55a83a9e7716.json');
  const key = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return { values: res.data.values || [], rows: parseSheetValues(res.data.values || []) };
}

const header = [
  'r4_review_id', 'question', 'gold_answer', 'model_answer', 'support_fact_1', 'support_fact_2', 'support_fact_3', 'support_fact_4',
  'human_label', 'human_confidence', 'human_notes', 'reviewer_id', 'reviewed_at',
  'hidden_source_review_id', 'hidden_dataset', 'hidden_bucket', 'hidden_condition', 'hidden_metric_state', 'hidden_em', 'hidden_f1', 'hidden_closure',
  'hidden_panel_majority', 'hidden_panel_unanimous', 'hidden_panel_labels', 'hidden_metric_error_majority', 'hidden_selection_score', 'hidden_selection_phase', 'hidden_qid_hash'
];
function makeRow(r, selectionScore, selectionPhase, human = {}) {
  const fs4 = facts(r);
  while (fs4.length < 4) fs4.push('');
  return {
    r4_review_id: '',
    question: r.question,
    gold_answer: r.gold_answer,
    model_answer: r.prediction,
    support_fact_1: fs4[0],
    support_fact_2: fs4[1],
    support_fact_3: fs4[2],
    support_fact_4: fs4[3],
    human_label: human.human_label ?? '',
    human_confidence: human.human_confidence ?? '',
    human_notes: human.human_notes ?? '',
    reviewer_id: human.reviewer_id ?? '',
    reviewed_at: human.reviewed_at ?? '',
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
    hidden_selection_score: selectionScore,
    hidden_selection_phase: selectionPhase,
    hidden_qid_hash: sha(r.qid).slice(0, 16),
  };
}

fs.mkdirSync(args.outDir, { recursive: true });
const records = readJsonl(args.input);
const recordByReviewId = new Map(records.map((r) => [r.review_id, r]));
let previousRows = readJsonl(args.previous);
let sheetValues = [];
if (args.sheetId) {
  const fetched = await fetchSheetRows(args.sheetId, args.sheetRange);
  sheetValues = fetched.values;
  previousRows = fetched.rows;
  fs.writeFileSync(path.join(args.outDir, 'source-sheet-snapshot.json'), JSON.stringify({
    schema: 'realrag.r4b_v2.source_sheet_snapshot.v1',
    fetched_at: new Date().toISOString(),
    spreadsheetId: args.sheetId,
    range: args.sheetRange,
    values: sheetValues,
  }, null, 2) + '\n');
}

const bySourceHuman = new Map();
for (const row of previousRows) {
  const source = row.hidden_source_review_id;
  if (!source) continue;
  bySourceHuman.set(source, {
    human_label: row.human_label ?? '',
    human_confidence: row.human_confidence ?? '',
    human_notes: row.human_notes ?? '',
    reviewer_id: row.reviewer_id ?? '',
    reviewed_at: row.reviewed_at ?? '',
  });
}
const previousGroups = new Map();
previousRows.forEach((row, idx) => {
  const key = row.hidden_qid_hash || sha(recordByReviewId.get(row.hidden_source_review_id)?.qid ?? row.question).slice(0, 16);
  if (!previousGroups.has(key)) previousGroups.set(key, []);
  previousGroups.get(key).push({ row, idx });
});
const duplicateGroups = [...previousGroups.entries()].filter(([, rs]) => rs.length > 1);
const keptPrevious = [];
const removedDuplicates = [];
for (const [qidHash, group] of previousGroups.entries()) {
  const sorted = [...group].sort((a, b) => Number(rowHasHumanWork(b.row)) - Number(rowHasHumanWork(a.row)) || a.idx - b.idx);
  const keep = sorted[0];
  keptPrevious.push(keep);
  for (const rem of sorted.slice(1)) {
    removedDuplicates.push({
      reason: 'duplicate_qid',
      hidden_qid_hash: qidHash,
      removed_r4_review_id: rem.row.r4_review_id,
      removed_source_review_id: rem.row.hidden_source_review_id,
      removed_human_label: rem.row.human_label ?? '',
      kept_r4_review_id: keep.row.r4_review_id,
      kept_source_review_id: keep.row.hidden_source_review_id,
      kept_human_label: keep.row.human_label ?? '',
      question: rem.row.question,
    });
  }
}
keptPrevious.sort((a, b) => a.idx - b.idx);
const selectedRows = [];
const selectedQidHashes = new Set();
const selectedSourceIds = new Set();
const addPanelRecord = (r, selectionScore, phase, human = {}) => {
  const qidHash = sha(r.qid).slice(0, 16);
  if (selectedQidHashes.has(qidHash)) return false;
  selectedQidHashes.add(qidHash);
  selectedSourceIds.add(r.review_id);
  selectedRows.push(makeRow(r, selectionScore, phase, human));
  return true;
};
for (const item of keptPrevious) {
  const r = recordByReviewId.get(item.row.hidden_source_review_id);
  if (!r) throw new Error(`previous row source not found in panel: ${item.row.hidden_source_review_id}`);
  addPanelRecord(r, Number(item.row.hidden_selection_score || score(r)), 'r4b_v1_preserved_deduped', bySourceHuman.get(r.review_id) || {});
}
for (const x of panelSorted(records)) {
  if (selectedRows.length >= args.n) break;
  addPanelRecord(x.r, x.score, 'r4b_v2_fill_high_score', bySourceHuman.get(x.r.review_id) || {});
}
if (selectedRows.length !== args.n) throw new Error(`could only build ${selectedRows.length}/${args.n} rows`);
selectedRows.forEach((row, i) => { row.r4_review_id = `r4b-v2-${String(i + 1).padStart(4, '0')}`; });

const counts = { dataset: {}, condition: {}, bucket: {}, metricState: {}, panelMajority: {}, selectionPhase: {} };
for (const row of selectedRows) {
  for (const [k, field] of Object.entries({ dataset: 'hidden_dataset', condition: 'hidden_condition', bucket: 'hidden_bucket', metricState: 'hidden_metric_state', panelMajority: 'hidden_panel_majority', selectionPhase: 'hidden_selection_phase' })) {
    counts[k][row[field]] = (counts[k][row[field]] || 0) + 1;
  }
}
const preservedHumanRows = selectedRows.filter(rowHasHumanWork).length;
const filledHumanLabels = selectedRows.filter((r) => String(r.human_label ?? '').trim() !== '').length;
fs.writeFileSync(path.join(args.outDir, 'human-calibration-batch.csv'), [header.join(','), ...selectedRows.map((row) => header.map((h) => csvEscape(row[h])).join(','))].join('\n') + '\n');
fs.writeFileSync(path.join(args.outDir, 'human-calibration-batch.jsonl'), selectedRows.map((r) => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(path.join(args.outDir, 'dedupe-report.json'), JSON.stringify({
  schema: 'realrag.r4b_v2.dedupe_report.v1',
  created_at: new Date().toISOString(),
  previous_rows: previousRows.length,
  previous_duplicate_qid_groups: duplicateGroups.length,
  previous_duplicate_rows_in_groups: duplicateGroups.reduce((acc, [, rs]) => acc + rs.length, 0),
  removed_duplicate_rows: removedDuplicates.length,
  preserved_previous_rows_after_dedupe: keptPrevious.length,
  fill_rows_added: selectedRows.filter((r) => r.hidden_selection_phase === 'r4b_v2_fill_high_score').length,
  preserved_human_work_rows: preservedHumanRows,
  preserved_human_label_rows: filledHumanLabels,
  removed_duplicates: removedDuplicates,
}, null, 2) + '\n');
const instructions = `# RealRAG R4B-v2 — human calibration instructions\n\nThis is the deduplicated R4B batch. Each question/qid appears at most once. Previously filled human labels from the first R4B sheet were preserved where the source row remained the representative row.\n\nJudge whether the model answer answers the question. Use the gold answer and support facts as reference.\n\nDo **not** judge whether the model internally used the evidence.\n\nAllowed labels:\n\n- correct — semantically answers the question\n- partial — contains a useful but incomplete/ambiguous answer\n- wrong — does not answer correctly or contradicts the answer\n- parse_error — invalid/truncated/non-answer output\n- unclear — cannot decide from the provided information\n\nRecommended confidence: 1 low / 2 medium / 3 high.\n\nVisible columns should be judged first. Hidden columns contain condition/metric/LLM panel metadata for analysis after review.\n`;
fs.writeFileSync(path.join(args.outDir, 'INSTRUCTIONS.md'), instructions);
const summary = {
  schema: 'realrag.r4b_v2.human_calibration_batch.summary.v1',
  status: 'ready',
  created_at: new Date().toISOString(),
  input: args.input,
  input_sha256: sha(fs.readFileSync(args.input)),
  previous: args.previous,
  previous_sheet_id: args.sheetId || null,
  requested_n: args.n,
  selected_n: selectedRows.length,
  unique_qid_hashes: new Set(selectedRows.map((r) => r.hidden_qid_hash)).size,
  removed_duplicate_rows: removedDuplicates.length,
  fill_rows_added: selectedRows.filter((r) => r.hidden_selection_phase === 'r4b_v2_fill_high_score').length,
  preserved_human_work_rows: preservedHumanRows,
  preserved_human_label_rows: filledHumanLabels,
  boundary: ['deduplicated human calibration batch', 'one row per question/qid', 'preserves already-filled human_* fields from sheet', 'LLM panel used only for triage'],
  counts,
  files: ['human-calibration-batch.csv', 'human-calibration-batch.jsonl', 'INSTRUCTIONS.md', 'summary.json', 'dedupe-report.json'],
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
fs.writeFileSync(path.join(args.outDir, 'RESULTS.md'), `# RealRAG R4B-v2 — deduplicated human calibration batch\n\nStatus: ${summary.status}\nDate: 2026-05-21\n\n\`\`\`txt\nselected rows: ${selectedRows.length}\nunique qid hashes: ${summary.unique_qid_hashes}\nremoved duplicate rows: ${summary.removed_duplicate_rows}\nfill rows added: ${summary.fill_rows_added}\npreserved human label rows: ${summary.preserved_human_label_rows}\nsource records: ${records.length}\n\`\`\`\n\nFiles:\n\n\`\`\`txt\nhuman-calibration-batch.csv\nhuman-calibration-batch.jsonl\nINSTRUCTIONS.md\nsummary.json\ndedupe-report.json\n\`\`\`\n\nVisible columns come first; condition/metric/LLM metadata columns are trailing hidden_* fields and should be hidden before review.\n`);
console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, selected_n: selectedRows.length, unique_qid_hashes: summary.unique_qid_hashes, removed_duplicate_rows: summary.removed_duplicate_rows, fill_rows_added: summary.fill_rows_added, preserved_human_label_rows: summary.preserved_human_label_rows, counts }, null, 2));
