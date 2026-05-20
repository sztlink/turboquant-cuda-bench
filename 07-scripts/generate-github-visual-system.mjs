#!/usr/bin/env node
/**
 * Generate GitHub-native visual system assets.
 *
 * Light editorial direction adapted from szt.link image system:
 * warm paper, dark ink, lab notebook hierarchy, semantic color only.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const assets = path.join(root, 'bench-public', 'assets');
const docsAssets = path.join(root, 'docs', 'assets');
fs.mkdirSync(assets, { recursive: true });
fs.mkdirSync(docsAssets, { recursive: true });

const C = {
  paper: '#f3ead7',
  paper2: '#efe0c2',
  ink: '#171717',
  muted: '#5f594f',
  line: '#24221e',
  faint: '#d8c9aa',
  panel: '#fff7e8',
  green: '#2f7d4f',
  yellow: '#a06f18',
  red: '#a33a2b',
  blue: '#2f5f87',
  gray: '#746f67'
};

function esc(s) { return String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])); }
function writeBoth(name, svg) {
  fs.writeFileSync(path.join(assets, name), svg, 'utf8');
  fs.writeFileSync(path.join(docsAssets, name), svg, 'utf8');
}
function shell({ w=1200, h=630, title, subtitle, tag='turboquant-cuda-bench', body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
  <defs>
    <pattern id="papergrain" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="${C.paper}"/>
      <path d="M0 8h32M0 23h32M7 0v32M24 0v32" stroke="${C.faint}" stroke-width="0.6" opacity="0.22"/>
      <circle cx="6" cy="6" r="0.7" fill="#9b8d74" opacity="0.18"/><circle cx="22" cy="18" r="0.6" fill="#9b8d74" opacity="0.14"/>
    </pattern>
    <style>
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; }
      .tag { font-size: 13px; font-weight: 700; letter-spacing: 2.2px; fill: ${C.red}; text-transform: uppercase; }
      .title { font-size: 48px; font-weight: 800; letter-spacing: -2px; fill: ${C.ink}; }
      .sub { font-size: 18px; fill: ${C.muted}; }
      .small { font-size: 13px; fill: ${C.muted}; }
      .label { font-size: 16px; fill: ${C.ink}; }
      .num { font-size: 42px; font-weight: 800; fill: ${C.ink}; letter-spacing: -1px; }
      .micro { font-size: 11px; fill: ${C.muted}; letter-spacing: 1.1px; text-transform: uppercase; }
    </style>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#papergrain)"/>
  <rect x="28" y="28" width="${w-56}" height="${h-56}" rx="28" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <text x="58" y="68" class="mono tag">${esc(tag)}</text>
  <text x="58" y="126" class="mono title">${esc(title)}</text>
  <text x="58" y="160" class="mono sub">${esc(subtitle)}</text>
  ${body}
</svg>`;
}
function arrow(x1,y1,x2,y2,color=C.line){ return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2.2"/><path d="M${x2} ${y2} l-10 -6 v12 z" fill="${color}"/>`; }
function node({x,y,w=174,h=98,num,label,color=C.ink}){ return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${C.panel}" stroke="${C.line}" stroke-width="1.4"/><text x="${x+20}" y="${y+42}" class="mono num" fill="${color}">${esc(num)}</text><text x="${x+20}" y="${y+70}" class="mono small">${esc(label)}</text></g>`; }

writeBoth('github-hero-evidence-path.svg', shell({
  title: 'retrieved != used',
  subtitle: 'Your model found the right chunk. Why did it still answer wrong?',
  body: `
    <rect x="58" y="206" width="1084" height="318" rx="24" fill="${C.panel}" stroke="${C.line}" stroke-width="1.4"/>
    <text x="92" y="255" class="mono micro">offline milestone v1.9</text>
    <text x="92" y="314" class="mono num">178 → 16 → 13 + 3 → 22</text>
    <text x="92" y="355" class="mono label">aggregate risk → selected targets → bridge-ready + refined → replay records</text>
    <rect x="92" y="402" width="286" height="58" rx="14" fill="#e8f1e7" stroke="${C.green}"/><text x="112" y="437" class="mono label" fill="${C.green}">provenance: PASS</text>
    <rect x="406" y="402" width="286" height="58" rx="14" fill="#f6ebd3" stroke="${C.yellow}"/><text x="426" y="437" class="mono label" fill="${C.yellow}">compatibility states</text>
    <rect x="720" y="402" width="330" height="58" rx="14" fill="#f4ded7" stroke="${C.red}"/><text x="740" y="437" class="mono label" fill="${C.red}">not evidence-use proof</text>
    <text x="92" y="492" class="mono small">validator-first view · hook-off replay packs · no live serving mutation</text>`
}));

writeBoth('evidence-path-ledger-v19.svg', shell({
  w: 1400, h: 760,
  title: 'evidence-path ledger v1.9',
  subtitle: 'A validator-first process view for retrieved != used',
  body: `
    <g transform="translate(70 250)">
      ${node({x:0,y:0,num:'178',label:'aggregate groups'})}
      ${arrow(184,49,255,49)}
      ${node({x:270,y:0,num:'16',label:'selected targets'})}
      ${arrow(454,49,524,20,C.yellow)}
      ${arrow(454,49,524,106,C.yellow)}
      ${node({x:540,y:-44,w:190,h:86,num:'13',label:'bridge-ready'})}
      ${node({x:540,y:72,w:190,h:86,num:'3',label:'refined targets'})}
      ${arrow(740,0,850,49,C.green)}
      ${arrow(740,116,850,70,C.green)}
      ${node({x:870,y:0,w:210,num:'22',label:'replay records'})}
      ${arrow(1090,49,1160,49,C.green)}
      ${node({x:1175,y:0,w:150,num:'PASS',label:'provenance'})}
    </g>
    <rect x="70" y="520" width="1260" height="120" rx="22" fill="${C.panel}" stroke="${C.line}"/>
    <text x="104" y="560" class="mono micro">invariants</text>
    <text x="104" y="594" class="mono label">receipts present · primary artifacts present · non-serving boundaries · no attention claim · no evidence-use proof</text>
    <text x="104" y="625" class="mono small">This diagram shows an offline audit path. It is not runtime behavior from a live request.</text>`
}));

writeBoth('boundary-seal-v19.svg', shell({
  w: 1200, h: 420,
  title: 'offline milestone sealed',
  subtitle: 'Crystallize the milestone, not the hypothesis',
  body: `
    <g transform="translate(76 205)">
      <rect width="240" height="78" rx="18" fill="#e8f1e7" stroke="${C.green}"/><text x="24" y="46" class="mono label" fill="${C.green}">22 replay records</text>
      <rect x="268" width="250" height="78" rx="18" fill="#e8f1e7" stroke="${C.green}"/><text x="292" y="46" class="mono label" fill="${C.green}">provenance PASS</text>
      <rect x="546" width="250" height="78" rx="18" fill="#f4ded7" stroke="${C.red}"/><text x="570" y="46" class="mono label" fill="${C.red}">no live runtime</text>
      <rect x="824" width="250" height="78" rx="18" fill="#f4ded7" stroke="${C.red}"/><text x="848" y="46" class="mono label" fill="${C.red}">no attention claim</text>
    </g>
    <text x="76" y="340" class="mono small">Only next gates: external review packet or live-runtime contact. Both are explicit decisions.</text>`
}));

writeBoth('claims-and-constraints-v19.svg', shell({
  w: 1200, h: 560,
  title: 'claims and constraints',
  subtitle: 'The honesty plate for reading the repo',
  body: `
    <rect x="70" y="210" width="500" height="250" rx="24" fill="${C.panel}" stroke="${C.line}"/>
    <text x="104" y="254" class="mono micro">what this repo claims</text>
    <text x="104" y="302" class="mono label">reproducible receipts</text>
    <text x="104" y="338" class="mono label">evidence-path compatibility</text>
    <text x="104" y="374" class="mono label">runtime observability contracts</text>
    <text x="104" y="410" class="mono label">provenance closure for v1.9</text>
    <rect x="630" y="210" width="500" height="250" rx="24" fill="#f4ded7" stroke="${C.red}"/>
    <text x="664" y="254" class="mono micro" fill="${C.red}">what this repo does not claim</text>
    <text x="664" y="302" class="mono label">serving speedup</text>
    <text x="664" y="338" class="mono label">production attention</text>
    <text x="664" y="374" class="mono label">answer-quality improvement</text>
    <text x="664" y="410" class="mono label">proof of evidence use</text>`
}));

writeBoth('provenance-card-v19.svg', shell({
  w: 1200, h: 440,
  title: 'provenance closure',
  subtitle: 'Replay pack and ledger invariants are pinned',
  body: `
    <rect x="72" y="210" width="1056" height="130" rx="24" fill="${C.panel}" stroke="${C.line}"/>
    <text x="110" y="258" class="mono num" fill="${C.green}">PASS</text>
    <text x="250" y="252" class="mono label">source sha256 pinned · target closure · 13/13 replay rows · ledger invariants true</text>
    <text x="250" y="292" class="mono small">v1.9 ledger indexes v0.8 through v1.8 with 22 replay records.</text>`
}));

writeBoth('milestone-seal-inline-v19.svg', `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="140" viewBox="0 0 420 140" role="img" aria-label="EPKV offline milestone v1.9 provenance pass">
  <rect width="420" height="140" rx="24" fill="${C.paper}" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="22" y="22" width="10" height="96" fill="${C.line}"/>
  <text x="52" y="52" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" letter-spacing="2" fill="${C.red}">EPKV OFFLINE</text>
  <text x="52" y="86" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="28" font-weight="800" fill="${C.ink}">milestone v1.9</text>
  <text x="52" y="112" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13" fill="${C.green}">provenance PASS · 22 replay records</text>
</svg>`);

writeBoth('github-entry-map.svg', shell({
  title: 'read the repo as three paths',
  subtitle: 'Less inventory, more behavior',
  body: `
    <g transform="translate(70 220)">
      <rect width="318" height="220" rx="24" fill="${C.panel}" stroke="${C.line}"/>
      <text x="28" y="48" class="mono micro">path 1</text><text x="28" y="86" class="mono label">Evidence utilization</text><text x="28" y="124" class="mono small">FOUND → PRESENTED → USED</text><text x="28" y="158" class="mono small">Why retrieval is not answer closure.</text>
      <rect x="366" width="318" height="220" rx="24" fill="${C.panel}" stroke="${C.line}"/>
      <text x="394" y="48" class="mono micro">path 2</text><text x="394" y="86" class="mono label">Bridge methodology</text><text x="394" y="124" class="mono small">action · target · source-rank</text><text x="394" y="158" class="mono small">Compression changes split layers.</text>
      <rect x="732" width="318" height="220" rx="24" fill="${C.panel}" stroke="${C.line}"/>
      <text x="760" y="48" class="mono micro">path 3</text><text x="760" y="86" class="mono label">Evidence-Paged KV</text><text x="760" y="124" class="mono small">kernel receipts · telemetry</text><text x="760" y="158" class="mono small">Exploratory, not production hook.</text>
    </g>`
}));

const docsIndex = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>turboquant-cuda-bench · evidence path</title><style>
body{margin:0;background:${C.paper};color:${C.ink};font:16px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}main{max-width:1120px;margin:0 auto;padding:40px 22px 80px}img{max-width:100%;border:1px solid ${C.line};border-radius:22px;background:${C.panel}}a{color:${C.blue}}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.banner{border:1px solid ${C.line};background:${C.panel};border-radius:20px;padding:18px;margin:18px 0}.small{color:${C.muted};font-size:13px}@media(max-width:800px){.grid{grid-template-columns:1fr}}
</style></head><body><main>
<h1>turboquant-cuda-bench</h1><p>GitHub-native visual layer for the offline evidence-path milestone.</p>
<div class="banner"><strong>Boundary:</strong> offline receipts and compatibility states. Not attention, not evidence-use proof, not serving readiness.</div>
<img src="assets/github-hero-evidence-path.svg" alt="retrieved not used hero">
<h2>Evidence-path ledger</h2><img src="assets/evidence-path-ledger-v19.svg" alt="evidence path ledger v1.9">
<div class="grid"><img src="assets/github-entry-map.svg" alt="three repo paths"><img src="assets/boundary-seal-v19.svg" alt="offline milestone seal"></div>
<h2>Claims and provenance</h2><div class="grid"><img src="assets/claims-and-constraints-v19.svg" alt="claims and constraints"><img src="assets/provenance-card-v19.svg" alt="provenance pass"></div>
<p class="small">Canonical repo docs: <a href="../README.md">README</a>, <a href="../bench-public/evidence-utilization/OFFLINE-MILESTONE-v1.9.md">OFFLINE-MILESTONE-v1.9</a>.</p>
</main></body></html>`;
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs', 'index.html'), docsIndex, 'utf8');

console.log(`wrote GitHub visual system assets to ${assets} and ${docsAssets}`);
