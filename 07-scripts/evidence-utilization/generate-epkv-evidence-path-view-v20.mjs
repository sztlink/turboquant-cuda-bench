#!/usr/bin/env node
/**
 * Generate EPKV evidence-path validator-first offline view v2.0.
 *
 * Casey-guided form: process + validation first, receipts second.
 * Boundary: static local HTML only. No runtime, no model call, no external post.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const LEDGER = path.join(ROOT, 'bench/evidence-utilization-epkv-evidence-path-ledger-v19-2026-05-19/evidence-path-ledger-v19.json');
const SUMMARY = path.join(ROOT, 'bench/evidence-utilization-epkv-evidence-path-ledger-v19-2026-05-19/summary.json');
const OUT = path.join(ROOT, 'bench-public/evidence-utilization/EVIDENCE-PATH-LEDGER-VIEW.html');

function esc(x) {
  return String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function main() {
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  const summary = JSON.parse(fs.readFileSync(SUMMARY, 'utf8'));
  const c = summary.coverage;
  const inv = summary.chain_invariants;
  const stages = ledger.stages;
  const allOk = Object.values(inv).every(Boolean);

  const stageCards = stages.map((s, i) => `
    <details class="stage">
      <summary><span class="idx">${i + 1}</span><span>${esc(s.id)} · ${esc(s.name)}</span><b>${esc(s.commit)}</b></summary>
      <div class="stage-body">
        <p><strong>Primary</strong><br><code>${esc(s.artifacts.primary.path)}</code></p>
        <p><strong>Receipt</strong><br><code>${esc(s.artifacts.receipt.path)}</code></p>
        <p><strong>Boundary</strong> · serving=${s.boundary.serving} · runtime_hook_live=${s.boundary.runtime_hook_live} · model_attention=${s.boundary.model_attention} · evidence_use_proof=${s.boundary.evidence_use_proof}</p>
      </div>
    </details>`).join('\n');

  const invRows = Object.entries(inv).map(([k, v]) => `<li class="${v ? 'ok' : 'fail'}"><span>${esc(k)}</span><b>${v ? 'PASS' : 'FAIL'}</b></li>`).join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EPKV evidence-path ledger · validator-first view</title>
<style>
:root { color-scheme: dark; --bg:#0b0d0f; --panel:#14181c; --ink:#e8ecef; --muted:#97a0aa; --line:#2b333b; --green:#7bd88f; --yellow:#f6d365; --red:#ff7a7a; --blue:#7aa2ff; --gray:#9aa4af; }
* { box-sizing:border-box; }
body { margin:0; background:radial-gradient(circle at 20% 0%, #17202a 0, #0b0d0f 38rem); color:var(--ink); font:14px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
main { max-width:1180px; margin:0 auto; padding:32px 24px 64px; }
h1 { margin:0 0 8px; font-size:28px; letter-spacing:-0.04em; }
h2 { margin:28px 0 12px; font-size:16px; color:#fff; }
p { color:var(--muted); }
code { color:#dce7ff; overflow-wrap:anywhere; }
.banner { border:1px solid var(--line); background:linear-gradient(135deg, rgba(122,162,255,.15), rgba(123,216,143,.06)); border-radius:16px; padding:18px; margin:20px 0; }
.banner strong { color:var(--green); }
.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
.card { background:rgba(20,24,28,.86); border:1px solid var(--line); border-radius:14px; padding:14px; min-height:92px; }
.card b { display:block; font-size:26px; color:#fff; margin-top:4px; }
.card span { color:var(--muted); }
.pipeline { background:rgba(20,24,28,.72); border:1px solid var(--line); border-radius:18px; padding:18px; overflow:auto; }
svg { width:100%; min-width:900px; height:260px; display:block; }
.node rect { fill:#151b21; stroke:#34404b; stroke-width:1.2; rx:14; }
.node text { fill:#e8ecef; font-family:ui-monospace, monospace; }
.node .num { font-size:24px; font-weight:700; fill:#fff; }
.node .lab { font-size:12px; fill:#a6b0bb; }
.arrow { stroke:#536171; stroke-width:2; marker-end:url(#arrow); }
.split { stroke:#f6d365; }
.legend { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.legend div { border:1px solid var(--line); border-radius:12px; padding:12px; background:#11161b; }
.dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; }
.green { background:var(--green); } .yellow { background:var(--yellow); } .red { background:var(--red); } .gray { background:var(--gray); }
.invariants { padding:0; margin:0; list-style:none; display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
.invariants li { display:flex; justify-content:space-between; gap:16px; border:1px solid var(--line); background:#11161b; border-radius:10px; padding:10px 12px; }
.invariants .ok b { color:var(--green); } .invariants .fail b { color:var(--red); }
details.stage { border:1px solid var(--line); border-radius:12px; margin:8px 0; background:#11161b; }
details.stage summary { cursor:pointer; display:grid; grid-template-columns:42px 1fr auto; gap:12px; align-items:center; padding:12px 14px; }
.idx { display:inline-grid; place-items:center; width:26px; height:26px; border-radius:50%; background:#202832; color:var(--blue); }
.stage-body { padding:0 14px 14px 68px; border-top:1px solid var(--line); }
.warn { color:var(--yellow); }
.footer { margin-top:34px; padding-top:18px; border-top:1px solid var(--line); color:var(--muted); }
@media (max-width:800px){ .grid,.legend,.invariants { grid-template-columns:1fr; } }
</style>
</head>
<body>
<main>
  <h1>EPKV evidence-path ledger</h1>
  <p>Validator-first local view · process first, receipts second.</p>

  <section class="banner">
    <strong>BOUNDARY CLOSED</strong>
    <p>This view is offline and local. It shows evidence-path compatibility states. It does not show model attention, evidence-use proof, serving readiness, speedup, or answer-quality improvement.</p>
  </section>

  <section class="grid" aria-label="coverage numbers">
    <div class="card"><span>aggregate risk groups</span><b>${c.aggregate_records}</b></div>
    <div class="card"><span>selected targets</span><b>${c.selected_targets}</b></div>
    <div class="card"><span>bridge-ready + needs detail</span><b>${c.bridge_ready_targets} + ${c.needs_fixture_detail_targets}</b></div>
    <div class="card"><span>validated replay records</span><b>${c.total_replay_records}</b></div>
  </section>

  <h2>Process geometry</h2>
  <section class="pipeline">
    <svg viewBox="0 0 1060 260" role="img" aria-label="Evidence path pipeline: 178 to 16 to 13 plus 3 to 22">
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#536171"/></marker></defs>
      <g class="node" transform="translate(20 78)"><rect width="160" height="92"/><text x="18" y="36" class="num">178</text><text x="18" y="62" class="lab">aggregate groups</text></g>
      <line x1="190" y1="124" x2="280" y2="124" class="arrow"/>
      <g class="node" transform="translate(290 78)"><rect width="160" height="92"/><text x="18" y="36" class="num">16</text><text x="18" y="62" class="lab">selected targets</text></g>
      <line x1="460" y1="124" x2="545" y2="84" class="arrow split"/>
      <line x1="460" y1="124" x2="545" y2="164" class="arrow split"/>
      <g class="node" transform="translate(555 36)"><rect width="170" height="82"/><text x="18" y="34" class="num">13</text><text x="18" y="58" class="lab">bridge-ready</text></g>
      <g class="node" transform="translate(555 146)"><rect width="170" height="82"/><text x="18" y="34" class="num">3</text><text x="18" y="58" class="lab">needs detail</text></g>
      <line x1="735" y1="77" x2="850" y2="108" class="arrow"/>
      <line x1="735" y1="187" x2="850" y2="140" class="arrow"/>
      <g class="node" transform="translate(860 78)"><rect width="180" height="92"/><text x="18" y="36" class="num">22</text><text x="18" y="62" class="lab">validated replay records</text></g>
    </svg>
  </section>

  <h2>Compatibility legend</h2>
  <section class="legend">
    <div><span class="dot green"></span><b>green</b><p>canonical geometry compatible</p></div>
    <div><span class="dot yellow"></span><b>yellow</b><p>inconclusive / neither geometry</p></div>
    <div><span class="dot red"></span><b>red</b><p>decoy geometry risk / by construction</p></div>
    <div><span class="dot gray"></span><b>gray</b><p>insufficient telemetry</p></div>
  </section>

  <h2>Validation invariants</h2>
  <ul class="invariants">${invRows}</ul>

  <h2>Receipts</h2>
  <p>Receipts are drill-down evidence, not the surface behavior.</p>
  ${stageCards}

  <section class="footer">
    <p>Generated from <code>${esc(path.relative(ROOT, LEDGER))}</code> and <code>${esc(path.relative(ROOT, SUMMARY))}</code>.</p>
    <p class="warn">Selected-position geometry is not model attention. Audit labels are compatibility states, not proof of evidence use.</p>
  </section>
</main>
</body>
</html>`;

  fs.writeFileSync(OUT, html);
  console.log(JSON.stringify({ output: path.relative(ROOT, OUT), stages: stages.length, all_invariants_pass: allOk, total_replay_records: c.total_replay_records }, null, 2));
}

main();
