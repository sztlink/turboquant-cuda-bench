#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const outDir = path.dirname(new URL(import.meta.url).pathname);
const runId = 'epkv-control-eligibility-v0-day2-shadow-2026-05-30';

const paths = {
  llmSummary: 'bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-llm-500/summary.json',
  gatedSummary: 'bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-answer-rerank-gated-v1-500/summary.json',
  day1Taxonomy: 'bench/epkv-control-eligibility-v0-2026-05-30/n500-taxonomy-all.jsonl',
  spec: 'bench/epkv-control-eligibility-v0-2026-05-30/ELIGIBILITY-SPEC.md',
};

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function sha256File(rel) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
}

function norm(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const STOPWORDS = new Set('a an the of in on at to for and or by from with as is was were this that these those film song'.split(' '));
function tokens(s) {
  return norm(s).split(' ').filter(t => t && !STOPWORDS.has(t));
}

function tokenJaccard(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function normalizedOverlap(a, b) {
  const na = norm(a);
  const nb = norm(b);
  return Boolean(na && nb && (na.includes(nb) || nb.includes(na)));
}

const SCHEMA_ARTIFACTS = new Set([
  'place of origin', 'place of birth', 'place of death', 'date of birth',
  'date of death', 'country of origin', 'occupation', 'profession',
].map(norm));

function isSchemaArtifact(s) {
  return SCHEMA_ARTIFACTS.has(norm(s));
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
    'passage does not',
    'passages do not',
    'not specified',
    'not stated',
    'uncertain',
  ].some(p => x.includes(p));
}

function looksConcreteAnswer(s) {
  const str = String(s ?? '');
  const n = norm(str);
  if (!n || isSchemaArtifact(str) || isRefusalLike(str)) return false;
  if (str.split(/\s+/).length > 8 && /\b(is|was|were|died|born|worked|provide|provided|mentioned|associated)\b/i.test(str)) {
    return false;
  }
  return true;
}

function isDateLike(s) {
  return /\b(\d{3,4}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(String(s ?? ''));
}

function answerTypeCompatible(question, answer) {
  const q = norm(question);
  const ts = tokens(answer);
  if (q.startsWith('when') || q.includes('date of')) return isDateLike(answer);
  if (q.includes('nationality')) return ts.length <= 3 && !isDateLike(answer);
  if (q.startsWith('where') || q.includes('place of')) return !isDateLike(answer) && !isRefusalLike(answer);
  return true;
}

function regexEscape(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function relationDepthRisk(question, verifierAnswer, reason) {
  const q = norm(question);
  if (!/(grandfather|grandmother|paternal|maternal)/.test(q)) return false;
  const v = String(verifierAnswer ?? '').trim();
  if (!v) return false;
  const esc = regexEscape(v);
  const pat = new RegExp(`(son|daughter|child|father|mother)\\s+of\\s+${esc}|${esc}[^.]{0,80}(father|mother|parent)`, 'i');
  return pat.test(String(reason ?? ''));
}

function unsupportedInferenceRisk(reason) {
  return /reasonable to infer|production context|does not directly state|not directly state|likely|probably/i.test(String(reason ?? ''));
}

function attributeOwnerAsAttributeRisk(question, verifierAnswer, reason) {
  const q = norm(question);
  if (!(q.includes('place of') || q.includes('date of') || q.startsWith('where') || q.startsWith('when'))) return false;
  const v = String(verifierAnswer ?? '').trim();
  if (!v) return false;
  const esc = regexEscape(v);
  const ownerPat = new RegExp(`${esc}[^.]{0,80}\\bis\\s+(?:the\\s+)?(director|performer|composer|father|mother|husband|wife|son|daughter)\\b`, 'i');
  return ownerPat.test(String(reason ?? '')) && /\b(his|her|their)\s+(place|date)\b/i.test(String(reason ?? ''));
}

function highConfidence(verifier) {
  return String(verifier?.confidence ?? '').toLowerCase() === 'high';
}

function detectEligibility(input) {
  const question = input.question;
  const pathAnswer = input.path_answer;
  const verifierAnswer = input.verifier_answer;
  const verifier = input.verifier ?? {};
  const reason = String(verifier.reason ?? '');
  const confidenceHigh = highConfidence(verifier);
  const pathRefusalLike = isRefusalLike(pathAnswer);
  const pathSchemaArtifact = isSchemaArtifact(pathAnswer);
  const pathConcrete = looksConcreteAnswer(pathAnswer);
  const verifierConcrete = looksConcreteAnswer(verifierAnswer);
  const overlap = normalizedOverlap(pathAnswer, verifierAnswer);
  const jaccard = tokenJaccard(pathAnswer, verifierAnswer);
  const typeCompatible = answerTypeCompatible(question, verifierAnswer);

  const guards = [];
  if (overlap) guards.push('containment_preserve_path');
  if (!typeCompatible) guards.push('answer_type_mismatch');
  if (relationDepthRisk(question, verifierAnswer, reason)) guards.push('relation_depth_confusion_risk');
  if (unsupportedInferenceRisk(reason)) guards.push('unsupported_inference_risk');
  if (attributeOwnerAsAttributeRisk(question, verifierAnswer, reason)) guards.push('attribute_owner_as_attribute_risk');

  const base = confidenceHigh && verifierConcrete && !overlap && typeCompatible && guards.length === 0;

  let state = 'out_of_scope_for_control';
  let lane = 'no_claim';
  const reasons = [];

  if (pathConcrete) {
    state = 'closed';
    lane = 'abstain_preserve_path';
    reasons.push('path_concrete_preserve_default');
  }

  if (base && pathConcrete && jaccard >= 0.72) {
    state = 'near_closed';
    lane = 'alias_or_answer_repair';
    reasons.push('high_confidence_concrete_pair_high_token_similarity_no_containment');
  } else if (base && !pathConcrete && (pathRefusalLike || pathSchemaArtifact)) {
    state = 'open_broken';
    lane = 'path_failure_rescue';
    reasons.push(pathRefusalLike ? 'path_refusal_like' : 'path_schema_artifact');
    reasons.push('high_confidence_concrete_verifier_no_negative_guard');
  } else if (!pathConcrete && guards.length > 0) {
    state = 'guarded_no_claim';
    lane = 'guarded_no_claim';
    reasons.push('path_not_concrete_but_guarded');
  } else if (!pathConcrete) {
    state = 'out_of_scope_for_control';
    lane = 'no_claim';
    reasons.push('path_not_concrete_but_no_safe_rescue');
  }

  const eligible = lane === 'alias_or_answer_repair' || lane === 'path_failure_rescue';

  return {
    eligible,
    state,
    lane,
    reasons,
    guards,
    features: {
      verifier_confidence_high: confidenceHigh,
      path_refusal_like: pathRefusalLike,
      path_schema_artifact: pathSchemaArtifact,
      path_concrete: pathConcrete,
      verifier_concrete: verifierConcrete,
      normalized_overlap: overlap,
      token_jaccard: Number(jaccard.toFixed(6)),
      answer_type_compatible: typeCompatible,
    },
  };
}

function countBy(items, fn) {
  const m = new Map();
  for (const item of items) {
    const k = fn(item);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))));
}

function mean(items, fn) {
  if (!items.length) return 0;
  return items.reduce((s, item) => s + Number(fn(item) || 0), 0) / items.length;
}

function quantile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function mulberry32(seed) {
  return function rand() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bootstrapMeanDiff(diffs, reps = 5000, seed = 20260530) {
  const rand = mulberry32(seed);
  const n = diffs.length;
  const vals = [];
  for (let r = 0; r < reps; r += 1) {
    let s = 0;
    for (let i = 0; i < n; i += 1) {
      s += diffs[Math.floor(rand() * n)];
    }
    vals.push(s / n);
  }
  return {
    reps,
    seed,
    mean: mean(diffs, x => x),
    ci95: [quantile(vals, 0.025), quantile(vals, 0.975)],
  };
}

function safeGit(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

const llm = readJson(paths.llmSummary);
const gated = readJson(paths.gatedSummary);
const contextByIdx = new Map(llm.rows.map(r => [Number(r.idx), r]));
const taxonomyRows = fs.readFileSync(path.join(root, paths.day1Taxonomy), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const taxonomyByIdx = new Map(taxonomyRows.map(r => [Number(r.idx), r]));

const receipts = [];

for (const row of gated.rows) {
  const idx = Number(row.idx);
  const ctx = contextByIdx.get(idx) ?? {};
  const audit = taxonomyByIdx.get(idx) ?? {};
  const detectorInput = {
    question: String(row.question ?? ctx.question ?? ''),
    path_answer: String(row.path_prompt?.output ?? ''),
    verifier_answer: String(row.rerank?.output ?? ''),
    verifier: row.rerank?.verifier ?? {},
    candidates: row.candidates ?? [],
    selected_titles: ctx.selected_titles ?? [],
  };
  const decision = detectEligibility(detectorInput);
  const proposed = decision.eligible ? detectorInput.verifier_answer : detectorInput.path_answer;

  const pathEm = Number(row.path_prompt?.em ?? 0);
  const verifierEm = Number(row.rerank?.em ?? 0);
  const pathF1 = Number(row.path_prompt?.f1 ?? 0);
  const verifierF1 = Number(row.rerank?.f1 ?? 0);
  const emDiff = decision.eligible ? verifierEm - pathEm : 0;
  const f1Diff = decision.eligible ? verifierF1 - pathF1 : 0;
  const outcomeEm = !decision.eligible ? 'not_applicable' : emDiff > 0 ? 'win' : emDiff < 0 ? 'loss' : 'tie';

  const receipt = {
    schema: 'epkv.control_eligibility_shadow_receipt.v0',
    run_id: runId,
    idx,
    qid: ctx.qid ?? null,
    detector_inputs: {
      question: detectorInput.question,
      path_answer: detectorInput.path_answer,
      verifier_answer: detectorInput.verifier_answer,
      verifier_confidence: detectorInput.verifier.confidence ?? null,
      verifier_selected: detectorInput.verifier.selected ?? null,
      verifier_reason: detectorInput.verifier.reason ?? null,
      candidates_count: detectorInput.candidates.length,
      selected_titles: detectorInput.selected_titles,
    },
    features: decision.features,
    eligibility: {
      eligible: decision.eligible,
      state: decision.state,
      lane: decision.lane,
      reasons: decision.reasons,
      guards: decision.guards,
    },
    shadow_decision: {
      would_override: decision.eligible,
      proposed_answer: proposed,
      final_answer_unchanged: true,
      note: 'Shadow run only. The final answer is not changed by Day 2.',
    },
    posthoc_gold_eval: {
      used_by_detector: false,
      primary_path_status: audit.primary_path_status ?? null,
      answer_string_present_in_docs: audit.answer_string_present_in_docs ?? null,
      path_em: pathEm,
      verifier_em: verifierEm,
      path_f1: pathF1,
      verifier_f1: verifierF1,
      em_diff_if_proposed: emDiff,
      f1_diff_if_proposed: f1Diff,
      outcome_em_if_proposed: outcomeEm,
    },
  };
  receipts.push(receipt);
}

const eligible = receipts.filter(r => r.eligibility.eligible);
const targetRelevant = r => {
  const s = r.posthoc_gold_eval.primary_path_status;
  if (s === 'evidence_present_not_closed') return true;
  if (s === 'answer_extraction_or_scoring_artifact') return true;
  if (s === 'model_refusal_or_unknown' && r.posthoc_gold_eval.answer_string_present_in_docs) return true;
  return false;
};
const retrievalPathLimited = r => [
  'retrieval_answer_absent',
  'partial_path_schema_or_support_miss',
  'path_schema_miss_answer_present_elsewhere',
].includes(r.posthoc_gold_eval.primary_path_status);

const allTargetCount = receipts.filter(targetRelevant).length;
const eligibleTargetCount = eligible.filter(targetRelevant).length;
const eligibleRetrievalPathCount = eligible.filter(retrievalPathLimited).length;
const eligiblePathSolvedCount = eligible.filter(r => r.posthoc_gold_eval.primary_path_status === 'solved_by_path_prompt').length;

const wins = eligible.filter(r => r.posthoc_gold_eval.outcome_em_if_proposed === 'win');
const losses = eligible.filter(r => r.posthoc_gold_eval.outcome_em_if_proposed === 'loss');
const ties = eligible.filter(r => r.posthoc_gold_eval.outcome_em_if_proposed === 'tie');
const gatedDiffs = receipts.map(r => {
  const row = gated.rows[Number(r.idx)];
  return Number(row.gated_rerank_v1?.em ?? 0) - Number(row.path_prompt?.em ?? 0);
});
const shadowProjectedDiffs = receipts.map(r => r.posthoc_gold_eval.em_diff_if_proposed);

const criteria = {
  promote_to_override_pilot: {
    eligible_count_at_least_20: eligible.length >= 20,
    em_wins_greater_than_losses: wins.length > losses.length,
    no_unexplained_em_losses: losses.length === 0,
    not_dominated_by_retrieval_path_limited: eligible.length > 0 && eligibleRetrievalPathCount / eligible.length <= 0.5,
    no_material_path_solved_damage: eligible.filter(r => r.posthoc_gold_eval.primary_path_status === 'solved_by_path_prompt' && r.posthoc_gold_eval.outcome_em_if_proposed === 'loss').length === 0,
  },
  continue_detector_iteration: {
    eligible_count_at_least_5: eligible.length >= 5,
    em_wins_at_least_losses: wins.length >= losses.length,
    higher_target_concentration_than_baseline: eligible.length > 0 && (eligibleTargetCount / eligible.length) > (allTargetCount / receipts.length),
    no_obvious_em_loss: losses.length === 0,
  },
};
criteria.promote_to_override_pilot.pass = Object.values(criteria.promote_to_override_pilot).every(Boolean);
criteria.continue_detector_iteration.pass = Object.values(criteria.continue_detector_iteration).every(Boolean);

const summary = {
  schema: 'epkv.control_eligibility_shadow_summary.v0',
  run_id: runId,
  total: receipts.length,
  detector_is_shadow_only: true,
  detector_inputs_forbidden_gold_features: true,
  counts: {
    eligible: eligible.length,
    not_eligible: receipts.length - eligible.length,
    by_state: countBy(receipts, r => r.eligibility.state),
    by_lane: countBy(receipts, r => r.eligibility.lane),
    by_guard: countBy(receipts.flatMap(r => r.eligibility.guards), x => x),
  },
  posthoc_eval: {
    baseline_control_relevant_rate_all_rows: allTargetCount / receipts.length,
    eligible_control_relevant_rate: eligible.length ? eligibleTargetCount / eligible.length : 0,
    eligible_target_relevant_count: eligibleTargetCount,
    eligible_retrieval_path_limited_count: eligibleRetrievalPathCount,
    eligible_path_solved_count: eligiblePathSolvedCount,
    eligible_primary_path_status_counts: countBy(eligible, r => r.posthoc_gold_eval.primary_path_status ?? 'missing'),
    eligible_outcome_em_counts: countBy(eligible, r => r.posthoc_gold_eval.outcome_em_if_proposed),
    eligible_em_wins: wins.map(r => r.idx),
    eligible_em_losses: losses.map(r => r.idx),
    eligible_em_ties: ties.map(r => r.idx),
    projected_global_em_diff_if_shadow_policy_used: mean(shadowProjectedDiffs, x => x),
    projected_eligible_slice_em_diff_mean: mean(eligible, r => r.posthoc_gold_eval.em_diff_if_proposed),
    projected_global_f1_diff_if_shadow_policy_used: mean(receipts, r => r.posthoc_gold_eval.f1_diff_if_proposed),
    projected_eligible_slice_f1_diff_mean: mean(eligible, r => r.posthoc_gold_eval.f1_diff_if_proposed),
  },
  bootstrap: {
    gated_v1_vs_path_em_diff: bootstrapMeanDiff(gatedDiffs),
    shadow_policy_vs_path_em_diff: bootstrapMeanDiff(shadowProjectedDiffs),
  },
  criteria,
  decision: criteria.promote_to_override_pilot.pass
    ? 'promote_to_small_override_pilot'
    : criteria.continue_detector_iteration.pass
      ? 'continue_detector_iteration_only'
      : 'do_not_promote_pivot_or_redesign_detector',
  caveat: 'Posthoc gold evaluation is not used by the detector. The detector only sees operational text and verifier metadata.',
};

const manifest = {
  schema: 'epkv.control_eligibility_run_manifest.v0',
  run_id: runId,
  generated_at_utc: new Date().toISOString(),
  git: {
    sha: safeGit('git rev-parse HEAD'),
    status_short: safeGit('git status --short'),
  },
  source_files: Object.fromEntries(Object.entries(paths).map(([k, rel]) => [k, { path: rel, sha256: sha256File(rel) }])),
  outputs: {
    receipts: 'bench/epkv-control-eligibility-v0-2026-05-30/eligibility-receipts.jsonl',
    summary: 'bench/epkv-control-eligibility-v0-2026-05-30/shadow-summary.json',
    report: 'bench/epkv-control-eligibility-v0-2026-05-30/SHADOW-RUN.md',
  },
  detector: {
    name: 'eligibility-shadow-v0',
    implementation: 'bench/epkv-control-eligibility-v0-2026-05-30/build-eligibility-shadow.mjs',
    operational_inputs: [
      'question', 'path_prompt.output', 'rerank.output', 'rerank.verifier.confidence',
      'rerank.verifier.selected', 'rerank.verifier.reason', 'candidates', 'selected_titles',
    ],
    forbidden_operational_inputs: [
      'gold', 'em', 'contains', 'f1', 'answer_string_present_in_docs',
      'support_title_recall', 'full_support_recall', 'primary_path_status', 'candidate_has_gold',
    ],
  },
};

fs.writeFileSync(path.join(outDir, 'RUN-MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'eligibility-receipts.jsonl'), receipts.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(path.join(outDir, 'shadow-summary.json'), JSON.stringify(summary, null, 2) + '\n');

const md = [];
md.push('# Day 2 shadow run - eligibility detector v0');
md.push('');
md.push('This is a shadow run. It does not change final answers.');
md.push('');
md.push('## Detector result');
md.push('');
md.push('```txt');
md.push(`total rows: ${summary.total}`);
md.push(`eligible: ${summary.counts.eligible}`);
md.push(`not eligible: ${summary.counts.not_eligible}`);
md.push('```');
md.push('');
md.push('### By lane');
md.push('');
md.push('| lane | count |');
md.push('|---|---:|');
for (const [lane, count] of Object.entries(summary.counts.by_lane)) md.push(`| \`${lane}\` | ${count} |`);
md.push('');
md.push('## Posthoc evaluation');
md.push('');
md.push('Posthoc scoring uses gold labels only after detector decisions are recorded.');
md.push('');
md.push('| metric | value |');
md.push('|---|---:|');
md.push(`| eligible target-relevant count | ${summary.posthoc_eval.eligible_target_relevant_count} |`);
md.push(`| eligible retrieval/path-limited count | ${summary.posthoc_eval.eligible_retrieval_path_limited_count} |`);
md.push(`| eligible path-solved count | ${summary.posthoc_eval.eligible_path_solved_count} |`);
md.push(`| eligible EM wins | ${summary.posthoc_eval.eligible_em_wins.length} |`);
md.push(`| eligible EM losses | ${summary.posthoc_eval.eligible_em_losses.length} |`);
md.push(`| eligible EM ties | ${summary.posthoc_eval.eligible_em_ties.length} |`);
md.push(`| projected global EM delta | ${summary.posthoc_eval.projected_global_em_diff_if_shadow_policy_used.toFixed(6)} |`);
md.push(`| projected global F1 delta | ${summary.posthoc_eval.projected_global_f1_diff_if_shadow_policy_used.toFixed(6)} |`);
md.push('');
md.push('### Eligible rows');
md.push('');
md.push('| idx | lane | posthoc status | outcome | path | proposed |');
md.push('|---:|---|---|---|---|---|');
for (const r of eligible) {
  const pathAnswer = String(r.detector_inputs.path_answer).replace(/\|/g, '\\|');
  const proposed = String(r.shadow_decision.proposed_answer).replace(/\|/g, '\\|');
  md.push(`| ${r.idx} | \`${r.eligibility.lane}\` | \`${r.posthoc_gold_eval.primary_path_status}\` | \`${r.posthoc_gold_eval.outcome_em_if_proposed}\` | ${pathAnswer} | ${proposed} |`);
}
md.push('');
md.push('## Bootstrap');
md.push('');
md.push('```json');
md.push(JSON.stringify(summary.bootstrap, null, 2));
md.push('```');
md.push('');
md.push('## Criteria decision');
md.push('');
md.push('```json');
md.push(JSON.stringify(summary.criteria, null, 2));
md.push('```');
md.push('');
md.push(`Decision: \`${summary.decision}\`.`);
md.push('');
md.push('## Interpretation');
md.push('');
if (summary.decision === 'do_not_promote_pivot_or_redesign_detector') {
  md.push('The detector is too narrow or insufficiently validated to promote to an override policy. Preserve as a negative/diagnostic receipt and either redesign detector criteria or pivot to retrieval/path work.');
} else if (summary.decision === 'continue_detector_iteration_only') {
  md.push('The detector has enough signal to iterate, but not enough to promote to an override policy. The next step is detector iteration or a small holdout shadow run, not deployment.');
} else {
  md.push('The detector passes the pre-registered criteria for a small override pilot. This still does not establish a global RealRAG gain.');
}

fs.writeFileSync(path.join(outDir, 'SHADOW-RUN.md'), md.join('\n') + '\n');

console.log(JSON.stringify({
  run_id: runId,
  eligible: eligible.length,
  wins: wins.map(r => r.idx),
  losses: losses.map(r => r.idx),
  ties: ties.map(r => r.idx),
  decision: summary.decision,
}, null, 2));
console.log('EPKV_CONTROL_ELIGIBILITY_SHADOW_DONE');
