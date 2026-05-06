#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function includes(text, phrase) { return norm(text).includes(norm(phrase)); }
function turns(trace) { return trace.turns || []; }
function hash(s) { return crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 12); }

function walk(value, out = []) {
  if (Array.isArray(value)) for (const v of value) walk(v, out);
  else if (value && typeof value === 'object') {
    const action = value.action || value.type || '';
    const tool = value.tool || value.name || value.tool_name || '';
    if (action === 'tool_call' || tool) out.push(value);
    for (const v of Object.values(value)) walk(v, out);
  }
  return out;
}

function uniqueCalls(calls) {
  const seen = new Set();
  const out = [];
  for (const c of calls) {
    const key = JSON.stringify(c);
    if (!seen.has(key)) { seen.add(key); out.push(c); }
  }
  return out;
}

function toolCallsIn(obj) { return uniqueCalls(walk(obj || {})); }
function toolName(call) { return String(call.tool || call.name || call.tool_name || 'unknown'); }
function finalText(turn) {
  if (turn?.parsed?.final_answer != null) return String(turn.parsed.final_answer);
  if (turn?.parsed?.decision != null) return String(turn.parsed.decision);
  if (turn?.parsed?.gate_status != null || turn?.parsed?.readiness != null || turn?.parsed?.rationale != null) return JSON.stringify(turn.parsed || {});
  return String(turn?.raw || '');
}
function corpus(turn) { return [turn?.raw, JSON.stringify(turn?.parsed || {})].join('\n'); }
function sig(turn) {
  const calls = toolCallsIn(turn.parsed || {});
  if (calls.length) return `tools:${calls.map(toolName).join(',')}:${calls.length}`;
  return `text:${hash(finalText(turn))}`;
}
function firstDivergence(candidate, reference) {
  if (!reference) return null;
  const c = turns(candidate), r = turns(reference);
  for (let i = 0; i < Math.max(c.length, r.length); i++) {
    const cs = c[i] ? sig(c[i]) : null;
    const rs = r[i] ? sig(r[i]) : null;
    if (cs !== rs) return { turn_index: i, candidate: cs, reference: rs };
  }
  return null;
}
function classify(div) {
  if (!div) return 'none';
  if (String(div.candidate).startsWith('tools:') || String(div.reference).startsWith('tools:')) return 'hard_tool';
  return 'soft_text';
}
function finiteNum(v) { return Number.isFinite(v) ? v : null; }
function countByTool(calls) {
  const counts = {};
  for (const c of calls) counts[toolName(c)] = (counts[toolName(c)] || 0) + 1;
  return counts;
}
function toolCheck(def, calls) {
  const names = calls.map(toolName);
  const requiredNames = def.required_tool_names || [];
  const forbiddenNames = def.forbidden_tool_names || [];
  const exact = finiteNum(def.exact_tool_calls);
  const max = finiteNum(def.max_tool_calls);
  const min = finiteNum(def.min_tool_calls);
  const requiredPresent = requiredNames.map(n => ({ tool: n, present: names.includes(n) }));
  const forbiddenPresent = forbiddenNames.map(n => ({ tool: n, present: names.includes(n) }));
  const ok = (exact == null || calls.length === exact)
    && (max == null || calls.length <= max)
    && (min == null || calls.length >= min)
    && requiredPresent.every(x => x.present)
    && forbiddenPresent.every(x => !x.present);
  return { ok, names, count: calls.length, exact_tool_calls: exact, max_tool_calls: max, min_tool_calls: min, required_tool_names: requiredPresent, forbidden_tool_names: forbiddenPresent };
}

const taskPath = arg('--task');
const tracePath = arg('--trace');
const referencePath = arg('--reference');
if (!taskPath || !tracePath) {
  console.error('Usage: node score-multiturn.mjs --task task.json --trace trace.json [--reference ref.json]');
  process.exit(1);
}

const task = readJson(taskPath);
const trace = readJson(tracePath);
const reference = referencePath ? readJson(referencePath) : null;
const tdefs = task.turns || [];
const tactual = turns(trace);
const turnResults = [];
let totalToolCalls = 0;
let allCalls = [];
let pass = trace.task_id === task.task_id && tactual.length === tdefs.length;

for (const def of tdefs) {
  const actual = tactual.find(t => t.turn === def.turn) || {};
  const text = finalText(actual);
  const full = corpus(actual);
  const reqScope = def.required_scope || 'trace_corpus';
  const reqText = reqScope === 'final_answer' ? text : full;
  const req = (def.required_phrases || []).map(p => ({ phrase: p, present: includes(reqText, p) }));
  const forbScope = def.forbidden_scope || 'final_answer';
  const ftext = forbScope === 'trace_corpus' ? full : text;
  const forb = (def.forbidden_phrases || []).map(p => ({ phrase: p, present: includes(ftext, p) }));
  const calls = toolCallsIn(actual.parsed || {});
  totalToolCalls += calls.length;
  allCalls.push(...calls);
  const tools = toolCheck(def, calls);
  const turnPass = req.every(x => x.present) && forb.every(x => !x.present) && tools.ok && !actual.parse_error;
  if (!turnPass) pass = false;
  turnResults.push({
    turn: def.turn,
    pass: turnPass,
    required: req,
    forbidden: forb,
    tool_calls: calls.length,
    tool_names: tools.names,
    exact_tool_calls: tools.exact_tool_calls,
    max_tool_calls: tools.max_tool_calls,
    required_tool_names: tools.required_tool_names,
    forbidden_tool_names: tools.forbidden_tool_names,
    final: text,
    parse_error: actual.parse_error || null
  });
}

const expected = task.expected_behavior || {};
const finalTurn = tactual.at(-1) || {};
const final = finalText(finalTurn);
const finalReqScope = expected.required_scope || 'trace_corpus';
const finalReqText = finalReqScope === 'final_answer' ? final : JSON.stringify(finalTurn);
const finalReq = (expected.required_phrases || []).map(p => ({ phrase: p, present: includes(finalReqText, p) }));
const finalForbScope = expected.forbidden_scope || 'final_answer';
const finalForbText = finalForbScope === 'trace_corpus' ? JSON.stringify(trace) : final;
const finalForb = (expected.forbidden_phrases || []).map(p => ({ phrase: p, present: includes(finalForbText, p) }));
const totalTools = toolCheck(expected, allCalls);
if (!finalReq.every(x => x.present)) pass = false;
if (!finalForb.every(x => !x.present)) pass = false;
if (!totalTools.ok) pass = false;

const div = firstDivergence(trace, reference);
const result = {
  task_id: task.task_id,
  trace_id: trace.run_id || tracePath,
  model: trace.model || null,
  kv_config: trace.kv_config || null,
  context_tokens: trace.context_tokens || null,
  scriptable_pass: pass,
  turn_results: turnResults,
  final_checks: {
    required: finalReq,
    forbidden: finalForb,
    total_tool_calls: totalToolCalls,
    tool_counts: countByTool(allCalls),
    exact_tool_calls: totalTools.exact_tool_calls,
    max_total_tool_calls: totalTools.max_tool_calls,
    required_tool_names: totalTools.required_tool_names,
    forbidden_tool_names: totalTools.forbidden_tool_names
  },
  first_divergence: div,
  divergence_kind: classify(div),
};

console.log(JSON.stringify(result, null, 2));
process.exit(pass ? 0 : 2);
