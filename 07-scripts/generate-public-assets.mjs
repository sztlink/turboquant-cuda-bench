#!/usr/bin/env node
/**
 * Generate public SVG assets for GitHub README / bench-public.
 *
 * Visual system: szt.link light editorial GitHub layer.
 * Warm paper, dark ink, semantic color only, no scripts/animation.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'bench-public', 'assets');
fs.mkdirSync(out, { recursive: true });

const C = {
  paper: '#f3ead7',
  panel: '#fff7e8',
  ink: '#171717',
  muted: '#5f594f',
  line: '#24221e',
  faint: '#d8c9aa',
  blue: '#2f5f87',
  green: '#2f7d4f',
  yellow: '#a06f18',
  red: '#a33a2b',
  gray: '#746f67'
};

function esc(s) {
  return String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
}

function clean(svg) {
  return svg.split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n');
}

function write(name, svg) {
  fs.writeFileSync(path.join(out, name), clean(svg), 'utf8');
}

function shell({ w = 1200, h = 630, title, subtitle, tag = 'turboquant-cuda-bench', body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
  <defs>
    <pattern id="papergrain" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="${C.paper}"/>
      <path d="M0 8h32M0 23h32M7 0v32M24 0v32" stroke="${C.faint}" stroke-width="0.6" opacity="0.22"/>
      <circle cx="6" cy="6" r="0.7" fill="#9b8d74" opacity="0.18"/>
      <circle cx="22" cy="18" r="0.6" fill="#9b8d74" opacity="0.14"/>
    </pattern>
    <style>
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; }
      .tag { font-size: 13px; font-weight: 700; letter-spacing: 2.2px; fill: ${C.red}; text-transform: uppercase; }
      .title { font-size: 44px; font-weight: 800; letter-spacing: -1.7px; fill: ${C.ink}; }
      .sub { font-size: 18px; fill: ${C.muted}; }
      .small { font-size: 13px; fill: ${C.muted}; }
      .label { font-size: 16px; fill: ${C.ink}; }
      .num { font-size: 42px; font-weight: 800; fill: ${C.ink}; letter-spacing: -1px; }
      .micro { font-size: 11px; fill: ${C.muted}; letter-spacing: 1.1px; text-transform: uppercase; }
    </style>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#papergrain)"/>
  <rect x="28" y="28" width="${w - 56}" height="${h - 56}" rx="28" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="62" y="78" width="10" height="${h - 156}" fill="${C.line}"/>
  <text x="96" y="70" class="mono tag">${esc(tag)}</text>
  <text x="96" y="128" class="mono title">${esc(title)}</text>
  <text x="96" y="162" class="mono sub">${esc(subtitle)}</text>
  ${body}
</svg>`;
}

function barChart({ name, title, subtitle, rows, max = 100, note = '', x = 112, y = 230, w = 830, rowH = 54 }) {
  const bars = rows.map((r, i) => {
    const yy = y + i * rowH;
    const bw = Math.max(3, (r.value / max) * w);
    const col = r.color || C.blue;
    return `
      <text x="${x}" y="${yy - 10}" class="mono label">${esc(r.label)}</text>
      <rect x="${x}" y="${yy}" width="${w}" height="16" rx="8" fill="#eadfc7" stroke="${C.faint}"/>
      <rect x="${x}" y="${yy}" width="${bw.toFixed(1)}" height="16" rx="8" fill="${col}"/>
      <text x="${x + w + 24}" y="${yy + 13}" class="mono label">${esc(r.text || `${r.value}%`)}</text>`;
  }).join('');
  write(name, shell({
    title, subtitle,
    body: `
      <rect x="86" y="190" width="1028" height="360" rx="24" fill="${C.panel}" stroke="${C.line}" stroke-width="1.4"/>
      ${bars}
      <text x="112" y="522" class="mono small">${esc(note)}</text>`
  }));
}

function groupedBars({ name, title, subtitle, groups, metrics, note = '' }) {
  const x0 = 110, y0 = 225, labelW = 190, chartW = 650, rowH = 58;
  const legend = metrics.map((m, i) => `
    <rect x="${x0 + i * 150}" y="198" width="14" height="14" rx="3" fill="${m.color}"/>
    <text x="${x0 + 22 + i * 150}" y="211" class="mono small">${esc(m.label)}</text>`).join('');
  const rows = groups.map((g, i) => {
    const yy = y0 + i * rowH;
    const bars = metrics.map((m, j) => {
      const val = g[m.key];
      const bw = Math.max(2, (val / 120) * chartW);
      return `
        <rect x="${x0 + labelW}" y="${yy + j * 13}" width="${chartW}" height="9" rx="4.5" fill="#eadfc7"/>
        <rect x="${x0 + labelW}" y="${yy + j * 13}" width="${bw.toFixed(1)}" height="9" rx="4.5" fill="${m.color}"/>`;
    }).join('');
    return `
      <text x="${x0}" y="${yy + 18}" class="mono label">${esc(g.label)}</text>
      ${bars}
      <text x="${x0 + labelW + chartW + 18}" y="${yy + 12}" class="mono small">${g.exact}/120 exact</text>`;
  }).join('');
  write(name, shell({
    title, subtitle,
    body: `
      <rect x="86" y="180" width="1028" height="400" rx="24" fill="${C.panel}" stroke="${C.line}" stroke-width="1.4"/>
      ${legend}
      ${rows}
      <text x="110" y="548" class="mono small">${esc(note)}</text>`
  }));
}

function miniNode({ x, y, n, label, color = C.ink }) {
  return `<g><rect x="${x}" y="${y}" width="185" height="92" rx="18" fill="${C.panel}" stroke="${C.line}"/><text x="${x + 20}" y="${y + 40}" class="mono num" fill="${color}">${esc(n)}</text><text x="${x + 20}" y="${y + 68}" class="mono small">${esc(label)}</text></g>`;
}
function tickArrow(x1, y1, x2, y2, color = C.line) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2"/><path d="M${x2} ${y2} l-9 -5 v10 z" fill="${color}"/>`;
}

write('hero-retrieved-not-used.svg', shell({
  title: 'retrieved != used',
  subtitle: 'Your model found the right chunk. Why did it still answer wrong?',
  body: `
    <rect x="92" y="210" width="1016" height="310" rx="24" fill="${C.panel}" stroke="${C.line}"/>
    <text x="126" y="266" class="mono micro">promoted evidence-utilization phase</text>
    <text x="126" y="325" class="mono num">11,376 runs · 69.5% closure · 0 errors</text>
    <text x="126" y="376" class="mono label">Needle retrieval can pass at 192K while decoy answer closure still fails.</text>
    <text x="126" y="438" class="mono small">Qwen · llama.cpp · vLLM · TurboQuant · CASK · KVFidelity</text>
    <text x="126" y="478" class="mono small">Boundary: receipts first, not serving speedup or evidence-use proof.</text>`
}));

barChart({
  name: 'evidence-rank-closure.svg',
  title: 'Rank dominates answer closure',
  subtitle: 'Canonical evidence is present, but local rank changes closure',
  rows: [
    { label: 'rank 1', value: 98.9, text: '98.9%', color: C.green },
    { label: 'rank 4', value: 55.7, text: '55.7%', color: C.yellow },
    { label: 'rank 8', value: 45.1, text: '45.1%', color: C.yellow },
    { label: 'rank 16', value: 23.2, text: '23.2%', color: C.red }
  ],
  note: 'Distractor taxonomy sweep. Closure is answer-side, not evidence-use proof.'
});

barChart({
  name: 'distractor-taxonomy.svg',
  title: 'Not all distractors are equal',
  subtitle: 'Stale and correction-like records are harder than unrelated noise',
  rows: [
    { label: 'unrelated noise', value: 84.2, text: '84.2%', color: C.green },
    { label: 'explicit decoy', value: 58.2, text: '58.2%', color: C.yellow },
    { label: 'conflicting correction', value: 54.2, text: '54.2%', color: C.yellow },
    { label: 'near duplicate', value: 46.0, text: '46.0%', color: C.yellow },
    { label: 'stale record', value: 36.1, text: '36.1%', color: C.red }
  ],
  note: 'Metric: answer closure in the public-safe synthetic distractor taxonomy sweep.'
});

barChart({
  name: 'decoy-vs-policy-splice.svg',
  title: 'Same decoy failure, portable fix',
  subtitle: 'Decoy replay closes 5/8; policy splice recovers hard cases 4/4',
  rows: [
    { label: 'llama.cpp Qwen 27B - decoy', value: 62.5, text: '5/8', color: C.red },
    { label: 'vLLM Qwen 7B - decoy', value: 62.5, text: '5/8', color: C.red },
    { label: 'vLLM Qwen 7B + V3 - decoy', value: 62.5, text: '5/8', color: C.red },
    { label: 'policy splice orig', value: 100, text: '4/4', color: C.green },
    { label: 'policy splice rewrite', value: 100, text: '4/4', color: C.green }
  ],
  note: 'Splice is a fixture intervention, not a general model-quality claim.'
});

groupedBars({
  name: 'cask-bridge-fidelity.svg',
  title: 'Action, target, rank can split',
  subtitle: 'CASK x KVFidelity bridge v2 - 120 synthetic action-router cases',
  metrics: [
    { key: 'action', label: 'action', color: C.blue },
    { key: 'target', label: 'target', color: C.yellow },
    { key: 'rank', label: 'rank', color: C.green }
  ],
  groups: [
    { label: 'FullKV', exact: 119, action: 119, target: 119, rank: 120 },
    { label: 'CASK b512', exact: 1, action: 117, target: 2, rank: 108 },
    { label: 'CASK b1024', exact: 109, action: 119, target: 109, rank: 120 },
    { label: 'CASK b2048', exact: 119, action: 119, target: 119, rank: 120 },
    { label: 'TriAttn b2048', exact: 119, action: 119, target: 119, rank: 120 }
  ],
  note: 'Bridge probe only. Not a global compression leaderboard.'
});

barChart({
  name: 'kvfidelity-trace-drift.svg',
  title: 'Pass/fail can hide trace drift',
  subtitle: 'Early N=28 paired trace sweep: q8/q8 vs q8/turbo3',
  rows: [
    { label: 'same-config controls', value: 100, text: '100%', color: C.green },
    { label: 'action-class equality', value: 82.1, text: '82.1%', color: C.blue },
    { label: 'semantic equality', value: 53.6, text: '53.6%', color: C.yellow },
    { label: 'full-signature equality', value: 50.0, text: '50.0%', color: C.red }
  ],
  note: 'Hold-out narrowed the claim. Use as paired trace diagnostics.'
});

write('needle-192k-vs-decoys.svg', shell({
  title: '192K retrieval is not closure',
  subtitle: 'Needles pass; adversarial evidence still wins without splice or rerank control',
  body: `
    <rect x="92" y="210" width="1016" height="310" rx="24" fill="${C.panel}" stroke="${C.line}"/>
    <text x="140" y="294" class="mono num" fill="${C.green}">5/5</text>
    <text x="140" y="330" class="mono label">needle @ 128K / 160K / 192K</text>
    <text x="140" y="365" class="mono small">vLLM Qwen2.5-7B + TurboQuant K8V4 + YaRN</text>
    <line x1="585" y1="245" x2="585" y2="478" stroke="${C.line}"/>
    <text x="660" y="294" class="mono num" fill="${C.red}">5/8</text>
    <text x="660" y="330" class="mono label">decoy replay at top_k=16</text>
    <text x="660" y="365" class="mono small">same miss set across llama.cpp and vLLM</text>
    <text x="140" y="455" class="mono small">Context length and retrieval ceiling are separate from evidence utilization.</text>`
}));

write('evidence-paged-kv-kernel-receipts.svg', shell({
  title: 'Evidence-Paged KV receipts',
  subtitle: 'Kernel receipts and offline telemetry, not a production hook',
  body: `
    <g transform="translate(92 230)">
      ${miniNode({ x: 0, y: 0, n: 'v4', label: 'public receipt', color: C.blue })}
      ${tickArrow(195, 46, 255, 46)}
      ${miniNode({ x: 270, y: 0, n: 'v5', label: 'K=32 path', color: C.blue })}
      ${tickArrow(465, 46, 525, 46)}
      ${miniNode({ x: 540, y: 0, n: 'v7', label: 'architecture', color: C.yellow })}
      ${tickArrow(735, 46, 795, 46)}
      ${miniNode({ x: 810, y: 0, n: 'v1.9', label: 'offline ledger', color: C.green })}
    </g>
    <rect x="92" y="390" width="1016" height="94" rx="18" fill="#f4ded7" stroke="${C.red}"/>
    <text x="124" y="430" class="mono label" fill="${C.red}">Boundary: not production attention, not serving readiness, not evidence-use proof.</text>
    <text x="124" y="462" class="mono small">Live hook-on remains paused behind explicit runtime gates.</text>`
}));

console.log(`wrote light editorial SVG assets to ${out}`);
