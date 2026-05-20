#!/usr/bin/env node
/**
 * RealRAG R3H: 2Wiki diagnostic analysis for R3G.
 *
 * Diagnoses why 2Wiki does not reproduce the HotpotQA R3B reranker/oracle
 * ladder: by question type, answer style, support sentence placement, and
 * condition-disagreement buckets.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CONDITIONS = ['bm25_top10', 'bge_rerank_top10', 'oracle_first', 'no_support'];

function parseArgs(argv) {
  const args = {
    dataset: 'bench/_datasets/2wiki/data/dev.json',
    records: 'bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/records.jsonl',
    summary: 'bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/summary.json',
    out: null,
    samplesPerBucket: 20,
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
function usage() { console.log('Usage: node build-realrag-2wiki-r3h-diagnostic.mjs --out bench/...'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function readJsonl(p) { return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); }
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function tokenCount(s) { const n = norm(s); return n ? n.split(' ').length : 0; }
function answerClass(answer) {
  const a = String(answer || '').trim();
  const n = norm(a);
  if (n === 'yes' || n === 'no') return 'yes_no';
  if (/^\d+(\.\d+)?$/.test(n)) return 'numeric_only';
  if (/\d/.test(a) && /[a-zA-Z]/.test(a)) return 'mixed_numeric_text';
  const tc = tokenCount(a);
  if (tc <= 1) return 'single_token_entity';
  if (tc <= 3) return 'short_entity';
  return 'long_answer';
}
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
    const sentence_rank = present ? sentenceBaseByParagraphIdx.get(sf.paragraph_idx) + sf.sent_idx : null;
    return { ...sf, present, paragraph_rank, sentence_rank };
  });
  const ranks = facts.map(x => x.sentence_rank).filter(x => x != null);
  return { recall: facts.length ? facts.filter(x => x.present).length / facts.length : 0, rank_min: ranks.length ? Math.min(...ranks) : null, rank_mean: ranks.length ? ranks.reduce((a,b)=>a+b,0)/ranks.length : null, facts };
}
function addAgg(obj, key, rec, item, sent) {
  obj[key] ||= { key, n: 0, closure: 0, em: 0, f1: 0, contains: 0, sfRecall: 0, sfRankMins: [], supportRankMins: [] };
  const a = obj[key];
  a.n++;
  a.closure += rec.metrics?.closure || 0;
  a.em += rec.metrics?.em || 0;
  a.f1 += rec.metrics?.f1 || 0;
  a.contains += rec.metrics?.contains_answer || 0;
  a.sfRecall += sent.recall;
  if (sent.rank_min != null) a.sfRankMins.push(sent.rank_min);
  if (rec.support?.support_rank_min != null) a.supportRankMins.push(rec.support.support_rank_min);
}
function finishAgg(obj) {
  return Object.values(obj).sort((a,b)=>String(a.key).localeCompare(String(b.key))).map(a => ({
    key: a.key, n: a.n,
    closure: a.closure / a.n, em: a.em / a.n, f1: a.f1 / a.n, contains: a.contains / a.n,
    sf_sentence_recall: a.sfRecall / a.n,
    sf_sentence_rank_mean: a.sfRankMins.length ? a.sfRankMins.reduce((x,y)=>x+y,0)/a.sfRankMins.length : null,
    sf_sentence_rank_median: a.sfRankMins.length ? [...a.sfRankMins].sort((x,y)=>x-y)[Math.floor(a.sfRankMins.length/2)] : null,
    support_rank_mean: a.supportRankMins.length ? a.supportRankMins.reduce((x,y)=>x+y,0)/a.supportRankMins.length : null,
  }));
}
function bucket(group) {
  const bm25 = group.bm25_top10?.metrics?.closure || 0;
  const bge = group.bge_rerank_top10?.metrics?.closure || 0;
  const oracle = group.oracle_first?.metrics?.closure || 0;
  const no = group.no_support?.metrics?.closure || 0;
  const out = [];
  if (bge && !bm25) out.push('bge_only_success');
  if (bm25 && !bge) out.push('bm25_only_success');
  if (oracle && !bge && !bm25) out.push('oracle_only_success');
  if (!oracle && (bge || bm25)) out.push('natural_success_oracle_fail');
  if (!oracle && !bge && !bm25) out.push('all_support_conditions_fail');
  if (no) out.push('no_support_success_leakage');
  return out;
}
function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(args.out);
  const datasetRaw = fs.readFileSync(args.dataset);
  const recordsRaw = fs.readFileSync(args.records);
  const sourceSummary = fs.existsSync(args.summary) ? JSON.parse(fs.readFileSync(args.summary, 'utf8')) : null;
  const dataset = JSON.parse(datasetRaw.toString('utf8'));
  const itemById = new Map(dataset.map(item => [item._id, item]));
  const records = readJsonl(args.records);
  const byQid = new Map();
  const byCondition = {}, byTypeCondition = {}, byAnswerClassCondition = {};
  for (const rec of records) {
    const item = itemById.get(rec.qid);
    if (!item) throw new Error(`missing item ${rec.qid}`);
    const sent = sentenceAudit(item, rec);
    byQid.set(rec.qid, byQid.get(rec.qid) || {});
    byQid.get(rec.qid)[rec.condition] = rec;
    addAgg(byCondition, rec.condition, rec, item, sent);
    addAgg(byTypeCondition, `${item.type || 'unknown'}:${rec.condition}`, rec, item, sent);
    addAgg(byAnswerClassCondition, `${answerClass(item.answer)}:${rec.condition}`, rec, item, sent);
  }
  const bucketCounts = {};
  const bucketSamples = {};
  for (const [qid, group] of byQid.entries()) {
    if (!CONDITIONS.every(c => group[c])) continue;
    const item = itemById.get(qid);
    for (const b of bucket(group)) {
      bucketCounts[b] = (bucketCounts[b] || 0) + 1;
      bucketSamples[b] ||= [];
      if (bucketSamples[b].length < args.samplesPerBucket) {
        bucketSamples[b].push({
          qid, type: item.type, answer_class: answerClass(item.answer), question: item.question, answer: item.answer,
          predictions: Object.fromEntries(CONDITIONS.map(c => [c, { prediction: group[c].prediction, closure: group[c].metrics.closure, em: group[c].metrics.em, f1: group[c].metrics.f1, support_rank_min: group[c].support.support_rank_min, context_titles: group[c].context_titles.slice(0, 5) }]))
        });
      }
    }
  }
  const summary = {
    schema: 'realrag.2wiki.r3h.diagnostic.summary.v1',
    created_at: new Date().toISOString(),
    dataset_path: args.dataset,
    dataset_sha256: sha256(datasetRaw),
    records_path: args.records,
    records_sha256: sha256(recordsRaw),
    source_summary_path: args.summary,
    source_status: sourceSummary?.status || null,
    questions: byQid.size,
    records: records.length,
    aggregate: { byCondition: finishAgg(byCondition), byTypeCondition: finishAgg(byTypeCondition), byAnswerClassCondition: finishAgg(byAnswerClassCondition) },
    bucket_counts: bucketCounts,
    interpretation_boundary: ['offline diagnostic only', 'uses answer-side closure and prompt-side support sentence placement', 'does not adjudicate semantic correctness', 'intended to explain R3G non-generalization'],
  };
  fs.writeFileSync(path.join(args.out, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(args.out, 'bucket-samples.json'), JSON.stringify(bucketSamples, null, 2));
  writeMarkdown(args.out, summary, bucketSamples);
  console.log(JSON.stringify({ out: args.out, questions: byQid.size, records: records.length, buckets: bucketCounts }, null, 2));
}
function pct(x) { return `${(x*100).toFixed(1)}%`; }
function writeMarkdown(outDir, summary, bucketSamples) {
  const lines = [];
  lines.push('# RealRAG 2Wiki R3H — diagnostic analysis', '', 'Status: **offline diagnostic complete**', '', '## Boundary', '');
  for (const b of summary.interpretation_boundary) lines.push(`- ${b}.`);
  lines.push('', '## By condition', '', '| condition | n | closure | EM | F1 | SF sentence recall | SF sentence rank mean | support rank mean |', '|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const a of summary.aggregate.byCondition) lines.push(`| ${a.key} | ${a.n} | ${pct(a.closure)} | ${pct(a.em)} | ${pct(a.f1)} | ${pct(a.sf_sentence_recall)} | ${a.sf_sentence_rank_mean == null ? 'n/a' : a.sf_sentence_rank_mean.toFixed(2)} | ${a.support_rank_mean == null ? 'n/a' : a.support_rank_mean.toFixed(2)} |`);
  lines.push('', '## Bucket counts', '', '| bucket | count |', '|---|---:|');
  for (const [k,v] of Object.entries(summary.bucket_counts).sort()) lines.push(`| ${k} | ${v} |`);
  lines.push('', '## By 2Wiki question type', '', '| type:condition | n | closure | SF sentence rank mean |', '|---|---:|---:|---:|');
  for (const a of summary.aggregate.byTypeCondition) lines.push(`| ${a.key} | ${a.n} | ${pct(a.closure)} | ${a.sf_sentence_rank_mean == null ? 'n/a' : a.sf_sentence_rank_mean.toFixed(2)} |`);
  lines.push('', '## By answer class', '', '| answer_class:condition | n | closure |', '|---|---:|---:|');
  for (const a of summary.aggregate.byAnswerClassCondition) lines.push(`| ${a.key} | ${a.n} | ${pct(a.closure)} |`);
  lines.push('', '## Sample buckets', '');
  for (const [bucket, rows] of Object.entries(bucketSamples).sort()) {
    lines.push(`### ${bucket}`, '');
    for (const r of rows.slice(0, 5)) {
      lines.push(`- **${r.qid}** (${r.type}, ${r.answer_class}) — ${r.question}`);
      lines.push(`  - answer: \`${r.answer}\``);
      for (const c of CONDITIONS) lines.push(`  - ${c}: \`${String(r.predictions[c].prediction).slice(0, 140)}\` closure=${r.predictions[c].closure} rank=${r.predictions[c].support_rank_min}`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(outDir, 'RESULTS.md'), lines.join('\n') + '\n');
}
main();
