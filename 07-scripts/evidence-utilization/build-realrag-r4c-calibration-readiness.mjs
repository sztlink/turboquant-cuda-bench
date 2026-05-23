#!/usr/bin/env node
/**
 * RealRAG R4C — calibration readiness.
 *
 * Consumes the deduplicated R4B-v2 human calibration batch and R4A panel
 * records. Produces:
 * - analysis of already-filled human labels vs panel/metrics
 * - prioritized queue for remaining rows, without requesting new review now
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = {
  batch: 'bench/evidence-utilization-realrag-r4b-v2-human-calibration-deduped-2026-05-21/human-calibration-batch.jsonl',
  panel: 'bench/evidence-utilization-realrag-r4a-llm-judge-panel-2026-05-21/panel-records.jsonl',
  outDir: 'bench/evidence-utilization-realrag-r4c-calibration-readiness-2026-05-21',
};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--batch') args.batch = process.argv[++i];
  else if (a === '--panel') args.panel = process.argv[++i];
  else if (a === '--out') args.outDir = process.argv[++i];
  else throw new Error(`unknown arg ${a}`);
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const readJsonl = (p) => fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const csvEscape = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const countBy = (rows, keyFn) => {
  const out = {};
  for (const row of rows) {
    const k = keyFn(row) ?? '';
    out[k] = (out[k] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
};
const isHumanFilled = (r) => ['human_label', 'human_confidence', 'human_notes', 'reviewer_id', 'reviewed_at'].some((k) => String(r[k] ?? '').trim() !== '');
const isHumanLabelFilled = (r) => String(r.human_label ?? '').trim() !== '';
const isPositiveLabel = (label) => label === 'correct' || label === 'partial';
const isNegativeLabel = (label) => label === 'wrong' || label === 'parse_error';
const metricClosed = (r) => Number(r.automatic_metrics?.closure ?? r.hidden_closure ?? 0) === 1;
const supportPresent = (r) => {
  if (r.support && typeof r.support.support_present === 'boolean') return r.support.support_present;
  return !String(r.hidden_bucket ?? r.bucket ?? '').includes('no_support');
};
const riskReasons = (row, panel) => {
  const bucket = row.hidden_bucket || panel.bucket;
  const condition = row.hidden_condition || panel.condition;
  const metricState = row.hidden_metric_state || panel.metric_state;
  const majority = row.hidden_panel_majority || panel.panel_summary.majority_label;
  const reasons = [];
  if (condition === 'no_support') reasons.push('no_support_condition');
  if (condition === 'no_support' && metricClosed(panel)) reasons.push('no_support_metric_closed');
  if (String(bucket).includes('no_support')) reasons.push('no_support_success_bucket');
  if (metricState === 'metric_open' && isPositiveLabel(majority)) reasons.push('metric_open_panel_positive');
  if (metricState === 'metric_closed' && !isPositiveLabel(majority)) reasons.push('metric_closed_panel_negative');
  if (!panel.panel_summary.unanimous) reasons.push('panel_disagreement');
  if ((panel.panel_summary.unique_labels || []).length >= 3) reasons.push('three_way_panel_split');
  if (panel.panel_summary.metric_error_majority !== 'none') reasons.push(`panel_metric_error_${panel.panel_summary.metric_error_majority}`);
  if (!supportPresent(panel)) reasons.push('support_absent');
  if (majority === 'partial') reasons.push('panel_partial');
  if (majority === 'parse_error') reasons.push('panel_parse_error');
  return reasons;
};
const priorityScore = (row, panel) => {
  const bucket = row.hidden_bucket || panel.bucket;
  const condition = row.hidden_condition || panel.condition;
  const metricState = row.hidden_metric_state || panel.metric_state;
  const majority = row.hidden_panel_majority || panel.panel_summary.majority_label;
  let score = Number(row.hidden_selection_score || 0);
  if (condition === 'no_support' && metricClosed(panel)) score += 12;
  if (String(bucket).includes('no_support')) score += 8;
  if (metricState === 'metric_open' && isPositiveLabel(majority)) score += 10;
  if (metricState === 'metric_closed' && !isPositiveLabel(majority)) score += 10;
  if (!panel.panel_summary.unanimous) score += 8;
  if ((panel.panel_summary.unique_labels || []).length >= 3) score += 5;
  if (panel.panel_summary.metric_error_majority !== 'none') score += 4;
  if (condition === 'no_support') score += 4;
  if (majority === 'partial' || majority === 'parse_error') score += 3;
  if (!supportPresent(panel)) score += 2;
  if ((row.hidden_dataset || '').includes('hotpotqa')) score += 2;
  return score;
};

const batch = readJsonl(args.batch);
const panelRecords = readJsonl(args.panel);
const panelByReviewId = new Map(panelRecords.map((r) => [r.review_id, r]));
fs.mkdirSync(args.outDir, { recursive: true });

const enriched = batch.map((row) => {
  const panel = panelByReviewId.get(row.hidden_source_review_id);
  if (!panel) throw new Error(`panel source not found: ${row.hidden_source_review_id}`);
  const humanLabel = String(row.human_label || '').trim();
  const panelMajority = panel.panel_summary.majority_label;
  const panelPositive = isPositiveLabel(panelMajority);
  const humanPositive = isPositiveLabel(humanLabel);
  const humanNegative = isNegativeLabel(humanLabel);
  const closure = metricClosed(panel);
  return { row, panel, humanLabel, panelMajority, panelPositive, humanPositive, humanNegative, closure };
});

const labeled = enriched.filter((x) => x.humanLabel);
const unlabeled = enriched.filter((x) => !x.humanLabel);
const labeledAnalysis = labeled.map((x) => {
  const { row, panel, humanLabel, panelMajority, panelPositive, humanPositive, humanNegative, closure } = x;
  const exactMatchPanel = humanLabel === panelMajority;
  const polarityMatchPanel = humanLabel === 'unclear' ? 'neutral' : String(humanPositive === panelPositive);
  const metricPolarity = closure ? 'closed' : 'open';
  const humanMetricRelation = humanLabel === 'unclear' ? 'neutral' : String((humanPositive && closure) || (humanNegative && !closure));
  return {
    r4_review_id: row.r4_review_id,
    source_review_id: row.hidden_source_review_id,
    dataset: row.hidden_dataset,
    condition: row.hidden_condition,
    bucket: row.hidden_bucket,
    metric_state: row.hidden_metric_state,
    human_label: humanLabel,
    human_confidence: row.human_confidence,
    human_notes: row.human_notes,
    panel_majority: panelMajority,
    panel_unanimous: panel.panel_summary.unanimous ? 'TRUE' : 'FALSE',
    panel_labels: panel.panel.map((p) => `${p.rubric}:${p.label}`).join(';'),
    metric_closure: closure ? 1 : 0,
    metric_em: panel.automatic_metrics?.em ?? '',
    metric_f1: panel.automatic_metrics?.f1 ?? '',
    exact_match_panel: exactMatchPanel ? 'TRUE' : 'FALSE',
    polarity_match_panel: polarityMatchPanel,
    metric_polarity: metricPolarity,
    human_metric_relation: humanMetricRelation,
    risk_reasons: riskReasons(row, panel).join(';'),
    question: row.question,
    gold_answer: row.gold_answer,
    model_answer: row.model_answer,
  };
});
const queue = unlabeled.map((x) => {
  const { row, panel } = x;
  const score = priorityScore(row, panel);
  return {
    priority_rank: 0,
    priority_score: score,
    r4_review_id: row.r4_review_id,
    source_review_id: row.hidden_source_review_id,
    dataset: row.hidden_dataset,
    condition: row.hidden_condition,
    bucket: row.hidden_bucket,
    metric_state: row.hidden_metric_state,
    panel_majority: panel.panel_summary.majority_label,
    panel_unanimous: panel.panel_summary.unanimous ? 'TRUE' : 'FALSE',
    panel_unique_labels: (panel.panel_summary.unique_labels || []).join(';'),
    panel_metric_error_majority: panel.panel_summary.metric_error_majority,
    metric_closure: metricClosed(panel) ? 1 : 0,
    metric_em: panel.automatic_metrics?.em ?? '',
    metric_f1: panel.automatic_metrics?.f1 ?? '',
    support_present: supportPresent(panel) ? 'TRUE' : 'FALSE',
    support_rank_min: panel.support?.support_rank_min ?? '',
    risk_reasons: riskReasons(row, panel).join(';'),
    question: row.question,
    gold_answer: row.gold_answer,
    model_answer: row.model_answer,
  };
}).sort((a, b) => b.priority_score - a.priority_score || a.r4_review_id.localeCompare(b.r4_review_id));
queue.forEach((r, i) => { r.priority_rank = i + 1; });

const labeledHeader = Object.keys(labeledAnalysis[0] || {
  r4_review_id: '', source_review_id: '', dataset: '', condition: '', bucket: '', metric_state: '', human_label: '', human_confidence: '', human_notes: '', panel_majority: '', panel_unanimous: '', panel_labels: '', metric_closure: '', metric_em: '', metric_f1: '', exact_match_panel: '', polarity_match_panel: '', metric_polarity: '', human_metric_relation: '', risk_reasons: '', question: '', gold_answer: '', model_answer: '',
});
const queueHeader = Object.keys(queue[0] || {
  priority_rank: '', priority_score: '', r4_review_id: '', source_review_id: '', dataset: '', condition: '', bucket: '', metric_state: '', panel_majority: '', panel_unanimous: '', panel_unique_labels: '', panel_metric_error_majority: '', metric_closure: '', metric_em: '', metric_f1: '', support_present: '', support_rank_min: '', risk_reasons: '', question: '', gold_answer: '', model_answer: '',
});
fs.writeFileSync(path.join(args.outDir, 'labeled-analysis.jsonl'), labeledAnalysis.map((r) => JSON.stringify(r)).join('\n') + (labeledAnalysis.length ? '\n' : ''));
fs.writeFileSync(path.join(args.outDir, 'labeled-analysis.csv'), [labeledHeader.join(','), ...labeledAnalysis.map((r) => labeledHeader.map((h) => csvEscape(r[h])).join(','))].join('\n') + '\n');
fs.writeFileSync(path.join(args.outDir, 'unlabeled-priority-queue.jsonl'), queue.map((r) => JSON.stringify(r)).join('\n') + (queue.length ? '\n' : ''));
fs.writeFileSync(path.join(args.outDir, 'unlabeled-priority-queue.csv'), [queueHeader.join(','), ...queue.map((r) => queueHeader.map((h) => csvEscape(r[h])).join(','))].join('\n') + '\n');

const summary = {
  schema: 'realrag.r4c.calibration_readiness.summary.v1',
  status: 'ready',
  created_at: new Date().toISOString(),
  batch: args.batch,
  batch_sha256: sha(fs.readFileSync(args.batch)),
  panel: args.panel,
  panel_sha256: sha(fs.readFileSync(args.panel)),
  rows: batch.length,
  unique_qid_hashes: new Set(batch.map((r) => r.hidden_qid_hash)).size,
  labeled_rows: labeled.length,
  unlabeled_rows: unlabeled.length,
  human_label_counts: countBy(labeledAnalysis, (r) => r.human_label),
  labeled_by_dataset: countBy(labeledAnalysis, (r) => r.dataset),
  labeled_by_condition: countBy(labeledAnalysis, (r) => r.condition),
  labeled_by_bucket: countBy(labeledAnalysis, (r) => r.bucket),
  panel_exact_agreement_on_labeled: {
    true: labeledAnalysis.filter((r) => r.exact_match_panel === 'TRUE').length,
    false: labeledAnalysis.filter((r) => r.exact_match_panel === 'FALSE').length,
  },
  panel_polarity_agreement_on_labeled: countBy(labeledAnalysis, (r) => r.polarity_match_panel),
  metric_relation_on_labeled: countBy(labeledAnalysis, (r) => r.human_metric_relation),
  queue_top_risk_reasons: countBy(queue.flatMap((r) => r.risk_reasons ? r.risk_reasons.split(';') : []).map((risk) => ({ risk })), (r) => r.risk),
  queue_top_20: queue.slice(0, 20).map((r) => ({ priority_rank: r.priority_rank, priority_score: r.priority_score, r4_review_id: r.r4_review_id, source_review_id: r.source_review_id, condition: r.condition, bucket: r.bucket, panel_majority: r.panel_majority, risk_reasons: r.risk_reasons })),
  files: ['labeled-analysis.csv', 'labeled-analysis.jsonl', 'unlabeled-priority-queue.csv', 'unlabeled-priority-queue.jsonl', 'summary.json', 'RESULTS.md'],
  boundary: ['readiness analysis only', 'no new human labels', 'does not convert LLM panel into ground truth', 'does not publish or mutate serving infrastructure'],
};
fs.writeFileSync(path.join(args.outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

const topQueue = queue.slice(0, 15).map((r) => `${String(r.priority_rank).padStart(2, '0')}. ${r.r4_review_id} score=${r.priority_score} ${r.condition} ${r.bucket} [${r.risk_reasons || 'no_extra_risk'}]`).join('\n');
fs.writeFileSync(path.join(args.outDir, 'RESULTS.md'), `# RealRAG R4C — calibration readiness\n\nStatus: ready\nDate: 2026-05-21\n\nBoundary: readiness analysis only. No new human labels, no public claim, no serving mutation.\n\n## Inputs\n\n\`\`\`txt\nbatch: ${args.batch}\npanel: ${args.panel}\n\`\`\`\n\n## Current calibration state\n\n\`\`\`txt\nrows: ${summary.rows}\nunique qid hashes: ${summary.unique_qid_hashes}\nlabeled rows: ${summary.labeled_rows}\nunlabeled rows: ${summary.unlabeled_rows}\n\`\`\`\n\nHuman label counts:\n\n\`\`\`json\n${JSON.stringify(summary.human_label_counts, null, 2)}\n\`\`\`\n\nPanel agreement on labeled rows:\n\n\`\`\`json\n${JSON.stringify({ exact: summary.panel_exact_agreement_on_labeled, polarity: summary.panel_polarity_agreement_on_labeled }, null, 2)}\n\`\`\`\n\nMetric relation on labeled rows:\n\n\`\`\`json\n${JSON.stringify(summary.metric_relation_on_labeled, null, 2)}\n\`\`\`\n\n## Prioritized remaining queue\n\nTop 15 unlabeled rows by risk/readiness score:\n\n\`\`\`txt\n${topQueue}\n\`\`\`\n\n## Files\n\n\`\`\`txt\nlabeled-analysis.csv\nlabeled-analysis.jsonl\nunlabeled-priority-queue.csv\nunlabeled-priority-queue.jsonl\nsummary.json\nRESULTS.md\n\`\`\`\n`);
console.log(JSON.stringify({ outDir: args.outDir, status: summary.status, rows: summary.rows, labeled_rows: summary.labeled_rows, unlabeled_rows: summary.unlabeled_rows, top_queue: summary.queue_top_20.slice(0, 5) }, null, 2));
