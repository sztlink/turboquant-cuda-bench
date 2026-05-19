#!/usr/bin/env node
/**
 * EPKV bridge target selection v0.9.
 *
 * Uses the v0.8 aggregate audit taxonomy to choose the next fixture families
 * that should receive span/page/geometry bridge coverage.
 *
 * Boundary: planning artifact only. No serving, no runtime hook, no model call.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const IN = path.join(ROOT, 'bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/aggregate-audit-records.jsonl');
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19');
const QUEUE = path.join(OUT, 'bridge-target-queue.json');
const FIXTURES = path.join(OUT, 'bridge-fixture-skeletons.jsonl');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function priority(r) {
  const severity = r.audit_severity === 'red' ? 100 : r.audit_severity === 'yellow' ? 50 : 0;
  const wrong = Number(r.wrong_rate || 0) * 80;
  const miss = (1 - Number(r.hit_rate || 0)) * 40;
  const size = Math.log10(Math.max(1, Number(r.runs || 1))) * 8;
  const groupBonus = /by_distractor_rank|by_zone_rank_prompt|by_prompt_decoys/.test(r.group) ? 12 : 0;
  return severity + wrong + miss + size + groupBonus;
}

function familyKey(r) {
  const k = r.keys || {};
  return [
    r.source,
    k.distractor || 'generic',
    k.canonical_rank ?? 'rank_any',
    k.decoys_before ?? 'decoys_any',
    k.zone || 'zone_any',
    k.prompt || 'prompt_any',
  ].join('|');
}

function inferDistractorType(r) {
  const k = r.keys || {};
  if (k.distractor) return k.distractor;
  if (Number(k.decoys_before || 0) > 0) return 'explicit_decoy';
  if (r.source === 'phase') return 'phase_decoy';
  return 'generic_competitor';
}

function inferDecoysBefore(r) {
  const k = r.keys || {};
  if (Number.isFinite(Number(k.decoys_before))) return Number(k.decoys_before);
  if (Number.isFinite(Number(k.canonical_rank))) return Math.max(0, Number(k.canonical_rank) - 1);
  return null;
}

function inferRank(r) {
  const k = r.keys || {};
  if (Number.isFinite(Number(k.canonical_rank))) return Number(k.canonical_rank);
  return null;
}

function targetFromRecord(r, index) {
  const k = r.keys || {};
  const distractorType = inferDistractorType(r);
  const canonicalRank = inferRank(r);
  const decoysBefore = inferDecoysBefore(r);
  const risk = r.wrong_rate >= 0.3 ? 'decoy_capture_risk' : r.hit_rate < 0.5 ? 'evidence_nonclosure_risk' : 'mixed_evidence_risk';
  return {
    target_id: `bridge-target-${String(index + 1).padStart(2, '0')}`,
    priority_score: Number(priority(r).toFixed(3)),
    source_audit_record: {
      source: r.source,
      group: r.group,
      keys: k,
      runs: r.runs,
      hit_rate: r.hit_rate,
      wrong_rate: r.wrong_rate,
      audit_label: r.audit_label,
    },
    bridge_family: {
      risk,
      distractor_type: distractorType,
      canonical_rank: canonicalRank,
      decoys_before: decoysBefore,
      prompt_variant: k.prompt || null,
      zone: k.zone || null,
      depth_chars: k.depth_chars || null,
    },
    fixture_requirements: {
      include_canonical_span: true,
      include_decoy_spans: distractorType !== 'unrelated_noise',
      include_token_page_ranges: true,
      include_selected_position_geometry: true,
      include_schema_v1_runtime_event: true,
      hook_mode: 'hook-off-or-offline-dry-run',
    },
    expected_audit_question: risk === 'decoy_capture_risk'
      ? 'Do selected-position geometry and answer-side wrong-distractor risk point to the same decoy family?'
      : 'Does selected-position geometry miss canonical evidence when aggregate hit rate collapses?',
    non_claims: [
      'not model attention',
      'not evidence-use proof',
      'not EPKV behavior until bridged through runtime schema',
      'not serving readiness',
    ],
  };
}

function skeletonFromTarget(t) {
  const rank = t.bridge_family.canonical_rank ?? 16;
  const decoys = t.bridge_family.decoys_before ?? Math.max(0, rank - 1);
  const canonicalStartPage = Math.max(2, decoys + 2);
  const decoyPages = Array.from({ length: Math.min(decoys, 8) }, (_, i) => i + 1);
  return {
    skeleton_schema: 'epkv.bridge_fixture_skeleton.v0.9',
    target_id: t.target_id,
    fixture_id: `${t.target_id}-${t.bridge_family.distractor_type}`,
    canonical_rank: rank,
    distractor_type: t.bridge_family.distractor_type,
    decoys_before: decoys,
    prompt_variant: t.bridge_family.prompt_variant,
    zone: t.bridge_family.zone,
    synthetic_layout: {
      page_size_tokens: 16,
      canonical_page_range: [canonicalStartPage, canonicalStartPage + 1],
      decoy_page_ranges: decoyPages.map((p) => [p, p]),
      neutral_page_ranges: [[canonicalStartPage + 2, canonicalStartPage + 8]],
    },
    bridge_steps: [
      'materialize synthetic retrieval span metadata',
      'tokenize or assign page ranges',
      'build hook-off telemetry event with selected-position geometry',
      'run validate-epkv-runtime-telemetry.mjs',
      'emit audit label; keep label as compatibility state only',
    ],
    boundary: {
      synthetic_layout: true,
      serving: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  };
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const records = readJsonl(IN);
  const candidates = records
    .filter((r) => r.audit_severity === 'red' || r.audit_label === 'yellow_wrong_distractor_watch')
    .sort((a, b) => priority(b) - priority(a));

  const selected = [];
  const seen = new Set();
  for (const r of candidates) {
    const key = familyKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(r);
    if (selected.length >= 16) break;
  }

  const targets = selected.map(targetFromRecord);
  const skeletons = targets.map(skeletonFromTarget);
  fs.writeFileSync(QUEUE, JSON.stringify({
    queue_schema: 'epkv.bridge_target_queue.v0.9',
    created_at: new Date().toISOString(),
    source: path.relative(ROOT, IN),
    targets,
    boundary: {
      planning_only: true,
      serving: false,
      runtime_hook: false,
      model_call: false,
    },
  }, null, 2));
  fs.writeFileSync(FIXTURES, skeletons.map((x) => JSON.stringify(x)).join('\n') + '\n');

  const byRisk = {};
  const byDistractor = {};
  for (const t of targets) {
    byRisk[t.bridge_family.risk] = (byRisk[t.bridge_family.risk] || 0) + 1;
    byDistractor[t.bridge_family.distractor_type] = (byDistractor[t.bridge_family.distractor_type] || 0) + 1;
  }
  const summary = {
    selection_version: 'v0.9-bridge-target-selection',
    targets: targets.length,
    source_records: records.length,
    candidate_records: candidates.length,
    by_risk: byRisk,
    by_distractor: byDistractor,
    top_targets: targets.slice(0, 8),
    artifacts: {
      queue: path.relative(ROOT, QUEUE),
      fixture_skeletons: path.relative(ROOT, FIXTURES),
    },
    boundary: {
      planning_only: true,
      serving: false,
      runtime_hook: false,
      model_call: false,
    },
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));

  const rows = targets.slice(0, 12).map((t) => `| ${t.target_id} | ${t.bridge_family.risk} | ${t.bridge_family.distractor_type} | ${t.bridge_family.canonical_rank ?? 'any'} | ${t.bridge_family.decoys_before ?? 'unknown'} | ${t.source_audit_record.hit_rate.toFixed(3)} | ${t.source_audit_record.wrong_rate.toFixed(3)} | ${t.priority_score} |`).join('\n');
  fs.writeFileSync(RESULTS, [
    '# EPKV bridge target selection v0.9 — 2026-05-19',
    '',
    '> Selects high-risk aggregate evidence-utilization families for the next hook-off geometry bridge pass.',
    '',
    '## Boundary',
    '',
    '```txt',
    'planning only: yes',
    'serving: no',
    'runtime hook: no',
    'model call: no',
    'evidence-use proof: no',
    '```',
    '',
    '## Artifacts',
    '',
    '```txt',
    path.relative(ROOT, QUEUE),
    path.relative(ROOT, FIXTURES),
    path.relative(ROOT, SUMMARY),
    '```',
    '',
    '## Result',
    '',
    '```txt',
    `source audit records: ${records.length}`,
    `candidate records: ${candidates.length}`,
    `selected targets: ${targets.length}`,
    `by_risk: ${JSON.stringify(byRisk)}`,
    `by_distractor: ${JSON.stringify(byDistractor)}`,
    '```',
    '',
    '## Top targets',
    '',
    '| target | risk | distractor | rank | decoys_before | hit_rate | wrong_rate | priority |',
    '|---|---|---|---:|---:|---:|---:|---:|',
    rows,
    '',
    '## Decision',
    '',
    '```txt',
    'The next bridge work should start with stale_record/conflicting_correction/near_duplicate rank-16 and rank-8 families.',
    'These are the strongest answer-side risk cases and should receive synthetic span/page/selected-geometry coverage before any live prompt work.',
    '```',
    '',
    '## Non-claims',
    '',
    '- Not runtime telemetry.',
    '- Not EPKV behavior.',
    '- Not model attention.',
    '- Not evidence-use proof.',
    '- Not serving readiness.',
  ].join('\n') + '\n');

  console.log(JSON.stringify(summary, null, 2));
}

main();
