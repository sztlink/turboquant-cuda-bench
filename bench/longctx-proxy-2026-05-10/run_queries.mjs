import fs from 'fs';
const [,, port, upstreamPort, corpus, outDir] = process.argv;
const manifest = JSON.parse(fs.readFileSync(`${corpus}/manifest.json`, 'utf8'));
const readme = `${corpus}/README.md`;
const summary = `${outDir}/summary.jsonl`;
function append(o){ fs.appendFileSync(summary, JSON.stringify(o)+'\n'); }
async function one(endpoint, mode, rec, idx) {
  const url = `http://127.0.0.1:${endpoint}/v1/chat/completions`;
  const prompt = `Project path: ${readme}\nFind the lookup target named ${rec.handle}. What is the exact SECRET VALUE assigned to it? Answer only the secret value.`;
  const body = {
    model: 'local', temperature: 0, max_tokens: 160, stream: false, longctx_top_k: 8,
    messages: [
      {role:'system', content:'You are a precise retrieval assistant. Answer only the exact secret value, no explanation.'},
      {role:'user', content: prompt},
    ],
  };
  const started = Date.now();
  let status='ok', httpStatus=0, text='', json=null, answer='', hit=false, headers={};
  try {
    const res = await fetch(url, {method:'POST', headers:{'content-type':'application/json','x-session-affinity':`longctx-proxy-${mode}`}, body:JSON.stringify(body), signal: AbortSignal.timeout(300000)});
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
  } catch (e) {
    status='error'; text=String(e?.stack || e);
  }
  const elapsed = (Date.now()-started)/1000;
  fs.writeFileSync(`${outDir}/raw/${String(idx).padStart(2,'0')}-${mode}-${rec.handle}.json`, JSON.stringify({body, headers, httpStatus, text, json, answer}, null, 2));
  append({idx, mode, status, httpStatus, elapsed_sec:elapsed, handle:rec.handle, expected:rec.code, hit, answer:answer.slice(0,500), headers});
}
let idx=0;
// Direct upstream sanity on first three: should not know the secret because no corpus is spliced.
for (const rec of manifest.needles.slice(0,3)) await one(upstreamPort, 'direct-upstream', rec, ++idx);
// Longctx proxy on all targets.
for (const rec of manifest.needles) await one(port, 'longctx-proxy', rec, ++idx);
