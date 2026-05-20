#!/usr/bin/env node
/**
 * RealRAG R3C: metric/supporting-facts audit pack for R3B.
 *
 * Builds an offline, public-safe audit package from R3B records:
 * - supporting-facts sentence presence/rank metrics
 * - stratified sample packs for manual audit
 * - metric-risk heuristics, not LLM judging
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CONDITIONS = ['bm25_top10', 'bge_rerank_top10', 'oracle_first', 'no_support'];
const BUCKETS = [
  'bm25_fail_bge_success',
  'bm25_success_bge_fail',
  'bm25_fail_bge_fail_oracle_success',
  'all_support_conditions_fail',
  'oracle_success_bge_fail',
  'bge_success_oracle_fail',
  'no_support_success_leakage',
];

function parseArgs(argv) {
  const args = {
    dataset: 'bench/_datasets/hotpot_dev_distractor_v1.json',
    records: 'bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/records.jsonl',
    summary: 'bench/evidence-utilization-realrag-hotpotqa-r3b-natural-retrieval-2026-05-20/summary.json',
    out: null,
    samplesPerBucket: 25,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') args.dataset = argv[++i];
    else if (a === '--records') args.records = argv[++i];
    else if (a === '--summary') args.summary = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--samples-per-bucket') args.samplesPerBucket = Number(argv[++i]);
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.out) throw new Error('--out is required');
  return args;
}
function usage() { console.log('Usage: node build-realrag-hotpotqa-r3c-audit-pack.mjs --out bench/...'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function readJsonl(p) { return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); }
function normText(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function short(s, n = 600) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function itemContextMap(item) {
  const byIdx = new Map();
  const byTitle = new Map();
  for (let idx = 0; idx < (item.context || []).length; idx++) {
    const [title, sentences] = item.context[idx];
    const p = { idx, title: String(title), sentences: Array.isArray(sentences) ? sentences.map(String) : [String(sentences || '')] };
    byIdx.set(idx, p);
    byTitle.set(String(title), p);
  }
  return { byIdx, byTitle };
}

function supportFacts(item) {
  const { byTitle } = itemContextMap(item);
  return (item.supporting_facts || []).map(([title, sentIdx]) => {
    const p = byTitle.get(String(title));
    const sentence = p?.sentences?.[Number(sentIdx)] ?? null;
    return { title: String(title), sent_idx: Number(sentIdx), paragraph_idx: p?.idx ?? null, sentence };
  });
}

function sentenceAudit(item, rec) {
  const { byIdx } = itemContextMap(item);
  const selected = new Set(rec.context_indices || []);
  const paragraphOrder = rec.context_indices || [];
  const sentenceBaseByParagraphIdx = new Map();
  let cursor = 1;
  for (const idx of paragraphOrder) {
    const p = byIdx.get(idx);
    if (!p) continue;
    sentenceBaseByParagraphIdx.set(idx, cursor);
    cursor += p.sentences.length;
  }
  const facts = supportFacts(item).map(sf => {
    const present = sf.paragraph_idx != null && selected.has(sf.paragraph_idx);
    const paragraph_rank = present ? paragraphOrder.indexOf(sf.paragraph_idx) + 1 : null;
    const sentence_rank = present ? (sentenceBaseByParagraphIdx.get(sf.paragraph_idx) + sf.sent_idx) : null;
    return { ...sf, present, paragraph_rank, sentence_rank };
  });
  const presentCount = facts.filter(x => x.present).length;
  const ranks = facts.map(x => x.sentence_rank).filter(x => x != null);
  return {
    supporting_fact_count: facts.length,
    supporting_fact_sentence_present_count: presentCount,
    supporting_fact_sentence_recall: facts.length ? presentCount / facts.length : 0,
    supporting_fact_sentence_rank_min: ranks.length ? Math.min(...ranks) : null,
    supporting_fact_sentence_rank_all: ranks,
    facts,
  };
}

function metricRisk(rec) {
  const pred = String(rec.prediction || '').trim();
  const gold = String(rec.gold_answer || '').trim();
  const nPred = normText(pred), nGold = normText(gold);
  const m = rec.metrics || {};
  const yesNo = nGold === 'yes' || nGold === 'no';
  const unknown = /^unknown\b/i.test(pred);
  let risk = 'not_closed';
  const flags = [];
  if (unknown) flags.push('prediction_unknown');
  if (yesNo) flags.push('yes_no_gold');
  if (m.em) { risk = 'low_exact_match'; flags.push('exact_match'); }
  else if (m.closure && m.contains_answer) { risk = yesNo ? 'medium_yes_no_contains' : 'medium_contains_only'; flags.push('contains_answer'); }
  else if (m.closure && (m.f1 || 0) >= 0.8) { risk = 'medium_high_f1_only'; flags.push('high_f1'); }
  if (rec.condition === 'no_support' && m.closure) { risk = 'high_no_support_leakage_or_prior'; flags.push('no_support_closure'); }
  if (!m.closure && !unknown && nPred && nPred !== 'unknown') flags.push('non_unknown_failure');
  return { risk, flags };
}

function compactRecord(rec, sentAudit) {
  return {
    condition: rec.condition,
    prediction: rec.prediction,
    metrics: rec.metrics,
    support: rec.support,
    sentence_audit: {
      recall: sentAudit.supporting_fact_sentence_recall,
      rank_min: sentAudit.supporting_fact_sentence_rank_min,
      present_count: sentAudit.supporting_fact_sentence_present_count,
      total: sentAudit.supporting_fact_count,
    },
    metric_risk: metricRisk(rec),
    context_titles: rec.context_titles,
    context_indices: rec.context_indices,
  };
}

function bucketFor(group) {
  const bm25 = group.bm25_top10?.metrics?.closure || 0;
  const bge = group.bge_rerank_top10?.metrics?.closure || 0;
  const oracle = group.oracle_first?.metrics?.closure || 0;
  const noSupport = group.no_support?.metrics?.closure || 0;
  const buckets = [];
  if (!bm25 && bge) buckets.push('bm25_fail_bge_success');
  if (bm25 && !bge) buckets.push('bm25_success_bge_fail');
  if (!bm25 && !bge && oracle) buckets.push('bm25_fail_bge_fail_oracle_success');
  if (!bm25 && !bge && !oracle) buckets.push('all_support_conditions_fail');
  if (oracle && !bge) buckets.push('oracle_success_bge_fail');
  if (bge && !oracle) buckets.push('bge_success_oracle_fail');
  if (noSupport) buckets.push('no_support_success_leakage');
  return buckets;
}

function updateAgg(agg, key, rec, sentAudit) {
  agg[key] ||= { condition: key, n: 0, closure: 0, em: 0, f1: 0, contains: 0, sentenceRecall: 0, sentencePresent: 0, rankMins: [], lowExact: 0, mediumContains: 0, mediumF1: 0, noSupportLeakage: 0 };
  const a = agg[key];
  a.n++;
  a.closure += rec.metrics?.closure || 0;
  a.em += rec.metrics?.em || 0;
  a.f1 += rec.metrics?.f1 || 0;
  a.contains += rec.metrics?.contains_answer || 0;
  a.sentenceRecall += sentAudit.supporting_fact_sentence_recall;
  a.sentencePresent += sentAudit.supporting_fact_sentence_present_count > 0 ? 1 : 0;
  if (sentAudit.supporting_fact_sentence_rank_min != null) a.rankMins.push(sentAudit.supporting_fact_sentence_rank_min);
  const risk = metricRisk(rec).risk;
  if (risk === 'low_exact_match') a.lowExact++;
  else if (risk.includes('contains')) a.mediumContains++;
  else if (risk.includes('f1')) a.mediumF1++;
  else if (risk.includes('no_support')) a.noSupportLeakage++;
}
function finalizeAgg(agg) {
  return Object.values(agg).sort((a, b) => a.condition.localeCompare(b.condition)).map(a => ({
    condition: a.condition,
    n: a.n,
    closure: a.closure / a.n,
    em: a.em / a.n,
    f1: a.f1 / a.n,
    contains: a.contains / a.n,
    supporting_fact_sentence_recall: a.sentenceRecall / a.n,
    supporting_fact_sentence_present_rate: a.sentencePresent / a.n,
    supporting_fact_sentence_rank_mean: a.rankMins.length ? a.rankMins.reduce((x, y) => x + y, 0) / a.rankMins.length : null,
    supporting_fact_sentence_rank_median: a.rankMins.length ? [...a.rankMins].sort((x, y) => x - y)[Math.floor(a.rankMins.length / 2)] : null,
    closure_risk_breakdown: {
      low_exact_match: a.lowExact,
      medium_contains_only: a.mediumContains,
      medium_high_f1_only: a.mediumF1,
      no_support_leakage_or_prior: a.noSupportLeakage,
    },
  }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(args.out);
  const datasetRaw = fs.readFileSync(args.dataset);
  const recordsRaw = fs.readFileSync(args.records);
  const dataset = JSON.parse(datasetRaw.toString('utf8'));
  const sourceSummary = fs.existsSync(args.summary) ? JSON.parse(fs.readFileSync(args.summary, 'utf8')) : null;
  const itemById = new Map(dataset.map(item => [item._id, item]));
  const records = readJsonl(args.records);
  const byQid = new Map();
  const enrichedByQid = new Map();
  const agg = {};
  for (const rec of records) {
    const item = itemById.get(rec.qid);
    if (!item) throw new Error(`missing dataset item ${rec.qid}`);
    const sAudit = sentenceAudit(item, rec);
    updateAgg(agg, rec.condition, rec, sAudit);
    byQid.set(rec.qid, byQid.get(rec.qid) || {});
    byQid.get(rec.qid)[rec.condition] = rec;
    enrichedByQid.set(rec.qid, enrichedByQid.get(rec.qid) || {});
    enrichedByQid.get(rec.qid)[rec.condition] = compactRecord(rec, sAudit);
  }

  const bucketCounts = Object.fromEntries(BUCKETS.map(b => [b, 0]));
  const bucketSamples = Object.fromEntries(BUCKETS.map(b => [b, []]));
  const jsonlRows = [];
  for (const [qid, group] of byQid.entries()) {
    if (!CONDITIONS.every(c => group[c])) continue;
    const item = itemById.get(qid);
    const sf = supportFacts(item);
    const buckets = bucketFor(group);
    for (const b of buckets) bucketCounts[b]++;
    for (const b of buckets) {
      if (bucketSamples[b].length >= args.samplesPerBucket) continue;
      const row = {
        schema: 'realrag.hotpotqa.r3c.audit_sample.v1',
        bucket: b,
        audit_label: 'unreviewed',
        audit_focus: b,
        qid,
        question: item.question,
        gold_answer: item.answer,
        supporting_facts: sf,
        conditions: enrichedByQid.get(qid),
      };
      bucketSamples[b].push(row);
      jsonlRows.push(row);
    }
  }

  const summary = {
    schema: 'realrag.hotpotqa.r3c.metric_support_audit.summary.v1',
    created_at: new Date().toISOString(),
    dataset_path: args.dataset,
    dataset_sha256: sha256(datasetRaw),
    records_path: args.records,
    records_sha256: sha256(recordsRaw),
    source_summary_path: args.summary,
    source_r3b_status: sourceSummary?.status || null,
    selected_questions: byQid.size,
    records: records.length,
    conditions: CONDITIONS,
    aggregate: finalizeAgg(agg),
    bucket_counts: bucketCounts,
    samples_per_bucket: args.samplesPerBucket,
    interpretation_boundary: [
      'offline metric/supporting-facts audit pack',
      'audit_label is unreviewed; this is not an LLM-as-judge result',
      'supporting-fact sentence presence follows HotpotQA paragraph inclusion; it validates prompt inclusion, not internal use',
      'closure remains answer-side EM/contains/F1 derived',
    ],
  };

  fs.writeFileSync(path.join(args.out, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(args.out, 'samples.json'), JSON.stringify(bucketSamples, null, 2));
  fs.writeFileSync(path.join(args.out, 'samples.jsonl'), jsonlRows.map(r => JSON.stringify(r)).join('\n') + '\n');
  writeMarkdown(args.out, summary, bucketSamples);
  console.log(JSON.stringify({ out: args.out, selected_questions: byQid.size, records: records.length, bucket_counts: bucketCounts }, null, 2));
}

function pct(x) { return `${(x * 100).toFixed(1)}%`; }
function writeMarkdown(outDir, summary, bucketSamples) {
  const lines = [];
  lines.push('# RealRAG HotpotQA R3C — metric/supporting-facts audit pack', '');
  lines.push('Status: **offline audit pack generated**', '');
  lines.push('## Boundary', '');
  for (const b of summary.interpretation_boundary) lines.push(`- ${b}.`);
  lines.push('', '## Aggregate sentence-support audit', '');
  lines.push('| condition | n | closure | EM | F1 | SF sentence recall | SF sentence rank mean | closure risk breakdown |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---|');
  for (const a of summary.aggregate) {
    const rb = a.closure_risk_breakdown;
    lines.push(`| ${a.condition} | ${a.n} | ${pct(a.closure)} | ${pct(a.em)} | ${pct(a.f1)} | ${pct(a.supporting_fact_sentence_recall)} | ${a.supporting_fact_sentence_rank_mean == null ? 'n/a' : a.supporting_fact_sentence_rank_mean.toFixed(2)} | exact ${rb.low_exact_match}; contains ${rb.medium_contains_only}; f1 ${rb.medium_high_f1_only}; no-support ${rb.no_support_leakage_or_prior} |`);
  }
  lines.push('', '## Stratified bucket counts', '');
  lines.push('| bucket | count | sample count |');
  lines.push('|---|---:|---:|');
  for (const b of BUCKETS) lines.push(`| ${b} | ${summary.bucket_counts[b]} | ${bucketSamples[b].length} |`);
  lines.push('', '## Sample preview', '');
  for (const b of BUCKETS) {
    lines.push(`### ${b}`, '');
    for (const s of bucketSamples[b].slice(0, 5)) {
      const bm25 = s.conditions.bm25_top10;
      const bge = s.conditions.bge_rerank_top10;
      const oracle = s.conditions.oracle_first;
      const no = s.conditions.no_support;
      lines.push(`- **${s.qid}** — ${s.question}`);
      lines.push(`  - gold: \`${s.gold_answer}\``);
      lines.push(`  - bm25: \`${short(bm25.prediction, 120)}\` closure=${bm25.metrics.closure} sfRank=${bm25.sentence_audit.rank_min}`);
      lines.push(`  - bge: \`${short(bge.prediction, 120)}\` closure=${bge.metrics.closure} sfRank=${bge.sentence_audit.rank_min}`);
      lines.push(`  - oracle: \`${short(oracle.prediction, 120)}\` closure=${oracle.metrics.closure} sfRank=${oracle.sentence_audit.rank_min}`);
      lines.push(`  - no_support: \`${short(no.prediction, 120)}\` closure=${no.metrics.closure}`);
    }
    lines.push('');
  }
  lines.push('## Files', '', '- `summary.json` — aggregate and bucket counts.', '- `samples.json` — grouped samples by bucket.', '- `samples.jsonl` — flat sample rows for review.');
  fs.writeFileSync(path.join(outDir, 'RESULTS.md'), lines.join('\n') + '\n');
}

main();
