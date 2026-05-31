#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'bench/realrag-path-construction-v1-2026-05-30';
const RUNS = [
  {
    id: 'offset500',
    label: 'known offset500',
    currentPath: 'bench/epkv-control-eligibility-v0-2026-05-30/holdout-offset500-n100/entity-hop-llm/summary.json',
    configPath: `${ROOT}/answer-quality-offset500-n100-config0/summary.json`,
  },
  {
    id: 'offset1500',
    label: 'fresh offset1500',
    currentPath: `${ROOT}/answer-quality-offset1500-n100-current/summary.json`,
    configPath: `${ROOT}/answer-quality-offset1500-n100-config0/summary.json`,
  },
];

const GENERIC_EXACT = new Set([
  'place of birth', 'place of death', 'place of origin', 'the singer', 'the child', 'the feature',
  'the general', 'the will', 'the dance', 'the dancer', 'the rock', 'the room', 'the street',
  'the light', 'the dead', 'the jury', 'the cell', 'the first day', 'the only one', 'the supporter',
  'the employee', 'the bastard', 'the open road', 'the hours', 'the mess', 'story', 'master',
  'model', 'part', 'missing', 'point', 'division', 'a division', 'captured', 'captured!',
  '@home', 'them!', 'like that', 'fire', 'kings', 'comedy!', 'the name of love', 'in the name of',
]);

const TOKEN_STOP = new Set([
  'the', 'and', 'of', 'in', 'a', 'an', 'to', 'for', 'with', 'from', 'film', 'song', 'songs',
  'duke', 'duchess', 'count', 'countess', 'prince', 'princess', 'king', 'queen', 'earl', 'lord',
  'lady', 'baron', 'baroness', 'marquess', 'saint', 'john', 'mary', 'anna', 'anne', 'william',
  'henry', 'charles', 'francis', 'james', 'louis', 'george', 'richard', 'robert', 'maria',
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokens(s) {
  return norm(s).split(/\s+/).filter(Boolean);
}

function titleTokens(title) {
  return tokens(title).filter((t) => t.length >= 4 && !TOKEN_STOP.has(t) && !/^\d+$/.test(t));
}

function isGenericTitle(title) {
  const n = norm(title);
  return GENERIC_EXACT.has(n) || /^the [a-z]+$/.test(n) && ['the singer', 'the child', 'the feature', 'the general', 'the will', 'the dance', 'the rock', 'the room', 'the street', 'the light', 'the dead', 'the jury', 'the cell'].includes(n);
}

function inferExpectedType(question) {
  const q = norm(question);
  if (/\b(when|date)\b/.test(q) || /date of (birth|death)/.test(q) || /\b(born|died)\b/.test(q)) return 'date';
  if (/nationality/.test(q)) return 'nationality';
  if (/which country|what country|country .* from|\bfrom\b/.test(q)) return 'country';
  if (/\bwhere\b|place of (birth|death|origin)/.test(q)) return 'place';
  if (/graduated/.test(q)) return 'institution';
  if (/\bwho\b|spouse|father|mother|grandfather|grandmother|performer|director|composer/.test(q)) return 'person_or_org';
  return 'entity_or_value';
}

function inferRelation(question) {
  const q = norm(question);
  const rels = [];
  if (/paternal grandfather/.test(q)) rels.push('father_of_father');
  if (/maternal grandfather/.test(q)) rels.push('father_of_mother');
  if (/paternal grandmother/.test(q)) rels.push('mother_of_father');
  if (/maternal grandmother/.test(q)) rels.push('mother_of_mother');
  if (/\bgrandfather\b/.test(q) && rels.length === 0) rels.push('grandfather');
  if (/\bgrandmother\b/.test(q) && rels.length === 0) rels.push('grandmother');
  if (/\bfather\b/.test(q)) rels.push('father');
  if (/\bmother\b/.test(q)) rels.push('mother');
  if (/spouse|husband|wife/.test(q)) rels.push('spouse');
  if (/performer/.test(q)) rels.push('performer');
  if (/director/.test(q)) rels.push('director');
  if (/composer/.test(q)) rels.push('composer');
  return [...new Set(rels)];
}

function questionSpans(question) {
  const spans = String(question || '').match(/(?:[A-ZÀ-ÖØ-Þ][\wÀ-ÖØ-öø-ÿ'’.-]*(?:\s+|$)){1,8}/g) || [];
  return spans.map((s) => s.replace(/\s+/g, ' ').trim().replace(/[?.,;:!()[\]{}"']/g, '')).filter((s) => s.length >= 3);
}

function outputLooksLikeType(output, expectedType) {
  const raw = String(output || '').trim();
  const n = norm(raw);
  if (!raw || /^unknown|none|no information|cannot be answered/.test(n)) return false;
  if (expectedType === 'date') return /\b\d{3,4}\b/.test(raw) || /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(raw);
  if (expectedType === 'nationality') return /^[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ -]+$/.test(raw) && !/,/.test(raw);
  if (expectedType === 'country') return /^[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ .'-]+$/.test(raw) && !/place of|film|song/i.test(raw);
  if (expectedType === 'place') return !/place of (birth|death|origin)|the singer|the child|the feature/i.test(raw);
  if (expectedType === 'person_or_org') return !/^\d/.test(raw) && !/place of|nationality|country/i.test(raw);
  return true;
}

function buildFeatures(row) {
  const q = row.question;
  const selected = row.selected_titles || [];
  const selectedNorm = selected.map(norm);
  const expectedType = inferExpectedType(q);
  const relations = inferRelation(q);
  const genericCount = selected.filter(isGenericTitle).length;
  const genericDensity = selected.length ? genericCount / selected.length : 0;
  const uniqueTitles = new Set(selectedNorm).size;
  const duplicateDensity = selected.length ? 1 - uniqueTitles / selected.length : 0;

  const tokenCounts = new Map();
  for (const title of selected) {
    for (const t of new Set(titleTokens(title))) tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
  }
  const dominantTitleTokens = [...tokenCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([token, count]) => ({ token, count }));
  const maxTokenCount = dominantTitleTokens[0]?.count || 0;
  const sameNeighborhoodDensity = selected.length ? maxTokenCount / selected.length : 0;

  const qSpanNorms = questionSpans(q).map(norm).filter(Boolean);
  const matchedQuestionSpans = qSpanNorms.filter((span) => selectedNorm.some((t) => t.includes(span) || span.includes(t)));
  const targetEntitySparse = qSpanNorms.length > 0 && matchedQuestionSpans.length === 0;

  const qn = norm(q);
  const asksAttributeOfOwner = /(place|date|country|nationality).*(father|mother|spouse|husband|wife|performer|director|composer)|(father|mother|spouse|husband|wife|performer|director|composer).*(born|died|from|nationality|graduated|place|date)/.test(qn);
  const relationDepthRisk = relations.some((r) => r.includes('grand') || r.includes('_of_')) || (relations.some((r) => ['father', 'mother', 'spouse'].includes(r)) && sameNeighborhoodDensity >= 0.3);
  const attributeOwnerRisk = asksAttributeOfOwner && (genericCount > 0 || relations.length > 0);
  const answerGranularityRisk = ['date', 'place', 'country', 'nationality'].includes(expectedType) && (genericCount > 0 || sameNeighborhoodDensity >= 0.3);
  const genericDistractorRisk = genericDensity >= 0.3;
  const sameFamilyTitleNeighborhood = sameNeighborhoodDensity >= 0.4 || (relations.length > 0 && sameNeighborhoodDensity >= 0.3);
  const candidateCrowdingRisk = (row.edges || []).length >= 15 || selected.length >= 10 && genericCount >= 3;

  const flags = [];
  if (relationDepthRisk) flags.push('relation_depth_risk');
  if (attributeOwnerRisk) flags.push('attribute_owner_risk');
  if (answerGranularityRisk) flags.push('answer_granularity_risk');
  if (genericDistractorRisk) flags.push('generic_distractor_density');
  if (sameFamilyTitleNeighborhood) flags.push('same_family_title_neighborhood');
  if (candidateCrowdingRisk) flags.push('candidate_crowding');
  if (targetEntitySparse) flags.push('target_entity_sparse');

  return {
    expected_type: expectedType,
    relation_chain_hint: relations,
    generic_title_count: genericCount,
    generic_title_density: Number(genericDensity.toFixed(3)),
    duplicate_title_density: Number(duplicateDensity.toFixed(3)),
    same_neighborhood_density: Number(sameNeighborhoodDensity.toFixed(3)),
    dominant_title_tokens: dominantTitleTokens,
    matched_question_spans: matchedQuestionSpans,
    operational_flags: flags,
  };
}

function compareRun(run) {
  const current = readJson(run.currentPath);
  const config = readJson(run.configPath);
  const currentRows = new Map(current.rows.map((r) => [String(r.qid), r]));
  const cases = [];
  for (const row of config.rows) {
    const cur = currentRows.get(String(row.qid));
    if (!cur) continue;
    const curPath = cur.conditions?.entity_hop_path_prompt || {};
    const cfgPath = row.conditions?.entity_hop_path_prompt || {};
    const emDelta = Number(cfgPath.em || 0) - Number(curPath.em || 0);
    const f1Delta = Number(cfgPath.f1 || 0) - Number(curPath.f1 || 0);
    const containsDelta = Number(cfgPath.contains || 0) - Number(curPath.contains || 0);
    const outcome = emDelta > 0 ? 'win' : emDelta < 0 ? 'loss' : 'tie';
    const features = buildFeatures(row);
    const currentFeatures = buildFeatures(cur);
    cases.push({
      schema: 'realrag.path_risk_case.v1',
      run_id: run.id,
      idx: row.idx,
      qid: row.qid,
      question: row.question,
      gold: row.gold,
      operational: features,
      current_operational: currentFeatures,
      eval: {
        outcome,
        em_delta: emDelta,
        f1_delta: f1Delta,
        contains_delta: containsDelta,
        current_em: Number(curPath.em || 0),
        config0_em: Number(cfgPath.em || 0),
        current_f1: Number(curPath.f1 || 0),
        config0_f1: Number(cfgPath.f1 || 0),
        current_output: String(curPath.output || ''),
        config0_output: String(cfgPath.output || ''),
        config0_output_type_compatible: outputLooksLikeType(cfgPath.output, features.expected_type),
        current_answer_present: Boolean(cur.answer_string_present_in_docs),
        config0_answer_present: Boolean(row.answer_string_present_in_docs),
        current_full_support: Number(cur.full_support_recall || 0),
        config0_full_support: Number(row.full_support_recall || 0),
      },
      selected_titles: row.selected_titles,
      current_titles: cur.selected_titles,
    });
  }
  return { run, current, config, cases };
}

function summarizeCases(id, cases) {
  const n = cases.length || 1;
  const flags = new Map();
  for (const c of cases) {
    const caseFlags = c.operational.operational_flags.length ? c.operational.operational_flags : ['no_flag'];
    for (const f of caseFlags) {
      if (!flags.has(f)) flags.set(f, { count: 0, wins: 0, losses: 0, ties: 0, em_delta_sum: 0, f1_delta_sum: 0 });
      const s = flags.get(f);
      s.count += 1;
      const outcomeKey = c.eval.outcome === 'win' ? 'wins' : c.eval.outcome === 'loss' ? 'losses' : 'ties';
      s[outcomeKey] += 1;
      s.em_delta_sum += c.eval.em_delta;
      s.f1_delta_sum += c.eval.f1_delta;
    }
  }
  const byFlag = [...flags.entries()].map(([flag, s]) => ({
    flag,
    count: s.count,
    share: Number((s.count / n).toFixed(3)),
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    avg_em_delta: Number((s.em_delta_sum / s.count).toFixed(4)),
    avg_f1_delta: Number((s.f1_delta_sum / s.count).toFixed(4)),
    loss_rate: Number((s.losses / s.count).toFixed(3)),
  })).sort((a, b) => b.count - a.count || b.loss_rate - a.loss_rate);

  return {
    id,
    n: cases.length,
    wins: cases.filter((c) => c.eval.outcome === 'win').length,
    losses: cases.filter((c) => c.eval.outcome === 'loss').length,
    ties: cases.filter((c) => c.eval.outcome === 'tie').length,
    avg_em_delta: Number((cases.reduce((s, c) => s + c.eval.em_delta, 0) / n).toFixed(4)),
    avg_f1_delta: Number((cases.reduce((s, c) => s + c.eval.f1_delta, 0) / n).toFixed(4)),
    output_type_mismatch_count: cases.filter((c) => !c.eval.config0_output_type_compatible).length,
    by_flag: byFlag,
  };
}

function mdTable(rows, cols) {
  const header = `| ${cols.map((c) => c.label).join(' | ')} |`;
  const sep = `| ${cols.map((c) => c.align === 'right' ? '---:' : '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${cols.map((c) => c.value(r)).join(' | ')} |`);
  return [header, sep, ...body].join('\n');
}

const compared = RUNS.map(compareRun);
const allCases = compared.flatMap((x) => x.cases);
const summaries = compared.map((x) => summarizeCases(x.run.id, x.cases));
const overall = summarizeCases('overall', allCases);
const summary = {
  schema: 'realrag.path_risk_instrumentation_summary.v1',
  generated_at: new Date().toISOString(),
  runs: summaries,
  overall,
  guard_decision: 'do_not_spend_4090_until_guarded_prompt_or_path_filter_is_tested',
};

writeJson(`${ROOT}/path-risk-instrumentation-summary.json`, summary);
fs.writeFileSync(`${ROOT}/path-risk-cases.jsonl`, allCases.map((c) => JSON.stringify(c)).join('\n') + '\n');

const topFlags = overall.by_flag.slice(0, 8);
const fresh = summaries.find((s) => s.id === 'offset1500');
const known = summaries.find((s) => s.id === 'offset500');
const md = [];
md.push('# Path-risk instrumentation and guard plan');
md.push('');
md.push('## Status');
md.push('');
md.push('Done. This is a no-LLM instrumentation pass over the existing offset500 and offset1500 answer-quality runs.');
md.push('');
md.push('Generated files:');
md.push('');
md.push('```txt');
md.push('path-risk-instrumentation-summary.json');
md.push('path-risk-cases.jsonl');
md.push('path-risk-guard-spec.json');
md.push('```');
md.push('');
md.push('## Why');
md.push('');
md.push('Config0 improved retrieval coverage, but fresh answer quality did not clear the gate. The next step is to identify operational risk states before spending more 4090 time.');
md.push('');
md.push('## Runs analyzed');
md.push('');
md.push(mdTable([known, fresh, overall], [
  { label: 'run', value: (r) => r.id },
  { label: 'n', align: 'right', value: (r) => r.n },
  { label: 'wins', align: 'right', value: (r) => r.wins },
  { label: 'losses', align: 'right', value: (r) => r.losses },
  { label: 'ties', align: 'right', value: (r) => r.ties },
  { label: 'avg EM delta', align: 'right', value: (r) => r.avg_em_delta.toFixed(3) },
  { label: 'avg F1 delta', align: 'right', value: (r) => r.avg_f1_delta.toFixed(3) },
  { label: 'type mismatches', align: 'right', value: (r) => r.output_type_mismatch_count },
]));
md.push('');
md.push('## Operational flags');
md.push('');
md.push(mdTable(topFlags, [
  { label: 'flag', value: (r) => r.flag },
  { label: 'count', align: 'right', value: (r) => r.count },
  { label: 'share', align: 'right', value: (r) => r.share.toFixed(3) },
  { label: 'wins', align: 'right', value: (r) => r.wins },
  { label: 'losses', align: 'right', value: (r) => r.losses },
  { label: 'avg EM delta', align: 'right', value: (r) => r.avg_em_delta.toFixed(3) },
  { label: 'avg F1 delta', align: 'right', value: (r) => r.avg_f1_delta.toFixed(3) },
]));
md.push('');
md.push('## Guard interpretation');
md.push('');
md.push('The risk flags are operational proxies. They do not use the gold answer to decide the guard. Gold is only used in the eval block to count wins and losses after the fact.');
md.push('');
md.push('Most important guard families:');
md.push('');
md.push('```txt');
md.push('attribute_owner_risk');
md.push('relation_depth_risk');
md.push('answer_granularity_risk');
md.push('generic_distractor_density');
md.push('same_family_title_neighborhood');
md.push('```');
md.push('');
md.push('## Decision');
md.push('');
md.push('Do not spend another 4090 run on config0 alone. The next LLM run should test the guarded path prompt or an explicit pre-answer path filter.');
md.push('');
md.push('Minimum next test:');
md.push('');
md.push('```txt');
md.push('offset1500 n100');
md.push('current config0 path_prompt');
md.push('vs config0 guarded_path_prompt');
md.push('same selected docs, only prompt guard changes');
md.push('```');
md.push('');
md.push('Pass condition:');
md.push('');
md.push('```txt');
md.push('losses decrease without erasing wins');
md.push('F1 delta vs unguarded config0 >= +0.03');
md.push('UNKNOWN/refusal rate does not dominate');
md.push('```');
md.push('');
md.push('## Non-claims');
md.push('');
md.push('This instrumentation does not claim that the guards work. It only defines what must be tested before the next positive claim.');
fs.writeFileSync(`${ROOT}/PATH-RISK-INSTRUMENTATION.md`, md.join('\n') + '\n');

const guardSpec = {
  schema: 'realrag.path_guard_spec.v1',
  status: 'ready_for_shadow_or_llm_test',
  no_gold_in_operational_triggers: true,
  guards: [
    {
      id: 'answer_type_contract',
      trigger: 'question surface: when/where/who/nationality/country/place/date/graduated',
      rule: 'Infer expected answer type before generation and reject outputs that are relation labels or wrong semantic type.',
      prompt_line: 'Answer must match the expected type from the question: date, country, nationality, place, person, organization, or short entity/value.',
    },
    {
      id: 'attribute_owner_guard',
      trigger: 'question asks an attribute of father/mother/spouse/performer/director/composer or other owner entity',
      rule: 'Resolve owner entity first, then answer the requested attribute of that owner. Do not answer the owner or the generic attribute label.',
      prompt_line: 'First resolve the owner entity, then answer only that owner\'s requested attribute.',
    },
    {
      id: 'relation_depth_guard',
      trigger: 'question contains father/mother/grandfather/grandmother/paternal/maternal',
      rule: 'Require the relation depth requested by the question. Do not answer a direct parent when a grandparent is requested.',
      prompt_line: 'A grandparent answer needs a two-hop parent-of-parent chain. A parent answer needs exactly the requested parent relation.',
    },
    {
      id: 'generic_title_guard',
      trigger: 'selected titles contain generic ontology/document titles',
      rule: 'Treat generic titles as evidence hints only, never as final answers.',
      prompt_line: 'Generic titles like Place of birth, Place of origin, The Singer, The Child, Story, Model, or The General are not final answers.',
    },
    {
      id: 'same_neighborhood_guard',
      trigger: 'many selected titles share surname, dynasty, title, or family-neighborhood tokens',
      rule: 'Require direct evidence tying the exact relation target, not just a nearby family or title neighbor.',
      prompt_line: 'In dense family/title neighborhoods, answer only if the passage directly supports the exact relation target.',
    },
    {
      id: 'media_chain_guard',
      trigger: 'question contains film/song plus performer/director/composer',
      rule: 'Resolve exact media work first, then relation, then final attribute.',
      prompt_line: 'Resolve the exact film/song first, then the requested performer/director/composer, then the final attribute.',
    },
  ],
};
writeJson(`${ROOT}/path-risk-guard-spec.json`, guardSpec);

console.log(JSON.stringify({
  wrote: [
    `${ROOT}/PATH-RISK-INSTRUMENTATION.md`,
    `${ROOT}/path-risk-instrumentation-summary.json`,
    `${ROOT}/path-risk-cases.jsonl`,
    `${ROOT}/path-risk-guard-spec.json`,
  ],
  overall: summary.overall,
}, null, 2));
