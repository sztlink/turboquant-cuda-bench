#!/usr/bin/env node
/*
 * KVFidelity paired-run comparator for tool-eval-bench Markdown reports.
 *
 * External prototype: pairs scenarios across two reports and asks whether a
 * same-model config change preserves long multi-turn action traces.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

function usage(exitCode = 0) {
  console.log(`Usage:
  node scripts/kvfidelity-compare-tool-eval-bench.mjs \\
    --report-a baseline.md --report-b candidate.md \\
    [--label-a q8/q8] [--label-b q8/turbo3] [--out-dir out] \\
    [--mode v1|v2] [--tool-ontology path.json] [--scenario-metadata path.json]

Outputs paired trace metrics as JSON and/or Markdown. v2 adds operational
classification for publish/review/exclude decisions.
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

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_TOOL_ONTOLOGY_PATH = path.join(REPO_ROOT, "bench/agentic-context-fidelity/kvfidelity-tool-ontology.json");
const DEFAULT_SCENARIO_METADATA_PATH = path.join(REPO_ROOT, "bench/agentic-context-fidelity/kvfidelity-scenario-metadata.json");

let TOOL_ONTOLOGY = { tools: {}, default_volatile_args: ["body", "content", "message", "raw", "metadata", "timestamp", "request_id"] };
let TOOL_ONTOLOGY_SOURCE = null;

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}
function maybeLoadJson(filePath) {
  return filePath && existsSync(filePath) ? loadJson(filePath) : null;
}
function configureToolOntology(filePath, { required = false } = {}) {
  const resolved = filePath ? path.resolve(filePath) : DEFAULT_TOOL_ONTOLOGY_PATH;
  const ontology = maybeLoadJson(resolved);
  if (!ontology) {
    if (required) throw new Error(`Missing required tool ontology: ${resolved}`);
    TOOL_ONTOLOGY_SOURCE = null;
    return;
  }
  TOOL_ONTOLOGY = ontology;
  TOOL_ONTOLOGY_SOURCE = resolved;
}
function loadScenarioMetadata(filePath) {
  const resolved = filePath ? path.resolve(filePath) : DEFAULT_SCENARIO_METADATA_PATH;
  return maybeLoadJson(resolved) ?? { version: 0, scenarios: {} };
}
function toolSpec(name) { return TOOL_ONTOLOGY.tools?.[name] ?? {}; }
function isDangerousTool(name) { return Boolean(toolSpec(name).dangerous); }
function volatileKeysFor(name) {
  return new Set([...(TOOL_ONTOLOGY.default_volatile_args ?? []), ...(toolSpec(name).volatile_args ?? [])]);
}

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
  const configured = toolSpec(name).durable_args;
  const volatile = volatileKeysFor(name);
  const keys = Array.isArray(configured) ? configured : Object.keys(args).filter((k) => !volatile.has(k));
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
        dangerous: isDangerousTool(name),
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
  const candidateImproved = severity(candidate.verdict) > severity(baseline.verdict);

  return {
    scenario_id: scenarioId,
    baseline_status: baseline.verdict,
    candidate_status: candidate.verdict,
    status_equal: statusEqual,
    status_delta: candidateRegressed ? "regressed" : candidateImproved ? "improved" : "same",
    candidate_regressed: candidateRegressed,
    candidate_improved: candidateImproved,
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
  const byCategory = countBy(results.map((r) => r.classification?.category ?? "unclassified"), (x) => x);
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
    v2_category_counts: Object.fromEntries([...byCategory.entries()].sort()),
    v2_high_confidence_regression_count: results.filter((r) => r.classification?.auto_confidence === "high" && ["REGRESSION_CRITICAL", "REGRESSION_MODERATE"].includes(r.classification?.category)).length,
  };
}

function uniq(items) { return [...new Set(items.filter(Boolean))]; }
function extraDangerousActionClasses(result) {
  return result.extra_action_classes.filter((x) => isDangerousTool(x.action_class));
}
function semanticDriftTouchesCriticalField(drift) {
  const spec = toolSpec(drift.tool);
  const critical = spec.critical_args ?? spec.identity_args ?? [];
  if (!critical.length) return false;
  return critical.some((k) => String(drift.baseline).includes(`"${k}"`) || String(drift.candidate).includes(`"${k}"`));
}
function defaultMechanismClasses(r) {
  const classes = [];
  if (r.candidate_regressed) classes.push("status_regression");
  if (r.candidate_improved) classes.push("status_improvement", "candidate_improvement");
  if (r.dangerous_duplicate_action_count > 0) classes.push("dangerous_duplicate_excess");
  if (extraDangerousActionClasses(r).length) classes.push("extra_dangerous_action");
  if (r.semantic_argument_drift_count > 0) classes.push("semantic_argument_drift");
  if (r.action_order_drift) classes.push("commutative_order_swap");
  if (r.extra_action_class_count > 0) classes.push("redundant_expansion", "extra_action");
  if (r.candidate_tool_call_count < r.baseline_tool_call_count && !r.semantic_path_equal) classes.push("workflow_truncation");
  if (!classes.length && !r.semantic_path_equal) classes.push("semantic_path_drift");
  if (!classes.length && !r.tool_signature_path_equal) classes.push("volatile_or_full_signature_drift");
  if (!classes.length) classes.push("exact_or_equivalent");
  return uniq(classes);
}
function reviewMetadataApplies(meta, r) {
  if (!meta || !Object.keys(meta).length) return false;
  if (meta.review_scope === "scenario_global") return true;
  // Pair-specific/source-review metadata must not be reused by scenario id alone.
  // Future trace-bound metadata should match labels and/or semantic path hashes here.
  if (meta.review_scope === "trace_bound") return false;
  return false;
}
function hasReviewLikeMetadata(meta) {
  return Boolean(meta && (meta.human_reviewed || meta.human_label || meta.category_override || meta.direction_override || meta.primary_class_override || meta.severity !== undefined || meta.auto_confidence || meta.notes));
}
function classifyScenarioV2(r, scenarioMetadata = {}) {
  const rawMeta = scenarioMetadata.scenarios?.[r.scenario_id] ?? {};
  const metadataReviewApplied = reviewMetadataApplies(rawMeta, r);
  const metadataStale = !metadataReviewApplied && hasReviewLikeMetadata(rawMeta);
  const meta = metadataReviewApplied ? rawMeta : {};
  const traceEquivalent = r.status_equal && r.tool_name_path_equal && r.semantic_path_equal && r.tool_signature_path_equal && !r.action_order_drift && r.extra_action_class_count === 0 && r.semantic_argument_drift_count === 0 && r.dangerous_duplicate_action_count === 0;
  if (traceEquivalent) {
    return {
      category: "EQUIVALENT",
      severity: 0,
      auto_confidence: "high",
      human_label: null,
      human_reviewed: false,
      primary_class: "exact_trace_match",
      mechanism_classes: ["exact_trace_match"],
      direction: "benign_equivalent",
      review_status: "auto_only",
      public_evidence_eligible: false,
      exclude_from_public_aggregates: false,
      exclude_from_degradation_aggregates: false,
      rationale: null,
    };
  }
  const mechanisms = uniq([...(meta.mechanism_classes ?? []), ...defaultMechanismClasses(r)]);

  let category = "EQUIVALENT";
  let sev = 0;
  let autoConfidence = "high";
  let direction = "benign_equivalent";

  const criticalDanger = r.dangerous_duplicate_action_count > 0 || extraDangerousActionClasses(r).length > 0;
  const criticalArgDrift = r.semantic_argument_drifts.some(semanticDriftTouchesCriticalField);

  if (criticalDanger) {
    category = "REGRESSION_CRITICAL";
    sev = 3;
    autoConfidence = "low";
    direction = "candidate_regression";
  } else if (r.candidate_improved) {
    category = "IMPROVEMENT";
    sev = 0;
    autoConfidence = "high";
    direction = "candidate_improvement";
  } else if (r.candidate_regressed || criticalArgDrift) {
    category = "REGRESSION_MODERATE";
    sev = 2;
    autoConfidence = r.candidate_regressed ? "high" : "low";
    direction = "candidate_regression";
  } else if (!r.semantic_path_equal) {
    category = "REGRESSION_MODERATE";
    sev = 2;
    autoConfidence = "low";
    direction = "lateral_drift";
  } else if (r.action_order_drift || !r.tool_signature_path_equal) {
    category = "REGRESSION_SOFT";
    sev = 1;
    autoConfidence = "low";
    direction = "lateral_drift";
  }

  if (meta.category_override) category = meta.category_override;
  if (meta.direction_override) direction = meta.direction_override;
  if (Number.isFinite(meta.severity)) sev = meta.severity;
  if (meta.auto_confidence) autoConfidence = meta.auto_confidence;
  if (category === "ARTIFACT") direction = meta.direction_override ?? "scenario_artifact";

  const sourceReviewed = Boolean(meta.human_reviewed);
  const humanLabel = meta.human_label ?? null;
  const reviewStatus = sourceReviewed ? "source_reviewed" : (metadataStale ? "stale_metadata_needs_review" : (autoConfidence === "high" ? "auto_only" : "needs_review"));
  const primaryClass = meta.primary_class_override ?? meta.expected_primary_class ?? mechanisms[0] ?? "exact_or_equivalent";

  return {
    category,
    severity: sev,
    auto_confidence: autoConfidence,
    human_label: humanLabel,
    human_reviewed: sourceReviewed,
    source_reviewed: sourceReviewed,
    metadata_review_applied: metadataReviewApplied,
    metadata_stale: metadataStale,
    primary_class: primaryClass,
    mechanism_classes: mechanisms,
    direction,
    review_status: reviewStatus,
    public_evidence_eligible: sourceReviewed && metadataReviewApplied && !["ARTIFACT"].includes(category) && !meta.exclude_from_public_aggregates,
    exclude_from_public_aggregates: Boolean(meta.exclude_from_public_aggregates),
    exclude_from_degradation_aggregates: Boolean(meta.exclude_from_degradation_aggregates) || category === "IMPROVEMENT" || category === "ARTIFACT",
    rationale: metadataReviewApplied ? (meta.notes ?? null) : null,
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
  if (metrics.schema.includes("v2")) {
    md.push("## V2 operational classification", "");
    md.push("Operational category is the publish/review/exclude decision layer. Mechanism classes describe the trace behavior behind it.", "");
    for (const [category, count] of Object.entries(metrics.aggregate.v2_category_counts ?? {})) md.push(`- ${category}: **${count}**`);
    md.push(`- High-confidence regression count: **${metrics.aggregate.v2_high_confidence_regression_count ?? 0}**`, "");
    md.push("| Scenario | Category | Sev | Auto confidence | Review status | Primary mechanism | Public evidence |", "|---|---|---:|---|---|---|---:|");
    for (const r of metrics.scenarios) {
      const c = r.classification;
      md.push(`| ${r.scenario_id} | ${c?.category ?? "—"} | ${c?.severity ?? "—"} | ${c?.auto_confidence ?? "—"} | ${c?.review_status ?? "—"} | ${c?.primary_class ?? "—"} | ${c?.public_evidence_eligible ? "✅" : "—"} |`);
    }
    md.push("");
  }

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

function renderHumanReviewQueue(metrics) {
  const items = metrics.scenarios
    .filter((r) => r.classification && r.classification.category !== "EQUIVALENT" && !r.classification.exclude_from_public_aggregates)
    .sort((a, b) => {
      const ar = a.classification.review_status === "needs_review" ? 1 : 0;
      const br = b.classification.review_status === "needs_review" ? 1 : 0;
      if (br !== ar) return br - ar;
      if (b.classification.severity !== a.classification.severity) return b.classification.severity - a.classification.severity;
      return (a.first_action_divergence_turn_semantic ?? 999) - (b.first_action_divergence_turn_semantic ?? 999);
    });
  const md = [];
  md.push("# KVFidelity v2 review queue", "", `Generated: ${metrics.generated_at}`, "");
  md.push("Review goal: decide whether each non-equivalent trace difference is regression, improvement, artifact, or benign drift before public aggregation.", "");
  for (const r of items) {
    const c = r.classification;
    md.push(`## ${r.scenario_id} — ${c.category} / ${c.primary_class}`, "");
    md.push(`- status: ${r.baseline_status} → ${r.candidate_status}`);
    md.push(`- severity: ${c.severity}`);
    md.push(`- auto confidence: ${c.auto_confidence}`);
    md.push(`- review status: ${c.review_status}`);
    md.push(`- first semantic divergence turn: ${r.first_action_divergence_turn_semantic ?? "none"}`);
    md.push(`- baseline actions: ${r.baseline_path_names.join(" → ") || "∅"}`);
    md.push(`- candidate actions: ${r.candidate_path_names.join(" → ") || "∅"}`);
    md.push(`- mechanism classes: ${(c.mechanism_classes ?? []).join(", ")}`);
    if (c.rationale) md.push(`- source rationale: ${c.rationale}`);
    if (c.metadata_stale) md.push("- stale metadata warning: scenario metadata exists but was not trace-bound/applied; do not reuse prior review blindly.");
    md.push("- reviewer question: does this category reflect candidate behavior, or is it improvement/artifact/benign equivalence?", "");
  }
  if (!items.length) md.push("No non-equivalent review items.", "");
  return md.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  const mode = args.mode ?? "v1";
  if (!["v1", "v2"].includes(mode)) throw new Error(`Unsupported --mode: ${mode}`);
  configureToolOntology(args.toolOntology, { required: mode === "v2" });
  const scenarioMetadata = mode === "v2" ? loadScenarioMetadata(args.scenarioMetadata) : { version: 0, scenarios: {} };

  const baseline = parseReportMarkdown(args.reportA), candidate = parseReportMarkdown(args.reportB);
  const ids = [...baseline.scenarios.keys()].filter((id) => candidate.scenarios.has(id)).sort();
  if (!ids.length) throw new Error("No overlapping scenario ids between reports.");
  const scenarios = ids.map((id) => {
    const compared = compareScenario(id, baseline.scenarios.get(id), candidate.scenarios.get(id));
    if (mode === "v2") compared.classification = classifyScenarioV2(compared, scenarioMetadata);
    return compared;
  });
  const metrics = {
    schema: mode === "v2" ? "kvfidelity.tool-eval-bench.paired-report.v2-operational" : "kvfidelity.tool-eval-bench.paired-report.v1-semantic",
    generated_at: new Date().toISOString(),
    comparator_mode: mode,
    labels: { baseline: args.labelA, candidate: args.labelB },
    config: {
      tool_ontology: TOOL_ONTOLOGY_SOURCE,
      scenario_metadata: mode === "v2" ? path.resolve(args.scenarioMetadata ?? DEFAULT_SCENARIO_METADATA_PATH) : null,
    },
    runs: { baseline: { run_id: baseline.runId, model: baseline.model, report: path.resolve(args.reportA) }, candidate: { run_id: candidate.runId, model: candidate.model, report: path.resolve(args.reportB) } },
    aggregate: aggregate(scenarios),
    scenarios,
  };
  if (args.outDir) {
    mkdirSync(args.outDir, { recursive: true });
    const jsonName = mode === "v2" ? "kvfidelity-v2-classified.json" : "kvfidelity-metrics.json";
    const mdName = mode === "v2" ? "kvfidelity-v2-report.md" : "kvfidelity-report.md";
    writeFileSync(path.join(args.outDir, jsonName), JSON.stringify(metrics, null, 2) + "\n");
    writeFileSync(path.join(args.outDir, mdName), renderMarkdown(metrics));
    if (mode === "v2") writeFileSync(path.join(args.outDir, "human-review-queue.md"), renderHumanReviewQueue(metrics));
  }
  if (args.json || !args.outDir) console.log(JSON.stringify(metrics, null, 2));
  else console.log(`Wrote ${path.join(args.outDir, mode === "v2" ? "kvfidelity-v2-report.md" : "kvfidelity-report.md")}`);
}

try { main(); } catch (err) { console.error(`kvfidelity-compare: ${err.message}`); process.exit(1); }
