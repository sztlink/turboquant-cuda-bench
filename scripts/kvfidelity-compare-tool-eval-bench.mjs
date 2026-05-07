#!/usr/bin/env node
/*
 * KVFidelity paired-run comparator for tool-eval-bench Markdown reports.
 *
 * External prototype: pairs scenarios across two reports and asks whether a
 * same-model config change preserves long multi-turn action traces.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function usage(exitCode = 0) {
  console.log(`Usage:
  node scripts/kvfidelity-compare-tool-eval-bench.mjs \\
    --report-a baseline.md --report-b candidate.md \\
    [--label-a q8/q8] [--label-b q8/turbo3] [--out-dir out]

Outputs paired trace metrics as JSON and/or Markdown.
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage(0);
    if (a === "--json") { args.json = true; continue; }
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

const DANGEROUS_TOOLS = new Set([
  "close_case", "delete_file", "remove_file", "drop_table", "execute_payment",
  "send_email", "create_calendar_event", "run_code", "run_script", "write_file",
]);

const SEMANTIC_KEYS = {
  create_calendar_event: ["title", "date", "time", "duration_minutes", "attendees"],
  send_email: ["to", "cc", "bcc", "subject"],
  get_contacts: ["query"],
  search_files: ["query", "file_type"],
  read_file: ["file_id", "path"],
  web_search: ["query"],
  run_code: ["language", "code"],
  close_case: ["case_id", "id", "reason"],
  set_reminder: ["title", "time", "date"],
};

function sha12(s) { return crypto.createHash("sha256").update(String(s ?? "")).digest("hex").slice(0, 12); }

function normalizePrimitive(value) {
  if (typeof value === "string") return value.toLowerCase().replace(/\s+/g, " ").trim();
  return value;
}
function normalizeValue(value) {
  if (Array.isArray(value)) return value.map(normalizeValue).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, normalizeValue(value[k])]));
  }
  return normalizePrimitive(value);
}
function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(normalizePrimitive(value));
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}
function parseMaybeJson(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { parsed: null, normalized: "" };
  try { const parsed = JSON.parse(s); return { parsed, normalized: stableStringify(parsed) }; }
  catch { return { parsed: null, normalized: s.replace(/\s+/g, " ") }; }
}

function pickSemanticArgs(name, args) {
  if (!args || typeof args !== "object") return {};
  const keys = SEMANTIC_KEYS[name] ?? Object.keys(args).filter((k) => !["body", "content", "message", "raw", "metadata", "timestamp", "request_id"].includes(k));
  const out = {};
  for (const k of keys) if (args[k] !== undefined) out[k] = normalizeValue(args[k]);
  return out;
}
function semanticSignature(name, parsedArgs, normalizedArguments) {
  const sem = pickSemanticArgs(name, parsedArgs);
  if (Object.keys(sem).length) return `${name} ${stableStringify(sem)}`;
  return `${name} ${normalizedArguments}`.trim();
}

function parseReportMarkdown(filePath) {
  const text = readFileSync(filePath, "utf8");
  const runId = text.match(/\*\*Run ID\*\*:\s*`([^`]+)`/)?.[1] ?? path.basename(filePath, ".md");
  const model = text.match(/\*\*Model\*\*:\s*`?([^`\n]+?)`?\s*(?:\n|$)/)?.[1]?.trim() ?? null;
  const traces = new Map();
  const re = /^###\s+([^\n]+)\n\s*```text\n([\s\S]*?)\n```/gm;
  let m;
  while ((m = re.exec(text))) traces.set(m[1].trim(), parseRawTrace(m[1].trim(), m[2]));
  if (!traces.size) throw new Error(`No trace blocks found in ${filePath}`);
  return { filePath, runId, model, scenarios: traces };
}

function parseRawTrace(scenarioIdFromHeader, rawLog) {
  const trace = { scenarioId: scenarioIdFromHeader, model: null, scenarioLine: null, prompt: null, verdict: null, summary: null, note: null, assistantTurns: [], userFollowUps: [], toolCallsRequested: [], toolCalls: [], finalAnswer: null, rawLog };
  let currentTurn = 0;
  for (const line of rawLog.split(/\r?\n/)) {
    if (line.startsWith("model=")) trace.model = line.slice(6);
    else if (line.startsWith("scenario=")) trace.scenarioLine = line.slice(9);
    else if (line.startsWith("prompt=")) trace.prompt = line.slice(7);
    else if (line.startsWith("assistant_turn_")) {
      const idx = line.indexOf("="); const turn = Number(line.slice("assistant_turn_".length, idx));
      currentTurn = Number.isFinite(turn) ? turn : currentTurn;
      const text = line.slice(idx + 1); trace.assistantTurns.push({ turn: currentTurn, text, hash: sha12(text) });
    } else if (line.startsWith("user_follow_up_")) {
      const idx = line.indexOf("="); trace.userFollowUps.push({ phase: Number(line.slice("user_follow_up_".length, idx)), text: line.slice(idx + 1), hash: sha12(line.slice(idx + 1)) });
    } else if (line.startsWith("tool_calls_requested=")) {
      trace.toolCallsRequested.push({ turn: currentTurn, names: line.slice("tool_calls_requested=".length).split(",").map((s) => s.trim()).filter(Boolean) });
    } else if (line.startsWith("tool_call=")) {
      const rest = line.slice("tool_call=".length).trim();
      const firstSpace = rest.search(/\s/);
      const name = firstSpace === -1 ? rest : rest.slice(0, firstSpace);
      const rawArguments = firstSpace === -1 ? "" : rest.slice(firstSpace + 1).trim();
      const args = parseMaybeJson(rawArguments);
      const semantic = semanticSignature(name, args.parsed, args.normalized);
      trace.toolCalls.push({
        turn: currentTurn || null,
        name,
        actionClass: name,
        rawArguments,
        arguments: args.parsed,
        normalizedArguments: args.normalized,
        signature: `${name} ${args.normalized}`.trim(),
        semanticSignature: semantic,
        semanticArgs: pickSemanticArgs(name, args.parsed),
        dangerous: DANGEROUS_TOOLS.has(name),
      });
    } else if (line.startsWith("final_answer=")) trace.finalAnswer = line.slice(13);
    else if (line.startsWith("verdict=")) trace.verdict = line.slice(8).trim();
    else if (line.startsWith("summary=")) trace.summary = line.slice(8).trim();
    else if (line.startsWith("note=")) trace.note = line.slice(5).trim();
  }
  return trace;
}

function countBy(items, keyFn) { const m = new Map(); for (const item of items) { const key = keyFn(item); m.set(key, (m.get(key) ?? 0) + 1); } return m; }
function severity(status) { const s = String(status ?? "").toLowerCase(); return s === "pass" ? 2 : s === "partial" ? 1 : s === "fail" ? 0 : -1; }
function pathOf(trace, mode) {
  if (mode === "name" || mode === "actionClass") return trace.toolCalls.map((c) => c.name);
  if (mode === "semantic") return trace.toolCalls.map((c) => c.semanticSignature);
  return trace.toolCalls.map((c) => c.signature);
}
function byTurnPath(trace, mode) {
  const byTurn = new Map();
  for (const c of trace.toolCalls) {
    const turn = c.turn ?? 0; if (!byTurn.has(turn)) byTurn.set(turn, []);
    byTurn.get(turn).push(mode === "name" || mode === "actionClass" ? c.name : mode === "semantic" ? c.semanticSignature : c.signature);
  }
  return byTurn;
}
function firstDivergenceTurn(a, b, mode) {
  const aa = byTurnPath(a, mode), bb = byTurnPath(b, mode);
  const turns = [...new Set([...aa.keys(), ...bb.keys()])].sort((x, y) => x - y);
  for (const t of turns) if (JSON.stringify(aa.get(t) ?? []) !== JSON.stringify(bb.get(t) ?? [])) return t;
  return null;
}
function firstAssistantTextDivergenceTurn(a, b) {
  const n = Math.max(a.assistantTurns.length, b.assistantTurns.length);
  for (let i = 0; i < n; i++) {
    const at = a.assistantTurns[i], bt = b.assistantTurns[i];
    if (!at || !bt) return at?.turn ?? bt?.turn ?? i + 1;
    if (at.hash !== bt.hash) return Math.min(at.turn ?? i + 1, bt.turn ?? i + 1);
  }
  return null;
}
function multisetEqual(a, b) {
  const aa = countBy(a, (x) => x), bb = countBy(b, (x) => x);
  if (aa.size !== bb.size) return false;
  for (const [k, v] of aa) if (bb.get(k) !== v) return false;
  return true;
}
function excessBy(candidateItems, baselineItems, label = "item") {
  const base = countBy(baselineItems, (x) => x), cand = countBy(candidateItems, (x) => x);
  const out = [];
  for (const [item, n] of cand) {
    const b = base.get(item) ?? 0;
    if (n > b) out.push({ [label]: item, candidate: n, baseline: b, excess: n - b });
  }
  return out;
}
function pairedArgumentDrift(baseline, candidate, mode) {
  const out = [];
  const n = Math.min(baseline.toolCalls.length, candidate.toolCalls.length);
  for (let i = 0; i < n; i++) {
    const a = baseline.toolCalls[i], b = candidate.toolCalls[i];
    if (a.name === b.name) {
      const aSig = mode === "semantic" ? a.semanticSignature : a.signature;
      const bSig = mode === "semantic" ? b.semanticSignature : b.signature;
      if (aSig !== bSig) out.push({ index: i, turn: b.turn, tool: b.name, baseline: aSig, candidate: bSig });
    }
  }
  return out;
}
function dangerousDuplicateExcess(baseline, candidate) {
  const base = countBy(baseline.toolCalls.filter((c) => c.dangerous).map((c) => c.semanticSignature), (x) => x);
  const cand = countBy(candidate.toolCalls.filter((c) => c.dangerous).map((c) => c.semanticSignature), (x) => x);
  const out = [];
  for (const [semanticSignature, candidateCount] of cand.entries()) {
    const baselineCount = base.get(semanticSignature) ?? 0;
    const excess = Math.max(0, candidateCount - Math.max(1, baselineCount));
    if (excess > 0) out.push({ semanticSignature, baseline: baselineCount, candidate: candidateCount, excess });
  }
  return out;
}

function compareScenario(scenarioId, baseline, candidate) {
  const baselineNamePath = pathOf(baseline, "name"), candidateNamePath = pathOf(candidate, "name");
  const baselineSemanticPath = pathOf(baseline, "semantic"), candidateSemanticPath = pathOf(candidate, "semantic");
  const baselineSignaturePath = pathOf(baseline, "signature"), candidateSignaturePath = pathOf(candidate, "signature");

  const namePathEqual = JSON.stringify(baselineNamePath) === JSON.stringify(candidateNamePath);
  const semanticPathEqual = JSON.stringify(baselineSemanticPath) === JSON.stringify(candidateSemanticPath);
  const signaturePathEqual = JSON.stringify(baselineSignaturePath) === JSON.stringify(candidateSignaturePath);
  const nameMultisetEqual = multisetEqual(baselineNamePath, candidateNamePath);
  const actionOrderDrift = !namePathEqual && nameMultisetEqual;
  const extraActionClasses = excessBy(candidateNamePath, baselineNamePath, "action_class");
  const candidateOnlySemantic = excessBy(candidateSemanticPath, baselineSemanticPath, "semantic_signature");
  const candidateOnlySignature = excessBy(candidateSignaturePath, baselineSignaturePath, "signature");
  const semanticArgDrift = pairedArgumentDrift(baseline, candidate, "semantic");
  const fullArgDrift = pairedArgumentDrift(baseline, candidate, "signature");
  const dangerousDupes = dangerousDuplicateExcess(baseline, candidate);
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
    action_class_path_equal: namePathEqual,
    tool_name_multiset_equal: nameMultisetEqual,
    action_order_drift: actionOrderDrift,
    semantic_path_equal: semanticPathEqual,
    tool_signature_path_equal: signaturePathEqual,
    first_action_divergence_turn_name: firstDivergenceTurn(baseline, candidate, "name"),
    first_action_divergence_turn_semantic: firstDivergenceTurn(baseline, candidate, "semantic"),
    first_action_divergence_turn_signature: firstDivergenceTurn(baseline, candidate, "signature"),
    first_soft_text_divergence_turn: firstAssistantTextDivergenceTurn(baseline, candidate),
    extra_action_class_count: extraActionClasses.reduce((s, x) => s + x.excess, 0),
    extra_action_classes: extraActionClasses,
    candidate_only_semantic_action_count: candidateOnlySemantic.reduce((s, x) => s + x.excess, 0),
    candidate_only_semantic_action_rate: candidate.toolCalls.length ? candidateOnlySemantic.reduce((s, x) => s + x.excess, 0) / candidate.toolCalls.length : 0,
    candidate_only_action_count: candidateOnlySignature.reduce((s, x) => s + x.excess, 0),
    candidate_only_action_rate: candidate.toolCalls.length ? candidateOnlySignature.reduce((s, x) => s + x.excess, 0) / candidate.toolCalls.length : 0,
    semantic_argument_drift_count: semanticArgDrift.length,
    full_argument_drift_count: fullArgDrift.length,
    semantic_argument_drifts: semanticArgDrift,
    full_argument_drifts: fullArgDrift,
    dangerous_duplicate_action_count: dangerousDupes.reduce((s, x) => s + x.excess, 0),
    dangerous_duplicate_actions: dangerousDupes,
    candidate_only_actions: candidateOnlySignature,
    candidate_only_semantic_actions: candidateOnlySemantic,
    baseline_path_names: baselineNamePath,
    candidate_path_names: candidateNamePath,
    baseline_path_semantic: baselineSemanticPath,
    candidate_path_semantic: candidateSemanticPath,
    baseline_path_signatures: baselineSignaturePath,
    candidate_path_signatures: candidateSignaturePath,
    baseline_summary: baseline.summary,
    candidate_summary: candidate.summary,
  };
}

function aggregate(results) {
  const n = results.length;
  const candidateCalls = results.reduce((s, r) => s + r.candidate_tool_call_count, 0);
  const semanticDivTurns = results.map((r) => r.first_action_divergence_turn_semantic).filter((x) => x !== null);
  return {
    scenario_count: n,
    tool_name_path_equality_rate: n ? results.filter((r) => r.tool_name_path_equal).length / n : 0,
    semantic_path_equality_rate: n ? results.filter((r) => r.semantic_path_equal).length / n : 0,
    tool_signature_path_equality_rate: n ? results.filter((r) => r.tool_signature_path_equal).length / n : 0,
    status_equality_rate: n ? results.filter((r) => r.status_equal).length / n : 0,
    candidate_regression_rate: n ? results.filter((r) => r.candidate_regressed).length / n : 0,
    action_order_drift_rate: n ? results.filter((r) => r.action_order_drift).length / n : 0,
    extra_action_class_rate: candidateCalls ? results.reduce((s, r) => s + r.extra_action_class_count, 0) / candidateCalls : 0,
    candidate_only_semantic_action_rate: candidateCalls ? results.reduce((s, r) => s + r.candidate_only_semantic_action_count, 0) / candidateCalls : 0,
    candidate_only_action_rate: candidateCalls ? results.reduce((s, r) => s + r.candidate_only_action_count, 0) / candidateCalls : 0,
    semantic_argument_drift_rate: candidateCalls ? results.reduce((s, r) => s + r.semantic_argument_drift_count, 0) / candidateCalls : 0,
    dangerous_duplicate_action_count: results.reduce((s, r) => s + r.dangerous_duplicate_action_count, 0),
    first_divergence_turn_min: semanticDivTurns.length ? Math.min(...semanticDivTurns) : null,
  };
}

function renderPath(pathItems) { return pathItems.length ? pathItems.map((x) => `\`${x}\``).join(" → ") : "∅"; }
function renderMarkdown(metrics) {
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const md = [];
  md.push("# KVFidelity paired-run report", "", "External prototype over `tool-eval-bench` Markdown traces.", "");
  md.push("## Runs", "", `- Baseline: **${metrics.labels.baseline}** — \`${metrics.runs.baseline.run_id}\``, `- Candidate: **${metrics.labels.candidate}** — \`${metrics.runs.candidate.run_id}\``, "");
  md.push("## Aggregate", "");
  md.push(`- Scenario count: **${metrics.aggregate.scenario_count}**`);
  md.push(`- Tool/action-class path equality: **${pct(metrics.aggregate.tool_name_path_equality_rate)}**`);
  md.push(`- Semantic path equality: **${pct(metrics.aggregate.semantic_path_equality_rate)}**`);
  md.push(`- Full signature path equality: **${pct(metrics.aggregate.tool_signature_path_equality_rate)}**`);
  md.push(`- Status equality: **${pct(metrics.aggregate.status_equality_rate)}**`);
  md.push(`- Candidate regression rate: **${pct(metrics.aggregate.candidate_regression_rate)}**`);
  md.push(`- Action-order drift rate: **${pct(metrics.aggregate.action_order_drift_rate)}**`);
  md.push(`- Extra action-class rate: **${pct(metrics.aggregate.extra_action_class_rate)}**`);
  md.push(`- Candidate-only semantic action rate: **${pct(metrics.aggregate.candidate_only_semantic_action_rate)}**`);
  md.push(`- Candidate-only full-signature action rate: **${pct(metrics.aggregate.candidate_only_action_rate)}**`);
  md.push(`- Semantic argument drift rate: **${pct(metrics.aggregate.semantic_argument_drift_rate)}**`);
  md.push(`- Dangerous duplicate action count: **${metrics.aggregate.dangerous_duplicate_action_count}**`);
  md.push(`- Earliest semantic action divergence turn: **${metrics.aggregate.first_divergence_turn_min ?? "none"}**`, "");

  md.push("## Scenario comparison", "");
  md.push("| Scenario | Status | Action class path | Semantic path | Full signature | Order drift | Extra class | Semantic-only | Arg drift | Dangerous dupes | First semantic div | Soft text div |");
  md.push("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const r of metrics.scenarios) {
    const status = r.status_equal ? `${r.baseline_status}` : `${r.baseline_status} → ${r.candidate_status}`;
    md.push(`| ${r.scenario_id} | ${status} | ${r.tool_name_path_equal ? "✅" : "❌"} | ${r.semantic_path_equal ? "✅" : "❌"} | ${r.tool_signature_path_equal ? "✅" : "❌"} | ${r.action_order_drift ? "⚠️" : "—"} | ${r.extra_action_class_count} | ${r.candidate_only_semantic_action_count} | ${r.semantic_argument_drift_count} | ${r.dangerous_duplicate_action_count} | ${r.first_action_divergence_turn_semantic ?? "—"} | ${r.first_soft_text_divergence_turn ?? "—"} |`);
  }
  md.push("", "## Divergences", "");
  for (const r of metrics.scenarios.filter((x) => !x.semantic_path_equal || !x.tool_name_path_equal || !x.status_equal || x.extra_action_class_count || x.dangerous_duplicate_action_count)) {
    md.push(`### ${r.scenario_id}`, "", `- Status: ${r.baseline_status} → ${r.candidate_status}`);
    md.push(`- First semantic divergence turn: ${r.first_action_divergence_turn_semantic ?? "none"}`);
    md.push(`- Action-class path equal: ${r.tool_name_path_equal ? "yes" : "no"}`);
    md.push(`- Action-order drift: ${r.action_order_drift ? "yes" : "no"}`);
    md.push(`- Baseline action classes: ${renderPath(r.baseline_path_names)}`);
    md.push(`- Candidate action classes: ${renderPath(r.candidate_path_names)}`);
    md.push(`- Baseline semantic path: ${renderPath(r.baseline_path_semantic)}`);
    md.push(`- Candidate semantic path: ${renderPath(r.candidate_path_semantic)}`);
    if (r.semantic_argument_drifts.length) {
      md.push("- Paired semantic argument drifts:");
      for (const d of r.semantic_argument_drifts.slice(0, 8)) md.push(`  - #${d.index} turn ${d.turn} \`${d.tool}\`: ${d.baseline} → ${d.candidate}`);
    }
    if (r.extra_action_classes.length) {
      md.push("- Extra action classes:");
      for (const a of r.extra_action_classes) md.push(`  - \`${a.action_class}\` baseline=${a.baseline}, candidate=${a.candidate}, excess=${a.excess}`);
    }
    if (r.dangerous_duplicate_actions.length) {
      md.push("- Dangerous duplicate actions:");
      for (const a of r.dangerous_duplicate_actions) md.push(`  - \`${a.semanticSignature}\` baseline=${a.baseline}, candidate=${a.candidate}, excess=${a.excess}`);
    }
    md.push("");
  }
  md.push("## Notes", "");
  md.push("- Action-class path = tool-name path. This catches order/class changes without treating every argument change as a new action class.");
  md.push("- Semantic path removes volatile/verbose fields such as email body, while preserving recipients, subject, event fields, file IDs and query terms.");
  md.push("- Full signature path remains available as the strictest comparison.");
  md.push("- Dangerous duplicate detection is heuristic and flags repeated dangerous semantic signatures, not all repeated tool uses.");
  md.push("- `tool-eval-bench` SQLite summaries currently do not persist `raw_log`; this prototype reads Markdown reports because they include full traces.", "");
  return md.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const baseline = parseReportMarkdown(args.reportA), candidate = parseReportMarkdown(args.reportB);
  const ids = [...baseline.scenarios.keys()].filter((id) => candidate.scenarios.has(id)).sort();
  if (!ids.length) throw new Error("No overlapping scenario ids between reports.");
  const scenarios = ids.map((id) => compareScenario(id, baseline.scenarios.get(id), candidate.scenarios.get(id)));
  const metrics = {
    schema: "kvfidelity.tool-eval-bench.paired-report.v1-semantic",
    generated_at: new Date().toISOString(),
    labels: { baseline: args.labelA, candidate: args.labelB },
    runs: { baseline: { run_id: baseline.runId, model: baseline.model, report: path.resolve(args.reportA) }, candidate: { run_id: candidate.runId, model: candidate.model, report: path.resolve(args.reportB) } },
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

try { main(); } catch (err) { console.error(`kvfidelity-compare: ${err.message}`); process.exit(1); }
