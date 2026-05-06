#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

function arg(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function includes(text, phrase) { return norm(text).includes(norm(phrase)); }
function turns(trace) { return trace.turns || []; }
function toolCallsIn(obj) { return (obj.action_trace || obj.turns || []).filter(t => t.action === 'tool_call' || t.tool); }
function finalText(turn) { return String(turn.parsed?.final_answer || turn.parsed?.decision || turn.raw || ''); }
function corpus(turn) { return [turn.raw, JSON.stringify(turn.parsed || {})].join('\n'); }
function hash(s) { return crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 12); }
function sig(turn) {
  const calls = toolCallsIn(turn.parsed || {});
  if (calls.length) return `tools:${calls.map(c => c.tool || c.name || 'unknown').join(',')}:${calls.length}`;
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
let pass = trace.task_id === task.task_id && tactual.length === tdefs.length;

for (const def of tdefs) {
  const actual = tactual.find(t => t.turn === def.turn) || {};
  const text = finalText(actual);
  const full = corpus(actual);
  const req = (def.required_phrases || []).map(p => ({ phrase: p, present: includes(full, p) }));
  const forbScope = def.forbidden_scope || 'final_answer';
  const ftext = forbScope === 'trace_corpus' ? full : text;
  const forb = (def.forbidden_phrases || []).map(p => ({ phrase: p, present: includes(ftext, p) }));
  const calls = toolCallsIn(actual.parsed || {});
  totalToolCalls += calls.length;
  const maxCalls = Number.isFinite(def.max_tool_calls) ? def.max_tool_calls : null;
  const turnPass = req.every(x => x.present) && forb.every(x => !x.present) && (maxCalls == null || calls.length <= maxCalls) && !actual.parse_error;
  if (!turnPass) pass = false;
  turnResults.push({ turn: def.turn, pass: turnPass, required: req, forbidden: forb, tool_calls: calls.length, max_tool_calls: maxCalls, final: text, parse_error: actual.parse_error || null });
}

const expected = task.expected_behavior || {};
const finalTurn = tactual.at(-1) || {};
const final = finalText(finalTurn);
const finalReq = (expected.required_phrases || []).map(p => ({ phrase: p, present: includes(JSON.stringify(finalTurn), p) }));
const finalForbScope = expected.forbidden_scope || 'final_answer';
const finalForbText = finalForbScope === 'trace_corpus' ? JSON.stringify(trace) : final;
const finalForb = (expected.forbidden_phrases || []).map(p => ({ phrase: p, present: includes(finalForbText, p) }));
const maxTotalTools = Number.isFinite(expected.max_tool_calls) ? expected.max_tool_calls : null;
if (!finalReq.every(x => x.present)) pass = false;
if (!finalForb.every(x => !x.present)) pass = false;
if (maxTotalTools != null && totalToolCalls > maxTotalTools) pass = false;

const div = firstDivergence(trace, reference);
const result = {
  task_id: task.task_id,
  trace_id: trace.run_id || tracePath,
  model: trace.model || null,
  kv_config: trace.kv_config || null,
  context_tokens: trace.context_tokens || null,
  scriptable_pass: pass,
  turn_results: turnResults,
  final_checks: { required: finalReq, forbidden: finalForb, total_tool_calls: totalToolCalls, max_total_tool_calls: maxTotalTools },
  first_divergence: div,
  divergence_kind: classify(div),
};

console.log(JSON.stringify(result, null, 2));
process.exit(pass ? 0 : 2);
