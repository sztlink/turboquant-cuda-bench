#!/usr/bin/env node
/**
 * Generate the boring-receipts delta sheet SVG (rung 2 weight-quant sweep).
 *
 * Visual gate (AXES.md): zero as dead line; color distinguishes series, never
 * verdict; no gradient/shadow/animation; every stroke has a YAML counterpart.
 * Tokens inherit the szt.link light system (docs/GITHUB-VISUAL-DESIGN.md).
 *
 * Data is the source; this script is a sibling render. Edit DATA + GATE, re-run.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(here, '..', 'assets');
const docs = path.join(here, '..', '..', 'docs', 'assets');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(docs, { recursive: true });

const C = {
  paper: '#f3ead7', ink: '#171717', muted: '#5f594f', line: '#24221e',
  faint: '#d8c9aa', panel: '#fff7e8', green: '#2f7d4f', yellow: '#a06f18',
  red: '#a33a2b', blue: '#2f5f87', bar: '#3a352c'
};

// --- DATA: rung 2, Llama-3.1-8B, AYA-3090, baseline Q4_K_M ---
const QUANTS = ['Q4_K_M', 'Q5_K_M', 'Q8_0'];
const METRICS = [
  { key: 'tg',   label: 'tg  decode  t/s',  unit: 't/s', vals: [131.9, 118.7, 90.3], group: 'speed' },
  { key: 'pp',   label: 'pp  prefill t/s',  unit: 't/s', vals: [4459, 4347, 4542],   group: 'speed' },
  { key: 'vram', label: 'VRAM peak  GiB',   unit: 'GiB', vals: [6.0, 6.7, 9.2],      group: 'mem'   }
];
// locked shared scale per group (AXES.md: a truncated/auto-rescaled axis lies).
// tg and pp share one speed scale, so flat pp reads as flat, not as a montanha.
const GROUP_MAXABS = {};
for (const m of METRICS) {
  const base = m.vals[0];
  const ma = Math.max(...m.vals.map(v => Math.abs((v - base) / base * 100)));
  GROUP_MAXABS[m.group] = Math.max(GROUP_MAXABS[m.group] || 1, ma);
}
// GATE: exercised via llama-perplexity on wikitext-2-raw test.
// PPL: Q4 7.5002, Q5 7.3948, Q8 7.3285 (ref). Criterion: PPL Δ < 5% vs Q8_0.
const GATE = {
  state: 'PASS',                    // PASS | FAIL | NOT-EXERCISED
  version: 'gate-v1',
  signal: 'PPL Δ vs Q8_0 ref · wikitext-2-raw test',
  detail: 'all quants PPL Δ < 5% (Q4 +2.3% · Q5 +0.9%) — none broke the model'
};

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pct = (v, base) => ((v - base) / base) * 100;
const fmtPct = p => (p === 0 ? '0%' : (p > 0 ? '+' : '') + p.toFixed(1) + '%');
const gateColor = s => s === 'PASS' ? C.green : s === 'FAIL' ? C.red : C.yellow;

// sparkbar: three vertical ticks showing the SHAPE of the absolute values
function sparkbar(x, y, vals, color) {
  const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn || 1;
  const H = 34, W = 12, gap = 6;
  return vals.map((v, i) => {
    const h = 6 + ((v - mn) / span) * (H - 6);
    return `<rect x="${x + i * (W + gap)}" y="${y + H - h}" width="${W}" height="${h}" fill="${color}" opacity="0.85"/>`;
  }).join('');
}

// one metric row: label · zero-anchored delta bars (Q5,Q8 vs Q4) · sparkbar · numbers
function metricRow(y, m) {
  const base = m.vals[0];
  const deltas = m.vals.map(v => pct(v, base));
  const maxAbs = GROUP_MAXABS[m.group];
  const zeroX = 470, halfW = 300, scale = halfW / maxAbs;
  let bars = '';
  m.vals.forEach((v, i) => {
    const d = deltas[i];
    const w = Math.abs(d) * scale;
    const bx = d >= 0 ? zeroX : zeroX - w;
    const cy = y + 14 + i * 22;
    if (i === 0) {
      bars += `<circle cx="${zeroX}" cy="${cy + 7}" r="4" fill="${C.ink}"/>`;
    } else {
      bars += `<rect x="${bx}" y="${cy}" width="${Math.max(w, 1)}" height="14" fill="${C.bar}" opacity="0.9"/>`;
    }
    bars += `<text x="${d >= 0 ? bx + w + 8 : bx - 8}" y="${cy + 11}" class="mono small" text-anchor="${d >= 0 ? 'start' : 'end'}">${esc(QUANTS[i].replace('_K_M', '').replace('_0', ''))} ${v}${m.unit === 'GiB' ? '' : ''}  ${fmtPct(d)}</text>`;
  });
  return `
    <text x="58" y="${y + 16}" class="mono label">${esc(m.label)}</text>
    <line x1="${zeroX}" y1="${y + 6}" x2="${zeroX}" y2="${y + 78}" stroke="${C.line}" stroke-width="1.4" stroke-dasharray="3 3"/>
    <text x="${zeroX}" y="${y - 2}" class="mono micro" text-anchor="middle">baseline 0</text>
    ${bars}
    ${sparkbar(1080, y + 18, m.vals, C.blue)}`;
}

const W = 1200, H = 720;
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="boring receipts delta sheet rung 2 weight quant sweep">
  <defs>
    <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="${C.paper}"/>
      <path d="M0 8h32M0 23h32M7 0v32M24 0v32" stroke="${C.faint}" stroke-width="0.6" opacity="0.22"/>
    </pattern>
    <style>
      .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
      .tag{font-size:13px;font-weight:700;letter-spacing:2.2px;fill:${C.red};}
      .title{font-size:40px;font-weight:800;letter-spacing:-1.5px;fill:${C.ink};}
      .sub{font-size:17px;fill:${C.muted};}
      .label{font-size:15px;fill:${C.ink};}
      .small{font-size:13px;fill:${C.muted};}
      .micro{font-size:11px;fill:${C.muted};letter-spacing:1px;}
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${C.line}" stroke-width="1.5"/>
  <text x="58" y="66" class="mono tag">BORING-RECEIPTS · RUNG 2 · WEIGHT-QUANT SWEEP</text>
  <text x="58" y="118" class="mono title">delta sheet</text>
  <text x="58" y="148" class="mono sub">Llama-3.1-8B · AYA-3090 · baseline Q4_K_M · llama.cpp b9286</text>

  <rect x="58" y="172" width="${W - 116}" height="44" fill="${C.paper}" stroke="${gateColor(GATE.state)}" stroke-width="1.6"/>
  <text x="78" y="200" class="mono label" fill="${gateColor(GATE.state)}">GATE: ${esc(GATE.state)}</text>
  <text x="300" y="200" class="mono small">${esc(GATE.detail)} · ${esc(GATE.version)}</text>

  ${metricRow(258, METRICS[0])}
  ${metricRow(366, METRICS[1])}
  ${metricRow(474, METRICS[2])}

  <line x1="58" y1="582" x2="${W - 58}" y2="582" stroke="${C.faint}" stroke-width="1"/>
  <text x="58" y="608" class="mono small">decode (tg) collapses with bits — memory-bound. prefill (pp) is flat — compute-bound. the divergence is the thesis.</text>
  <text x="58" y="632" class="mono small">trade-off, sayable in full: Q4 is +31.5% faster decode &amp; −35% VRAM vs Q8, costing +2.3% PPL — within the gate.</text>
  <text x="58" y="658" class="mono micro">bars = delta vs baseline Q4 (shared speed scale) · sparkbars = shape · zero is a dead line · color marks series, never verdict</text>
  <text x="58" y="682" class="mono micro">reproduce: llama-bench -m {Q4,Q5,Q8} -ngl 99 -p 512 -n 128 -r 5 · gate: llama-perplexity -f wiki.test.raw · receipt: receipts/2026-05-22-3090-llama31-8b-quant-sweep.md</text>
</svg>`;

fs.writeFileSync(path.join(out, 'delta-sheet-rung2-quant-sweep.svg'), svg, 'utf8');
fs.writeFileSync(path.join(docs, 'delta-sheet-rung2-quant-sweep.svg'), svg, 'utf8');
console.log('wrote delta-sheet-rung2-quant-sweep.svg (gate:', GATE.state + ')');
