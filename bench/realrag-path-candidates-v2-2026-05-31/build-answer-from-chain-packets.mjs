#!/usr/bin/env node
import fs from 'node:fs';

const ROOT = 'bench/realrag-path-candidates-v2-2026-05-31';
const IN = `${ROOT}/path-candidates-offset1500-n100.jsonl`;
const OUT = `${ROOT}/answer-from-chain-packets-offset1500-n100.jsonl`;

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function makePrompt(row) {
  const candidate = row.top_candidate;
  const steps = candidate?.candidate_chain || [];
  const lines = [];
  lines.push('You are answering a multi-hop question from an explicit candidate path.');
  lines.push('Use only the path steps and snippets below.');
  lines.push('If the path is incomplete or the final answer is not supported, answer UNKNOWN.');
  lines.push('Answer with only the final answer string. No explanation.');
  lines.push('');
  lines.push(`Question: ${row.question}`);
  lines.push(`Expected answer slot: ${candidate?.answer_slot || row.question_parse?.answer_slot || 'entity'}`);
  lines.push('');
  lines.push('Candidate path:');
  if (!steps.length) {
    lines.push('- NO COMPLETE PATH');
  } else {
    for (const step of steps) {
      lines.push(`- Step ${step.step}: ${step.from} --${step.relation}--> ${step.to}`);
      if (step.snippet) lines.push(`  Evidence (${step.evidence_title}): ${step.snippet}`);
    }
  }
  if (candidate?.answer_candidate) {
    lines.push('');
    lines.push(`Candidate final answer: ${candidate.answer_candidate}`);
  }
  lines.push('');
  lines.push('Final answer:');
  return lines.join('\n');
}

function main() {
  const rows = readJsonl(IN);
  const packets = rows.map((row) => ({
    schema: 'realrag.answer_from_chain_packet.v1',
    idx: row.idx,
    qid: row.qid,
    question: row.question,
    prompt: makePrompt(row),
    candidate_complete: Boolean(row.top_candidate?.complete && row.top_candidate?.answer_candidate),
    candidate_answer: row.top_candidate?.answer_candidate || null,
    expected_answer_slot: row.top_candidate?.answer_slot || row.question_parse?.answer_slot || 'entity',
    template: row.question_parse?.template || 'unknown',
    operational_score: row.top_candidate?.operational_score || 0,
    risk_flags: row.top_candidate?.risk_flags || row.risk_flags || [],
    // Eval-only metadata. Do not include this field in a live LLM prompt.
    eval_gold: row.gold,
    prior_config0_path_prompt_output: row.prior_run_metrics?.config0_path_prompt?.output || '',
  }));
  fs.writeFileSync(OUT, packets.map((p) => JSON.stringify(p)).join('\n') + '\n');
  console.log(JSON.stringify({ out: OUT, rows: packets.length, complete: packets.filter((p) => p.candidate_complete).length }, null, 2));
}

main();
