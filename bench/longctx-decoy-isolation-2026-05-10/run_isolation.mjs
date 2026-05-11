import fs from 'fs';
import path from 'path';
const [,, longctxPort, upstreamPort, corpus, outDir] = process.argv;
const manifest = JSON.parse(fs.readFileSync(`${corpus}/manifest.json`, 'utf8'));
const readme = `${corpus}/README.md`;
const summary = `${outDir}/summary.jsonl`;
const rawDir = `${outDir}/raw`;
const retrDir = `${outDir}/retrieve`;
function append(o){ fs.appendFileSync(summary, JSON.stringify(o)+'\n'); }
function clean(s){ return String(s || '').replace(/\r/g,'').trim(); }
function blockFromChunks(chunks, mode, rec) {
  let selected = chunks;
  if (mode === 'filtered_splice') {
    selected = [...chunks].sort((a,b) => rank(b, rec) - rank(a, rec)).slice(0, 4);
  }
  return '## Retrieved context\n\n' + selected.map(c => `// ${c.file_path}:${c.start_line}-${c.end_line}\n\`\`\`\n${c.text}\n\`\`\``).join('\n\n');
}
function rank(c, rec) {
  const t = c.text || '';
  let s = 0;
  if (t.includes('SECRET VALUE:')) s += 10;
  if (t.includes('CANONICAL HANDLE:')) s += 4;
  if (t.includes(rec.handle)) s += 4;
  if (t.includes(rec.alias)) s += 2;
  if (t.includes('DECOY LOOKUP')) s -= 7;
  if (t.includes('INVALID VALUE')) s -= 5;
  if (t.includes(rec.code)) s += 20;
  return s;
}
async function retrieve(rec, topK, idx) {
  const query = `Which SECRET VALUE belongs to the ${rec.alias}? The clue is ${rec.clue}.`;
  const body = {session_id:`decoy-isolation-k${topK}`, prefill_text:`Project path: ${readme}\nQuestion: ${query}`, query, top_k:topK};
  const res = await fetch(`http://127.0.0.1:${longctxPort}/retrieve`, {method:'POST', headers:{'content-type':'application/json','x-session-affinity':`decoy-isolation-k${topK}`}, body:JSON.stringify(body), signal:AbortSignal.timeout(300000)});
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  const chunks = json?.chunks || [];
  const hit = chunks.some(c => String(c.text || '').includes(rec.code));
  fs.writeFileSync(`${retrDir}/${String(idx).padStart(2,'0')}-${rec.handle}.json`, JSON.stringify({body, status:res.status, json, retrieval_hit:hit}, null, 2));
  return {chunks, retrieval_hit:hit};
}
async function chat(endpoint, payload, idx, arm, rec) {
  const started = Date.now();
  let status='ok', httpStatus=0, text='', json=null, answer='', hit=false, headers={};
  try {
    const res = await fetch(`http://127.0.0.1:${endpoint}/v1/chat/completions`, {method:'POST', headers:{'content-type':'application/json','x-session-affinity':`decoy-isolation-${arm}`}, body:JSON.stringify(payload), signal:AbortSignal.timeout(300000)});
    httpStatus = res.status;
    for (const k of ['x-longctx-chunks-used','x-longctx-scope-status','x-longctx-scope','x-longctx-confidence']) headers[k] = res.headers.get(k);
    text = await res.text();
    try { json = JSON.parse(text); } catch {}
    const msg = json?.choices?.[0]?.message;
    answer = msg?.content ?? json?.choices?.[0]?.text ?? text;
    const reasoning = msg?.reasoning_content ?? '';
    hit = (`${answer}\n${reasoning}`).includes(rec.code);
    if (!answer && reasoning) answer = `[reasoning] ${reasoning}`;
    if (!res.ok) status='http_error';
  } catch (e) { status='error'; text=String(e?.stack || e); }
  const elapsed = (Date.now() - started) / 1000;
  fs.writeFileSync(`${rawDir}/${String(idx).padStart(2,'0')}-${arm}-${rec.handle}.json`, JSON.stringify({payload, headers, httpStatus, text, json, answer}, null, 2));
  return {status, httpStatus, elapsed_sec:elapsed, answer:clean(answer).slice(0,500), hit, headers, timings:json?.timings || null, usage:json?.usage || null};
}
function proxyPayload(rec, arm) {
  const anti = arm === 'anti_decoy_proxy';
  const system = anti
    ? 'You are a precise retrieval assistant. Answer only the exact secret value. Ignore every chunk or line marked DECOY LOOKUP, INVALID VALUE, or explicitly not the requested record. Use only a line beginning SECRET VALUE from a chunk that is not marked as decoy. No explanation.'
    : 'You are a precise retrieval assistant. Answer only the exact secret value, no explanation.';
  const user = `Project path: ${readme}\nWhich SECRET VALUE belongs to the ${rec.alias}? The clue is ${rec.clue}. Answer only the exact secret value.`;
  return {model:'local', temperature:0, max_tokens:120, stream:false, longctx_top_k:16, messages:[{role:'system', content:system},{role:'user', content:user}]};
}
function manualPayload(rec, arm, contextBlock) {
  const system = arm === 'oracle'
    ? 'You are a precise retrieval assistant. The provided context contains the canonical record. Answer only the exact SECRET VALUE line, no explanation.'
    : 'You are a precise retrieval assistant. Answer only the exact secret value, no explanation.';
  const user = `${contextBlock}\n\nQuestion: Which SECRET VALUE belongs to the ${rec.alias}? The clue is ${rec.clue}. Answer only the exact secret value.`;
  return {model:'local', temperature:0, max_tokens:120, stream:false, messages:[{role:'system', content:system},{role:'user', content:user}]};
}
function oracleBlock(rec) {
  const file = path.join(corpus, 'src', `sector_${String(Math.floor(rec.fileIndex/100)).padStart(2,'0')}`, `shard_${String(rec.fileIndex).padStart(4,'0')}.md`);
  const text = fs.readFileSync(file, 'utf8');
  return `## Retrieved context\n\n// ${file}\n\`\`\`\n${text}\n\`\`\``;
}
let idx = 0;
for (const rec of manifest.targets) {
  const ridx = ++idx;
  const ret = await retrieve(rec, 16, ridx);
  for (const arm of ['baseline_proxy','anti_decoy_proxy']) {
    const c = await chat(longctxPort, proxyPayload(rec, arm), ++idx, arm, rec);
    append({idx, arm, handle:rec.handle, alias:rec.alias, expected:rec.code, retrieval_hit:ret.retrieval_hit, retrieved_chunks:ret.chunks.length, ...c});
  }
  const filtered = blockFromChunks(ret.chunks, 'filtered_splice', rec);
  const cf = await chat(upstreamPort, manualPayload(rec, 'filtered_splice', filtered), ++idx, 'filtered_splice', rec);
  append({idx, arm:'filtered_splice', handle:rec.handle, alias:rec.alias, expected:rec.code, retrieval_hit:ret.retrieval_hit, retrieved_chunks:ret.chunks.length, ...cf});
  const co = await chat(upstreamPort, manualPayload(rec, 'oracle', oracleBlock(rec)), ++idx, 'oracle', rec);
  append({idx, arm:'oracle', handle:rec.handle, alias:rec.alias, expected:rec.code, retrieval_hit:true, retrieved_chunks:1, ...co});
}
