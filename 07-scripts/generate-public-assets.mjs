#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'bench-public', 'assets');
fs.mkdirSync(out, { recursive: true });

const C = {
  bg: '#0d0f12',
  panel: '#151922',
  panel2: '#10141b',
  ink: '#e8edf2',
  muted: '#91a0ad',
  line: '#2a3240',
  accent: '#7df9ff',
  good: '#9cff87',
  hot: '#ffcc66',
  bad: '#ff6b6b',
  purple: '#b79cff'
};

function esc(s) {
  return String(s).replace(/[&<>]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[ch]));
}

function frame({ w=1200, h=630, title, subtitle, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#17202f"/>
      <stop offset="0.55" stop-color="#0d0f12"/>
      <stop offset="1" stop-color="#090a0d"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.32"/>
    </filter>
    <style>
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; }
      .title { font-size: 44px; font-weight: 800; letter-spacing: -1.8px; fill: ${C.ink}; }
      .sub { font-size: 18px; fill: ${C.muted}; }
      .axis { font-size: 13px; fill: ${C.muted}; }
      .label { font-size: 15px; fill: ${C.ink}; }
      .small { font-size: 12px; fill: ${C.muted}; }
      .big { font-size: 42px; font-weight: 800; fill: ${C.ink}; letter-spacing: -1px; }
      .kicker { font-size: 12px; fill: ${C.accent}; letter-spacing: 2.5px; text-transform: uppercase; }
    </style>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="130" cy="-80" r="260" fill="#24344f" opacity="0.35"/>
  <circle cx="1120" cy="560" r="320" fill="#16303a" opacity="0.32"/>
  <text x="56" y="64" class="mono kicker">turboquant-cuda-bench</text>
  <text x="56" y="118" class="mono title">${esc(title)}</text>
  <text x="56" y="150" class="mono sub">${esc(subtitle)}</text>
  ${body}
</svg>
`;
}

function write(name, svg) {
  fs.writeFileSync(path.join(out, name), svg, 'utf8');
}

function barChart({ title, subtitle, name, rows, max=100, x=92, y=210, w=960, rowH=52, color=C.accent, note='' }) {
  const bars = rows.map((r, i) => {
    const yy = y + i * rowH;
    const bw = Math.max(2, (r.value / max) * w);
    const col = r.color || color;
    return `
      <text x="${x}" y="${yy - 8}" class="mono label">${esc(r.label)}</text>
      <rect x="${x}" y="${yy}" width="${w}" height="16" rx="8" fill="#202735"/>
      <rect x="${x}" y="${yy}" width="${bw.toFixed(1)}" height="16" rx="8" fill="${col}"/>
      <text x="${x + w + 18}" y="${yy + 13}" class="mono label">${r.text || `${r.value}%`}</text>`;
  }).join('');
  const body = `
    <rect x="56" y="184" width="1088" height="380" rx="24" fill="${C.panel}" stroke="${C.line}" filter="url(#shadow)"/>
    ${bars}
    <text x="92" y="540" class="mono small">${esc(note)}</text>`;
  write(name, frame({ title, subtitle, body }));
}

function groupedBars({ title, subtitle, name, groups, metrics, y=220, note='' }) {
  const x0 = 96, labelW = 210, chartW = 750, rowH = 56;
  const bodyRows = groups.map((g, i) => {
    const yy = y + i * rowH;
    const bars = metrics.map((m, j) => {
      const val = g[m.key];
      const bw = (val / 120) * chartW;
      return `
        <rect x="${x0 + labelW}" y="${yy + j * 13}" width="${chartW}" height="9" rx="4.5" fill="#202735"/>
        <rect x="${x0 + labelW}" y="${yy + j * 13}" width="${bw.toFixed(1)}" height="9" rx="4.5" fill="${m.color}"/>`;
    }).join('');
    return `
      <text x="${x0}" y="${yy + 18}" class="mono label">${esc(g.label)}</text>
      ${bars}
      <text x="${x0 + labelW + chartW + 16}" y="${yy + 12}" class="mono small">${g.exact}/120 exact</text>`;
  }).join('');
  const legend = metrics.map((m, i) => `
    <rect x="${x0 + i*150}" y="190" width="14" height="14" rx="3" fill="${m.color}"/>
    <text x="${x0 + 22 + i*150}" y="202" class="mono small">${esc(m.label)}</text>`).join('');
  const body = `
    <rect x="56" y="174" width="1088" height="410" rx="24" fill="${C.panel}" stroke="${C.line}" filter="url(#shadow)"/>
    ${legend}
    ${bodyRows}
    <text x="96" y="552" class="mono small">${esc(note)}</text>`;
  write(name, frame({ title, subtitle, body }));
}

// 1. Hero social card.
write('hero-retrieved-not-used.svg', frame({
  title: 'retrieved != used',
  subtitle: 'Your model found the right chunk. Why did it still answer wrong?',
  body: `
    <rect x="56" y="190" width="1088" height="340" rx="28" fill="${C.panel}" stroke="${C.line}" filter="url(#shadow)"/>
    <text x="96" y="270" class="mono big">11,376 runs</text>
    <text x="96" y="304" class="mono sub">evidence-utilization phase - 69.5% answer closure, 0 errors</text>
    <text x="96" y="382" class="mono big" fill="${C.accent}">5/5 @ 192K</text>
    <text x="96" y="416" class="mono sub">needle retrieval passed, but decoy replay still closed only 5/8</text>
    <text x="96" y="486" class="mono label">Qwen3 / Qwen2.5 - llama.cpp - vLLM - TurboQuant - CASK - KVFidelity</text>`
}));

// 2. Evidence rank closure.
barChart({
  name: 'evidence-rank-closure.svg',
  title: 'Rank dominates answer closure',
  subtitle: 'Canonical evidence present in context, different local rank',
  rows: [
    { label: 'rank 1', value: 98.9, text: '98.9%', color: C.good },
    { label: 'rank 4', value: 55.7, text: '55.7%', color: C.hot },
    { label: 'rank 8', value: 45.1, text: '45.1%', color: C.hot },
    { label: 'rank 16', value: 23.2, text: '23.2%', color: C.bad }
  ],
  note: 'Distractor taxonomy sweep: closure drops even though canonical evidence is still available.'
});

// 3. Distractor type chart.
barChart({
  name: 'distractor-taxonomy.svg',
  title: 'Not all distractors are equal',
  subtitle: 'Stale and correction-like records are much harder than unrelated noise',
  rows: [
    { label: 'unrelated noise', value: 84.2, text: '84.2%', color: C.good },
    { label: 'explicit decoy', value: 58.2, text: '58.2%', color: C.hot },
    { label: 'conflicting correction', value: 54.2, text: '54.2%', color: C.hot },
    { label: 'near duplicate', value: 46.0, text: '46.0%', color: C.hot },
    { label: 'stale record', value: 36.1, text: '36.1%', color: C.bad }
  ],
  note: 'Metric: answer closure in the promoted synthetic distractor taxonomy sweep.'
});

// 4. Cross-stack decoy vs policy splice.
barChart({
  name: 'decoy-vs-policy-splice.svg',
  title: 'Same decoy failure, portable fix',
  subtitle: 'Decoy replay closes 5/8; policy splice recovers hard cases 4/4',
  rows: [
    { label: 'llama.cpp Qwen 27B - decoy', value: 62.5, text: '5/8', color: C.bad },
    { label: 'vLLM Qwen 7B - decoy', value: 62.5, text: '5/8', color: C.bad },
    { label: 'vLLM Qwen 7B + V3 - decoy', value: 62.5, text: '5/8', color: C.bad },
    { label: 'policy splice orig', value: 100, text: '4/4', color: C.good },
    { label: 'policy splice rewrite', value: 100, text: '4/4', color: C.good }
  ],
  note: 'The wrong brass-river answer DECOY-0616-1 repeated byte-identically across stacks.'
});

// 5. CASK bridge.
groupedBars({
  name: 'cask-bridge-fidelity.svg',
  title: 'Action, target, rank can split',
  subtitle: 'CASK x KVFidelity bridge v2 - 120 synthetic action-router cases',
  metrics: [
    { key: 'action', label: 'action', color: C.accent },
    { key: 'target', label: 'target', color: C.hot },
    { key: 'rank', label: 'rank', color: C.good }
  ],
  groups: [
    { label: 'FullKV', exact: 119, action: 119, target: 119, rank: 120 },
    { label: 'CASK b512', exact: 1, action: 117, target: 2, rank: 108 },
    { label: 'CASK b1024', exact: 109, action: 119, target: 109, rank: 120 },
    { label: 'CASK b2048', exact: 119, action: 119, target: 119, rank: 120 },
    { label: 'TriAttn b2048', exact: 119, action: 119, target: 119, rank: 120 }
  ],
  note: 'Tight budgets can preserve operation/rank while losing exact payload identity.'
});

// 6. KVFidelity trace drift.
barChart({
  name: 'kvfidelity-trace-drift.svg',
  title: 'Pass/fail can hide trace drift',
  subtitle: 'Early N=28 paired trace sweep: q8/q8 vs q8/turbo3',
  rows: [
    { label: 'same-config controls', value: 100, text: '100%', color: C.good },
    { label: 'action-class equality', value: 82.1, text: '82.1%', color: C.accent },
    { label: 'semantic equality', value: 53.6, text: '53.6%', color: C.hot },
    { label: 'full-signature equality', value: 50.0, text: '50.0%', color: C.bad }
  ],
  note: 'Hold-out later narrowed the claim. Use KVFidelity as paired trace diagnostics, not a broad agent leaderboard.'
});

// 7. 192K needle / decoy split.
write('needle-192k-vs-decoys.svg', frame({
  title: '192K retrieval is not closure',
  subtitle: 'Needle retrieval passes; adversarial evidence still wins without splice/rerank control',
  body: `
    <rect x="56" y="184" width="1088" height="390" rx="24" fill="${C.panel}" stroke="${C.line}" filter="url(#shadow)"/>
    <text x="100" y="268" class="mono big" fill="${C.good}">5/5</text>
    <text x="100" y="305" class="mono label">needle @ 128K / 160K / 192K</text>
    <text x="100" y="348" class="mono small">vLLM Qwen2.5-7B + TurboQuant K8V4 + YaRN</text>
    <line x1="560" y1="230" x2="560" y2="510" stroke="${C.line}"/>
    <text x="640" y="268" class="mono big" fill="${C.bad}">5/8</text>
    <text x="640" y="305" class="mono label">decoy replay at top_k=16</text>
    <text x="640" y="348" class="mono small">same miss set across llama.cpp and vLLM</text>
    <text x="100" y="470" class="mono label">Conclusion: context length/retrieval ceiling is separate from evidence utilization.</text>`
}));

console.log(`wrote SVG assets to ${out}`);
