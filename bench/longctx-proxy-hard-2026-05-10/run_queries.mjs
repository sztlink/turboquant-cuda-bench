import fs from 'fs';
const [,, longctxPort, upstreamPort, corpus, outDir] = process.argv;
const manifest = JSON.parse(fs.readFileSync(`${corpus}/manifest.json`, 'utf8'));
const readme = `${corpus}/README.md`;
const summary = `${outDir}/summary.jsonl`;
function append(o){ fs.appendFileSync(summary, JSON.stringify(o)+'\n'); }
async function retrieveProbe(rec, topK, idx) {
  const query = `Which SECRET VALUE belongs to the ${rec.alias}? The clue is ${rec.clue}.`;
  const body = {session_id:`longctx-hard-k${topK}`, prefill_text:`Project path: ${readme}\nQuestion: ${query}`, query, top_k:topK};
  const res = await fetch(`http://127.0.0.1:${longctxPort}/retrieve`, {method:'POST', headers:{'content-type':'application/json','x-session-affinity':`hard-k${topK}`}, body:JSON.stringify(body), signal:AbortSignal.timeout(300000)});
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  const chunks = json?.chunks || [];
  const hit = chunks.some(c => String(c.text || '').includes(rec.code));
  fs.writeFileSync(`${outDir}/retrieve/${String(idx).padStart(2,'0')}-k${topK}-${rec.handle}.json`, JSON.stringify({body, status:res.status, json, text, retrieval_hit:hit}, null, 2));
  return {retrieval_hit:hit, chunks_count:chunks.length, top_files:chunks.slice(0,5).map(c=>`${c.file_path}:${c.start_line}-${c.end_line}`), top_scores:chunks.slice(0,5).map(c=>c.score)};
}
async function chat(endpoint, mode, rec, topK, idx) {
  const url = `http://127.0.0.1:${endpoint}/v1/chat/completions`;
  const query = `Project path: ${readme}\nWhich SECRET VALUE belongs to the ${rec.alias}? The clue is ${rec.clue}. Answer only the exact secret value.`;
  const body = {
    model:'local', temperature:0, max_tokens:120, stream:false, longctx_top_k:topK,
    messages:[
      {role:'system', content:'You are a precise retrieval assistant. Answer only the exact secret value, no explanation.'},
      {role:'user', content:query},
    ],
  };
  const started = Date.now();
  let status='ok', httpStatus=0, text='', json=null, answer='', hit=false, headers={};
  try {
    const res = await fetch(url, {method:'POST', headers:{'content-type':'application/json','x-session-affinity':`longctx-hard-${mode}-k${topK}`}, body:JSON.stringify(body), signal:AbortSignal.timeout(300000)});
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
  fs.writeFileSync(`${outDir}/raw/${String(idx).padStart(2,'0')}-${mode}-k${topK}-${rec.handle}.json`, JSON.stringify({body, headers, httpStatus, text, json, answer}, null, 2));
  return {status, httpStatus, elapsed_sec:elapsed, answer, hit, headers, timings:json?.timings || null, usage:json?.usage || null};
}
let idx = 0;
for (const rec of manifest.targets.slice(0,4)) {
  const c = await chat(upstreamPort, 'direct-upstream', rec, 0, ++idx);
  append({idx, mode:'direct-upstream', top_k:0, handle:rec.handle, alias:rec.alias, expected:rec.code, retrieval_hit:null, ...c, answer:String(c.answer).slice(0,500)});
}
for (const topK of [2,4,8,16]) {
  for (const rec of manifest.targets) {
    const ridx = ++idx;
    const rp = await retrieveProbe(rec, topK, ridx);
    const c = await chat(longctxPort, 'longctx-proxy', rec, topK, ridx);
    append({idx:ridx, mode:'longctx-proxy', top_k:topK, handle:rec.handle, alias:rec.alias, expected:rec.code, retrieval_hit:rp.retrieval_hit, chunks_count:rp.chunks_count, top_files:rp.top_files, top_scores:rp.top_scores, ...c, answer:String(c.answer).slice(0,500)});
  }
}
