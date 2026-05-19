#!/usr/bin/env node
// Offline KV replay v0.3 for the evidence-utilization ↔ EPKV bridge.
//
// Boundary:
//   - no vLLM serving;
//   - no model inference;
//   - no real prompt text in telemetry;
//   - synthetic Q/K tensors only;
//   - real dot-product score + topK selected-position computation.
//
// Purpose: move beyond v0.2's direct selected-position fabrication by
// constructing deterministic synthetic Q/K tensors from token/page evidence
// spans and running the Phase-2a-like selected-position path offline.
// This validates tensor -> topK -> selected_positions_sample -> span/page
// overlap plumbing. It is still not behavioral evidence and not attention.

import fs from 'fs';
import path from 'path';
import url from 'url';

const REPO_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_IN = path.join(REPO_ROOT, 'bench', 'evidence-utilization-epkv-bridge-tokenized-2026-05-19', 'records.jsonl');
const DEFAULT_OUT = path.join(REPO_ROOT, 'bench', 'evidence-utilization-epkv-offline-kv-replay-2026-05-19');
const IN = process.env.IN || DEFAULT_IN;
const OUT = process.env.OUT || DEFAULT_OUT;
const Hq = Number(process.env.HQ || 28);
const Hk = Number(process.env.HK || 4);
const D = Number(process.env.D || 64);
const K = Number(process.env.K || 32);
const TRACE_TOP_N = Number(process.env.TRACE_TOP_N || 32);
const BLOCK_SIZE = Number(process.env.BLOCK_SIZE || 16);
const HIST_BIN = Number(process.env.HIST_BIN || 128);
const SIGNAL = Number(process.env.SIGNAL || 1.0);
const NOISE = Number(process.env.NOISE || 0.0125);

if (Hq % Hk !== 0) throw new Error(`Hq must be divisible by Hk; got Hq=${Hq} Hk=${Hk}`);
const KV_GROUP = Hq / Hk;

function loadJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split(/\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function xorshift32(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) / 0xffffffff);
  };
}

function randn(rng) {
  const u = Math.max(1e-12, rng());
  const v = Math.max(1e-12, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function normalize(v) {
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => x / norm);
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}

function addNoise(base, rng, noise = NOISE) {
  const out = new Array(base.length);
  for (let i = 0; i < base.length; i += 1) out[i] = SIGNAL * base[i] + noise * randn(rng);
  return normalize(out);
}

function spanContains(span, pos) {
  return pos >= span[0] && pos < span[1];
}

function spanLength(span) {
  return Math.max(0, span[1] - span[0]);
}

function overlapAny(pos, spans) {
  return spans.some((span) => spanContains(span, pos));
}

function tokenRegion(pos, canonicalSpan, decoySpans) {
  if (spanContains(canonicalSpan, pos)) return 'canonical';
  if (overlapAny(pos, decoySpans)) return 'decoy';
  return 'neither';
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
  let canonical = Math.round((hit / total) * Hq);
  let decoy = Math.round((wrong / total) * Hq);
  canonical = clamp(canonical, 0, Hq);
  decoy = clamp(decoy, 0, Hq - canonical);
  let neither = Hq - canonical - decoy;
  if (hit > 0 && canonical === 0 && neither > 0) { canonical += 1; neither -= 1; }
  if (wrong > 0 && decoy === 0 && neither > 0) { decoy += 1; neither -= 1; }
  return { canonical, decoy, neither };
}

function headLabels(record) {
  const alloc = headAllocation(record);
  const labels = [];
  for (let h = 0; h < Hq; h += 1) {
    if (h < alloc.canonical) labels.push('canonical');
    else if (h < alloc.canonical + alloc.decoy) labels.push('decoy');
    else labels.push('neither');
  }
  return { alloc, labels };
}

function orthogonalPrototypes(seed) {
  const rng = xorshift32(seed);
  const canonical = normalize(Array.from({ length: D }, () => randn(rng)));
  let decoyRaw = Array.from({ length: D }, () => randn(rng));
  const cdot = dot(decoyRaw, canonical);
  decoyRaw = decoyRaw.map((x, i) => x - cdot * canonical[i]);
  const decoy = normalize(decoyRaw);
  let neitherRaw = Array.from({ length: D }, () => randn(rng));
  const ndotC = dot(neitherRaw, canonical);
  const ndotD = dot(neitherRaw, decoy);
  neitherRaw = neitherRaw.map((x, i) => x - ndotC * canonical[i] - ndotD * decoy[i]);
  const neither = normalize(neitherRaw);
  return { canonical, decoy, neither };
}

function topK(scores, k) {
  return scores
    .map((score, pos) => ({ pos, score }))
    .sort((a, b) => (b.score - a.score) || (a.pos - b.pos))
    .slice(0, k);
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

function pageRangeForPositions(positions) {
  if (!positions.length) return null;
  const pages = positions.map((p) => Math.floor(p / BLOCK_SIZE));
  return [Math.min(...pages), Math.max(...pages) + 1];
}

function pageSet(positions) {
  return Array.from(new Set(positions.map((p) => Math.floor(p / BLOCK_SIZE)))).sort((a, b) => a - b);
}

function rangeOverlap(a, b) {
  return a && b && Math.max(a[0], b[0]) < Math.min(a[1], b[1]);
}

function replay(record, idx) {
  const canonicalSpan = record.evidence.canonical_token_span_exact;
  const decoySpans = record.evidence.decoy_spans.map((d) => d.token_span_exact);
  const totalTokens = record.evidence.chat_prompt_total_tokens;
  const { alloc, labels } = headLabels(record);
  const prototypes = orthogonalPrototypes(0xE9AA0000 + idx * 7919 + totalTokens);
  const tokenRegions = Array.from({ length: totalTokens }, (_, pos) => tokenRegion(pos, canonicalSpan, decoySpans));

  // Synthetic grouped KV keys: shape [M, Hk, D]. Each token's semantic region
  // chooses the prototype; per-KV-head noise makes topK real, deterministic,
  // and non-identical across groups while preserving region targeting.
  const keys = [];
  for (let pos = 0; pos < totalTokens; pos += 1) {
    const row = [];
    for (let kh = 0; kh < Hk; kh += 1) {
      const rng = xorshift32(0xA11CE000 + idx * 1000003 + pos * 97 + kh * 1009);
      row.push(addNoise(prototypes[tokenRegions[pos]], rng));
    }
    keys.push(row);
  }

  // Query shape [Hq, D]. Head labels are aggregate-proxy-derived probes,
  // not observed attention. Runtime-like mapping kh = hq // KV_GROUP.
  const queries = [];
  for (let hq = 0; hq < Hq; hq += 1) {
    const rng = xorshift32(0xBEEF0000 + idx * 4099 + hq * 193);
    queries.push(addNoise(prototypes[labels[hq]], rng, NOISE / 2));
  }

  const positionsByHead = [];
  const scoresByHeadFirstN = [];
  for (let hq = 0; hq < Hq; hq += 1) {
    const kh = Math.floor(hq / KV_GROUP);
    const q = queries[hq];
    const scores = new Array(totalTokens);
    for (let pos = 0; pos < totalTokens; pos += 1) {
      scores[pos] = dot(q, keys[pos][kh]) / Math.sqrt(D);
    }
    const top = topK(scores, Math.min(K, totalTokens));
    positionsByHead.push(top.map((x) => x.pos));
    scoresByHeadFirstN.push(top.slice(0, Math.min(TRACE_TOP_N, K)).map((x) => Number(x.score.toFixed(6))));
  }

  const traceTopN = Math.min(TRACE_TOP_N, K);
  const sampled = positionsByHead.map((p) => p.slice(0, traceTopN));
  const allPositions = positionsByHead.flat();
  const canonicalSelectedHeads = positionsByHead.filter((positions) => positions.some((p) => spanContains(canonicalSpan, p))).length;
  const decoySelectedHeads = positionsByHead.filter((positions) => positions.some((p) => overlapAny(p, decoySpans))).length;
  const neitherSelectedHeads = positionsByHead.filter((positions) => positions.some((p) => tokenRegion(p, canonicalSpan, decoySpans) === 'neither')).length;
  let dominantRegion = 'neither';
  if (canonicalSelectedHeads > decoySelectedHeads && canonicalSelectedHeads >= neitherSelectedHeads) dominantRegion = 'canonical';
  else if (decoySelectedHeads > canonicalSelectedHeads && decoySelectedHeads >= neitherSelectedHeads) dominantRegion = 'decoy';
  else if (neitherSelectedHeads > canonicalSelectedHeads && neitherSelectedHeads > decoySelectedHeads) dominantRegion = 'neither';
  else dominantRegion = 'mixed';

  const selectedPageRange = pageRangeForPositions(allPositions);
  const proxyClass = proxyDominantClass(record.answer.aggregate_proxy);
  const canonicalSelectedPositions = allPositions.filter((p) => spanContains(canonicalSpan, p)).length;
  const decoySelectedPositions = allPositions.filter((p) => overlapAny(p, decoySpans)).length;
  const neitherSelectedPositions = allPositions.length - canonicalSelectedPositions - decoySelectedPositions;
  let targetRegionSelectedHeads = 0;
  let targetRegionSelectedPositions = 0;
  for (let hq = 0; hq < Hq; hq += 1) {
    const label = labels[hq];
    const matches = positionsByHead[hq].filter((p) => tokenRegion(p, canonicalSpan, decoySpans) === label).length;
    if (matches > 0) targetRegionSelectedHeads += 1;
    targetRegionSelectedPositions += matches;
  }

  return {
    mode: 'real_offline_synthetic_kv_topk_replay',
    policy: 'aggregate_proxy_query_mix_over_span_labeled_synthetic_keys',
    warning: 'real topK over synthetic Q/K tensors; not model attention, not vLLM serving, not behavioral evidence',
    hook: 'evidence_paged_kv.runtime.phase2a.score_topk_path_v0',
    enabled_in_serving: false,
    no_model_inference: true,
    no_real_prompt_text_in_trace: true,
    tensor_config: {
      query_shape: [1, Hq, D],
      key_cache_shape_logical: [totalTokens, Hk, D],
      Hq,
      Hk,
      D,
      kv_group: KV_GROUP,
      K,
      block_size: BLOCK_SIZE,
      signal: SIGNAL,
      noise: NOISE,
      score: 'dot(query_head, synthetic_key[token, kv_head]) / sqrt(D)',
      topk: 'stable descending score, ascending token position tie-break',
    },
    allocation_from_aggregate_proxy: alloc,
    selected_positions_sample: {
      heads: Hq,
      K,
      trace_top_n: traceTopN,
      positions_by_head_first_n: sampled,
      scores_by_head_first_n: scoresByHeadFirstN,
      head_region_labels: labels,
      position_histogram_bin_size: HIST_BIN,
      position_histogram: histogram(allPositions),
      min_position: Math.min(...allPositions),
      max_position: Math.max(...allPositions),
      seq_len: totalTokens,
      selected_page_range: selectedPageRange,
      selected_pages_first_n: pageSet(allPositions).slice(0, 64),
    },
    overlap_summary: {
      canonical_selected_heads: canonicalSelectedHeads,
      decoy_selected_heads: decoySelectedHeads,
      neither_selected_heads: neitherSelectedHeads,
      canonical_selected_positions: canonicalSelectedPositions,
      decoy_selected_positions: decoySelectedPositions,
      neither_selected_positions: neitherSelectedPositions,
      dominant_region: dominantRegion,
      proxy_dominant_answer_class: proxyClass,
      probe_alignment_with_proxy_class: proxyClass === 'unknown' ? null : dominantRegion === proxyClass,
      query_label_region_consistency_heads: targetRegionSelectedHeads / Hq,
      query_label_region_consistency_positions: targetRegionSelectedPositions / allPositions.length,
      canonical_token_span_exact: canonicalSpan,
      decoy_token_span_exact: decoySpans,
      canonical_page_range: record.evidence.canonical_page_range,
      decoy_page_ranges: record.evidence.decoy_spans.map((d) => d.page_range),
      selected_page_range: selectedPageRange,
      selected_pages_overlap_canonical_page_range: rangeOverlap(selectedPageRange, record.evidence.canonical_page_range),
      selected_pages_overlap_any_decoy_page_range: record.evidence.decoy_spans.some((d) => rangeOverlap(selectedPageRange, d.page_range)),
    },
    validation: {
      canonical_span_len: spanLength(canonicalSpan),
      decoy_span_total_len: decoySpans.reduce((a, s) => a + spanLength(s), 0),
      selected_positions_total: allPositions.length,
      target_region_selected_heads: targetRegionSelectedHeads,
      target_region_selected_positions: targetRegionSelectedPositions,
      topk_generated_by_scores: true,
      synthetic_tensor_probe_only: true,
    },
  };
}

function summarize(records) {
  const byDominant = {};
  const byProxy = {};
  let alignable = 0;
  let aligned = 0;
  let selectedSamples = 0;
  let totalEvents = 0;
  let minSeq = Infinity;
  let maxSeq = -Infinity;
  let consistencyHeads = 0;
  let consistencyPositions = 0;
  for (const r of records) {
    const rr = r.runtime_replay;
    const d = rr.overlap_summary.dominant_region;
    const p = rr.overlap_summary.proxy_dominant_answer_class;
    byDominant[d] = (byDominant[d] || 0) + 1;
    byProxy[p] = (byProxy[p] || 0) + 1;
    if (rr.overlap_summary.probe_alignment_with_proxy_class !== null) {
      alignable += 1;
      if (rr.overlap_summary.probe_alignment_with_proxy_class) aligned += 1;
    }
    selectedSamples += rr.selected_positions_sample ? 1 : 0;
    totalEvents += rr.validation.selected_positions_total;
    minSeq = Math.min(minSeq, rr.selected_positions_sample.seq_len);
    maxSeq = Math.max(maxSeq, rr.selected_positions_sample.seq_len);
    consistencyHeads += rr.overlap_summary.query_label_region_consistency_heads;
    consistencyPositions += rr.overlap_summary.query_label_region_consistency_positions;
  }
  return {
    created_at: new Date().toISOString(),
    bridge_version: 'v0.3-offline-kv-replay',
    source_records: path.relative(REPO_ROOT, IN),
    total_records: records.length,
    replay_policy: 'aggregate_proxy_query_mix_over_span_labeled_synthetic_keys',
    Hq,
    Hk,
    D,
    K,
    block_size: BLOCK_SIZE,
    selected_position_samples: selectedSamples,
    selected_positions_total: totalEvents,
    seq_len_min: minSeq,
    seq_len_max: maxSeq,
    by_dominant_region: byDominant,
    by_proxy_dominant_answer_class: byProxy,
    probe_alignment_rate_with_proxy_class: alignable ? aligned / alignable : null,
    alignable_records: alignable,
    mean_query_label_region_consistency_heads: records.length ? consistencyHeads / records.length : null,
    mean_query_label_region_consistency_positions: records.length ? consistencyPositions / records.length : null,
    boundary: {
      no_vllm_serving: true,
      no_model_inference: true,
      synthetic_qk_tensors: true,
      real_dot_product_topk: true,
      no_value_kernel: true,
      no_model_attention_claim: true,
      purpose: 'validate offline tensor/topK/selected-position/page-overlap bridge plumbing before any real-prompt hook-on trace',
    },
    non_claims: [
      'no serving claim',
      'no model-quality claim',
      'no model attention claim',
      'no real prompt hook-on trace',
      'no production attention claim',
      'no evidence that EPKV fixes retrieved-not-used',
      'probe alignment is induced by synthetic tensor construction, not behavioral evidence',
    ],
  };
}

function writeResults(outDir, summary) {
  const lines = [
    '# Evidence-utilization ↔ Evidence-Paged KV bridge — offline KV replay v0.3',
    '',
    '> Status: offline tensor/topK replay. Synthetic Q/K tensors, real dot-product topK selection, no serving, no model inference.',
    '',
    '## Boundary',
    '',
    '```txt',
    'bridge_version: v0.3-offline-kv-replay',
    'runtime_replay.mode: real_offline_synthetic_kv_topk_replay',
    'policy: aggregate_proxy_query_mix_over_span_labeled_synthetic_keys',
    `Hq/Hk/D/K: ${Hq}/${Hk}/${D}/${K}`,
    `block_size: ${BLOCK_SIZE}`,
    '```',
    '',
    '## Readout',
    '',
    `- records: ${summary.total_records}`,
    `- selected-position samples: ${summary.selected_position_samples}/${summary.total_records}`,
    `- selected positions total: ${summary.selected_positions_total}`,
    `- seq_len range: ${summary.seq_len_min}..${summary.seq_len_max}`,
    `- dominant regions: ${JSON.stringify(summary.by_dominant_region)}`,
    `- proxy dominant answer classes: ${JSON.stringify(summary.by_proxy_dominant_answer_class)}`,
    `- probe alignment with proxy class: ${(100 * summary.probe_alignment_rate_with_proxy_class).toFixed(1)}% (${summary.alignable_records}/${summary.total_records} alignable)`,
    `- mean query-label region consistency, heads: ${(100 * summary.mean_query_label_region_consistency_heads).toFixed(1)}%`,
    `- mean query-label region consistency, positions: ${(100 * summary.mean_query_label_region_consistency_positions).toFixed(1)}%`,
    '',
    'The query-label consistency is expected from the synthetic tensor construction: query-head labels are derived from aggregate proxy rates and key regions are span-labeled. The proxy-class alignment is only a probe readout, not behavioral evidence.',
    '',
    '## What this validates',
    '',
    '- token/page bridge records can construct synthetic Q/K tensors;',
    '- Phase-2a-like score + topK selection emits `selected_positions_sample`-shaped data;',
    '- selected token positions can be compared against canonical/decoy token spans and page ranges;',
    '- serving is not required to test this bridge schema path.',
    '',
    '## What this does not validate',
    '',
    '- not model attention;',
    '- not answer behavior;',
    '- not serving latency;',
    '- not EPKV quality or speedup;',
    '- not a real vLLM scheduler allocation or real KV cache from a prompt.',
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
    'Either stop here and publish no claims, or build a narrower offline harness that invokes the actual Python runtime score/topK function with synthetic packed TurboQuant-shaped cache tensors. Real-prompt hook-on remains paused.',
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
  const records = input.map((record, idx) => ({
    ...record,
    bridge_version: 'v0.3-offline-kv-replay',
    runtime_replay: replay(record, idx),
    non_claims: Array.from(new Set([...(record.non_claims || []), 'offline synthetic Q/K tensor replay only', 'real topK over synthetic tensors only', 'not model attention'])).sort(),
  }));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'records.jsonl'), records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarize(records);
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  writeResults(OUT, summary);
  console.log(`wrote ${records.length} offline KV replay records to ${OUT}`);
}

main();
