#!/usr/bin/env node
/**
 * RealRAG R3A: HotpotQA prompt/citation ablation under evidence placement.
 *
 * Tests whether answer-closure position sensitivity persists under:
 * - direct_short_answer
 * - cite_then_answer
 * - reason_then_answer
 *
 * This uses the existing OpenAI-compatible endpoint only. No vLLM mutation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_ENDPOINT = process.env.REALRAG_ENDPOINT || 'http://192.168.15.133:11435/v1/chat/completions';
const DEFAULT_MODEL = process.env.REALRAG_MODEL || 'local-vllm';
const DEFAULT_DATASET = process.env.REALRAG_HOTPOTQA_PATH || path.join(process.cwd(), 'bench', '_datasets', 'hotpot_dev_distractor_v1.json');
const CONDITIONS = ['rank_1', 'rank_5', 'rank_last', 'no_support'];
const VARIANTS = ['direct_short_answer', 'cite_then_answer', 'reason_then_answer'];

function parseArgs(argv) {
  const args = {
    dataset: DEFAULT_DATASET,
    out: null,
    limit: 2000,
    offset: 0,
    seed: 20260520,
    endpoint: DEFAULT_ENDPOINT,
    model: DEFAULT_MODEL,
    concurrency: 2,
    maxParagraphs: 10,
    maxTokens: 96,
    timeoutMs: 120000,
    retries: 2,
    conditions: CONDITIONS,
    variants: VARIANTS,
    stopOnNoSupportLeak: false,
    noSupportLeakAbortRate: 0.55,
    logEvery: 100,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') args.dataset = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--offset') args.offset = Number(argv[++i]);
    else if (a === '--seed') args.seed = Number(argv[++i]);
    else if (a === '--endpoint') args.endpoint = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--max-paragraphs') args.maxParagraphs = Number(argv[++i]);
    else if (a === '--max-tokens') args.maxTokens = Number(argv[++i]);
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
    else if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--conditions') args.conditions = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--variants') args.variants = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--stop-on-no-support-leak') args.stopOnNoSupportLeak = true;
    else if (a === '--no-support-leak-abort-rate') args.noSupportLeakAbortRate = Number(argv[++i]);
    else if (a === '--log-every') args.logEvery = Number(argv[++i]);
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.out) throw new Error('--out is required');
  for (const c of args.conditions) if (!CONDITIONS.includes(c)) throw new Error(`unknown condition: ${c}`);
  for (const v of args.variants) if (!VARIANTS.includes(v)) throw new Error(`unknown variant: ${v}`);
  args.concurrency = Math.max(1, Math.min(8, Math.trunc(args.concurrency || 1)));
  return args;
}
function usage() { console.log('Usage: node run-realrag-hotpotqa-r3-promptvariants.mjs --out bench/... --limit 2000'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function mulberry32(seed){let t=seed>>>0; return function(){t+=0x6D2B79F5; let r=Math.imul(t^(t>>>15),1|t); r^=r+Math.imul(r^(r>>>7),61|r); return ((r^(r>>>14))>>>0)/4294967296;};}
function shuffledIndices(n, seed){const arr=Array.from({length:n},(_,i)=>i); const rnd=mulberry32(seed); for(let i=arr.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr;}
function normText(s){return String(s||'').toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^a-z0-9\s]/g,' ').replace(/\b(a|an|the)\b/g,' ').replace(/\s+/g,' ').trim();}
function tokenize(s){const n=normText(s); return n?n.split(' '):[];}
function f1(pred,gold){const p=tokenize(pred), g=tokenize(gold); if(!p.length&&!g.length)return 1; if(!p.length||!g.length)return 0; const counts=new Map(); for(const tok of g)counts.set(tok,(counts.get(tok)||0)+1); let common=0; for(const tok of p){const c=counts.get(tok)||0; if(c>0){common++; counts.set(tok,c-1);}} if(!common)return 0; const prec=common/p.length, rec=common/g.length; return 2*prec*rec/(prec+rec);}
function exact(pred,gold){return normText(pred)===normText(gold)?1:0;}
function containsAnswer(pred,gold){const p=normText(pred), g=normText(gold); if(!g)return 0; if(g==='yes'||g==='no')return p.split(/\s+/).includes(g)?1:0; return p.includes(g)?1:0;}
function cleanPrediction(s){let text=String(s||'').trim(); const answerLine=text.split('\n').find(line=>/^\s*(answer|final answer)\s*[:：-]/i.test(line)); if(answerLine) text=answerLine.replace(/^\s*(answer|final answer)\s*[:：-]\s*/i,''); else text=text.replace(/^\s*(final answer|answer|resposta)\s*[:：-]\s*/i,'').split('\n')[0]; return text.trim().replace(/^['"`]+|['"`]+$/g,'').slice(0,300);}
function extractCitations(s){const text=String(s||''); const line=text.split('\n').find(l=>/^\s*(evidence|citations?|titles?)\s*[:：-]/i.test(l)); if(!line)return []; return line.replace(/^\s*(evidence|citations?|titles?)\s*[:：-]\s*/i,'').split(/[,;|]/).map(x=>x.trim().replace(/^['"`\[\]]+|['"`\[\]]+$/g,'')).filter(Boolean);}
function paragraphRecords(item){const supportTitleSet=new Set((item.supporting_facts||[]).map(sf=>String(sf[0]))); return (item.context||[]).map(([title,sentences],idx)=>{const text=Array.isArray(sentences)?sentences.join(' '):String(sentences||''); return {idx,title:String(title),text,isSupport:supportTitleSet.has(String(title))};});}
function bm25Order(question, paragraphs){const docs=paragraphs.map(p=>tokenize(`${p.title} ${p.text}`)); const q=tokenize(question).filter(t=>t.length>1); const N=docs.length||1; const df=new Map(); for(const doc of docs)for(const t of new Set(doc))df.set(t,(df.get(t)||0)+1); const avgdl=docs.reduce((a,d)=>a+d.length,0)/N||1; const k1=1.2,b=0.75; return paragraphs.map((p,i)=>{const doc=docs[i], tf=new Map(); for(const t of doc)tf.set(t,(tf.get(t)||0)+1); let score=0; for(const t of q){const f=tf.get(t)||0; if(!f)continue; const dft=df.get(t)||0; const idf=Math.log(1+(N-dft+0.5)/(dft+0.5)); score+=idf*(f*(k1+1))/(f+k1*(1-b+b*doc.length/avgdl));} return {p,score};}).sort((a,b)=>b.score-a.score||a.p.idx-b.p.idx).map(x=>x.p);}
function forcedRankOrder(support,distractors,targetRank){const beforeCount=Math.max(0,targetRank-1); return [...distractors.slice(0,beforeCount),...support,...distractors.slice(beforeCount)];}
function orderForCondition(item,condition,maxParagraphs){const paras=paragraphRecords(item); const support=paras.filter(p=>p.isSupport); const bm25=bm25Order(item.question,paras); const bm25Distractors=bm25.filter(p=>!p.isSupport); let ordered; if(condition==='rank_1')ordered=forcedRankOrder(support,bm25Distractors,1); else if(condition==='rank_5')ordered=forcedRankOrder(support,bm25Distractors,5); else if(condition==='rank_last')ordered=[...bm25Distractors,...support]; else if(condition==='no_support')ordered=[...bm25Distractors]; else throw new Error(`unknown condition: ${condition}`); const seen=new Set(), deduped=[]; for(const p of ordered){if(seen.has(p.idx))continue; seen.add(p.idx); deduped.push(p);} return deduped.slice(0,maxParagraphs);}
function promptFor(item,variant,ordered){const context=ordered.map((p,i)=>`[${i+1}] ${p.title}\n${p.text}`).join('\n\n'); if(variant==='direct_short_answer') return [{role:'system',content:'You answer questions using only the provided context. Return the shortest correct answer string. If the answer is not in the context, answer UNKNOWN.'},{role:'user',content:`Question: ${item.question}\n\nContext:\n${context}\n\nReturn only the answer.`}]; if(variant==='cite_then_answer') return [{role:'system',content:'Use only the provided context. Return exactly two lines: Evidence: <title(s)> and Answer: <short answer>. If the answer is not in the context, use Answer: UNKNOWN.'},{role:'user',content:`Question: ${item.question}\n\nContext:\n${context}\n\nReturn two lines only.`}]; if(variant==='reason_then_answer') return [{role:'system',content:'Use only the provided context. Think briefly, then return exactly two lines: Reason: <one short sentence> and Answer: <short answer>. If the answer is not in the context, use Answer: UNKNOWN.'},{role:'user',content:`Question: ${item.question}\n\nContext:\n${context}\n\nReturn two lines only.`}]; throw new Error(`unknown variant ${variant}`);}
function supportStats(ordered){const ranks=ordered.map((p,i)=>p.isSupport?i+1:null).filter(Boolean); return {support_present:ranks.length>0,support_rank_min:ranks.length?Math.min(...ranks):null,support_rank_all:ranks,support_count:ranks.length,support_titles:ordered.filter(p=>p.isSupport).map(p=>p.title)};}
function citationHit(citations, supportTitles){const cn=citations.map(normText).filter(Boolean); const sn=supportTitles.map(normText).filter(Boolean); if(!cn.length||!sn.length)return 0; return cn.some(c=>sn.some(s=>c.includes(s)||s.includes(c)))?1:0;}
async function postChat(args,messages){const payload={model:args.model,messages,temperature:0,top_p:1,max_tokens:args.maxTokens}; let lastErr; for(let attempt=0;attempt<=args.retries;attempt++){const ac=new AbortController(); const timer=setTimeout(()=>ac.abort(),args.timeoutMs); try{const res=await fetch(args.endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ac.signal}); clearTimeout(timer); const text=await res.text(); if(!res.ok)throw new Error(`HTTP ${res.status}: ${text.slice(0,500)}`); const j=JSON.parse(text); return {raw_response:j,response_text:j.choices?.[0]?.message?.content??'',usage:j.usage||null,finish_reason:j.choices?.[0]?.finish_reason||null,attempts:attempt+1};}catch(err){clearTimeout(timer); lastErr=err; if(attempt<args.retries)await new Promise(r=>setTimeout(r,1000*(attempt+1)));}} throw lastErr;}
function loadDone(recordsPath){const done=new Set(); if(!fs.existsSync(recordsPath))return done; for(const line of fs.readFileSync(recordsPath,'utf8').split('\n').filter(Boolean)){try{const r=JSON.parse(line); done.add(`${r.qid}\t${r.variant}\t${r.condition}`);}catch{}} return done;}
function readRecords(recordsPath){if(!fs.existsSync(recordsPath))return []; return fs.readFileSync(recordsPath,'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line));}
function aggregate(records){const byVariantCondition={}; for(const r of records){const key=`${r.variant}:${r.condition}`; byVariantCondition[key] ||= {variant:r.variant,condition:r.condition,n:0,em:0,f1:0,contains:0,closure:0,citationHit:0,citationEligible:0,supportPresent:0,errors:0}; const b=byVariantCondition[key]; b.n++; b.em+=r.metrics?.em||0; b.f1+=r.metrics?.f1||0; b.contains+=r.metrics?.contains_answer||0; b.closure+=r.metrics?.closure||0; b.supportPresent+=r.support?.support_present?1:0; b.errors+=r.error?1:0; if(r.variant==='cite_then_answer'){b.citationHit+=r.metrics?.citation_hit||0; b.citationEligible++;}}
 for(const b of Object.values(byVariantCondition)){for(const k of ['em','f1','contains','closure','supportPresent','errors'])b[k]=b.n?b[k]/b.n:0; b.citationHitRate=b.citationEligible?b.citationHit/b.citationEligible:null;} return {byVariantCondition:Object.values(byVariantCondition).sort((a,b)=>a.variant.localeCompare(b.variant)||a.condition.localeCompare(b.condition))};}
function writeSummary(outDir,args,records,selectedItems,startedAt,finishedAt,status='running'){const agg=aggregate(records); const summary={schema:'realrag.hotpotqa.r3.promptvariants.summary.v1',status,started_at:startedAt,finished_at:finishedAt||null,endpoint:args.endpoint,model:args.model,dataset_path:args.dataset,dataset_sha256:fs.existsSync(args.dataset)?sha256(fs.readFileSync(args.dataset)):null,limit:args.limit,offset:args.offset,seed:args.seed,conditions:args.conditions,variants:args.variants,selected_questions:selectedItems.length,expected_records:selectedItems.length*args.conditions.length*args.variants.length,completed_records:records.length,aggregate:agg,interpretation_boundary:['public HotpotQA prompt/citation ablation','closure is answer-side EM/contains/F1, not proof of evidence use','citation_hit is title-string overlap, not proof of internal use','no runtime hook, no serving mutation, no attention claim']}; fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify(summary,null,2)); return summary;}
function writeResults(outDir,summary){const lines=[]; lines.push('# RealRAG HotpotQA R3A — prompt/citation ablation'); lines.push(''); lines.push(`Status: **${summary.status}**`); lines.push(`Started: ${summary.started_at}`); lines.push(`Finished: ${summary.finished_at||'running'}`); lines.push(''); lines.push('## Boundary'); lines.push(''); for(const b of summary.interpretation_boundary)lines.push(`- ${b}.`); lines.push(''); lines.push('## Aggregate'); lines.push(''); lines.push('| variant | condition | n | closure | EM | contains | F1 | citation hit | error rate |'); lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|'); for(const v of summary.aggregate.byVariantCondition){lines.push(`| ${v.variant} | ${v.condition} | ${v.n} | ${(v.closure*100).toFixed(1)}% | ${(v.em*100).toFixed(1)}% | ${(v.contains*100).toFixed(1)}% | ${(v.f1*100).toFixed(1)}% | ${v.citationHitRate==null?'n/a':(v.citationHitRate*100).toFixed(1)+'%'} | ${(v.errors*100).toFixed(1)}% |`);} lines.push(''); lines.push('## Files'); lines.push(''); lines.push('- `records.jsonl` — per question/variant/condition record.'); lines.push('- `summary.json` — machine-readable aggregate.'); lines.push('- `run.log` — run log.'); fs.writeFileSync(path.join(outDir,'RESULTS.md'),lines.join('\n')+'\n');}
async function main(){const args=parseArgs(process.argv.slice(2)); const startedAt=new Date().toISOString(); ensureDir(args.out); const recordsPath=path.join(args.out,'records.jsonl'); const logPath=path.join(args.out,'run.log'); const log=line=>{const msg=`[${new Date().toISOString()}] ${line}`; console.log(msg); fs.appendFileSync(logPath,msg+'\n');}; log(`REALRAG_R3A_START model=${args.model} endpoint=${args.endpoint} limit=${args.limit} concurrency=${args.concurrency}`); if(!fs.existsSync(args.dataset))throw new Error(`dataset missing: ${args.dataset}`); const raw=fs.readFileSync(args.dataset,'utf8'); const dataset=JSON.parse(raw); log(`dataset_loaded records=${dataset.length} sha256=${sha256(raw)}`); const indices=shuffledIndices(dataset.length,args.seed).slice(args.offset,args.offset+args.limit); const selectedItems=indices.map(i=>dataset[i]).filter(item=>{const paras=paragraphRecords(item); return item?._id&&item.question&&item.answer&&paras.some(p=>p.isSupport)&&paras.some(p=>!p.isSupport);}); fs.writeFileSync(path.join(args.out,'selected-ids.json'),JSON.stringify(selectedItems.map(x=>x._id),null,2)); const tasks=[]; for(const item of selectedItems)for(const variant of args.variants)for(const condition of args.conditions)tasks.push({item,variant,condition}); const done=loadDone(recordsPath); const pending=tasks.filter(t=>!done.has(`${t.item._id}\t${t.variant}\t${t.condition}`)); log(`selected_questions=${selectedItems.length} tasks=${tasks.length} pending=${pending.length} already_done=${done.size}`); let completed=done.size, noSupportDone=0, noSupportClosure=0; async function runTask(task){const {item,variant,condition}=task; const ordered=orderForCondition(item,condition,args.maxParagraphs); const support=supportStats(ordered); const messages=promptFor(item,variant,ordered); const promptText=messages.map(m=>`${m.role}: ${m.content}`).join('\n'); const base={schema:'realrag.hotpotqa.r3.promptvariants.record.v1',qid:item._id,question:item.question,gold_answer:item.answer,variant,condition,paragraph_count:ordered.length,context_titles:ordered.map(p=>p.title),support,prompt_sha256:sha256(promptText),created_at:new Date().toISOString()}; try{const t0=Date.now(); const response=await postChat(args,messages); const latencyMs=Date.now()-t0; const pred=cleanPrediction(response.response_text); const citations=extractCitations(response.response_text); const metrics={em:exact(pred,item.answer),f1:f1(pred,item.answer),contains_answer:containsAnswer(pred,item.answer),citation_hit:variant==='cite_then_answer'?citationHit(citations,support.support_titles):null}; metrics.closure=(metrics.em||metrics.contains_answer||metrics.f1>=0.8)?1:0; const rec={...base,prediction:pred,citations,raw_response_text:response.response_text,metrics,latency_ms:latencyMs,usage:response.usage,finish_reason:response.finish_reason,attempts:response.attempts}; fs.appendFileSync(recordsPath,JSON.stringify(rec)+'\n'); if(condition==='no_support'){noSupportDone++; noSupportClosure+=metrics.closure;} return rec;}catch(err){const rec={...base,error:String(err?.stack||err),metrics:{em:0,f1:0,contains_answer:0,closure:0,citation_hit:null}}; fs.appendFileSync(recordsPath,JSON.stringify(rec)+'\n'); return rec;}}
let cursor=0; async function worker(){while(cursor<pending.length){const task=pending[cursor++]; const rec=await runTask(task); completed++; if(completed%args.logEvery===0||completed===tasks.length){const records=readRecords(recordsPath); const summary=writeSummary(args.out,args,records,selectedItems,startedAt,null,'running'); writeResults(args.out,summary); log(`progress completed=${completed}/${tasks.length} last=${rec.qid}/${rec.variant}/${rec.condition} closure=${rec.metrics?.closure??0}`);} if(args.stopOnNoSupportLeak&&noSupportDone>=50){const leakRate=noSupportClosure/noSupportDone; if(leakRate>args.noSupportLeakAbortRate)throw new Error(`abort: no_support closure leak rate ${(leakRate*100).toFixed(1)}% > ${(args.noSupportLeakAbortRate*100).toFixed(1)}%`);}}}
try{await Promise.all(Array.from({length:args.concurrency},()=>worker())); const finishedAt=new Date().toISOString(); const records=readRecords(recordsPath); const summary=writeSummary(args.out,args,records,selectedItems,startedAt,finishedAt,'done'); writeResults(args.out,summary); log(`REALRAG_R3A_DONE completed=${records.length}/${tasks.length}`);}catch(err){const finishedAt=new Date().toISOString(); const records=readRecords(recordsPath); const summary=writeSummary(args.out,args,records,selectedItems,startedAt,finishedAt,'failed'); writeResults(args.out,summary); fs.writeFileSync(path.join(args.out,'ERROR.md'),`# RealRAG R3A failed\n\n\`\`\`\n${String(err?.stack||err)}\n\`\`\`\n`); log(`REALRAG_R3A_FAILED ${String(err?.message||err)}`); process.exit(1);} }
main().catch(err=>{console.error(err); process.exit(1);});
