#!/usr/bin/env node
/**
 * EPKV evidence-path ledger v1.4.
 *
 * Indexes the offline evidence-utilization chain from aggregate taxonomy through
 * target selection/materialization/action/replay/validation.
 *
 * Boundary: audit ledger only. No serving, runtime hook, model call, attention,
 * or evidence-use proof.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'bench/evidence-utilization-epkv-evidence-path-ledger-2026-05-19');
const LEDGER = path.join(OUT, 'evidence-path-ledger.json');
const SUMMARY = path.join(OUT, 'summary.json');
const RESULTS = path.join(OUT, 'RESULTS.md');

const STAGES = [
  {
    id: 'v0.8',
    name: 'aggregate audit taxonomy',
    commit: '0c9d461',
    receipt: 'bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/RESULTS.md',
    primary: 'bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/aggregate-audit-records.jsonl',
    summary: 'bench/evidence-utilization-epkv-audit-taxonomy-2026-05-19/summary.json',
    proves: ['aggregate answer-side risk labels over existing sweeps'],
    does_not_prove: ['runtime geometry', 'EPKV behavior', 'evidence use'],
  },
  {
    id: 'v0.9',
    name: 'bridge target selection',
    commit: 'f1527a7',
    receipt: 'bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/RESULTS.md',
    primary: 'bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/bridge-target-queue.json',
    summary: 'bench/evidence-utilization-epkv-bridge-target-selection-2026-05-19/summary.json',
    proves: ['high-risk families selected for bridge coverage'],
    does_not_prove: ['runtime execution', 'model behavior', 'evidence use'],
  },
  {
    id: 'v1.0',
    name: 'target materialization',
    commit: '4270e00',
    receipt: 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/RESULTS.md',
    primary: 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/events.jsonl',
    summary: 'bench/evidence-utilization-epkv-target-materialization-2026-05-19/summary.json',
    proves: ['synthetic hook-off telemetry events can represent selected-position geometry'],
    does_not_prove: ['live request telemetry', 'model attention', 'evidence use'],
  },
  {
    id: 'v1.1',
    name: 'audit join action table',
    commit: '61b11eb',
    receipt: 'bench/evidence-utilization-epkv-audit-join-2026-05-19/RESULTS.md',
    primary: 'bench/evidence-utilization-epkv-audit-join-2026-05-19/target-action-table.jsonl',
    summary: 'bench/evidence-utilization-epkv-audit-join-2026-05-19/summary.json',
    proves: ['target action states can be derived from queue/materialization/validator'],
    does_not_prove: ['deployment readiness', 'runtime behavior', 'evidence use'],
  },
  {
    id: 'v1.2',
    name: 'bridge replay pack',
    commit: '8a56615',
    receipt: 'bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/RESULTS.md',
    primary: 'bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/bridge-replay-pack.jsonl',
    summary: 'bench/evidence-utilization-epkv-bridge-replay-pack-2026-05-19/summary.json',
    proves: ['bridge-ready targets can be compacted into privacy-safe replay records'],
    does_not_prove: ['live request tracing', 'runtime behavior', 'evidence use'],
  },
  {
    id: 'v1.3',
    name: 'replay pack validator',
    commit: 'f8dc52f',
    receipt: 'bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/RESULTS.md',
    primary: 'bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/validation-report.json',
    summary: 'bench/evidence-utilization-epkv-replay-pack-validator-2026-05-19/validation-report.json',
    proves: ['replay pack invariants pass'],
    does_not_prove: ['model behavior', 'serving readiness', 'evidence use'],
  },
];

function shaFile(rel) {
  const file = path.join(ROOT, rel);
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function fileSize(rel) {
  return fs.statSync(path.join(ROOT, rel)).size;
}

function maybeSummary(rel) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
  catch { return null; }
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const stages = STAGES.map((s) => ({
    ...s,
    artifacts: {
      receipt: { path: s.receipt, sha256: shaFile(s.receipt), bytes: fileSize(s.receipt) },
      primary: { path: s.primary, sha256: shaFile(s.primary), bytes: fileSize(s.primary) },
      summary: { path: s.summary, sha256: shaFile(s.summary), bytes: fileSize(s.summary) },
    },
    summary_snapshot: maybeSummary(s.summary),
    boundary: {
      offline: true,
      synthetic_or_aggregate: true,
      serving: false,
      runtime_hook_live: false,
      model_call: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  }));
  const ledger = {
    ledger_schema: 'epkv.evidence_path_ledger.v1.4',
    created_at: new Date().toISOString(),
    chain: stages.map((s) => s.id).join(' -> '),
    stages,
    chain_invariants: {
      all_receipts_present: stages.every((s) => fs.existsSync(path.join(ROOT, s.receipt))),
      all_primary_artifacts_present: stages.every((s) => fs.existsSync(path.join(ROOT, s.primary))),
      all_boundaries_non_serving: stages.every((s) => s.boundary.serving === false && s.boundary.runtime_hook_live === false),
      no_stage_claims_model_attention: stages.every((s) => s.boundary.model_attention === false),
      no_stage_claims_evidence_use_proof: stages.every((s) => s.boundary.evidence_use_proof === false),
    },
    public_safe_thesis: 'retrieval spans -> token/page ranges -> selected-position geometry -> telemetry schema -> audit action, without claiming attention or evidence use',
    boundary: {
      ledger_only: true,
      serving: false,
      runtime_hook_live: false,
      model_call: false,
      model_attention: false,
      evidence_use_proof: false,
    },
  };
  fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
  const summary = {
    ledger_version: 'v1.4-evidence-path-ledger',
    stages: stages.length,
    chain: ledger.chain,
    chain_invariants: ledger.chain_invariants,
    ledger_sha256: shaFile(path.relative(ROOT, LEDGER)),
    artifacts: { ledger: path.relative(ROOT, LEDGER), summary: path.relative(ROOT, SUMMARY) },
    boundary: ledger.boundary,
  };
  fs.writeFileSync(SUMMARY, JSON.stringify(summary, null, 2));
  const rows = stages.map((s) => `| ${s.id} | ${s.name} | ${s.commit} | \`${s.primary}\` |`).join('\n');
  fs.writeFileSync(RESULTS, [
    '# EPKV evidence-path ledger v1.4 — 2026-05-19',
    '',
    '> Single offline audit ledger for the evidence-utilization chain.',
    '',
    '## Boundary',
    '',
    '```txt',
    'ledger only: yes',
    'serving: no',
    'runtime hook live: no',
    'model call: no',
    'model attention: no',
    'evidence-use proof: no',
    '```',
    '',
    '## Artifacts',
    '',
    '```txt',
    path.relative(ROOT, LEDGER),
    path.relative(ROOT, SUMMARY),
    '```',
    '',
    '## Chain',
    '',
    '```txt',
    ledger.chain,
    '```',
    '',
    '## Stages',
    '',
    '| stage | name | commit | primary artifact |',
    '|---|---|---|---|',
    rows,
    '',
    '## Invariants',
    '',
    '```txt',
    JSON.stringify(ledger.chain_invariants, null, 2),
    '```',
    '',
    '## Decision',
    '',
    '```txt',
    'The offline evidence-path chain is now auditable from aggregate risk through replay-pack validation.',
    'Next autonomous packet: ask Claude/reviewer to audit the chain, then refine any flagged issue or generate a concise public-safe technical note.',
    'Hard stops remain closed for live hooks, serving mutation, and external publication.',
    '```',
    '',
    '## Non-claims',
    '',
    '- Not runtime telemetry from a live request.',
    '- Not EPKV behavior.',
    '- Not model attention.',
    '- Not evidence-use proof.',
    '- Not serving readiness.',
  ].join('\n') + '\n');
  console.log(JSON.stringify(summary, null, 2));
}

main();
