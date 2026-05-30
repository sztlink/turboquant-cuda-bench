#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const defaultOutDir = path.dirname(new URL(import.meta.url).pathname);
const sprint = 'bench/epkv-live-probe-v0-2026-05-21/sprint-12h';

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

function resolvePath(p) {
  return path.isAbsolute(p) ? p : path.join(root, p);
}

const llmPath = resolvePath(argValue('--llm-summary', path.join(sprint, 'entity-hop-llm-500/summary.json')));
const gatedPath = resolvePath(argValue('--gated-summary', path.join(sprint, 'entity-hop-answer-rerank-gated-v1-500/summary.json')));
const outDir = resolvePath(argValue('--out-dir', defaultOutDir));
const prefix = argValue('--prefix', 'n500');

const llm = JSON.parse(fs.readFileSync(llmPath, 'utf8'));
const gated = JSON.parse(fs.readFileSync(gatedPath, 'utf8'));
const gatedByIdx = new Map(gated.rows.map(r => [r.idx, r]));

function norm(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isRefusalLike(s) {
  const x = norm(s);
  if (!x) return true;
  return [
    'unknown',
    'not mentioned',
    'not provided',
    'does not provide',
    'do not provide',
    'cannot determine',
    'not enough information',
    'insufficient information',
    'no information',
    'the passage does not',
    'the passages do not',
    'not specified',
    'not stated'
  ].some(p => x.includes(p));
}

function containsNorm(a, b) {
  const na = norm(a);
  const nb = norm(b);
  return Boolean(na && nb && (na.includes(nb) || nb.includes(na)));
}

function bucketByQuestion(q) {
  const x = norm(q);
  if (x.startsWith('who')) return 'who';
  if (x.startsWith('what')) return 'what';
  if (x.startsWith('where')) return 'where';
  if (x.startsWith('when')) return 'when';
  if (x.startsWith('which')) return 'which';
  if (x.startsWith('how')) return 'how';
  return 'other';
}

function score(obj) {
  return {
    em: Number(obj?.em ?? 0),
    contains: Number(obj?.contains ?? 0),
    f1: Number(obj?.f1 ?? 0),
    output: obj?.output ?? ''
  };
}

function classify(row, grow) {
  const pathScore = score(row.conditions?.entity_hop_path_prompt);
  const strongScore = score(row.conditions?.entity_hop_strong);
  const gatedSource = grow?.gated_rerank_v1 ?? grow?.rerank ?? {};
  const gatedScore = score(gatedSource);
  const rerankScore = score(grow?.rerank);
  const bgeScore = score(row.bge_ref);
  const candidates = grow?.candidates ?? [];

  const pathSolved = pathScore.em === 1;
  const pathContains = pathScore.contains === 1;
  const pathHighF1 = pathScore.f1 >= 0.75;
  const pathRefusal = isRefusalLike(pathScore.output);
  const answerPresent = Boolean(row.answer_string_present_in_docs);
  const supportTitleRecall = Number(row.support_title_recall ?? 0);
  const fullSupportRecall = Number(row.full_support_recall ?? 0);
  const candidateHasGold = candidates.some(c => containsNorm(c, row.gold));
  const pathOutputInCandidates = candidates.some(c => containsNorm(c, pathScore.output));
  const strongSolved = strongScore.em === 1;
  const bgeSolved = bgeScore.em === 1;
  const rerankSolved = rerankScore.em === 1;
  const gatedSolved = gatedScore.em === 1;

  const flags = [];
  if (answerPresent) flags.push('answer_string_present');
  else flags.push('answer_string_absent');
  if (supportTitleRecall === 0) flags.push('no_support_title_recall');
  else if (supportTitleRecall < 1) flags.push('partial_support_title_recall');
  else flags.push('full_support_title_recall');
  if (fullSupportRecall === 1) flags.push('full_support_recall');
  else flags.push('incomplete_full_support');
  if (candidateHasGold) flags.push('candidate_has_gold');
  if (pathOutputInCandidates) flags.push('path_output_in_candidates');
  if (pathRefusal) flags.push('path_refusal_like');
  if (strongSolved && !pathSolved) flags.push('strong_solved_path_failed');
  if (!strongSolved && pathSolved) flags.push('path_solved_strong_failed');

  let primary;
  if (pathSolved) primary = 'solved_by_path_prompt';
  else if (pathContains || pathHighF1) primary = 'answer_extraction_or_scoring_artifact';
  else if (pathRefusal) primary = 'model_refusal_or_unknown';
  else if (!answerPresent) primary = 'retrieval_answer_absent';
  else if (fullSupportRecall === 1) primary = 'evidence_present_not_closed';
  else if (supportTitleRecall > 0) primary = 'partial_path_schema_or_support_miss';
  else if (answerPresent) primary = 'path_schema_miss_answer_present_elsewhere';
  else primary = 'uncategorized';

  let controlOutcome = 'tie';
  if (gatedScore.f1 > pathScore.f1 + 1e-9) controlOutcome = 'gated_f1_win';
  else if (gatedScore.f1 < pathScore.f1 - 1e-9) controlOutcome = 'gated_f1_loss';

  let controlEmOutcome = 'tie';
  if (gatedScore.em > pathScore.em) controlEmOutcome = 'gated_em_win';
  else if (gatedScore.em < pathScore.em) controlEmOutcome = 'gated_em_loss';

  return {
    idx: row.idx,
    qid: row.qid,
    question: row.question,
    question_type: bucketByQuestion(row.question),
    gold: row.gold,
    primary_path_status: primary,
    flags,
    support_title_recall: supportTitleRecall,
    full_support_recall: fullSupportRecall,
    answer_string_present_in_docs: answerPresent,
    path_prompt: pathScore,
    strong: strongScore,
    bge_ref: bgeScore,
    rerank: rerankScore,
    gated_rerank_v1: {
      ...gatedScore,
      used_verifier: Boolean(grow?.gated_rerank_v1?.used_verifier),
      rule: grow?.gated_rerank_v1?.rule ?? (grow?.gated_rerank_v1 ? null : 'rerank_as_comparison')
    },
    candidate_has_gold: candidateHasGold,
    path_output_in_candidates: pathOutputInCandidates,
    candidates_count: candidates.length,
    selected_titles: row.selected_titles,
    support_titles: row.support_titles,
    control_outcome_f1: controlOutcome,
    control_outcome_em: controlEmOutcome,
    disagree: Boolean(grow?.disagree)
  };
}

const records = llm.rows.map(row => {
  const grow = gatedByIdx.get(row.idx);
  if (!grow) throw new Error(`Missing gated row for idx ${row.idx}`);
  return classify(row, grow);
});

function countBy(arr, fn) {
  const out = new Map();
  for (const item of arr) {
    const k = fn(item);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return Object.fromEntries([...out.entries()].sort((a,b) => b[1]-a[1] || String(a[0]).localeCompare(String(b[0]))));
}

function mean(arr, fn) {
  if (!arr.length) return 0;
  return arr.reduce((a,b)=>a+Number(fn(b)||0),0)/arr.length;
}

const failures = records.filter(r => r.primary_path_status !== 'solved_by_path_prompt');
const solved = records.filter(r => r.primary_path_status === 'solved_by_path_prompt');
const overrides = records.filter(r => r.gated_rerank_v1.used_verifier);
const candidateGoldFailures = failures.filter(r => r.candidate_has_gold);
const answerPresentFailures = failures.filter(r => r.answer_string_present_in_docs);
const fullSupportFailures = failures.filter(r => r.full_support_recall === 1);
const partialSupportFailures = failures.filter(r => r.support_title_recall > 0 && r.full_support_recall < 1);
const controlWins = records.filter(r => r.control_outcome_em === 'gated_em_win');
const controlLosses = records.filter(r => r.control_outcome_em === 'gated_em_loss');

const summary = {
  schema: 'epkv.control_eligibility.n500_autopsy.v0',
  source: {
    llm_summary: path.relative(root, llmPath),
    gated_summary: path.relative(root, gatedPath)
  },
  total: records.length,
  path_prompt: {
    em_successes: solved.length,
    em_failures: failures.length,
    em: solved.length / records.length,
    contains: mean(records, r => r.path_prompt.contains),
    f1: mean(records, r => r.path_prompt.f1)
  },
  primary_path_status_counts: countBy(records, r => r.primary_path_status),
  failure_primary_status_counts: countBy(failures, r => r.primary_path_status),
  failure_question_type_counts: countBy(failures, r => r.question_type),
  signal_counts: {
    failures_answer_string_present: answerPresentFailures.length,
    failures_answer_string_absent: failures.length - answerPresentFailures.length,
    failures_full_support_recall: fullSupportFailures.length,
    failures_partial_support_title_recall: failures.filter(r => r.support_title_recall > 0 && r.support_title_recall < 1).length,
    failures_no_support_title_recall: failures.filter(r => r.support_title_recall === 0).length,
    failures_candidate_has_gold: candidateGoldFailures.length,
    failures_model_refusal_like: failures.filter(r => r.flags.includes('path_refusal_like')).length,
    failures_strong_solved_path_failed: failures.filter(r => r.flags.includes('strong_solved_path_failed')).length
  },
  retrieval_means: {
    all_support_title_recall: mean(records, r => r.support_title_recall),
    all_full_support_recall: mean(records, r => r.full_support_recall),
    failures_support_title_recall: mean(failures, r => r.support_title_recall),
    failures_full_support_recall: mean(failures, r => r.full_support_recall),
    successes_support_title_recall: mean(solved, r => r.support_title_recall),
    successes_full_support_recall: mean(solved, r => r.full_support_recall)
  },
  gated_control: {
    rule_counts: countBy(records, r => r.gated_rerank_v1.rule ?? 'none'),
    overrides: overrides.length,
    em_wins: controlWins.length,
    em_losses: controlLosses.length,
    em_ties: records.length - controlWins.length - controlLosses.length,
    override_outcomes: countBy(overrides, r => r.control_outcome_em),
    win_indices: controlWins.map(r => r.idx),
    loss_indices: controlLosses.map(r => r.idx)
  },
  day1_gate: {
    retrieval_or_path_limited_failures: failures.filter(r => [
      'retrieval_answer_absent',
      'partial_path_schema_or_support_miss',
      'path_schema_miss_answer_present_elsewhere'
    ].includes(r.primary_path_status)).length,
    potentially_control_relevant_failures: failures.filter(r => [
      'evidence_present_not_closed',
      'answer_extraction_or_scoring_artifact',
      'model_refusal_or_unknown'
    ].includes(r.primary_path_status) && r.answer_string_present_in_docs).length,
    note: 'Heuristic machine-only split. Gold is used for autopsy labels, not for a deployable detector.'
  }
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${prefix}-taxonomy-all.jsonl`), records.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(path.join(outDir, `${prefix}-failure-taxonomy.jsonl`), failures.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(path.join(outDir, `${prefix}-autopsy-summary.json`), JSON.stringify(summary, null, 2) + '\n');

console.log(JSON.stringify(summary, null, 2));
