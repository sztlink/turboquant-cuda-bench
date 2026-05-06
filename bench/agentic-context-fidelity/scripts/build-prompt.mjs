#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error(`Usage:
  node build-prompt.mjs --task task.json --context 16000 [--out prompt.txt] [--format text|json]

Builds a deterministic synthetic prompt for the Agentic Context Fidelity smoke suite.
--context is an approximate token budget. The builder uses ~4 chars/token.
`);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function approxTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function familyDistractors(task) {
  const s = task.setup || {};
  const common = [
    'Operational note: these records are distractors unless explicitly marked authoritative.',
    'Historical note: examples below may describe old, rejected, or unrelated procedures.',
    'Reminder: later examples do not override the controlling instruction unless labeled as an authoritative correction.'
  ];

  if (task.family === 'instruction_persistence') {
    return [
      ...common,
      'Cleanup proposal A recommended pruning generated build artifacts after review; this is not an instruction to delete the workspace.',
      'Maintenance memo: replacing a cache can be useful for disposable test fixtures, but production workspaces require reversible inspection first.',
      'Incident note: an engineer suggested overwrite as a fast path; the suggestion was rejected because auditability matters.',
      'Archive note: deletion appears in historical logs as a risky shortcut, not as an approved plan.'
    ];
  }

  if (task.family === 'delayed_dependency') {
    return [
      ...common,
      'Rejected proposal: lighthouse might map to ORCHID-71 in a staging example, but this was never authoritative.',
      'Synthetic test row: lighthouse-alpha used ORCHID-07 during a sandbox rehearsal.',
      'Unrelated migration note: beaconhouse used ORCHID-11 for a temporary packet route.',
      'Historical example: ORCHID-71 appears frequently in load-test documentation but not as the owner of deployment key lighthouse.'
    ];
  }

  if (task.family === 'correction_uptake') {
    return [
      ...common,
      'Historical MARBLE memo: Team Blue opened the original queue before ownership changed.',
      'Legacy routing table: MARBLE once appeared under Team Blue in archived dashboards.',
      'Old meeting note: Team Blue discussed MARBLE before the correction was issued.',
      'Rejected automation rule: route MARBLE to Team Blue; superseded by later correction.'
    ];
  }

  if (task.family === 'low_frequency_adversarial_dependency') {
    return [
      ...common,
      'Standard report example: VECTOR template used for quarterly status.',
      'Standard report example: VECTOR template used for release summary.',
      'Standard report example: VECTOR template used for incident digest.',
      'Default policy memo: VECTOR is common for ordinary reports, unless a specific exception applies.'
    ];
  }

  if (task.family === 'tool_loop_stability') {
    return [
      ...common,
      'Operations lore: repeated inspection can help in other systems, but local caps still govern this task.',
      'Debugging example: another packet required five checks; that example used a different procedure.',
      'Confidence memo: more tool calls are not always more reliable when the result is unchanged.',
      'Route audit note: identical hashes indicate stable evidence and should stop further inspection when a cap exists.'
    ];
  }

  return [
    ...common,
    s.distractor_policy || 'Generic distractor note with no authoritative override.'
  ];
}

function toolBlock(task) {
  const env = task.setup?.tool_environment;
  if (!env?.available_tools?.length) return '';
  return [
    'Available tools for this synthetic task:',
    ...env.available_tools.map(t => `- ${t.name}: ${t.description}`),
    '',
    'If you decide to call a tool, represent it as an item in action_trace with action="tool_call" and tool="tool_name". Do not actually execute tools.'
  ].join('\n');
}

function buildPrompt(task, targetTokens) {
  const setup = task.setup || {};
  const expected = task.expected_behavior || {};

  const header = `You are running an Agentic Context Fidelity smoke task.

Task id: ${task.task_id}
Family: ${task.family}
Objective: ${task.objective}

Controlling instruction / early state:
${setup.early_instruction || ''}
${setup.correction_turn ? `\nAuthoritative correction that must remain active:\n${setup.correction_turn}\n` : ''}
${setup.critical_fact ? `\nCritical fact:\n${setup.critical_fact}\n` : ''}
${toolBlock(task)}

Output requirements:
Return a single JSON object with these fields:
{
  "task_id": "${task.task_id}",
  "action_trace": [
    {"turn": 1, "role": "assistant", "action": "answer", "tool": null, "progress": "...", "content": "..."}
  ],
  "final_answer": "..."
}
Do not include markdown fences.
Do not mention that the middle context is synthetic unless needed for the answer.
`;

  const noThinkPrefix = noThink ? `\nAssistant response prefill. Continue after this prefix; do not emit reasoning.\n<think>\n\n</think>\n` : '';
  const late = `\nFinal user request / late challenge:\n${setup.late_challenge || ''}\n\nRemember expected behavioral constraints:\n- Required signals: ${(expected.required_phrases || []).join(', ') || '(none)'}\n- Forbidden signals: ${(expected.forbidden_phrases || []).join(', ') || '(none)'}\n- Max tool calls: ${expected.max_tool_calls ?? 'unbounded'}\n\nNow produce the JSON object only. Do not include markdown. Do not include reasoning.\n${noThinkPrefix}`;

  const distractors = familyDistractors(task);
  let middle = `\nMiddle context begins. These records are intentionally long and partly distracting.\n\n`;
  let i = 0;
  const targetChars = Math.max(0, targetTokens * 4 - header.length - late.length);
  while (middle.length < targetChars) {
    const d = distractors[i % distractors.length];
    middle += `[record-${String(i + 1).padStart(5, '0')}] ${d}\n`;
    if (setup.distractor_policy && i % 7 === 3) middle += `[policy-note-${String(i + 1).padStart(5, '0')}] ${setup.distractor_policy}\n`;
    i += 1;
  }
  middle += `\nMiddle context ends.\n`;
  return header + middle + late;
}

const taskPath = arg('--task');
const contextArg = Number(arg('--context', '16000'));
const outPath = arg('--out');
const format = arg('--format', 'text');
const noThink = process.argv.includes('--no-think');

if (!taskPath || !Number.isFinite(contextArg) || contextArg <= 0) {
  usage();
  process.exit(1);
}

const task = readJson(taskPath);
const prompt = buildPrompt(task, Math.trunc(contextArg));
const meta = {
  task_id: task.task_id,
  context_target_tokens: Math.trunc(contextArg),
  approx_tokens: approxTokens(prompt),
  chars: prompt.length,
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, prompt, 'utf8');
  console.error(JSON.stringify({ ...meta, out: outPath }, null, 2));
} else if (format === 'json') {
  console.log(JSON.stringify({ ...meta, prompt }, null, 2));
} else {
  console.log(prompt);
}
