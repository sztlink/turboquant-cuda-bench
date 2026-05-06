#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

function usage() {
  console.error(`Usage:
  node summarize-ab.mjs --tasks tasks-dir --traces traces-dir --context 4k \\
    [--reference q8q8] [--candidate q4q4] [--out summary.json] [--markdown summary.md]

Summarizes A/B Agentic Context Fidelity traces into a compact table.
`);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function traceTurns(trace) {
  return trace.turns || trace.action_trace || [];
}

function toolCalls(trace) {
  return traceTurns(trace).filter(t => t.action === 'tool_call' || t.tool);
}

function hashText(s) {
  return crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 12);
}

function actionSignature(turn) {
  if (!turn) return null;
  if (turn.action === 'tool_call' || turn.tool) {
    return `tool:${turn.tool || 'unknown'}:${turn.args_hash || JSON.stringify(turn.args || {})}`;
  }
  const content = String(turn.content || turn.final_answer || '');
  return `${turn.role || 'unknown'}:${turn.action || 'say'}:${hashText(content)}`;
}

function firstDivergence(candidate, reference) {
  const c = traceTurns(candidate);
  const r = traceTurns(reference);
  const max = Math.max(c.length, r.length);
  for (let i = 0; i < max; i++) {
    const cs = actionSignature(c[i]);
    const rs = actionSignature(r[i]);
    if (cs !== rs) return { turn_index: i, candidate: cs, reference: rs, candidate_turn: c[i] || null, reference_turn: r[i] || null };
  }
  return null;
}

function classifyDivergence(div) {
  if (!div) return 'none';
  const ca = div.candidate_turn?.action;
  const ra = div.reference_turn?.action;
  const ct = div.candidate_turn?.tool;
  const rt = div.reference_turn?.tool;
  if (ca === 'tool_call' || ra === 'tool_call' || ct || rt) return 'hard_tool';
  if (ca !== ra) return 'hard_status';
  return 'soft_text';
}

function scoreTrace(taskFile, traceFile, referenceFile = null) {
  const script = new URL('./score-trace.mjs', import.meta.url).pathname;
  const args = [script, '--task', taskFile, '--trace', traceFile];
  if (referenceFile) args.push('--reference', referenceFile);
  const out = spawnSync(process.execPath, args, { encoding: 'utf8' });
  const text = out.stdout || out.stderr;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Could not parse score output for ${traceFile}: ${text}`);
  }
}

function short(s, n = 96) {
  const one = String(s || '').replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1) + '…' : one;
}

function mdEscape(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

const tasksDir = arg('--tasks');
const tracesDir = arg('--traces');
const context = arg('--context');
const referenceTag = arg('--reference', 'q8q8');
const candidateTag = arg('--candidate', 'q4q4');
const outPath = arg('--out');
const mdPath = arg('--markdown');

if (!tasksDir || !tracesDir || !context) {
  usage();
  process.exit(1);
}

const taskFiles = fs.readdirSync(tasksDir)
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(f => path.join(tasksDir, f));

const rows = [];
for (const taskFile of taskFiles) {
  const task = readJson(taskFile);
  const base = task.task_id;
  const refFile = path.join(tracesDir, `${base}-${context}-${referenceTag}.json`);
  const candFile = path.join(tracesDir, `${base}-${context}-${candidateTag}.json`);
  if (!fs.existsSync(refFile) || !fs.existsSync(candFile)) continue;

  const refTrace = readJson(refFile);
  const candTrace = readJson(candFile);
  const refScore = scoreTrace(taskFile, refFile);
  const candScore = scoreTrace(taskFile, candFile, refFile);
  const div = firstDivergence(candTrace, refTrace);
  const divergenceKind = classifyDivergence(div);
  const refTools = toolCalls(refTrace);
  const candTools = toolCalls(candTrace);

  rows.push({
    task_id: task.task_id,
    title: task.title || task.task_id,
    context,
    reference: {
      tag: referenceTag,
      pass: refScore.scriptable_pass,
      status: refScore.output_status,
      tool_calls: refTools.length,
      final_answer: refTrace.final_answer || '',
    },
    candidate: {
      tag: candidateTag,
      pass: candScore.scriptable_pass,
      status: candScore.output_status,
      tool_calls: candTools.length,
      final_answer: candTrace.final_answer || '',
    },
    ab: {
      first_divergence: div ? {
        turn_index: div.turn_index,
        candidate: div.candidate,
        reference: div.reference,
      } : null,
      divergence_kind: divergenceKind,
      tool_call_delta: candTools.length - refTools.length,
      hard_behavior_equivalent: candScore.scriptable_pass && refScore.scriptable_pass && !['hard_tool', 'hard_status'].includes(divergenceKind),
    },
  });
}

const summary = {
  generated_at: new Date().toISOString(),
  context,
  reference: referenceTag,
  candidate: candidateTag,
  tasks: rows.length,
  passes: {
    reference: rows.filter(r => r.reference.pass).length,
    candidate: rows.filter(r => r.candidate.pass).length,
    hard_behavior_equivalent: rows.filter(r => r.ab.hard_behavior_equivalent).length,
  },
  rows,
};

let md = '';
md += `# Agentic Context Fidelity — A/B summary (${context})\n\n`;
md += `Reference: \`${referenceTag}\` · Candidate: \`${candidateTag}\`\n\n`;
md += `| Task | Ref | Cand | Div kind | Div turn | Tool delta | Ref final | Cand final |\n`;
md += `|---|---:|---:|---|---:|---:|---|---|\n`;
for (const r of rows) {
  md += `| ${mdEscape(r.task_id)} | ${r.reference.pass ? 'pass' : 'fail'} | ${r.candidate.pass ? 'pass' : 'fail'} | ${r.ab.divergence_kind} | ${r.ab.first_divergence?.turn_index ?? '—'} | ${r.ab.tool_call_delta} | ${mdEscape(short(r.reference.final_answer))} | ${mdEscape(short(r.candidate.final_answer))} |\n`;
}
md += `\nHard-behavior equivalent: ${summary.passes.hard_behavior_equivalent}/${rows.length}\n`;
md += `\nNote: \`soft_text\` means exact wording differs but scriptable behavior and tool/action constraints pass.\n`;

if (outPath) fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
if (mdPath) fs.writeFileSync(mdPath, md);
console.log(JSON.stringify(summary, null, 2));
