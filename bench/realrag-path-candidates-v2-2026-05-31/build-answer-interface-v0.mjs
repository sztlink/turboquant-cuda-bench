#!/usr/bin/env node
import fs from 'node:fs';

const ROOT = 'bench/realrag-path-candidates-v2-2026-05-31';
const CANDIDATES = `${ROOT}/path-candidates-offset1500-n100.jsonl`;
const SMOKE = `${ROOT}/answer-from-chain-smoke-offset1500-n100-4090/outputs.jsonl`;
const OUT_JSONL = `${ROOT}/answer-interface-v0-offset1500-n100.jsonl`;
const OUT_SUMMARY = `${ROOT}/answer-interface-v0-summary.json`;

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(a|an|the)\b/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function exact(pred, gold) {
  return normalize(pred) === normalize(gold) ? 1 : 0;
}

function contains(pred, gold) {
  const p = normalize(pred);
  const g = normalize(gold);
  return p && g && p.includes(g) ? 1 : 0;
}

function f1(pred, gold) {
  const pt = normalize(pred).split(/\s+/).filter(Boolean);
  const gt = normalize(gold).split(/\s+/).filter(Boolean);
  if (!pt.length && !gt.length) return 1;
  if (!pt.length || !gt.length) return 0;
  const counts = new Map();
  for (const t of pt) counts.set(t, (counts.get(t) || 0) + 1);
  let same = 0;
  for (const t of gt) {
    const c = counts.get(t) || 0;
    if (c > 0) {
      same += 1;
      counts.set(t, c - 1);
    }
  }
  if (!same) return 0;
  const precision = same / pt.length;
  const recall = same / gt.length;
  return 2 * precision * recall / (precision + recall);
}

function metrics(output, gold) {
  return { em: exact(output, gold), contains: contains(output, gold), f1: f1(output, gold) };
}

function isRefusal(output) {
  const n = normalize(output);
  return !n || n === 'unknown' || /^(unknown|not enough information|cannot determine|cannot be determined|not provided|no information)/.test(n);
}

function renderAnswer(answer, answerSlot) {
  let out = String(answer || '')
    .replace(/^\s*final answer\s*:\s*/i, '')
    .replace(/^\s*answer\s*:\s*/i, '')
    .trim()
    .split(/\n/)[0]
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\s+,\s*$/, '')
    .trim();

  if (answerSlot === 'person') {
    // Display cleanup only. This removes appositive descriptors, not noble/title words.
    out = out.replace(/,\s*(?:leader|daughter|son|wife|husband|mother|father|who|which)\b.*$/i, '').trim();
  }

  return out;
}

function route(row) {
  const candidate = row.top_candidate;
  if (candidate?.answer_candidate) {
    return {
      route: 'candidate_direct_rendered',
      output: renderAnswer(candidate.answer_candidate, row.question_parse?.answer_slot || candidate.answer_slot || 'entity'),
      source_answer: candidate.answer_candidate,
      fallback_used: false,
    };
  }
  const fallback = row.prior_run_metrics?.config0_path_prompt?.output || '';
  return {
    route: 'fallback_config0_path_prompt',
    output: renderAnswer(fallback, row.question_parse?.answer_slot || 'entity'),
    source_answer: fallback,
    fallback_used: true,
  };
}

function macro(records, field) {
  const n = records.length || 1;
  const out = { em: 0, contains: 0, f1: 0, refusal_rate: 0 };
  for (const r of records) {
    const m = r[field];
    out.em += m.em;
    out.contains += m.contains;
    out.f1 += m.f1;
    out.refusal_rate += r[`${field}_refusal`] ? 1 : 0;
  }
  out.em /= n;
  out.contains /= n;
  out.f1 /= n;
  out.refusal_rate /= n;
  return out;
}

function movement(records, metricField, baselineField) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const r of records) {
    const a = r[metricField].em || 0;
    const b = r[baselineField].em || 0;
    if (a > b) wins += 1;
    else if (a < b) losses += 1;
    else ties += 1;
  }
  return { wins, losses, ties };
}

function summarize(records) {
  const n = records.length || 1;
  const routes = new Map();
  for (const r of records) routes.set(r.route, (routes.get(r.route) || 0) + 1);
  return {
    schema: 'realrag.answer_interface_v0.summary',
    generated_at: new Date().toISOString(),
    policy: {
      name: 'candidate_direct_rendered_else_config0_path_prompt',
      description: 'Return the explicit path-candidate answer directly when present; otherwise fall back to the config0 path-prompt output. No LLM call.',
      uses_llm: false,
      uses_4090: false,
      uses_gold_for_selection: false,
    },
    total: records.length,
    route_counts: Object.fromEntries(routes),
    route_rates: Object.fromEntries([...routes.entries()].map(([k, v]) => [k, v / n])),
    macro: {
      answer_interface_v0: macro(records, 'answer_interface_v0_metrics'),
      candidate_direct_unrendered: macro(records, 'candidate_direct_metrics'),
      answer_from_chain_smoke: macro(records, 'answer_from_chain_metrics'),
      config0_path_prompt: macro(records, 'config0_metrics'),
      current_path_prompt: macro(records, 'current_metrics'),
    },
    pairwise_em_movement: {
      vs_config0_path_prompt: movement(records, 'answer_interface_v0_metrics', 'config0_metrics'),
      vs_current_path_prompt: movement(records, 'answer_interface_v0_metrics', 'current_metrics'),
      vs_answer_from_chain_smoke: movement(records, 'answer_interface_v0_metrics', 'answer_from_chain_metrics'),
      vs_candidate_direct_unrendered: movement(records, 'answer_interface_v0_metrics', 'candidate_direct_metrics'),
    },
    decision: {
      readout: 'overrefusal_fixed_by_not_asking_llm_to_regenerate_candidate_answer',
      next: 'use_answer_interface_v0_as_local_policy_then_review_alias_normalization',
      no_runtime_mapping_yet: true,
      no_megakernel_yet: true,
    },
  };
}

function main() {
  const candidates = readJsonl(CANDIDATES);
  const smokeByQid = new Map(readJsonl(SMOKE).map((r) => [String(r.qid), r]));
  const records = candidates.map((row) => {
    const selected = route(row);
    const smoke = smokeByQid.get(String(row.qid));
    const candidateRaw = row.top_candidate?.answer_candidate || '';
    const config0 = row.prior_run_metrics?.config0_path_prompt || { output: '', em: 0, contains: 0, f1: 0 };
    const current = row.prior_run_metrics?.current_path_prompt || { output: '', em: 0, contains: 0, f1: 0 };
    const answerMetrics = metrics(selected.output, row.gold);
    return {
      schema: 'realrag.answer_interface_v0.case',
      idx: row.idx,
      qid: row.qid,
      question: row.question,
      template: row.question_parse?.template || 'unknown',
      answer_slot: row.question_parse?.answer_slot || 'entity',
      route: selected.route,
      output: selected.output,
      source_answer: selected.source_answer,
      fallback_used: selected.fallback_used,
      gold: row.gold,
      answer_interface_v0_metrics: answerMetrics,
      answer_interface_v0_metrics_refusal: isRefusal(selected.output),
      candidate_direct_metrics: row.posthoc_top_metrics || metrics(candidateRaw, row.gold),
      candidate_direct_metrics_refusal: !candidateRaw,
      answer_from_chain_metrics: smoke?.metrics || { em: 0, contains: 0, f1: 0 },
      answer_from_chain_metrics_refusal: smoke ? isRefusal(smoke.output) : true,
      config0_metrics: { em: config0.em || 0, contains: config0.contains || 0, f1: config0.f1 || 0 },
      config0_metrics_refusal: isRefusal(config0.output),
      current_metrics: { em: current.em || 0, contains: current.contains || 0, f1: current.f1 || 0 },
      current_metrics_refusal: isRefusal(current.output),
      prior_outputs: {
        candidate_direct: candidateRaw,
        answer_from_chain: smoke?.output || '',
        config0_path_prompt: config0.output || '',
        current_path_prompt: current.output || '',
      },
      risk_flags: row.risk_flags || [],
      support_titles: row.support_titles || [],
      evidence_titles: row.top_candidate?.evidence_titles || [],
    };
  });
  fs.writeFileSync(OUT_JSONL, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(OUT_SUMMARY, JSON.stringify(summarize(records), null, 2) + '\n');
  console.log(JSON.stringify(summarize(records), null, 2));
}

main();
