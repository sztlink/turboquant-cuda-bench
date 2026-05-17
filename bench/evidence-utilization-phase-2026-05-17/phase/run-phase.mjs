import fs from 'fs';
import path from 'path';

const OUT = process.env.OUT || '/home/aya/implante/tmp/longctx-evidence-zone-phase-2026-05-16';
const BASE_URL = process.env.BASE_URL || 'http://4090:11435/v1';
const MODEL = process.env.MODEL || 'local';
const MAX_RUNS = Number(process.env.MAX_RUNS || 360);
const REPEATS = Number(process.env.REPEATS || 3);
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 96);
const TIME_BUDGET_MS = Number(process.env.TIME_BUDGET_MIN || 470) * 60_000;
const START = Date.now();

fs.mkdirSync(OUT, {recursive: true});
const rawDir = path.join(OUT, 'raw');
fs.mkdirSync(rawDir, {recursive: true});
const summaryPath = path.join(OUT, 'summary.jsonl');
const progressPath = path.join(OUT, 'progress.json');
const donePath = path.join(OUT, 'DONE.txt');
const failPath = path.join(OUT, 'FAILED.txt');
fs.rmSync(donePath, {force:true});
fs.rmSync(failPath, {force:true});
fs.writeFileSync(summaryPath, '');

const zones = ['top', 'early', 'middle', 'late', 'bottom'];
const canonicalRanks = [1, 2, 4, 8, 16];
const decoysBefore = [0, 1, 3, 7, 15];
const prompts = ['baseline', 'anti_decoy'];
const handles = Array.from({length: 24}, (_, i) => {
  const colors = ['aurora','brass','ceramic','delta','ember','feldspar','glass','jade','kelp','lunar','moss','nickel','onyx','pearl','quartz','raven','solar','tundra','umber','violet','willow','xenon','yarrow','zephyr'];
  const nouns = ['compass','river','lantern','archive','signal','memory','orchid','winter','harbor','theater','garden','circuit','mirror','needle','cabinet','vector','engine','atlas','gate','sensor','fountain','ledger','terminal','switch'];
  return {i, alias: `${colors[i]} ${nouns[i]} record`, code: `AYA-ZONE-${colors[i].toUpperCase()}-${nouns[i].toUpperCase()}-${String(1000+i*17)}-OK`};
});

function filler(label, size=900) {
  const base = `Ordinary context block ${label}. This describes studio logistics, cable routing, archival labels, sensor calibration, lighting levels, retrieval notes, and irrelevant maintenance records. It contains no valid SECRET VALUE. `;
  return base.repeat(Math.ceil(size/base.length)).slice(0,size);
}
function canonicalBlock(h) {
  return `CANONICAL RECORD\nALIAS: ${h.alias}\nSECRET VALUE: ${h.code}\nRULE: If asked for ${h.alias}, answer exactly ${h.code}. This is the valid record. It is not a decoy.`;
}
function decoyBlock(h, j) {
  return `DECOY LOOKUP\nALIAS: ${h.alias}\nINVALID VALUE: DECOY-${h.i}-${String(j).padStart(2,'0')}\nThis explicitly is not the requested canonical record. Do not answer with this decoy.`;
}
function buildRetrievedSection(h, rank, decoys) {
  const chunks = [];
  const before = Math.min(decoys, rank - 1);
  for (let i=0; i<before; i++) chunks.push(decoyBlock(h,i));
  while (chunks.length < rank - 1) chunks.push(filler(`pre-${chunks.length}`, 420));
  chunks.push(canonicalBlock(h));
  let j=before;
  while (chunks.length < 16) {
    if (j < 18) chunks.push(decoyBlock(h,j++));
    else chunks.push(filler(`post-${chunks.length}`, 420));
  }
  return chunks.map((c,i)=>`// retrieved_chunk_rank_${i+1}\n\`\`\`\n${c}\n\`\`\``).join('\n\n');
}
function placeSection(section, zone) {
  const f = {
    top: [0, 10], early: [3, 8], middle: [8, 8], late: [13, 5], bottom: [18, 0]
  }[zone];
  const [beforeN, afterN] = f;
  const before = Array.from({length: beforeN}, (_,i)=>filler(`${zone}-before-${i}`, 1200)).join('\n\n');
  const after = Array.from({length: afterN}, (_,i)=>filler(`${zone}-after-${i}`, 1200)).join('\n\n');
  return `${before}\n\n## Retrieved evidence package\n${section}\n\n${after}`;
}
function messages(h, rank, decoys, zone, promptType) {
  const section = placeSection(buildRetrievedSection(h, rank, decoys), zone);
  const sys = promptType === 'anti_decoy'
    ? 'You answer retrieval questions. Answer only the exact SECRET VALUE from the CANONICAL RECORD. Ignore DECOY LOOKUP and INVALID VALUE blocks. If a canonical record is present, use it. No explanation.'
    : 'You answer retrieval questions. Answer only the exact SECRET VALUE. No explanation.';
  const user = `${section}\n\nQuestion: Which SECRET VALUE belongs to ${h.alias}? Answer only the exact value.`;
  return [{role:'system',content:sys},{role:'user',content:user}];
}
async function chat(payload, timeoutMs=180000) {
  const res = await fetch(`${BASE_URL.replace(/\/$/,'')}/chat/completions`, {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify(payload), signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return {status:res.status, text, json};
}

const cases = [];
for (const zone of zones) for (const rank of canonicalRanks) for (const decoys of decoysBefore) {
  if (decoys > rank - 1) continue;
  for (const promptType of prompts) for (let rep=0; rep<REPEATS; rep++) {
    const h = handles[(cases.length + rep) % handles.length];
    cases.push({zone, rank, decoys, promptType, rep, h});
  }
}
// deterministic shuffle to mix easy/hard cases
for (let i=cases.length-1; i>0; i--) { const j=(i*73+19)%cases.length; [cases[i],cases[j]]=[cases[j],cases[i]]; }
const selected = cases.slice(0, Math.min(MAX_RUNS, cases.length));

let ok = 0, fail = 0;
for (let idx=0; idx<selected.length; idx++) {
  if (Date.now() - START > TIME_BUDGET_MS) break;
  const c = selected[idx];
  const payload = {model:MODEL, temperature:0, max_tokens:MAX_TOKENS, stream:false, messages:messages(c.h,c.rank,c.decoys,c.zone,c.promptType)};
  const t0 = Date.now();
  let row;
  try {
    const r = await chat(payload);
    const msg = r.json?.choices?.[0]?.message;
    const answer = (msg?.content || r.json?.choices?.[0]?.text || r.text || '').trim();
    const reasoning = msg?.reasoning_content || '';
    const combined = `${answer}\n${reasoning}`;
    const hit = combined.includes(c.h.code);
    const wrongDecoy = /DECOY-\d+-\d+/.test(combined);
    row = {idx, status:'ok', httpStatus:r.status, elapsed_sec:(Date.now()-t0)/1000, zone:c.zone, canonical_rank:c.rank, decoys_before:c.decoys, prompt:c.promptType, rep:c.rep, alias:c.h.alias, expected:c.h.code, hit, wrong_decoy:wrongDecoy, answer:answer.slice(0,240), usage:r.json?.usage||null, timings:r.json?.timings||null};
    fs.writeFileSync(path.join(rawDir, `${String(idx).padStart(4,'0')}-${c.zone}-r${c.rank}-d${c.decoys}-${c.promptType}.json`), JSON.stringify({row,payload,response:r.json ?? r.text}, null, 2));
    ok++;
  } catch (e) {
    row = {idx, status:'error', elapsed_sec:(Date.now()-t0)/1000, zone:c.zone, canonical_rank:c.rank, decoys_before:c.decoys, prompt:c.promptType, rep:c.rep, alias:c.h.alias, expected:c.h.code, hit:false, error:String(e?.stack||e).slice(0,1000)};
    fail++;
  }
  fs.appendFileSync(summaryPath, JSON.stringify(row)+'\n');
  if (idx % 5 === 0) fs.writeFileSync(progressPath, JSON.stringify({at:new Date().toISOString(), idx, total:selected.length, ok, fail, elapsed_min:(Date.now()-START)/60000}, null, 2));
}

const rows = fs.readFileSync(summaryPath,'utf8').trim().split(/\n/).filter(Boolean).map(JSON.parse);
function groupBy(keys) {
  const g = {};
  for (const r of rows) {
    const k = keys.map(x=>r[x]).join('|');
    const o = g[k] ||= {keys:Object.fromEntries(keys.map(x=>[x,r[x]])), runs:0, hits:0, wrong_decoy:0, errors:0, elapsed:[]};
    o.runs++; if (r.hit) o.hits++; if (r.wrong_decoy) o.wrong_decoy++; if(r.status!=='ok') o.errors++; if(r.elapsed_sec) o.elapsed.push(r.elapsed_sec);
  }
  for (const o of Object.values(g)) { o.hit_rate=o.hits/o.runs; o.mean_elapsed_sec=o.elapsed.reduce((a,b)=>a+b,0)/(o.elapsed.length||1); delete o.elapsed; }
  return Object.values(g).sort((a,b)=>JSON.stringify(a.keys).localeCompare(JSON.stringify(b.keys)));
}
const aggregate = {created_at:new Date().toISOString(), job:path.basename(OUT), base_url:BASE_URL, model:MODEL, runs:rows.length, hits:rows.filter(r=>r.hit).length, errors:rows.filter(r=>r.status!=='ok').length, groups:{by_prompt:groupBy(['prompt']), by_zone:groupBy(['zone']), by_rank:groupBy(['canonical_rank']), by_decoys:groupBy(['decoys_before']), by_zone_rank_prompt:groupBy(['zone','canonical_rank','prompt'])}};
fs.writeFileSync(path.join(OUT,'aggregate.json'), JSON.stringify(aggregate,null,2));
let md = `# Evidence-zone phase diagram — RESULTS\n\nDate: 2026-05-16\nStatus: staging / synthetic\n\nRuns: ${aggregate.runs}\nHits: ${aggregate.hits}/${aggregate.runs}\nErrors: ${aggregate.errors}\n\n## By prompt\n\n| prompt | hits/runs | hit rate | wrong decoy | mean elapsed |\n|---|---:|---:|---:|---:|\n`;
for (const g of aggregate.groups.by_prompt) md += `| ${g.keys.prompt} | ${g.hits}/${g.runs} | ${(100*g.hit_rate).toFixed(1)}% | ${g.wrong_decoy} | ${g.mean_elapsed_sec.toFixed(1)}s |\n`;
md += `\n## By evidence zone\n\n| zone | hits/runs | hit rate | wrong decoy |\n|---|---:|---:|---:|\n`;
for (const g of aggregate.groups.by_zone) md += `| ${g.keys.zone} | ${g.hits}/${g.runs} | ${(100*g.hit_rate).toFixed(1)}% | ${g.wrong_decoy} |\n`;
md += `\n## By canonical rank\n\n| rank | hits/runs | hit rate | wrong decoy |\n|---|---:|---:|---:|\n`;
for (const g of aggregate.groups.by_rank) md += `| ${g.keys.canonical_rank} | ${g.hits}/${g.runs} | ${(100*g.hit_rate).toFixed(1)}% | ${g.wrong_decoy} |\n`;
md += `\n## By decoys before canonical evidence\n\n| decoys before | hits/runs | hit rate | wrong decoy |\n|---|---:|---:|---:|\n`;
for (const g of aggregate.groups.by_decoys) md += `| ${g.keys.decoys_before} | ${g.hits}/${g.runs} | ${(100*g.hit_rate).toFixed(1)}% | ${g.wrong_decoy} |\n`;
fs.writeFileSync(path.join(OUT,'RESULTS.md'), md);
fs.writeFileSync(donePath, 'EVIDENCE_ZONE_DONE\n');
