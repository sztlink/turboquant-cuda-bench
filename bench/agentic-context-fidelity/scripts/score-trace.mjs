#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

function usage() {
  console.error(`Usage:
  node score-trace.mjs --task task.json --trace trace.json [--reference reference-trace.json]

Outputs JSON with basic scriptable checks:
- required/forbidden phrase checks on final_answer and full action trace corpus
- tool-call count and repeated-tool-call checks
- manual_scores passthrough
- first action divergence vs optional reference trace
`);
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function includesPhrase(text, phrase) {
  return norm(text).includes(norm(phrase));
}

function turnText(turn) {
  if (!turn) return '';
  return [
    turn.role,
    turn.action,
    turn.tool,
    turn.progress,
    turn.content,
    turn.final_answer,
    turn.observation,
  ].filter(Boolean).join(' ');
}

function traceCorpus(trace, finalAnswer) {
  return [
    finalAnswer,
    ...traceTurns(trace).map(turnText),
  ].filter(Boolean).join('\n');
}

function traceTurns(trace) {
  return trace.turns || trace.action_trace || [];
}

function toolCalls(trace) {
  return traceTurns(trace).filter(t => t.action === 'tool_call' || t.tool);
}

function actionSignature(turn) {
  if (!turn) return null;
  if (turn.action === 'tool_call' || turn.tool) {
    return `tool:${turn.tool || 'unknown'}:${turn.args_hash || JSON.stringify(turn.args || {})}`;
  }
  const content = String(turn.content || turn.final_answer || '');
  const digest = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  return `${turn.role || 'unknown'}:${turn.action || 'say'}:${digest}`;
}

function firstDivergence(candidate, reference) {
  if (!reference) return null;
  const c = traceTurns(candidate);
  const r = traceTurns(reference);
  const max = Math.max(c.length, r.length);
  for (let i = 0; i < max; i++) {
    const cs = actionSignature(c[i]);
    const rs = actionSignature(r[i]);
    if (cs !== rs) {
      return {
        turn_index: i,
        candidate: cs,
        reference: rs,
      };
    }
  }
  return null;
}

function repeatedToolCalls(calls) {
  let repeated = 0;
  let maxRun = 0;
  let currentRun = 0;
  let prev = null;
  for (const call of calls) {
    const sig = `${call.tool || 'unknown'}:${call.args_hash || JSON.stringify(call.args || {})}`;
    if (sig === prev) {
      repeated += 1;
      currentRun += 1;
    } else {
      currentRun = 0;
      prev = sig;
    }
    maxRun = Math.max(maxRun, currentRun);
  }
  return { repeated, maxRun };
}

const taskPath = arg('--task');
const tracePath = arg('--trace');
const referencePath = arg('--reference');

if (!taskPath || !tracePath) {
  usage();
  process.exit(1);
}

const task = readJson(taskPath);
const trace = readJson(tracePath);
const reference = referencePath ? readJson(referencePath) : null;

const expected = task.expected_behavior || {};
const finalAnswer = trace.final_answer || traceTurns(trace).filter(t => t.role === 'assistant').at(-1)?.content || '';
const hasParseError = Boolean(trace.parse_error);
const timedOut = Boolean(trace.timed_out);
let outputStatus = 'complete';
if (!String(finalAnswer || '').trim()) outputStatus = 'partial';
if (hasParseError) outputStatus = timedOut ? 'partial' : 'invalid_json';
if (String(finalAnswer || '').includes('<think>') && hasParseError) outputStatus = 'partial';
const calls = toolCalls(trace);
const repeats = repeatedToolCalls(calls);
const corpus = traceCorpus(trace, finalAnswer);

const finalRequired = (expected.required_phrases || []).map(phrase => ({ phrase, present: includesPhrase(finalAnswer, phrase) }));
const traceRequired = (expected.required_phrases || []).map(phrase => ({ phrase, present: includesPhrase(corpus, phrase) }));
const finalForbidden = (expected.forbidden_phrases || []).map(phrase => ({ phrase, present: includesPhrase(finalAnswer, phrase) }));
const traceForbidden = (expected.forbidden_phrases || []).map(phrase => ({ phrase, present: includesPhrase(corpus, phrase) }));
const maxToolCalls = Number.isFinite(expected.max_tool_calls) ? expected.max_tool_calls : null;
const maxRepeatedToolCalls = Number.isFinite(expected.max_repeated_tool_calls) ? expected.max_repeated_tool_calls : null;

const finalRequiredPass = finalRequired.every(x => x.present);
const traceRequiredPass = traceRequired.every(x => x.present);
const finalForbiddenPass = finalForbidden.every(x => !x.present);
const traceForbiddenPass = traceForbidden.every(x => !x.present);
const forbiddenScope = expected.forbidden_scope || 'final_answer';
const forbiddenPass = forbiddenScope === 'trace_corpus' ? traceForbiddenPass : finalForbiddenPass;

const checks = {
  task_id_match: trace.task_id === task.task_id,
  // Hard pass: required evidence may appear in the final answer or the structured action trace.
  required_phrases_pass: traceRequiredPass,
  // Hard pass defaults to final_answer. For some tasks, forbidden strings are distractors
  // that may validly appear in the trace as explicitly rejected alternatives.
  forbidden_phrases_pass: forbiddenPass,
  tool_call_count_pass: maxToolCalls == null ? true : calls.length <= maxToolCalls,
  repeated_tool_calls_pass: maxRepeatedToolCalls == null ? true : repeats.repeated <= maxRepeatedToolCalls,
  output_complete_pass: outputStatus === 'complete',
};

const diagnostics = {
  final_required_pass: finalRequiredPass,
  trace_required_pass: traceRequiredPass,
  final_forbidden_pass: finalForbiddenPass,
  trace_forbidden_pass: traceForbiddenPass,
};

const scriptablePass = Object.values(checks).every(Boolean);
const manualScores = trace.manual_scores || {};

const result = {
  task_id: task.task_id,
  trace_id: trace.run_id || trace.trace_id || tracePath,
  model: trace.model || null,
  kv_config: trace.kv_config || null,
  context_tokens: trace.context_tokens || null,
  scriptable_pass: scriptablePass,
  output_status: outputStatus,
  forbidden_scope: forbiddenScope,
  checks,
  diagnostics,
  required_phrases: traceRequired,
  final_required_phrases: finalRequired,
  trace_required_phrases: traceRequired,
  forbidden_phrases: traceForbidden,
  final_forbidden_phrases: finalForbidden,
  trace_forbidden_phrases: traceForbidden,
  tool_calls: {
    count: calls.length,
    max_allowed: maxToolCalls,
    repeated_adjacent_count: repeats.repeated,
    max_repeated_allowed: maxRepeatedToolCalls,
    max_adjacent_repeat_run: repeats.maxRun,
  },
  first_divergence: firstDivergence(trace, reference),
  manual_scores: manualScores,
};

console.log(JSON.stringify(result, null, 2));
process.exit(scriptablePass ? 0 : 2);
