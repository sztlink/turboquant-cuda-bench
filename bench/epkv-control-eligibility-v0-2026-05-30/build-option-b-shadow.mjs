#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const defaultOutDir = path.dirname(new URL(import.meta.url).pathname);

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

function resolvePath(p) {
  return path.isAbsolute(p) ? p : path.join(root, p);
}

const outDir = resolvePath(argValue('--out-dir', defaultOutDir));
const runId = argValue('--run-id', 'epkv-control-eligibility-option-b-shadow-2026-05-30');
const outputPrefix = argValue('--output-prefix', 'option-b');

const paths = {
  llmSummary: argValue('--llm-summary', 'bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-llm-500/summary.json'),
  gatedSummary: argValue('--gated-summary', 'bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-answer-rerank-gated-v1-500/summary.json'),
  day1Taxonomy: argValue('--taxonomy', 'bench/epkv-control-eligibility-v0-2026-05-30/n500-taxonomy-all.jsonl'),
  spec: argValue('--spec', 'bench/epkv-control-eligibility-v0-2026-05-30/OPTION-B-REDESIGN-SPEC.md'),
};

function rel(...parts) { return path.join(root, ...parts); }
function readJson(p) { return JSON.parse(fs.readFileSync(resolvePath(p), 'utf8')); }
function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(resolvePath(p))).digest('hex'); }
function safeGit(cmd) { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } }

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
function tokens(s) { return norm(s).split(' ').filter(t => t && !STOPWORDS.has(t)); }

function tokenJaccard(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function charNgrams(s, n = 3) {
  const x = `  ${norm(s)}  `;
  const grams = [];
  if (x.trim().length < n) return x.trim() ? [x.trim()] : [];
  for (let i = 0; i <= x.length - n; i += 1) grams.push(x.slice(i, i + n));
  return grams;
}

function cosineFromCounts(a, b) {
  const A = new Map();
  const B = new Map();
  for (const g of a) A.set(g, (A.get(g) ?? 0) + 1);
  for (const g of b) B.set(g, (B.get(g) ?? 0) + 1);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of A.values()) na += v * v;
  for (const v of B.values()) nb += v * v;
  for (const [g, v] of A.entries()) dot += v * (B.get(g) ?? 0);
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function charTrigramCosine(a, b) { return cosineFromCounts(charNgrams(a), charNgrams(b)); }

function normalizedOverlap(a, b) {
  const na = norm(a);
  const nb = norm(b);
  return Boolean(na && nb && (na.includes(nb) || nb.includes(na)));
}

const SCHEMA_ARTIFACTS = new Set([
  'place of origin', 'place of birth', 'place of death', 'date of birth',
  'date of death', 'country of origin', 'occupation', 'profession',
].map(norm));
function isSchemaArtifact(s) { return SCHEMA_ARTIFACTS.has(norm(s)); }

function isRefusalLike(s) {
  const x = norm(s);
  if (!x) return true;
  return [
    'unknown', 'not mentioned', 'not provided', 'does not provide', 'do not provide',
    'cannot determine', 'not enough information', 'insufficient information', 'no information',
    'passage does not', 'passages do not', 'not specified', 'not stated', 'uncertain',
  ].some(p => x.includes(p));
}

function looksLongExplanatory(s) {
  const str = String(s ?? '');
  return str.split(/\s+/).filter(Boolean).length > 8 && /\b(is|was|were|died|born|worked|provide|provided|mentioned|associated)\b/i.test(str);
}

function looksConcreteAnswer(s) {
  const str = String(s ?? '');
  const n = norm(str);
  if (!n || isSchemaArtifact(str) || isRefusalLike(str)) return false;
  if (looksLongExplanatory(str)) return false;
  return true;
}

function pathUncertaintyScore(s) {
  let score = 0;
  if (!norm(s)) score += 2;
  if (isRefusalLike(s)) score += 2;
  if (isSchemaArtifact(s)) score += 1.5;
  if (/\b(uncertain|not specified|not mentioned|unknown)\b/i.test(String(s ?? ''))) score += 1;
  if (looksLongExplanatory(s)) score += 0.5;
  return score;
}

function isDateLike(s) {
  return /\b(\d{3,4}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(String(s ?? ''));
}

function isYearOnly(s) { return /^\d{3,4}$/.test(norm(s)); }

function isFullDateWithSameYear(answer, year) {
  const a = String(answer ?? '');
  const n = norm(a);
  return n.includes(String(year)) && /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2})\b/i.test(a) && /[a-z]/i.test(a);
}

function answerTypeCompatible(question, answer) {
  const q = norm(question);
  const ts = tokens(answer);
  if (q.startsWith('when') || q.includes('date of')) return isDateLike(answer);
  if (q.includes('nationality')) return ts.length <= 3 && !isDateLike(answer);
  if (q.startsWith('where') || q.includes('place of')) return !isDateLike(answer) && !isRefusalLike(answer);
  return true;
}

function selectedParts(verifier) {
  const raw = String(verifier?.selected ?? '');
  return raw.split('|').map(x => x.trim()).filter(Boolean);
}

function selectionFeatures(verifier) {
  const parts = selectedParts(verifier);
  const unknown = parts.some(x => x.toUpperCase() === 'UNKNOWN');
  const nonUnknown = parts.filter(x => x.toUpperCase() !== 'UNKNOWN');
  let entropyProxy = 0;
  if (unknown) entropyProxy += 1;
  if (nonUnknown.length <= 1) entropyProxy += 0;
  else if (nonUnknown.length === 2) entropyProxy += 0.5;
  else entropyProxy += 1;
  return {
    selected_raw: String(verifier?.selected ?? ''),
    selected_count: nonUnknown.length,
    selected_unknown: unknown,
    selection_entropy_proxy: entropyProxy,
  };
}

function verifierHigh(verifier) { return String(verifier?.confidence ?? '').toLowerCase() === 'high'; }

function directEvidenceScore(reason) {
  const r = String(reason ?? '');
  let score = 0;
  if (/\bdirectly states\b/i.test(r)) score += 2;
  if (/\bexplicitly states\b/i.test(r)) score += 2;
  if (/\bstates\b/i.test(r)) score += 1;
  if (/\baccording to\b/i.test(r)) score += 1;
  if (/\bmentioned in\b/i.test(r)) score += 0.5;
  return score;
}

function unsupportedInferenceRisk(reason) {
  return /reasonable to infer|production context|does not directly state|not directly state|likely|probably/i.test(String(reason ?? ''));
}

function regexEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function relationDepthRisk(question, verifierAnswer, reason) {
  const q = norm(question);
  if (!/(grandfather|grandmother|paternal|maternal)/.test(q)) return false;
  const v = String(verifierAnswer ?? '').trim();
  if (!v) return false;
  const esc = regexEscape(v);
  const pat = new RegExp(`(son|daughter|child|father|mother)\\s+of\\s+${esc}|${esc}[^.]{0,80}(father|mother|parent)`, 'i');
  return pat.test(String(reason ?? ''));
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

function candidateContains(candidates, answer) {
  const na = norm(answer);
  return Boolean(na) && candidates.some(c => norm(c) === na);
}

function independentAgreementWithVerifier(row, verifierAnswer) {
  const outputs = [row.strong?.output, row.bge_ref?.output].filter(Boolean);
  return outputs.some(o => charTrigramCosine(o, verifierAnswer) >= 0.86 || normalizedOverlap(o, verifierAnswer));
}

function answererAgreementEntropy(outputs) {
  const clean = outputs.filter(o => norm(o));
  if (!clean.length) return 0;
  const clusters = [];
  for (const out of clean) {
    let assigned = false;
    for (const cluster of clusters) {
      if (cluster.some(x => normalizedOverlap(x, out) || charTrigramCosine(x, out) >= 0.86)) {
        cluster.push(out);
        assigned = true;
        break;
      }
    }
    if (!assigned) clusters.push([out]);
  }
  const n = clean.length;
  let h = 0;
  for (const c of clusters) {
    const p = c.length / n;
    h -= p * Math.log2(p);
  }
  const hMax = Math.log2(Math.max(1, n));
  return hMax ? h / hMax : 0;
}

function hasSchemaPrefixOrRelationSentence(pathAnswer) {
  const s = String(pathAnswer ?? '');
  return /:\s*\S/.test(s) || /\b(is|was|are|were)\b/i.test(s);
}

function materiallyShorter(proposed, original) {
  const p = tokens(proposed).length;
  const o = tokens(original).length;
  return p > 0 && o > 0 && p / o <= 0.75;
}

function detectOptionB(row, ctx) {
  const question = String(row.question ?? ctx.question ?? '');
  const pathAnswer = String(row.path_prompt?.output ?? '');
  const verifierAnswer = String(row.rerank?.output ?? '');
  const verifier = row.rerank?.verifier ?? {};
  const reason = String(verifier.reason ?? '');
  const candidates = row.candidates ?? [];
  const selected = selectionFeatures(verifier);
  const pathConcrete = looksConcreteAnswer(pathAnswer);
  const verifierConcrete = looksConcreteAnswer(verifierAnswer);
  const overlap = normalizedOverlap(pathAnswer, verifierAnswer);
  const tokenJ = tokenJaccard(pathAnswer, verifierAnswer);
  const charCos = charTrigramCosine(pathAnswer, verifierAnswer);
  const uncertainty = pathUncertaintyScore(pathAnswer);
  const directScore = directEvidenceScore(reason);
  const typeCompatible = answerTypeCompatible(question, verifierAnswer);
  const high = verifierHigh(verifier);
  const candidateHasVerifier = candidateContains(candidates, verifierAnswer);
  const candidateHasPath = candidateContains(candidates, pathAnswer);
  const independentAgreement = independentAgreementWithVerifier(row, verifierAnswer);
  const answererEntropy = answererAgreementEntropy([
    row.bge_ref?.output,
    row.strong?.output,
    row.path_prompt?.output,
    row.rerank?.output,
  ]);

  const guards = [];
  if (!typeCompatible) guards.push('answer_type_mismatch');
  if (unsupportedInferenceRisk(reason)) guards.push('unsupported_inference_risk');
  if (relationDepthRisk(question, verifierAnswer, reason)) guards.push('relation_depth_confusion_risk');
  if (attributeOwnerAsAttributeRisk(question, verifierAnswer, reason)) guards.push('attribute_owner_as_attribute_risk');
  if (selected.selected_unknown) guards.push('selected_unknown');

  const base = high && verifierConcrete && typeCompatible && directScore >= 1 && !guards.length;
  const reasons = [];
  let eligible = false;
  let lane = 'abstain_or_no_claim';

  const dateSpecificity = base
    && (norm(question).startsWith('when') || norm(question).includes('date of'))
    && isYearOnly(pathAnswer)
    && isFullDateWithSameYear(verifierAnswer, norm(pathAnswer))
    && selected.selection_entropy_proxy === 0
    && (candidateHasVerifier || independentAgreement);

  const compressedSpan = base
    && pathConcrete
    && overlap
    && norm(verifierAnswer) !== norm(pathAnswer)
    && norm(pathAnswer).includes(norm(verifierAnswer))
    && hasSchemaPrefixOrRelationSentence(pathAnswer)
    && materiallyShorter(verifierAnswer, pathAnswer)
    && selected.selection_entropy_proxy <= 0.5;

  const aliasEmbedding = base
    && pathConcrete
    && verifierConcrete
    && !overlap
    && (charCos >= 0.92 || tokenJ >= 0.78)
    && (candidateHasPath && candidateHasVerifier || independentAgreement)
    && selected.selection_entropy_proxy <= 0.5;

  const lowSelectionEntropyRescue = base
    && !pathConcrete
    && uncertainty >= 1
    && selected.selection_entropy_proxy === 0;

  if (dateSpecificity) {
    eligible = true;
    lane = 'date_specificity_repair';
    reasons.push('year_only_path_full_date_verifier_low_selection_entropy');
  } else if (compressedSpan) {
    eligible = true;
    lane = 'compressed_span_repair';
    reasons.push('verifier_subspan_of_overlong_or_schema_prefixed_path');
  } else if (aliasEmbedding) {
    eligible = true;
    lane = 'alias_embedding_repair';
    reasons.push('high_surface_embedding_similarity_candidate_variant_pair');
  } else if (lowSelectionEntropyRescue) {
    eligible = true;
    lane = 'low_selection_entropy_rescue';
    reasons.push('path_uncertain_verifier_single_selection_direct_evidence');
  } else {
    if (pathConcrete && !dateSpecificity && !compressedSpan && !aliasEmbedding) guards.push('semantic_replacement_of_concrete_path');
    if (overlap && !dateSpecificity && !compressedSpan) guards.push('specificity_expansion_or_containment_not_allowed');
    if (!pathConcrete && uncertainty >= 1 && selected.selection_entropy_proxy > 0) guards.push('path_uncertain_but_selection_dispersion_high');
  }

  return {
    eligible,
    lane,
    reasons,
    guards: [...new Set(guards)],
    features: {
      verifier_confidence_high: high,
      selection: selected,
      answerer_agreement_entropy: Number(answererEntropy.toFixed(6)),
      surface_embedding: {
        char_trigram_cosine: Number(charCos.toFixed(6)),
        token_jaccard: Number(tokenJ.toFixed(6)),
        normalized_overlap: overlap,
      },
      path_uncertainty_score: uncertainty,
      path_concrete: pathConcrete,
      verifier_concrete: verifierConcrete,
      direct_evidence_score: directScore,
      answer_type_compatible: typeCompatible,
      candidate_has_path: candidateHasPath,
      candidate_has_verifier: candidateHasVerifier,
      independent_agreement_with_verifier: independentAgreement,
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
function mean(items, fn) { return items.length ? items.reduce((s, x) => s + Number(fn(x) || 0), 0) / items.length : 0; }
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
  const vals = [];
  for (let r = 0; r < reps; r += 1) {
    let s = 0;
    for (let i = 0; i < diffs.length; i += 1) s += diffs[Math.floor(rand() * diffs.length)];
    vals.push(s / diffs.length);
  }
  return { reps, seed, mean: mean(diffs, x => x), ci95: [quantile(vals, 0.025), quantile(vals, 0.975)] };
}

const llm = readJson(paths.llmSummary);
const gated = readJson(paths.gatedSummary);
const ctxByIdx = new Map(llm.rows.map(r => [Number(r.idx), r]));
const taxonomyRows = fs.readFileSync(resolvePath(paths.day1Taxonomy), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const taxonomyByIdx = new Map(taxonomyRows.map(r => [Number(r.idx), r]));

const receipts = [];
for (const row of gated.rows) {
  const idx = Number(row.idx);
  const ctx = ctxByIdx.get(idx) ?? {};
  const audit = taxonomyByIdx.get(idx) ?? {};
  const decision = detectOptionB(row, ctx);
  const proposed = decision.eligible ? String(row.rerank?.output ?? '') : String(row.path_prompt?.output ?? '');
  const pathEm = Number(row.path_prompt?.em ?? 0);
  const verifierEm = Number(row.rerank?.em ?? 0);
  const pathF1 = Number(row.path_prompt?.f1 ?? 0);
  const verifierF1 = Number(row.rerank?.f1 ?? 0);
  const emDiff = decision.eligible ? verifierEm - pathEm : 0;
  const f1Diff = decision.eligible ? verifierF1 - pathF1 : 0;
  receipts.push({
    schema: 'epkv.control_eligibility_option_b_shadow_receipt.v0',
    run_id: runId,
    idx,
    qid: ctx.qid ?? null,
    detector_inputs: {
      question: String(row.question ?? ctx.question ?? ''),
      path_answer: String(row.path_prompt?.output ?? ''),
      strong_answer: String(row.strong?.output ?? ''),
      bge_answer: String(row.bge_ref?.output ?? ''),
      verifier_answer: String(row.rerank?.output ?? ''),
      verifier_confidence: row.rerank?.verifier?.confidence ?? null,
      verifier_selected: row.rerank?.verifier?.selected ?? row.rerank?.selected ?? null,
      verifier_reason: row.rerank?.verifier?.reason ?? null,
      candidates_count: (row.candidates ?? []).length,
      selected_titles: ctx.selected_titles ?? [],
    },
    features: decision.features,
    eligibility: {
      eligible: decision.eligible,
      lane: decision.lane,
      reasons: decision.reasons,
      guards: decision.guards,
    },
    shadow_decision: {
      would_override: decision.eligible,
      proposed_answer: proposed,
      final_answer_unchanged: true,
      note: 'Option B shadow run only. The final answer is not changed.',
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
      outcome_em_if_proposed: !decision.eligible ? 'not_applicable' : emDiff > 0 ? 'win' : emDiff < 0 ? 'loss' : 'tie',
    },
  });
}

const eligible = receipts.filter(r => r.eligibility.eligible);
const wins = eligible.filter(r => r.posthoc_gold_eval.outcome_em_if_proposed === 'win');
const losses = eligible.filter(r => r.posthoc_gold_eval.outcome_em_if_proposed === 'loss');
const ties = eligible.filter(r => r.posthoc_gold_eval.outcome_em_if_proposed === 'tie');
const targetRelevant = r => {
  const s = r.posthoc_gold_eval.primary_path_status;
  return s === 'evidence_present_not_closed' || s === 'answer_extraction_or_scoring_artifact' || (s === 'model_refusal_or_unknown' && r.posthoc_gold_eval.answer_string_present_in_docs);
};
const retrievalPathLimited = r => ['retrieval_answer_absent', 'partial_path_schema_or_support_miss', 'path_schema_miss_answer_present_elsewhere'].includes(r.posthoc_gold_eval.primary_path_status);
const diffs = receipts.map(r => r.posthoc_gold_eval.em_diff_if_proposed);

const baselineTargetRate = receipts.filter(targetRelevant).length / receipts.length;
const eligibleTargetRate = eligible.length ? eligible.filter(targetRelevant).length / eligible.length : 0;
const retrievalPathLimitedRate = eligible.length ? eligible.filter(retrievalPathLimited).length / eligible.length : 0;
const bootstrap = bootstrapMeanDiff(diffs);

const exploratoryCriteria = {
  continue_to_fresh_holdout_shadow: {
    eligible_count_at_least_5: eligible.length >= 5,
    no_em_losses: losses.length === 0,
    em_wins_at_least_3: wins.length >= 3,
    not_dominated_by_retrieval_path_limited: retrievalPathLimitedRate <= 0.5,
    bootstrap_lower_bound_nonnegative: bootstrap.ci95[0] >= 0,
    target_concentration_above_baseline: eligibleTargetRate > baselineTargetRate,
  },
  promote_to_override_now: {
    pass: false,
    reason: 'Forbidden by spec. Option B is exploratory and must be validated on fresh holdout first.',
  },
};
exploratoryCriteria.continue_to_fresh_holdout_shadow.pass = Object.values(exploratoryCriteria.continue_to_fresh_holdout_shadow).every(Boolean);

const summary = {
  schema: 'epkv.control_eligibility_option_b_shadow_summary.v0',
  run_id: runId,
  exploratory_after_day2: true,
  detector_is_shadow_only: true,
  true_logits_or_probability_entropy_available: false,
  proxy_signals_used: [
    'selection_entropy_proxy',
    'answerer_agreement_entropy',
    'surface_embedding_similarity_char_trigram',
    'path_uncertainty_score',
    'direct_evidence_score',
    'specificity_direction',
    'candidate_variant_evidence',
  ],
  total: receipts.length,
  counts: {
    eligible: eligible.length,
    not_eligible: receipts.length - eligible.length,
    by_lane: countBy(receipts, r => r.eligibility.lane),
    eligible_by_lane: countBy(eligible, r => r.eligibility.lane),
    by_guard: countBy(receipts.flatMap(r => r.eligibility.guards), x => x),
  },
  posthoc_eval: {
    eligible_outcome_em_counts: countBy(eligible, r => r.posthoc_gold_eval.outcome_em_if_proposed),
    eligible_em_wins: wins.map(r => r.idx),
    eligible_em_losses: losses.map(r => r.idx),
    eligible_em_ties: ties.map(r => r.idx),
    eligible_primary_path_status_counts: countBy(eligible, r => r.posthoc_gold_eval.primary_path_status ?? 'missing'),
    eligible_target_relevant_count: eligible.filter(targetRelevant).length,
    eligible_retrieval_path_limited_count: eligible.filter(retrievalPathLimited).length,
    eligible_path_solved_count: eligible.filter(r => r.posthoc_gold_eval.primary_path_status === 'solved_by_path_prompt').length,
    baseline_control_relevant_rate_all_rows: baselineTargetRate,
    eligible_control_relevant_rate: eligibleTargetRate,
    projected_global_em_diff_if_shadow_policy_used: mean(diffs, x => x),
    projected_global_f1_diff_if_shadow_policy_used: mean(receipts, r => r.posthoc_gold_eval.f1_diff_if_proposed),
    projected_eligible_slice_em_diff_mean: mean(eligible, r => r.posthoc_gold_eval.em_diff_if_proposed),
    projected_eligible_slice_f1_diff_mean: mean(eligible, r => r.posthoc_gold_eval.f1_diff_if_proposed),
  },
  bootstrap: {
    option_b_shadow_vs_path_em_diff: bootstrap,
  },
  exploratory_criteria: exploratoryCriteria,
  decision: exploratoryCriteria.continue_to_fresh_holdout_shadow.pass ? 'freeze_option_b_for_fresh_holdout_shadow_only' : 'stop_option_b_or_redesign_again_not_recommended',
  caveat: 'This is an exploratory after-Day-2 detector. It cannot authorize an override policy without fresh holdout validation.',
};

const outputNames = outputPrefix === 'option-b'
  ? {
      manifest: 'OPTION-B-RUN-MANIFEST.json',
      receipts: 'option-b-receipts.jsonl',
      summary: 'option-b-summary.json',
      report: 'OPTION-B-SHADOW-RUN.md',
    }
  : {
      manifest: `${outputPrefix}-run-manifest.json`,
      receipts: `${outputPrefix}-receipts.jsonl`,
      summary: `${outputPrefix}-summary.json`,
      report: `${outputPrefix}-shadow-run.md`,
    };

function outputRel(name) {
  return path.relative(root, path.join(outDir, name));
}

const manifest = {
  schema: 'epkv.control_eligibility_option_b_manifest.v0',
  run_id: runId,
  generated_at_utc: new Date().toISOString(),
  git: { sha: safeGit('git rev-parse HEAD'), status_short: safeGit('git status --short') },
  source_files: Object.fromEntries(Object.entries(paths).map(([k, p]) => [k, { path: p, sha256: sha256File(p) }])),
  outputs: {
    receipts: outputRel(outputNames.receipts),
    summary: outputRel(outputNames.summary),
    report: outputRel(outputNames.report),
  },
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, outputNames.manifest), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, outputNames.receipts), receipts.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(path.join(outDir, outputNames.summary), JSON.stringify(summary, null, 2) + '\n');

const md = [];
md.push('# Option B shadow run - alternative-signal detector');
md.push('');
md.push('This is an exploratory last attempt after Day 2. It is shadow-only and cannot authorize override deployment.');
md.push('');
md.push('## Signal availability');
md.push('');
md.push('The existing N=500 artifacts do not contain raw logits, token probabilities, calibrated confidence distributions, or non-empty retriever scores. Option B therefore uses proxy signals only.');
md.push('');
md.push('## Result');
md.push('');
md.push('```txt');
md.push(`total rows: ${summary.total}`);
md.push(`eligible: ${summary.counts.eligible}`);
md.push(`not eligible: ${summary.counts.not_eligible}`);
md.push('```');
md.push('');
md.push('### Eligible by lane');
md.push('');
md.push('| lane | count |');
md.push('|---|---:|');
for (const [lane, count] of Object.entries(summary.counts.eligible_by_lane)) md.push(`| \`${lane}\` | ${count} |`);
md.push('');
md.push('## Posthoc evaluation');
md.push('');
md.push('Gold labels are used only after detector decisions are recorded.');
md.push('');
md.push('| metric | value |');
md.push('|---|---:|');
md.push(`| eligible EM wins | ${wins.length} |`);
md.push(`| eligible EM losses | ${losses.length} |`);
md.push(`| eligible EM ties | ${ties.length} |`);
md.push(`| eligible target-relevant count | ${summary.posthoc_eval.eligible_target_relevant_count} |`);
md.push(`| eligible retrieval/path-limited count | ${summary.posthoc_eval.eligible_retrieval_path_limited_count} |`);
md.push(`| projected global EM delta | ${summary.posthoc_eval.projected_global_em_diff_if_shadow_policy_used.toFixed(6)} |`);
md.push(`| projected global F1 delta | ${summary.posthoc_eval.projected_global_f1_diff_if_shadow_policy_used.toFixed(6)} |`);
md.push('');
md.push('### Eligible rows');
md.push('');
md.push('| idx | lane | outcome | path | proposed |');
md.push('|---:|---|---|---|---|');
for (const r of eligible) {
  const pathAnswer = String(r.detector_inputs.path_answer).replace(/\|/g, '\\|');
  const proposed = String(r.shadow_decision.proposed_answer).replace(/\|/g, '\\|');
  md.push(`| ${r.idx} | \`${r.eligibility.lane}\` | \`${r.posthoc_gold_eval.outcome_em_if_proposed}\` | ${pathAnswer} | ${proposed} |`);
}
md.push('');
md.push('## Bootstrap');
md.push('');
md.push('```json');
md.push(JSON.stringify(summary.bootstrap, null, 2));
md.push('```');
md.push('');
md.push('## Exploratory criteria');
md.push('');
md.push('```json');
md.push(JSON.stringify(summary.exploratory_criteria, null, 2));
md.push('```');
md.push('');
md.push(`Decision: \`${summary.decision}\`.`);
md.push('');
md.push('## Interpretation');
md.push('');
if (summary.decision === 'freeze_option_b_for_fresh_holdout_shadow_only') {
  md.push('Option B found a small repair-heavy slice with no posthoc EM losses on this inspected N=500. Because it is exploratory after Day 2, it should only be frozen and tested on a fresh holdout shadow run. It should not be promoted to an override policy now.');
} else {
  md.push('Option B did not satisfy the exploratory criteria. Further detector redesign is not recommended before pivoting to retrieval/path or preserving the negative result.');
}

fs.writeFileSync(path.join(outDir, outputNames.report), md.join('\n') + '\n');

console.log(JSON.stringify({
  run_id: runId,
  eligible: eligible.length,
  wins: wins.map(r => r.idx),
  losses: losses.map(r => r.idx),
  ties: ties.map(r => r.idx),
  decision: summary.decision,
}, null, 2));
console.log('EPKV_CONTROL_ELIGIBILITY_OPTION_B_SHADOW_DONE');
