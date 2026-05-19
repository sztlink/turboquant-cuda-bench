#!/usr/bin/env node
// Synthetic selected-position replay v0.2 for the tokenized EPKV bridge.
//
// Boundary:
//   - no model inference;
//   - no vLLM serving;
//   - no real EPKV scoring/selection;
//   - deterministic schema replay only, using token/page ranges from bridge v0.1.
//
// Purpose: validate the alignment record shape before any real KV replay or
// dry-run serving trace. The replay policy is intentionally labeled synthetic.

import fs from 'fs';
import path from 'path';
import url from 'url';

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_IN = path.join(REPO_ROOT, 'bench', 'evidence-utilization-epkv-bridge-tokenized-2026-05-19', 'records.jsonl');
const DEFAULT_OUT = path.join(REPO_ROOT, 'bench', 'evidence-utilization-epkv-bridge-replay-2026-05-19');
const IN = process.env.IN || DEFAULT_IN;
const OUT = process.env.OUT || DEFAULT_OUT;
const H = Number(process.env.HQ || 28);
const K = Number(process.env.K || 32);
const TRACE_TOP_N = Number(process.env.TRACE_TOP_N || 32);
const HIST_BIN = Number(process.env.HIST_BIN || 128);

function loadJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function rangePositions(span) {
  const [start, end] = span;
  const out = [];
  for (let i = start; i < end; i += 1) out.push(i);
  return out.length ? out : [start];
}

function cyclePick(values, count, seed = 0) {
  if (!values.length) return [];
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(values[(i + seed) % values.length]);
  return out;
}

function flatten(arr) {
  return arr.reduce((a, b) => a.concat(b), []);
}

function overlap(pos, span) {
  return pos >= span[0] && pos < span[1];
}

function overlapAny(pos, spans) {
  return spans.some((span) => overlap(pos, span));
}

function nonEvidencePositions(totalTokens, canonicalSpan, decoySpans) {
  const out = [];
  for (let i = 0; i < totalTokens; i += 1) {
    if (!overlap(i, canonicalSpan) && !overlapAny(i, decoySpans)) out.push(i);
  }
  return out.length ? out : [0];
}

function proxyDominantClass(proxy) {
  if (!proxy) return 'unknown';
  if (proxy.hit_rate > proxy.wrong_distractor_rate) return 'canonical';
  if (proxy.wrong_distractor_rate > proxy.hit_rate) return 'decoy';
  return 'neither';
}

function headAllocation(record) {
  const proxy = record.answer.aggregate_proxy;
  const hit = proxy?.hit_rate ?? 0;
  const wrong = proxy?.wrong_distractor_rate ?? 0;
  const other = Math.max(0, 1 - hit - wrong);
  const total = hit + wrong + other || 1;
  let canonical = Math.round((hit / total) * H);
  let decoy = Math.round((wrong / total) * H);
  canonical = clamp(canonical, 0, H);
  decoy = clamp(decoy, 0, H - canonical);
  let neither = H - canonical - decoy;

  // Keep the replay non-degenerate: if proxy strongly indicates a class but
  // rounding erased it, reserve one head for that class.
  if (hit > 0 && canonical === 0 && neither > 0) { canonical += 1; neither -= 1; }
  if (wrong > 0 && decoy === 0 && neither > 0) { decoy += 1; neither -= 1; }

  return { canonical, decoy, neither };
}

function histogram(positions) {
  const h = {};
  for (const pos of positions) {
    const start = Math.floor(pos / HIST_BIN) * HIST_BIN;
    const key = `${start}-${start + HIST_BIN - 1}`;
    h[key] = (h[key] || 0) + 1;
  }
  return h;
}

function replay(record) {
  const canonicalSpan = record.evidence.canonical_token_span_exact;
  const decoySpans = record.evidence.decoy_spans.map((d) => d.token_span_exact);
  const totalTokens = record.evidence.chat_prompt_total_tokens;
  const canonicalPositions = rangePositions(canonicalSpan);
  const decoyPositions = flatten(decoySpans.map(rangePositions));
  const neitherPositions = nonEvidencePositions(totalTokens, canonicalSpan, decoySpans);
  const alloc = headAllocation(record);

  const positionsByHead = [];
  const headLabels = [];
  for (let h = 0; h < H; h += 1) {
    let label;
    let source;
    if (h < alloc.canonical) {
      label = 'canonical';
      source = canonicalPositions;
    } else if (h < alloc.canonical + alloc.decoy) {
      label = 'decoy';
      source = decoyPositions;
    } else {
      label = 'neither';
      source = neitherPositions;
    }
    headLabels.push(label);
    positionsByHead.push(cyclePick(source, K, h));
  }

  const canonicalSelectedHeads = positionsByHead.filter((positions) => positions.some((p) => overlap(p, canonicalSpan))).length;
  const decoySelectedHeads = positionsByHead.filter((positions) => positions.some((p) => overlapAny(p, decoySpans))).length;
  const neitherSelectedHeads = H - Math.max(canonicalSelectedHeads, 0) - Math.max(decoySelectedHeads, 0);
  let dominantRegion = 'neither';
  if (canonicalSelectedHeads > decoySelectedHeads && canonicalSelectedHeads > 0) dominantRegion = 'canonical';
  else if (decoySelectedHeads > canonicalSelectedHeads && decoySelectedHeads > 0) dominantRegion = 'decoy';

  const proxyClass = proxyDominantClass(record.answer.aggregate_proxy);
  const allPositions = flatten(positionsByHead);
  return {
    mode: 'synthetic_offline_selected_position_replay',
    policy: 'aggregate_proxy_biased_schema_replay',
    warning: 'synthetic replay for schema/alignment validation only; not model attention and not EPKV output',
    hook: 'evidence_paged_kv.runtime.phase2a.v0',
    enabled_in_serving: false,
    no_real_selection: true,
    Hq: H,
    K,
    trace_top_n: Math.min(TRACE_TOP_N, K),
    allocation_from_aggregate_proxy: alloc,
    selected_positions_sample: {
      heads: H,
      K,
      trace_top_n: Math.min(TRACE_TOP_N, K),
      positions_by_head_first_n: positionsByHead.map((p) => p.slice(0, Math.min(TRACE_TOP_N, K))),
      head_region_labels: headLabels,
      position_histogram_bin_size: HIST_BIN,
      position_histogram: histogram(allPositions),
      min_position: Math.min(...allPositions),
      max_position: Math.max(...allPositions),
      seq_len: totalTokens,
    },
    overlap_summary: {
      canonical_selected_heads: canonicalSelectedHeads,
      decoy_selected_heads: decoySelectedHeads,
      neither_selected_heads: Math.max(0, neitherSelectedHeads),
      dominant_region: dominantRegion,
      proxy_dominant_answer_class: proxyClass,
      selection_answer_alignment: proxyClass === 'unknown' ? null : dominantRegion === proxyClass,
      canonical_page_range: record.evidence.canonical_page_range,
      decoy_page_ranges: record.evidence.decoy_spans.map((d) => d.page_range),
    },
  };
}

function summarize(records) {
  const byDominant = {};
  const byProxy = {};
  let aligned = 0;
  let alignable = 0;
  for (const r of records) {
    const d = r.runtime_replay.overlap_summary.dominant_region;
    const p = r.runtime_replay.overlap_summary.proxy_dominant_answer_class;
    byDominant[d] = (byDominant[d] || 0) + 1;
    byProxy[p] = (byProxy[p] || 0) + 1;
    if (r.runtime_replay.overlap_summary.selection_answer_alignment !== null) {
      alignable += 1;
      if (r.runtime_replay.overlap_summary.selection_answer_alignment) aligned += 1;
    }
  }
  return {
    created_at: new Date().toISOString(),
    bridge_version: 'v0.2-synthetic-replay',
    source_records: 'bench/evidence-utilization-epkv-bridge-tokenized-2026-05-19/records.jsonl',
    total_records: records.length,
    replay_policy: 'aggregate_proxy_biased_schema_replay',
    Hq: H,
    K,
    by_dominant_region: byDominant,
    by_proxy_dominant_answer_class: byProxy,
    synthetic_alignment_rate: alignable ? aligned / alignable : null,
    alignable_records: alignable,
    boundary: {
      no_model_inference: true,
      no_vllm_serving: true,
      no_real_epkv_selection: true,
      purpose: 'schema and alignment validation before real KV replay or serving dry-run',
    },
    non_claims: [
      'no serving claim',
      'no model-quality claim',
      'no real EPKV selection trace',
      'no model attention claim',
      'synthetic alignment is not evidence of causal behavior',
      'no leaderboard score',
    ],
  };
}

function writeResults(outDir, summary) {
  const lines = [
    '# Evidence-utilization ↔ Evidence-Paged KV bridge — synthetic replay v0.2',
    '',
    '> Status: deterministic offline selected-position replay. No model, no vLLM, no real EPKV selection.',
    '',
    '## Boundary',
    '',
    '```txt',
    'bridge_version: v0.2-synthetic-replay',
    'runtime_replay.mode: synthetic_offline_selected_position_replay',
    'policy: aggregate_proxy_biased_schema_replay',
    `Hq: ${H}`,
    `K: ${K}`,
    '```',
    '',
    '## Readout',
    '',
    `- records: ${summary.total_records}`,
    `- dominant regions: ${JSON.stringify(summary.by_dominant_region)}`,
    `- proxy dominant answer classes: ${JSON.stringify(summary.by_proxy_dominant_answer_class)}`,
    `- synthetic alignment rate: ${(100 * summary.synthetic_alignment_rate).toFixed(1)}% (${summary.alignable_records}/${summary.total_records} alignable)`,
    '',
    'This alignment rate is expected by construction because the replay policy is aggregate-proxy-biased. It validates schema plumbing only; it is not a behavioral result.',
    '',
    '## What this validates',
    '',
    '- the record schema can carry `selected_positions_sample`-shaped data;',
    '- token/page evidence spans can be compared against selected positions;',
    '- per-record overlap fields can be computed: canonical heads, decoy heads, dominant region, alignment flag.',
    '',
    '## What this does not validate',
    '',
    '- not model attention;',
    '- not actual EPKV scoring;',
    '- not vLLM scheduler allocation;',
    '- not answer quality or serving behavior.',
    '',
    '## Output files',
    '',
    '```txt',
    'records.jsonl',
    'summary.json',
    'RESULTS.md',
    '```',
    '',
    '## Next step',
    '',
    'If this schema is accepted, the next non-serving step is a real offline KV replay: construct synthetic Q/KV tensors for these token/page ranges and run the Phase 2a selected-page path, still without serving prompts through the hook.',
    '',
    '## Non-claims',
    '',
    ...summary.non_claims.map((c) => `- ${c}`),
    '',
  ];
  fs.writeFileSync(path.join(outDir, 'RESULTS.md'), lines.join('\n'));
}

function main() {
  const input = loadJsonl(IN);
  const records = input.map((record) => ({
    ...record,
    bridge_version: 'v0.2-synthetic-replay',
    runtime_replay: replay(record),
    non_claims: Array.from(new Set([...(record.non_claims || []), 'synthetic selected-position replay only', 'not model attention'])).sort(),
  }));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'records.jsonl'), records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarize(records);
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  writeResults(OUT, summary);
  console.log(`wrote ${records.length} replay records to ${OUT}`);
}

main();
