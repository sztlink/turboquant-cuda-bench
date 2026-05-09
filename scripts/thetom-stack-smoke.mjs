#!/usr/bin/env node
/*
 * Smoke adapter for TheTom public tools used around TurboQuant/longctx.
 *
 * This script does not vendor or install those tools. It expects local clones
 * or explicit env vars, runs no heavy benchmarks, and writes a receipt that can
 * be attached to KVFidelity / CUDA bench notes.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_CONTEXT_ROOT = path.resolve(REPO_ROOT, "../../tmp/turboquant-build-context-2026-05-09/github");

function usage(exitCode = 0) {
  console.log(`Usage:
  node scripts/thetom-stack-smoke.mjs [options]

Options:
  --out-dir DIR              Output directory. Default: bench/thetom-stack-smoke/latest
  --tqkit-dir DIR            Local clone of TheTom/tqkit
  --turboquant-plus-dir DIR  Local clone of TheTom/turboquant_plus
  --longctx-dir DIR          Local clone of TheTom/longctx
  --longctx-deps-dir DIR     Optional pip --target dir with fastapi/uvicorn/etc.
  --python BIN               Python binary. Default: python3

Env fallbacks:
  TQKIT_DIR, TURBOQUANT_PLUS_DIR, LONGCTX_DIR, LONGCTX_DEPS_DIR, PYTHON
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = {
    outDir: path.join(REPO_ROOT, "bench/thetom-stack-smoke/latest"),
    tqkitDir: process.env.TQKIT_DIR || path.join(DEFAULT_CONTEXT_ROOT, "tqkit-clone"),
    turboquantPlusDir: process.env.TURBOQUANT_PLUS_DIR || path.join(DEFAULT_CONTEXT_ROOT, "turboquant_plus-clone"),
    longctxDir: process.env.LONGCTX_DIR || path.join(DEFAULT_CONTEXT_ROOT, "longctx-clone"),
    longctxDepsDir: process.env.LONGCTX_DEPS_DIR || null,
    python: process.env.PYTHON || "python3",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") usage(0);
    if (!a.startsWith("--")) throw new Error(`Unexpected argument: ${a}`);
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = argv[++i];
    if (!value) throw new Error(`Missing value for ${a}`);
    if (!(key in args)) throw new Error(`Unknown option: ${a}`);
    args[key] = value;
  }
  args.outDir = path.resolve(args.outDir);
  args.tqkitDir = path.resolve(args.tqkitDir);
  args.turboquantPlusDir = path.resolve(args.turboquantPlusDir);
  args.longctxDir = path.resolve(args.longctxDir);
  if (args.longctxDepsDir) args.longctxDepsDir = path.resolve(args.longctxDepsDir);
  return args;
}

function commandString(cmd, args) {
  return [cmd, ...args.map((a) => String(a).includes(" ") ? JSON.stringify(a) : String(a))].join(" ");
}

function run(cmd, args, opts = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd || REPO_ROOT,
    env: { ...process.env, ...(opts.env || {}) },
    encoding: "utf8",
    timeout: opts.timeout || 60_000,
    shell: false,
  });
  return {
    command: commandString(cmd, args),
    cwd: opts.cwd || REPO_ROOT,
    startedAt,
    exitCode: result.status,
    signal: result.signal || null,
    error: result.error ? String(result.error) : null,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function pathStatus(p) {
  return { path: p, exists: existsSync(p) };
}

function pyPath(...dirs) {
  const parts = dirs.filter(Boolean);
  if (process.env.PYTHONPATH) parts.push(process.env.PYTHONPATH);
  return parts.join(path.delimiter);
}

function firstLines(text, n = 80) {
  return String(text || "").trim().split(/\r?\n/).slice(0, n).join("\n");
}

function listJsonExamples(dir) {
  const examplesDir = path.join(dir, "refract/examples");
  if (!existsSync(examplesDir)) return [];
  return readdirSync(examplesDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => path.join("refract/examples", f));
}

function writeMarkdown(receipt, outPath) {
  const lines = [];
  lines.push("# TheTom stack smoke receipt");
  lines.push("");
  lines.push(`Date: ${receipt.generatedAt}`);
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push("No public claim. This is a local adapter smoke for three public TheTom surfaces:");
  lines.push("");
  lines.push("- tqkit: KV-cache math and backend receipt surface.");
  lines.push("- longctx-svc: local retrieval sidecar / proxy.");
  lines.push("- REFRACT: reference-anchored quality audit reports.");
  lines.push("");
  lines.push("## Paths");
  lines.push("");
  for (const [name, status] of Object.entries(receipt.paths)) {
    lines.push(`- ${name}: ${status.exists ? "ok" : "missing"} - \`${status.path}\``);
  }
  lines.push("");
  lines.push("## tqkit");
  lines.push("");
  for (const key of ["backends", "reportQwen14b32k", "strategiesQwen14b128k", "tableQwen35b", "tableQwen27b"]) {
    const r = receipt.commands.tqkit?.[key];
    if (!r) continue;
    lines.push(`### ${key}`);
    lines.push("");
    lines.push(`Command: \`${r.command}\``);
    lines.push("");
    lines.push("```text");
    lines.push(firstLines(r.stdout || r.stderr, 120));
    lines.push("```");
    lines.push("");
  }
  lines.push("## REFRACT");
  lines.push("");
  const refract = receipt.commands.refract?.compareExamples;
  if (refract) {
    lines.push(`Command: \`${refract.command}\``);
    lines.push("");
    lines.push("```text");
    lines.push(firstLines(refract.stdout || refract.stderr, 120));
    lines.push("```");
    lines.push("");
  }
  lines.push("## longctx-svc");
  lines.push("");
  const dep = receipt.commands.longctx?.dependencyProbe;
  if (dep) {
    lines.push("### dependency probe");
    lines.push("");
    lines.push("```json");
    lines.push(firstLines(dep.stdout || dep.stderr, 120));
    lines.push("```");
    lines.push("");
  }
  for (const key of ["version", "healthz"]) {
    const r = receipt.commands.longctx?.[key];
    if (!r) continue;
    lines.push(`### ${key}`);
    lines.push("");
    lines.push(`Command: \`${r.command}\``);
    lines.push("");
    lines.push("```text");
    lines.push(firstLines(r.stdout || r.stderr, 120));
    lines.push("```");
    lines.push("");
  }
  lines.push("## Interpretation");
  lines.push("");
  lines.push("- tqkit is immediately usable as a metadata/receipt adapter for CUDA bench notes.");
  lines.push("- REFRACT examples can be parsed now; live scores still require model files and backend binaries.");
  lines.push("- longctx-svc boots locally when minimal web dependencies are supplied via PYTHONPATH. Retrieval requires sentence-transformers or a configured embedder path.");
  lines.push("");
  writeFileSync(outPath, lines.join("\n"));
}

function main() {
  const args = parseArgs(process.argv);
  mkdirSync(args.outDir, { recursive: true });

  const receipt = {
    schema: "sztlink.thetom_stack_smoke.v1",
    generatedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    paths: {
      tqkit: pathStatus(args.tqkitDir),
      turboquantPlus: pathStatus(args.turboquantPlusDir),
      longctx: pathStatus(args.longctxDir),
      longctxDeps: args.longctxDepsDir ? pathStatus(args.longctxDepsDir) : { path: null, exists: false },
    },
    commands: { tqkit: {}, refract: {}, longctx: {} },
  };

  if (receipt.paths.tqkit.exists) {
    const env = { PYTHONPATH: pyPath(args.tqkitDir) };
    receipt.commands.tqkit.backends = run(args.python, ["-m", "tqkit.cli", "backends"], { cwd: args.tqkitDir, env });
    receipt.commands.tqkit.reportQwen14b32k = run(args.python, ["-m", "tqkit.cli", "report", "--model", "qwen2.5-14b-instruct-1m", "--ctx", "32K", "--layout", "tq+asym"], { cwd: args.tqkitDir, env });
    receipt.commands.tqkit.strategiesQwen14b128k = run(args.python, ["-m", "tqkit.cli", "compare-strategies", "--model", "qwen2.5-14b-instruct-1m", "--ctx", "128K"], { cwd: args.tqkitDir, env });
    receipt.commands.tqkit.tableQwen35b = run(args.python, ["-m", "tqkit.cli", "table", "--model", "qwen3.6-35b-a3b", "--ctxs", "18000", "32768", "65000", "1M", "--layouts", "fp16", "q8_0", "tq+asym", "turbo4"], { cwd: args.tqkitDir, env });
    receipt.commands.tqkit.tableQwen27b = run(args.python, ["-m", "tqkit.cli", "table", "--model", "qwen3.6-27b", "--ctxs", "32768", "65000", "128K", "1M", "--layouts", "fp16", "q8_0", "tq+asym", "turbo4"], { cwd: args.tqkitDir, env });
  }

  if (receipt.paths.turboquantPlus.exists) {
    const examples = listJsonExamples(args.turboquantPlusDir);
    const env = { PYTHONPATH: pyPath(args.turboquantPlusDir) };
    if (examples.length) {
      receipt.commands.refract.compareExamples = run(args.python, ["-m", "refract.cli", "compare", ...examples], { cwd: args.turboquantPlusDir, env });
    }
  }

  if (receipt.paths.longctx.exists) {
    const svcDir = path.join(args.longctxDir, "services/longctx-svc");
    const env = { PYTHONPATH: pyPath(args.longctxDepsDir, svcDir, args.longctxDir) };
    const depsScript = "import json\nmods=['fastapi','uvicorn','pydantic','httpx','pathspec','watchdog','rank_bm25','sentence_transformers']\nout={}\nfor m in mods:\n    try:\n        __import__(m); out[m]='ok'\n    except Exception as e:\n        out[m]=type(e).__name__\nprint(json.dumps(out, indent=2, sort_keys=True))";
    receipt.commands.longctx.dependencyProbe = run(args.python, ["-c", depsScript], { cwd: svcDir, env });
    receipt.commands.longctx.version = run(args.python, ["-m", "longctx_svc.cli", "version"], { cwd: svcDir, env });

    if (args.longctxDepsDir && existsSync(args.longctxDepsDir)) {
      const healthScript = `set -e\nrm -f /tmp/thetom-longctx-smoke.log /tmp/thetom-longctx-health.json /tmp/thetom-longctx-status.txt\nPYTHONPATH=${JSON.stringify(env.PYTHONPATH)} LONGCTX_NO_JANITOR=1 timeout 12s ${args.python} -m longctx_svc.cli serve --host 127.0.0.1 --port 8876 > /tmp/thetom-longctx-smoke.log 2>&1 &\npid=$!\nfor i in $(seq 1 50); do\n  if curl -fsS http://127.0.0.1:8876/healthz > /tmp/thetom-longctx-health.json 2>/tmp/thetom-longctx-curl.err; then\n    curl -fsS -H 'Accept: text/plain' http://127.0.0.1:8876/longctx/status > /tmp/thetom-longctx-status.txt 2>/tmp/thetom-longctx-status.err || true\n    kill $pid 2>/dev/null || true\n    wait $pid 2>/dev/null || true\n    echo 'healthz:'\n    cat /tmp/thetom-longctx-health.json\n    echo '\nstatus:'\n    cat /tmp/thetom-longctx-status.txt || true\n    echo '\nlog:'\n    sed -n '1,80p' /tmp/thetom-longctx-smoke.log\n    exit 0\n  fi\n  sleep 0.2\ndone\necho 'healthz failed'\nsed -n '1,160p' /tmp/thetom-longctx-smoke.log || true\nkill $pid 2>/dev/null || true\nwait $pid 2>/dev/null || true\nexit 1`;
      receipt.commands.longctx.healthz = run("bash", ["-lc", healthScript], { cwd: svcDir, env, timeout: 20_000 });
    }
  }

  const jsonPath = path.join(args.outDir, "receipt.json");
  const mdPath = path.join(args.outDir, "RESULTS.md");
  writeFileSync(jsonPath, `${JSON.stringify(receipt, null, 2)}\n`);
  writeMarkdown(receipt, mdPath);
  console.log(`wrote ${jsonPath}`);
  console.log(`wrote ${mdPath}`);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
}
