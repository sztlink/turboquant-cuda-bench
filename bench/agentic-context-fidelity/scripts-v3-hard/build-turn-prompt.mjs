#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function usage() {
  console.error(`Usage:
  node build-turn-prompt.mjs --task task.json --turn N --context 16000 [--history history.json] [--out prompt.txt] [--no-think]
`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function approxTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

const taskPath = arg('--task');
const turnNumber = Number(arg('--turn'));
const contextTokens = Number(arg('--context', '16000'));
const historyPath = arg('--history');
const outPath = arg('--out');
const noThink = process.argv.includes('--no-think');

if (!taskPath || !Number.isFinite(turnNumber) || turnNumber <= 0 || !Number.isFinite(contextTokens)) {
  usage();
  process.exit(1);
}

const task = readJson(taskPath);
const history = historyPath && fs.existsSync(historyPath) ? readJson(historyPath) : [];
const turn = (task.turns || []).find(t => t.turn === turnNumber);
if (!turn) throw new Error(`No turn ${turnNumber} in ${taskPath}`);

const header = `You are running an Agentic Context Fidelity v3-hard multi-turn task.

Task id: ${task.task_id}
Family: ${task.family}
Objective: ${task.objective}

This is turn ${turnNumber} of ${(task.turns || []).length}.
Important: prior assistant turns below are generated outputs from this same run. Treat them as your own prior state, not as examples.

Output requirements:
Return one JSON object only. Do not include markdown fences. Do not include prose outside JSON.
Every JSON object must include task_id and turn.
If you represent a synthetic tool/action, include it as an item in action_trace with action="tool_call" and a tool name. Do not actually execute external tools.
Preserve the current valid state exactly. Do not promote stale, revoked, partial, or pressure-only states into active state.
`;

const transcript = history.length
  ? `\nPrior generated transcript:\n${history.map(h => `USER TURN ${h.turn}:\n${h.user}\n\nASSISTANT TURN ${h.turn}:\n${h.raw || JSON.stringify(h.parsed || h, null, 2)}`).join('\n\n---\n\n')}\n`
  : '\nPrior generated transcript: none.\n';

const distractors = task.distractors || [];
const noThinkPrefix = noThink ? `\nAssistant response prefill. Continue after this prefix; do not emit reasoning.\n<think>\n\n</think>\n` : '';
const late = `\nCurrent user turn ${turnNumber}:\n${turn.user}\n\nNow produce the JSON object only.\n${noThinkPrefix}`;

let middle = '\nLong middle context / distractor records:\n';
const targetChars = Math.max(0, contextTokens * 4 - header.length - transcript.length - late.length);
let i = 0;
while (middle.length < targetChars) {
  const d = distractors[i % Math.max(1, distractors.length)] || 'Generic unrelated distractor record.';
  middle += `[record-${String(i + 1).padStart(5, '0')}] ${d}\n`;
  i += 1;
}

const prompt = header + transcript + middle + late;
const meta = { task_id: task.task_id, turn: turnNumber, context_target_tokens: contextTokens, approx_tokens: approxTokens(prompt), chars: prompt.length };

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, prompt, 'utf8');
  console.error(JSON.stringify({ ...meta, out: outPath }, null, 2));
} else {
  console.log(prompt);
}
