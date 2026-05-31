#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'bench/realrag-path-candidates-v2-2026-05-31';
const PACKETS = `${ROOT}/answer-from-chain-packets-offset1500-n100.jsonl`;
const CANDIDATES = `${ROOT}/path-candidates-offset1500-n100.jsonl`;
const OUT_DIR = `${ROOT}/answer-from-chain-smoke-offset1500-n100-4090`;
const OUT_JSONL = `${OUT_DIR}/outputs.jsonl`;
const SUMMARY_JSON = `${OUT_DIR}/summary.json`;
const RESULTS_MD = `${OUT_DIR}/RESULTS.md`;
const ENDPOINT = process.env.VLLM_ENDPOINT || 'http://localhost:11435/v1/chat/completions';
const MODEL = process.env.VLLM_MODEL || 'local-vllm';
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 64);
const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 90000);
const LIMIT = Number(process.env.LIMIT || 0);

function readJsonl(file) {
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

function cleanOutput(s) {
  return String(s || '')
    .replace(/^\s*final answer\s*:\s*/i, '')
    .replace(/^\s*answer\s*:\s*/i, '')
    .trim()
    .split(/\n/)[0]
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
}

function isRefusal(s) {
  const n = normalize(s);
  return !n || n === 'unknown' || /^(unknown|not enough information|cannot determine|cannot be determined|not provided|no information)/.test(n);
}

async function callLLM(prompt) {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: ac.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: MAX_TOKENS,
      }),
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.slice(0, 500)}`);
    const json = JSON.parse(text);
    const content = json?.choices?.[0]?.message?.content || '';
    return { ok: true, output: cleanOutput(content), raw_output: content, latency_ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, output: 'UNKNOWN', raw_output: '', error: String(err?.message || err), latency_ms: Date.now() - t0 };
  } finally {
    clearTimeout(timeout);
  }
}

function summarize(records) {
  const n = records.length || 1;
  const sum = (field) => records.reduce((a, r) => a + Number(r.metrics[field] || 0), 0) / n;
  const cfg = (field) => records.reduce((a, r) => a + Number(r.prior_config0[field] || 0), 0) / n;
  const cur = (field) => records.reduce((a, r) => a + Number(r.prior_current[field] || 0), 0) / n;
  const cand = (field) => records.reduce((a, r) => a + Number(r.candidate_metrics[field] || 0), 0) / n;
  const movement = (baseName) => {
    let wins = 0; let losses = 0; let ties = 0;
    for (const r of records) {
      const b = r[baseName].em || 0;
      const e = r.metrics.em || 0;
      if (e > b) wins += 1;
      else if (e < b) losses += 1;
      else ties += 1;
    }
    return { wins, losses, ties };
  };
  const byTemplate = new Map();
  for (const r of records) {
    const key = r.template || 'unknown';
    if (!byTemplate.has(key)) byTemplate.set(key, { count: 0, em: 0, f1: 0, refusals: 0 });
    const s = byTemplate.get(key);
    s.count += 1;
    s.em += r.metrics.em;
    s.f1 += r.metrics.f1;
    s.refusals += r.refusal ? 1 : 0;
  }
  return {
    schema: 'realrag.answer_from_chain_smoke.summary.v1',
    generated_at: new Date().toISOString(),
    endpoint: process.env.VLLM_ENDPOINT_LABEL || 'local_vllm_endpoint',
    model: MODEL,
    total: records.length,
    macro: {
      answer_from_chain: { em: sum('em'), contains: sum('contains'), f1: sum('f1'), refusal_rate: records.filter((r) => r.refusal).length / n },
      candidate_direct: { em: cand('em'), contains: cand('contains'), f1: cand('f1'), missing_rate: records.filter((r) => !r.candidate_complete).length / n },
      config0_path_prompt: { em: cfg('em'), contains: cfg('contains'), f1: cfg('f1'), refusal_rate: records.filter((r) => isRefusal(r.prior_config0.output)).length / n },
      current_path_prompt: { em: cur('em'), contains: cur('contains'), f1: cur('f1'), refusal_rate: records.filter((r) => isRefusal(r.prior_current.output)).length / n },
    },
    pairwise_em_movement: {
      vs_config0_path_prompt: movement('prior_config0'),
      vs_current_path_prompt: movement('prior_current'),
      vs_candidate_direct: movement('candidate_metrics'),
    },
    ok_count: records.filter((r) => r.ok).length,
    error_count: records.filter((r) => !r.ok).length,
    latency_ms: {
      avg: records.reduce((a, r) => a + r.latency_ms, 0) / n,
      max: Math.max(...records.map((r) => r.latency_ms)),
    },
    by_template: [...byTemplate.entries()].map(([template, s]) => ({
      template,
      count: s.count,
      em: s.em / s.count,
      f1: s.f1 / s.count,
      refusal_rate: s.refusals / s.count,
    })).sort((a, b) => b.count - a.count || a.template.localeCompare(b.template)),
    decision: decide(records),
  };
}

function decide(records) {
  const n = records.length || 1;
  let wins = 0; let losses = 0;
  let f1Delta = 0;
  let refusal = 0;
  let baseRefusal = 0;
  for (const r of records) {
    if ((r.metrics.em || 0) > (r.prior_config0.em || 0)) wins += 1;
    if ((r.metrics.em || 0) < (r.prior_config0.em || 0)) losses += 1;
    f1Delta += (r.metrics.f1 || 0) - (r.prior_config0.f1 || 0);
    refusal += r.refusal ? 1 : 0;
    baseRefusal += isRefusal(r.prior_config0.output) ? 1 : 0;
  }
  f1Delta /= n;
  const refusalDelta = refusal / n - baseRefusal / n;
  const pass = f1Delta >= 0.05 && wins > losses && refusalDelta <= 0.05;
  return {
    gate: pass ? 'pass' : 'fail_or_mixed',
    f1_delta_vs_config0: f1Delta,
    em_wins_vs_config0: wins,
    em_losses_vs_config0: losses,
    refusal_delta_vs_config0: refusalDelta,
    next: pass ? 'manual_review_then_runtime_mapping_no_megakernel_yet' : 'revise_path_candidates_no_runtime',
  };
}

function writeResults(summary) {
  const lines = [];
  lines.push('# Answer-from-selected-chain smoke - offset1500 N=100');
  lines.push('');
  lines.push('## Boundary');
  lines.push('');
  lines.push('```txt');
  lines.push('4090/vLLM answer smoke');
  lines.push('no serving mutation');
  lines.push('no kernel change');
  lines.push('explicit path candidates selected before answer generation');
  lines.push('gold is eval-only metadata and is not included in prompts');
  lines.push('```');
  lines.push('');
  lines.push('## Macro');
  lines.push('');
  lines.push('| condition | EM | contains | F1 | refusal/missing |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const [name, m] of Object.entries(summary.macro)) {
    const rate = m.refusal_rate ?? m.missing_rate ?? 0;
    lines.push(`| ${name} | ${m.em.toFixed(3)} | ${m.contains.toFixed(3)} | ${m.f1.toFixed(3)} | ${rate.toFixed(3)} |`);
  }
  lines.push('');
  lines.push('## Pairwise EM movement');
  lines.push('');
  lines.push('```txt');
  lines.push(`vs config0 path prompt: ${summary.pairwise_em_movement.vs_config0_path_prompt.wins} wins / ${summary.pairwise_em_movement.vs_config0_path_prompt.losses} losses / ${summary.pairwise_em_movement.vs_config0_path_prompt.ties} ties`);
  lines.push(`vs current path prompt: ${summary.pairwise_em_movement.vs_current_path_prompt.wins} wins / ${summary.pairwise_em_movement.vs_current_path_prompt.losses} losses / ${summary.pairwise_em_movement.vs_current_path_prompt.ties} ties`);
  lines.push(`vs direct candidate string: ${summary.pairwise_em_movement.vs_candidate_direct.wins} wins / ${summary.pairwise_em_movement.vs_candidate_direct.losses} losses / ${summary.pairwise_em_movement.vs_candidate_direct.ties} ties`);
  lines.push('```');
  lines.push('');
  lines.push('## Gate decision');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(summary.decision, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('## Non-claims');
  lines.push('');
  lines.push('- This is not a megakernel run.');
  lines.push('- This is not a serving speedup claim.');
  lines.push('- This is not an EPKV runtime intervention.');
  lines.push('- It tests whether explicit path candidates improve answer generation over unstructured path prompting on this held-out slice.');
  lines.push('');
  fs.writeFileSync(RESULTS_MD, `${lines.join('\n')}\n`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const packets = readJsonl(PACKETS);
  const candidateRows = new Map(readJsonl(CANDIDATES).map((r) => [String(r.qid), r]));
  const todo = LIMIT > 0 ? packets.slice(0, LIMIT) : packets;
  const records = [];
  for (let i = 0; i < todo.length; i += 1) {
    const packet = todo[i];
    const row = candidateRows.get(String(packet.qid));
    const res = await callLLM(packet.prompt);
    const metrics = { em: exact(res.output, packet.eval_gold), contains: contains(res.output, packet.eval_gold), f1: f1(res.output, packet.eval_gold) };
    const record = {
      schema: 'realrag.answer_from_chain_smoke.output.v1',
      idx: packet.idx,
      qid: packet.qid,
      question: packet.question,
      template: packet.template,
      output: res.output,
      raw_output: res.raw_output,
      ok: res.ok,
      error: res.error || null,
      latency_ms: res.latency_ms,
      refusal: isRefusal(res.output),
      gold: packet.eval_gold,
      metrics,
      candidate_complete: packet.candidate_complete,
      candidate_answer: packet.candidate_answer,
      candidate_metrics: row?.posthoc_top_metrics || { em: 0, contains: 0, f1: 0 },
      prior_config0: row?.prior_run_metrics?.config0_path_prompt || { em: 0, contains: 0, f1: 0, output: packet.prior_config0_path_prompt_output || '' },
      prior_current: row?.prior_run_metrics?.current_path_prompt || { em: 0, contains: 0, f1: 0, output: '' },
      operational_score: packet.operational_score,
      risk_flags: packet.risk_flags,
    };
    records.push(record);
    fs.appendFileSync(OUT_JSONL, JSON.stringify(record) + '\n');
    console.log(`[${i + 1}/${todo.length}] idx=${record.idx} em=${metrics.em} f1=${metrics.f1.toFixed(3)} out=${JSON.stringify(record.output).slice(0, 120)}`);
  }
  const summary = summarize(records);
  fs.writeFileSync(SUMMARY_JSON, `${JSON.stringify(summary, null, 2)}\n`);
  writeResults(summary);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
