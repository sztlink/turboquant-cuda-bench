#!/usr/bin/env node
/**
 * Evidence-utilization audit taxonomy v0.8.
 *
 * Converts existing public-safe aggregate sweeps into audit-risk labels.
 * Boundary: answer-side aggregate risk only. This does not use runtime geometry,
 * does not prove evidence use, and does not evaluate EPKV behavior.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19');
const OUT_RECORDS = path.join(OUT, 'aggregate-audit-records.jsonl');
const OUT_SUMMARY = path.join(OUT, 'summary.json');
const OUT_RESULTS = path.join(OUT, 'RESULTS.md');

const SOURCES = [
  ['phase', 'bench/evidence-utilization-phase-2026-05-17/phase/aggregate.json'],
  ['depth', 'bench/evidence-utilization-phase-2026-05-17/depth/aggregate.json'],
  ['prompt_scaffold', 'bench/evidence-utilization-phase-2026-05-17/prompt-scaffold/aggregate.json'],
  ['distractor_taxonomy', 'bench/evidence-utilization-phase-2026-05-17/distractor-taxonomy/aggregate.json'],
];

function classify({ hitRate, wrongRate, errors, runs }) {
  if (!runs || errors > 0) {
    return { severity: 'gray', label: 'gray_incomplete_or_error_group', reason: 'empty group or aggregate contains errors' };
  }
  if (wrongRate >= 0.30) {
    return { severity: 'red', label: 'red_high_wrong_distractor_rate', reason: 'wrong distractor rate >= 30%' };
  }
  if (hitRate < 0.50) {
    return { severity: 'red', label: 'red_low_hit_rate', reason: 'hit rate < 50%' };
  }
  if (wrongRate >= 0.10) {
    return { severity: 'yellow', label: 'yellow_wrong_distractor_watch', reason: 'wrong distractor rate >= 10%' };
  }
  if (hitRate < 0.75) {
    return { severity: 'yellow', label: 'yellow_moderate_hit_rate', reason: 'hit rate < 75%' };
  }
  return { severity: 'green', label: 'green_aggregate_stable', reason: 'hit rate >= 75% and wrong distractor rate < 10%' };
}

function metricOf(group, key) {
  return Number(group[key] || 0);
}

function collectGroups(sourceName, aggregate) {
  const out = [];
  for (const [groupName, groups] of Object.entries(aggregate.groups || {})) {
    if (!Array.isArray(groups)) continue;
    for (const g of groups) {
      const runs = metricOf(g, 'runs');
      const hits = metricOf(g, 'hits');
      const wrong = metricOf(g, 'wrong_decoy') + metricOf(g, 'wrong_distractor');
      const errors = metricOf(g, 'errors');
      const hitRate = runs ? hits / runs : 0;
      const wrongRate = runs ? wrong / runs : 0;
      const c = classify({ hitRate, wrongRate, errors, runs });
      out.push({
        audit_schema: 'evidence_utilization.aggregate_audit.v0.8',
        source: sourceName,
        group: groupName,
        keys: g.keys || {},
        runs,
        hits,
        wrong_distractor_or_decoy: wrong,
        errors,
        hit_rate: hitRate,
        wrong_rate: wrongRate,
        audit_severity: c.severity,
        audit_label: c.label,
        audit_reason: c.reason,
        boundary: {
          aggregate_answer_side: true,
          runtime_geometry: false,
          model_attention: false,
          evidence_use_proof: false,
          epkv_behavior: false,
        },
      });
    }
  }
  return out;
}

function top(records, predicate, sortFn, n = 10) {
  return records.filter(predicate).sort(sortFn).slice(0, n);
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const records = [];
  for (const [name, rel] of SOURCES) {
    const file = path.join(ROOT, rel);
    const aggregate = JSON.parse(fs.readFileSync(file, 'utf8'));
    records.push(...collectGroups(name, aggregate));
  }
  records.sort((a, b) => `${a.source}/${a.group}/${JSON.stringify(a.keys)}`.localeCompare(`${b.source}/${b.group}/${JSON.stringify(b.keys)}`));
  fs.writeFileSync(OUT_RECORDS, records.map((r) => JSON.stringify(r)).join('\n') + '\n');

  const bySeverity = {};
  const byLabel = {};
  const bySource = {};
  for (const r of records) {
    bySeverity[r.audit_severity] = (bySeverity[r.audit_severity] || 0) + 1;
    byLabel[r.audit_label] = (byLabel[r.audit_label] || 0) + 1;
    bySource[r.source] ||= { records: 0, severities: {}, labels: {} };
    bySource[r.source].records += 1;
    bySource[r.source].severities[r.audit_severity] = (bySource[r.source].severities[r.audit_severity] || 0) + 1;
    bySource[r.source].labels[r.audit_label] = (bySource[r.source].labels[r.audit_label] || 0) + 1;
  }
  const redWrong = top(records, (r) => r.wrong_rate > 0, (a, b) => b.wrong_rate - a.wrong_rate, 12);
  const redLowHit = top(records, () => true, (a, b) => a.hit_rate - b.hit_rate, 12);
  const greenStable = top(records, (r) => r.audit_severity === 'green', (a, b) => b.runs - a.runs || b.hit_rate - a.hit_rate, 12);

  const summary = {
    audit_version: 'v0.8-aggregate-audit-taxonomy',
    records: records.length,
    sources: Object.fromEntries(SOURCES),
    output_records: path.relative(ROOT, OUT_RECORDS),
    by_severity: bySeverity,
    by_label: byLabel,
    by_source: bySource,
    top_wrong_rate: redWrong,
    lowest_hit_rate: redLowHit,
    stable_green_examples: greenStable,
    thresholds: {
      red_high_wrong_distractor_rate: 'wrong_rate >= 0.30',
      red_low_hit_rate: 'hit_rate < 0.50',
      yellow_wrong_distractor_watch: 'wrong_rate >= 0.10',
      yellow_moderate_hit_rate: 'hit_rate < 0.75',
      green_aggregate_stable: 'hit_rate >= 0.75 and wrong_rate < 0.10',
    },
    boundary: {
      aggregate_answer_side: true,
      runtime_geometry: false,
      model_attention: false,
      evidence_use_proof: false,
      epkv_behavior: false,
    },
  };
  fs.writeFileSync(OUT_SUMMARY, JSON.stringify(summary, null, 2));

  const renderRows = (arr) => arr.map((r) => `| ${r.source} | ${r.group} | \`${JSON.stringify(r.keys)}\` | ${r.runs} | ${r.hit_rate.toFixed(3)} | ${r.wrong_rate.toFixed(3)} | ${r.audit_label} |`).join('\n');
  fs.writeFileSync(OUT_RESULTS, [
    '# Evidence-utilization aggregate audit taxonomy v0.8 — 2026-05-19',
    '',
    '> Converts existing aggregate sweeps into answer-side risk labels. This is not runtime geometry and not proof of evidence use.',
    '',
    '## Boundary',
    '',
    '```txt',
    'source: existing aggregate sweeps only',
    'runtime geometry: no',
    'model attention: no',
    'evidence-use proof: no',
    'EPKV behavior: no',
    '```',
    '',
    '## Artifacts',
    '',
    '```txt',
    path.relative(ROOT, OUT_RECORDS),
    path.relative(ROOT, OUT_SUMMARY),
    '```',
    '',
    '## Result',
    '',
    '```txt',
    `records: ${records.length}`,
    `by_severity: ${JSON.stringify(bySeverity)}`,
    `by_label: ${JSON.stringify(byLabel)}`,
    '```',
    '',
    '## Highest wrong-rate groups',
    '',
    '| source | group | keys | runs | hit_rate | wrong_rate | label |',
    '|---|---|---:|---:|---:|---:|---|',
    renderRows(redWrong.slice(0, 8)),
    '',
    '## Lowest hit-rate groups',
    '',
    '| source | group | keys | runs | hit_rate | wrong_rate | label |',
    '|---|---|---:|---:|---:|---:|---|',
    renderRows(redLowHit.slice(0, 8)),
    '',
    '## Stable green examples',
    '',
    '| source | group | keys | runs | hit_rate | wrong_rate | label |',
    '|---|---|---:|---:|---:|---:|---|',
    renderRows(greenStable.slice(0, 8)),
    '',
    '## Decision',
    '',
    '```txt',
    'The evidence-utilization side now has a reusable aggregate audit taxonomy.',
    'It complements the v0.7 geometry bridge but remains answer-side aggregate risk only.',
    'Use it to prioritize which fixture families should receive geometry/runtime bridge coverage next.',
    '```',
    '',
    '## Non-claims',
    '',
    '- Not EPKV behavior.',
    '- Not runtime telemetry.',
    '- Not production attention.',
    '- Not evidence-use proof.',
    '- Not answer-quality improvement evidence.',
  ].join('\n') + '\n');

  console.log(JSON.stringify(summary, null, 2));
}

main();
