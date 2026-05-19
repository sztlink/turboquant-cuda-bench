#!/usr/bin/env node
/**
 * EPKV bridge v0.7 — answer audit bridge.
 *
 * Joins evidence-utilization bridge records with schema-valid selected-position
 * geometry events and emits privacy-preserving audit labels.
 *
 * Boundary: audit taxonomy over existing offline/synthetic artifacts only.
 * Labels are compatibility states, not proof of model evidence use.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const RECORDS = path.join(ROOT, 'bench/evidence-utilization-epkv-offline-kv-replay-2026-05-19/records.jsonl');
const EVENTS = path.join(ROOT, 'bench/evidence-utilization-epkv-hookoff-telemetry-bridge-2026-05-19/events.jsonl');
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-answer-audit-bridge-2026-05-19');
const OUT_RECORDS = path.join(OUT, 'audit-records.jsonl');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function proxyClass(proxy) {
  if (!proxy) return 'unknown';
  const hit = Number(proxy.hit_rate || 0);
  const wrong = Number(proxy.wrong_distractor_rate || 0);
  if (hit > wrong) return 'canonical';
  if (wrong > hit) return 'decoy';
  return 'neither';
}

function classify({ proxy, geometry }) {
  if (!geometry) return { label: 'gray_no_geometry', severity: 'gray', reason: 'missing selected-position geometry' };
  const counts = geometry.region_counts || {};
  const canonical = Number(counts.canonical_positions || 0);
  const decoy = Number(counts.decoy_positions || 0);
  const neither = Number(counts.neither_positions || 0);
  const total = canonical + decoy + neither;
  if (!total) return { label: 'gray_no_selected_positions', severity: 'gray', reason: 'zero selected positions in geometry' };
  const pClass = proxyClass(proxy);
  const dominant = geometry.dominant_region || 'unknown';
  const canonicalShare = canonical / total;
  const decoyShare = decoy / total;
  const neitherShare = neither / total;

  if (pClass === 'canonical' && dominant === 'canonical') {
    return { label: 'green_canonical_geometry_compatible', severity: 'green', reason: 'proxy class and selected-position geometry both canonical-dominant' };
  }
  if (pClass === 'decoy' && dominant === 'decoy') {
    return { label: 'red_decoy_geometry_compatible_with_wrong_proxy', severity: 'red', reason: 'wrong-distractor proxy and selected-position geometry both decoy-dominant' };
  }
  if (dominant === 'decoy' && decoyShare >= canonicalShare) {
    return { label: 'red_decoy_geometry_risk', severity: 'red', reason: 'selected-position geometry is decoy-dominant or decoy-heavy' };
  }
  if (dominant === 'canonical' && pClass === 'decoy') {
    return { label: 'yellow_geometry_proxy_disagreement', severity: 'yellow', reason: 'geometry canonical-dominant but aggregate answer proxy is decoy-dominant' };
  }
  if (dominant === 'neither' || neitherShare > 0.4) {
    return { label: 'yellow_neither_geometry_inconclusive', severity: 'yellow', reason: 'selected-position geometry mostly outside canonical/decoy spans' };
  }
  return { label: 'yellow_mixed_geometry', severity: 'yellow', reason: 'no single safe compatibility label' };
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const records = readJsonl(RECORDS);
  const events = readJsonl(EVENTS);
  if (records.length !== events.length) throw new Error(`record/event count mismatch: ${records.length} vs ${events.length}`);

  const audit = records.map((rec, i) => {
    const ev = events[i];
    const proxy = rec.answer?.aggregate_proxy;
    const geometry = ev.selection_geometry;
    const c = classify({ proxy, geometry });
    return {
      audit_schema: 'epkv.evidence_utilization.audit.v0.7',
      fixture_id: rec.fixture_id,
      source_bridge_version: rec.bridge_version,
      telemetry_schema: ev.schema,
      telemetry_mode: ev.mode,
      evidence_geometry: {
        canonical_rank: rec.evidence?.canonical_rank,
        distractor_type: rec.evidence?.distractor_type,
        decoys_before: rec.evidence?.decoys_before,
        canonical_page_range: rec.evidence?.canonical_page_range,
        decoy_count: rec.evidence?.decoy_spans?.length || 0,
      },
      answer_proxy: {
        class: proxyClass(proxy),
        hit_rate: proxy?.hit_rate,
        wrong_distractor_rate: proxy?.wrong_distractor_rate,
        observed: rec.answer?.observed,
        reason_not_observed: rec.answer?.reason_not_observed,
      },
      selection_geometry: {
        dominant_region: geometry?.dominant_region,
        region_counts: geometry?.region_counts,
        selected_positions_total: geometry?.selected_positions_total,
        selected_page_range: geometry?.selected_page_range,
        overlaps: geometry?.overlaps,
      },
      audit_label: c.label,
      audit_severity: c.severity,
      audit_reason: c.reason,
      boundary: {
        offline: true,
        synthetic_selected_positions: true,
        model_attention: false,
        evidence_use_proof: false,
        serving: false,
      },
    };
  });

  fs.writeFileSync(OUT_RECORDS, audit.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const labels = {};
  const severities = {};
  const proxyClasses = {};
  const dominantRegions = {};
  for (const r of audit) {
    labels[r.audit_label] = (labels[r.audit_label] || 0) + 1;
    severities[r.audit_severity] = (severities[r.audit_severity] || 0) + 1;
    proxyClasses[r.answer_proxy.class] = (proxyClasses[r.answer_proxy.class] || 0) + 1;
    dominantRegions[r.selection_geometry.dominant_region] = (dominantRegions[r.selection_geometry.dominant_region] || 0) + 1;
  }
  const summary = {
    audit_version: 'v0.7-answer-audit-bridge',
    records: audit.length,
    source_records: path.relative(ROOT, RECORDS),
    source_events: path.relative(ROOT, EVENTS),
    output_records: path.relative(ROOT, OUT_RECORDS),
    labels,
    severities,
    proxy_classes: proxyClasses,
    dominant_regions: dominantRegions,
    boundary: {
      offline: true,
      synthetic_selected_positions: true,
      model_attention: false,
      evidence_use_proof: false,
      serving: false,
    },
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));

  const lines = [
    '# Evidence-utilization EPKV answer audit bridge v0.7 — 2026-05-19',
    '',
    '> Joins evidence-utilization fixtures with selected-position geometry and emits audit labels. Offline only; labels are compatibility states, not proof of evidence use.',
    '',
    '## Boundary',
    '',
    '```txt',
    'source records: offline KV replay v0.3',
    'source telemetry: hook-off runtime schema bridge v0.4',
    'serving: no',
    'model attention: no',
    'evidence-use proof: no',
    '```',
    '',
    '## Artifacts',
    '',
    '```txt',
    path.relative(ROOT, OUT_RECORDS),
    path.relative(ROOT, SUMMARY),
    '```',
    '',
    '## Result',
    '',
    '```txt',
    `records: ${audit.length}`,
    `severities: ${JSON.stringify(severities)}`,
    `labels: ${JSON.stringify(labels)}`,
    `answer proxy classes: ${JSON.stringify(proxyClasses)}`,
    `dominant geometry regions: ${JSON.stringify(dominantRegions)}`,
    '```',
    '',
    '## Label semantics',
    '',
    '| severity | meaning |',
    '|---|---|',
    '| green | answer proxy and selected-position geometry are canonical-compatible |',
    '| yellow | geometry/proxy relationship is mixed or inconclusive |',
    '| red | selected-position geometry is decoy-compatible or decoy-risk |',
    '| gray | insufficient geometry |',
    '',
    '## Decision',
    '',
    '```txt',
    'The bridge can now emit an evidence-utilization audit layer over existing offline artifacts.',
    'This is the first complete retrieval-span -> geometry -> audit-label scaffold.',
    'It remains synthetic/offline and does not prove model evidence use.',
    '```',
    '',
    '## Non-claims',
    '',
    '- Not production attention.',
    '- Not serving.',
    '- Not answer-quality evidence.',
    '- Not evidence-utilization improvement evidence.',
    '- Audit labels are compatibility states, not proof of model use.',
  ];
  fs.writeFileSync(RESULTS, lines.join('\n') + '\n');
  console.log(JSON.stringify(summary, null, 2));
}

main();
