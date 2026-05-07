#!/usr/bin/env node
/*
 * KVFidelity paired-run comparator for tool-eval-bench Markdown reports.
 *
 * This is intentionally an external prototype: it does not patch upstream
 * tool-eval-bench. It pairs scenarios across two completed reports and asks:
 * same scenario, same model family, different serving/KV config — did the
 * action trace change?
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function usage(exitCode = 0) {
  const msg = `Usage:
  node scripts/kvfidelity-compare-tool-eval-bench.mjs \\
    --report-a baseline.md --report-b candidate.md \\
    [--label-a q8/q8] [--label-b q8/turbo3] [--out-dir out]

Required:
  --report-a PATH   tool-eval-bench Markdown report for baseline/reference
  --report-b PATH   tool-eval-bench Markdown report for candidate

Optional:
  --label-a TEXT    display label for baseline (default: basename of report-a)
  --label-b TEXT    display label for candidate (default: basename of report-b)
  --out-dir PATH    write kvfidelity-report.md and kvfidelity-metrics.json
  --json            print JSON metrics to stdout
`;
  console.log(msg);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage(0);
    if (a === "--json") {
      args.json = true;
      continue;
    }
    if (!a.startsWith("--")) throw new Error(`Unexpected argument: ${a}`);
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = argv[++i];
    if (!value) throw new Error(`Missing value for ${a}`);
    args[key] = value;
  }
  if (!args.reportA || !args.reportB) usage(1);
  args.labelA ||= path.basename(args.reportA, path.extname(args.reportA));
  args.labelB ||= path.basename(args.reportB, path.extname(args.reportB));
  return args;
}

function sha12(s) {
  return crypto.createHash("sha256").update(String(s ?? "")).digest("hex").slice(0, 12);
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function parseMaybeJson(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { parsed: null, normalized: "" };
  try {
    const parsed = JSON.parse(s);
    return { parsed, normalized: stableStringify(parsed) };
  } catch {
    return { parsed: null, normalized: s.replace(/\s+/g, " ") };
  }
}

function parseReportMarkdown(filePath) {
  const text = readFileSync(filePath, "utf8");
  const runId = text.match(/\*\*Run ID\*\*:\s*`([^`]+)`/)?.[1] ?? path.basename(filePath, ".md");
  const model = text.match(/\*\*Model\*\*:\s*`?([^`\n]+?)`?\s*(?:\n|$)/)?.[1]?.trim() ?? null;

  const traces = new Map();
  const re = /^###\s+([^\n]+)\n\s*```text\n([\s\S]*?)\n```/gm;
  let m;
  while ((m = re.exec(text))) {
    const scenarioId = m[1].trim();
    traces.set(scenarioId, parseRawTrace(scenarioId, m[2]));
  }

  if (traces.size === 0) {
    throw new Error(`No trace blocks found in ${filePath}. Expected tool-eval-bench report with ## Traces / ### TC-* blocks.`);
  }

  return { filePath, runId, model, scenarios: traces };
}

function parseRawTrace(scenarioIdFromHeader, rawLog) {
  const lines = rawLog.split(/\r?\n/);
  const trace = {
    scenarioId: scenarioIdFromHeader,
    model: null,
    scenarioLine: null,
    prompt: null,
    verdict: null,
    summary: null,
    note: null,
    assistantTurns: [],
    userFollowUps: [],
    toolCallsRequested: [],
    toolCalls: [],
    finalAnswer: null,
    rawLog,
  };

  let currentTurn = 0;
  for (const line of lines) {
    if (line.startsWith("model=")) trace.model = line.slice("model=".length);
    else if (line.startsWith("scenario=")) trace.scenarioLine = line.slice("scenario=".length);
    else if (line.startsWith("prompt=")) trace.prompt = line.slice("prompt=".length);
    else if (line.startsWith("assistant_turn_")) {
      const idx = line.indexOf("=");
      const turn = Number(line.slice("assistant_turn_".length, idx));
      currentTurn = Number.isFinite(turn) ? turn : currentTurn;
      trace.assistantTurns.push({ turn: currentTurn, text: line.slice(idx + 1), hash: sha12(line.slice(idx + 1)) });
    } else if (line.startsWith("user_follow_up_")) {
      const idx = line.indexOf("=");
      const phase = Number(line.slice("user_follow_up_".length, idx));
      trace.userFollowUps.push({ phase, text: line.slice(idx + 1), hash: sha12(line.slice(idx + 1)) });
    } else if (line.startsWith("tool_calls_requested=")) {
      trace.toolCallsRequested.push({ turn: currentTurn, names: line.slice("tool_calls_requested=".length).split(",").map((s) => s.trim()).filter(Boolean) });
    } else if (line.startsWith("tool_call=")) {
      const rest = line.slice("tool_call=".length).trim();
      const firstSpace = rest.search(/\s/);
      const name = firstSpace === -1 ? rest : rest.slice(0, firstSpace);
      const rawArguments = firstSpace === -1 ? "" : rest.slice(firstSpace + 1).trim();
      const args = parseMaybeJson(rawArguments);
      trace.toolCalls.push({
        turn: currentTurn || null,
        name,
        rawArguments,
        normalizedArguments: args.normalized,
        signature: `${name} ${args.normalized}`.trim(),
      });
    } else if (line.startsWith("final_answer=")) trace.finalAnswer = line.slice("final_answer=".length);
    else if (line.startsWith("verdict=")) trace.verdict = line.slice("verdict=".length).trim();
    else if (line.startsWith("summary=")) trace.summary = line.slice("summary=".length).trim();
    else if (line.startsWith("note=")) trace.note = line.slice("note=".length).trim();
  }

  return trace;
}

function countBy(items, keyFn) {
  const m = new Map();
  for (const item of items) {
    const key = keyFn(item);
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}

function severity(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "pass") return 2;
  if (s === "partial") return 1;
  if (s === "fail") return 0;
  return -1;
}

function callsByTurn(trace, mode = "signature") {
  const byTurn = new Map();
  for (const c of trace.toolCalls) {
    const turn = c.turn ?? 0;
    if (!byTurn.has(turn)) byTurn.set(turn, []);
    byTurn.get(turn).push(mode === "name" ? c.name : c.signature);
  }
  return byTurn;
}

function firstDivergenceTurn(a, b, mode = "signature") {
  const aa = callsByTurn(a, mode);
  const bb = callsByTurn(b, mode);
  const turns = [...new Set([...aa.keys(), ...bb.keys()])].sort((x, y) => x - y);
  for (const t of turns) {
    const av = JSON.stringify(aa.get(t) ?? []);
    const bv = JSON.stringify(bb.get(t) ?? []);
    if (av !== bv) return t;
  }
  return null;
}

function firstAssistantTextDivergenceTurn(a, b) {
  const n = Math.max(a.assistantTurns.length, b.assistantTurns.length);
  for (let i = 0; i < n; i++) {
    const at = a.assistantTurns[i];
    const bt = b.assistantTurns[i];
    if (!at || !bt) return at?.turn ?? bt?.turn ?? i + 1;
    if (at.hash !== bt.hash) return Math.min(at.turn ?? i + 1, bt.turn ?? i + 1);
  }
  return null;
}

function compareScenario(scenarioId, baseline, candidate) {
  const baselineNamePath = baseline.toolCalls.map((c) => c.name);
  const candidateNamePath = candidate.toolCalls.map((c) => c.name);
  const baselineSignaturePath = baseline.toolCalls.map((c) => c.signature);
  const candidateSignaturePath = candidate.toolCalls.map((c) => c.signature);

  const baselineCounts = countBy(baseline.toolCalls, (c) => c.signature);
  const candidateCounts = countBy(candidate.toolCalls, (c) => c.signature);
  const candidateOnly = [];
  const duplicateExcess = [];
  for (const [sig, n] of candidateCounts.entries()) {
    const b = baselineCounts.get(sig) ?? 0;
    if (n > b) {
      candidateOnly.push({ signature: sig, candidate: n, baseline: b, excess: n - b });
      if (n > 1) duplicateExcess.push({ signature: sig, candidate: n, baseline: b, excess: n - Math.max(1, b) });
    }
  }

  const namePathEqual = JSON.stringify(baselineNamePath) === JSON.stringify(candidateNamePath);
  const signaturePathEqual = JSON.stringify(baselineSignaturePath) === JSON.stringify(candidateSignaturePath);
  const statusEqual = String(baseline.verdict ?? "") === String(candidate.verdict ?? "");
  const candidateRegressed = severity(candidate.verdict) < severity(baseline.verdict);

  return {
    scenario_id: scenarioId,
    baseline_status: baseline.verdict,
    candidate_status: candidate.verdict,
    status_equal: statusEqual,
    candidate_regressed: candidateRegressed,
    baseline_tool_call_count: baseline.toolCalls.length,
    candidate_tool_call_count: candidate.toolCalls.length,
    tool_name_path_equal: namePathEqual,
    tool_signature_path_equal: signaturePathEqual,
    first_action_divergence_turn_name: firstDivergenceTurn(baseline, candidate, "name"),
    first_action_divergence_turn_signature: firstDivergenceTurn(baseline, candidate, "signature"),
    first_soft_text_divergence_turn: firstAssistantTextDivergenceTurn(baseline, candidate),
    candidate_only_action_count: candidateOnly.reduce((s, x) => s + x.excess, 0),
    candidate_only_action_rate: candidate.toolCalls.length ? candidateOnly.reduce((s, x) => s + x.excess, 0) / candidate.toolCalls.length : 0,
    duplicate_excess_action_count: duplicateExcess.reduce((s, x) => s + Math.max(0, x.excess), 0),
    duplicate_excess_action_rate: candidate.toolCalls.length ? duplicateExcess.reduce((s, x) => s + Math.max(0, x.excess), 0) / candidate.toolCalls.length : 0,
    candidate_only_actions: candidateOnly,
    duplicate_excess_actions: duplicateExcess,
    baseline_path_names: baselineNamePath,
    candidate_path_names: candidateNamePath,
    baseline_path_signatures: baselineSignaturePath,
    candidate_path_signatures: candidateSignaturePath,
    baseline_summary: baseline.summary,
    candidate_summary: candidate.summary,
  };
}

function aggregate(results) {
  const n = results.length;
  const divName = results.filter((r) => !r.tool_name_path_equal).length;
  const divSig = results.filter((r) => !r.tool_signature_path_equal).length;
  const regressed = results.filter((r) => r.candidate_regressed).length;
  const statusDiff = results.filter((r) => !r.status_equal).length;
  const candidateCalls = results.reduce((s, r) => s + r.candidate_tool_call_count, 0);
  const candidateOnly = results.reduce((s, r) => s + r.candidate_only_action_count, 0);
  const duplicateExcess = results.reduce((s, r) => s + r.duplicate_excess_action_count, 0);
  const actionDivTurns = results.map((r) => r.first_action_divergence_turn_signature).filter((x) => x !== null);
  return {
    scenario_count: n,
    tool_name_path_equality_rate: n ? (n - divName) / n : 0,
    tool_signature_path_equality_rate: n ? (n - divSig) / n : 0,
    status_equality_rate: n ? (n - statusDiff) / n : 0,
    candidate_regression_rate: n ? regressed / n : 0,
    candidate_only_action_rate: candidateCalls ? candidateOnly / candidateCalls : 0,
    duplicate_excess_action_rate: candidateCalls ? duplicateExcess / candidateCalls : 0,
    first_divergence_turn_min: actionDivTurns.length ? Math.min(...actionDivTurns) : null,
  };
}

function renderMarkdown(metrics) {
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const md = [];
  md.push("# KVFidelity paired-run report");
  md.push("");
  md.push("External prototype over `tool-eval-bench` Markdown traces.");
  md.push("");
  md.push("## Runs");
  md.push("");
  md.push(`- Baseline: **${metrics.labels.baseline}** — \`${metrics.runs.baseline.run_id}\``);
  md.push(`- Candidate: **${metrics.labels.candidate}** — \`${metrics.runs.candidate.run_id}\``);
  md.push("");
  md.push("## Aggregate");
  md.push("");
  md.push(`- Scenario count: **${metrics.aggregate.scenario_count}**`);
  md.push(`- Tool name path equality: **${pct(metrics.aggregate.tool_name_path_equality_rate)}**`);
  md.push(`- Tool signature path equality: **${pct(metrics.aggregate.tool_signature_path_equality_rate)}**`);
  md.push(`- Status equality: **${pct(metrics.aggregate.status_equality_rate)}**`);
  md.push(`- Candidate regression rate: **${pct(metrics.aggregate.candidate_regression_rate)}**`);
  md.push(`- Candidate-only action rate: **${pct(metrics.aggregate.candidate_only_action_rate)}**`);
  md.push(`- Duplicate excess action rate: **${pct(metrics.aggregate.duplicate_excess_action_rate)}**`);
  md.push(`- Earliest action divergence turn: **${metrics.aggregate.first_divergence_turn_min ?? "none"}**`);
  md.push("");
  md.push("## Scenario comparison");
  md.push("");
  md.push("| Scenario | Status | Name path | Signature path | First action divergence | Soft text divergence | Candidate-only | Duplicate excess |");
  md.push("|---|---|---:|---:|---:|---:|---:|---:|");
  for (const r of metrics.scenarios) {
    const status = r.status_equal ? `${r.baseline_status}` : `${r.baseline_status} → ${r.candidate_status}`;
    md.push(`| ${r.scenario_id} | ${status} | ${r.tool_name_path_equal ? "✅" : "❌"} | ${r.tool_signature_path_equal ? "✅" : "❌"} | ${r.first_action_divergence_turn_signature ?? "—"} | ${r.first_soft_text_divergence_turn ?? "—"} | ${r.candidate_only_action_count} | ${r.duplicate_excess_action_count} |`);
  }
  md.push("");
  md.push("## Divergences");
  md.push("");
  for (const r of metrics.scenarios.filter((x) => !x.tool_signature_path_equal || !x.status_equal || x.candidate_only_action_count || x.duplicate_excess_action_count)) {
    md.push(`### ${r.scenario_id}`);
    md.push("");
    md.push(`- Status: ${r.baseline_status} → ${r.candidate_status}`);
    md.push(`- First action divergence turn: ${r.first_action_divergence_turn_signature ?? "none"}`);
    md.push(`- Baseline path: ${r.baseline_path_signatures.length ? r.baseline_path_signatures.map((x) => `\`${x}\``).join(" → ") : "∅"}`);
    md.push(`- Candidate path: ${r.candidate_path_signatures.length ? r.candidate_path_signatures.map((x) => `\`${x}\``).join(" → ") : "∅"}`);
    if (r.candidate_only_actions.length) {
      md.push("- Candidate-only/excess actions:");
      for (const a of r.candidate_only_actions) md.push(`  - \`${a.signature}\` baseline=${a.baseline}, candidate=${a.candidate}, excess=${a.excess}`);
    }
    md.push("");
  }
  md.push("## Notes");
  md.push("");
  md.push("- `tool-eval-bench` SQLite summaries currently do not persist `raw_log`; this prototype reads Markdown reports because they include full traces.");
  md.push("- `candidate_only_action_rate` is a paired-trace proxy, not a semantic safety verdict. Scenario evaluators still determine pass/partial/fail.");
  md.push("- `soft text divergence` is tracked separately from action divergence.");
  md.push("");
  return md.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const baseline = parseReportMarkdown(args.reportA);
  const candidate = parseReportMarkdown(args.reportB);
  const ids = [...baseline.scenarios.keys()].filter((id) => candidate.scenarios.has(id)).sort();
  if (!ids.length) throw new Error("No overlapping scenario ids between reports.");

  const scenarios = ids.map((id) => compareScenario(id, baseline.scenarios.get(id), candidate.scenarios.get(id)));
  const metrics = {
    schema: "kvfidelity.tool-eval-bench.paired-report.v0",
    generated_at: new Date().toISOString(),
    labels: { baseline: args.labelA, candidate: args.labelB },
    runs: {
      baseline: { run_id: baseline.runId, model: baseline.model, report: path.resolve(args.reportA) },
      candidate: { run_id: candidate.runId, model: candidate.model, report: path.resolve(args.reportB) },
    },
    aggregate: aggregate(scenarios),
    scenarios,
  };

  if (args.outDir) {
    mkdirSync(args.outDir, { recursive: true });
    writeFileSync(path.join(args.outDir, "kvfidelity-metrics.json"), JSON.stringify(metrics, null, 2) + "\n");
    writeFileSync(path.join(args.outDir, "kvfidelity-report.md"), renderMarkdown(metrics));
  }
  if (args.json || !args.outDir) console.log(JSON.stringify(metrics, null, 2));
  else console.log(`Wrote ${path.join(args.outDir, "kvfidelity-report.md")}`);
}

try {
  main();
} catch (err) {
  console.error(`kvfidelity-compare: ${err.message}`);
  process.exit(1);
}
