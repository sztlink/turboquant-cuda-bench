#!/usr/bin/env node
/**
 * RealRAG 2Wiki R3I: prompt/schema ablation.
 *
 * Tests whether R3G/R3H non-generalization is caused by prompt/schema fit rather
 * than retrieval/reranker placement alone. Uses existing vLLM endpoint only;
 * does not patch/restart/deploy serving and does not touch EPKV hooks.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_ENDPOINT = process.env.REALRAG_ENDPOINT || 'http://192.168.15.133:11435/v1/chat/completions';
const DEFAULT_MODEL = process.env.REALRAG_MODEL || 'local-vllm';
const DEFAULT_DATASET = 'bench/_datasets/2wiki/data/dev.json';
const DEFAULT_RERANK = 'bench/evidence-utilization-realrag-2wiki-r3g-natural-retrieval-2026-05-20/bge-rerank-scores.json';
const DEFAULT_VARIANTS = [
  'context_bge_direct',
  'context_bge_typeaware',
  'context_oracle_typeaware',
  'support_sentences_typeaware',
  'evidence_triples_direct',
  'evidence_triples_typeaware',
  'no_support_typeaware',
];

function parseArgs(argv) {
  const args = { dataset: DEFAULT_DATASET, rerankScores: DEFAULT_RERANK, out: null, limit: 400, perType: 100, seed: 20260520, endpoint: DEFAULT_ENDPOINT, model: DEFAULT_MODEL, concurrency: 4, maxParagraphs: 10, candidateK: 10, maxTokens: 48, timeoutMs: 120000, retries: 2, variants: DEFAULT_VARIANTS, logEvery: 100 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') args.dataset = argv[++i];
    else if (a === '--rerank-scores') args.rerankScores = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--per-type') args.perType = Number(argv[++i]);
    else if (a === '--seed') args.seed = Number(argv[++i]);
    else if (a === '--endpoint') args.endpoint = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]);
    else if (a === '--max-paragraphs') args.maxParagraphs = Number(argv[++i]);
    else if (a === '--candidate-k') args.candidateK = Number(argv[++i]);
    else if (a === '--max-tokens') args.maxTokens = Number(argv[++i]);
    else if (a === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
    else if (a === '--retries') args.retries = Number(argv[++i]);
    else if (a === '--variants') args.variants = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--log-every') args.logEvery = Number(argv[++i]);
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.out) throw new Error('--out required');
  args.concurrency = Math.max(1, Math.min(8, Math.trunc(args.concurrency || 1)));
  return args;
}
function usage(){console.log('Usage: node run-realrag-2wiki-r3i-prompt-schema-ablation.mjs --out bench/... --limit 400 --per-type 100');}
function ensureDir(p){fs.mkdirSync(p,{recursive:true});}
function sha256(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
function mulberry32(seed){let t=seed>>>0; return function(){t+=0x6D2B79F5; let r=Math.imul(t^(t>>>15),1|t); r^=r+Math.imul(r^(r>>>7),61|r); return ((r^(r>>>14))>>>0)/4294967296;};}
function shuffle(arr, seed){const a=[...arr], rnd=mulberry32(seed); for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;}
function normText(s){return String(s||'').toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^a-z0-9\s]/g,' ').replace(/\b(a|an|the)\b/g,' ').replace(/\s+/g,' ').trim();}
function tokenize(s){const n=normText(s); return n?n.split(' '):[];}
function exact(pred,gold){return normText(pred)===normText(gold)?1:0;}
function f1(pred,gold){const p=tokenize(pred), g=tokenize(gold); if(!p.length&&!g.length)return 1; if(!p.length||!g.length)return 0; const counts=new Map(); for(const tok of g)counts.set(tok,(counts.get(tok)||0)+1); let common=0; for(const tok of p){const c=counts.get(tok)||0; if(c>0){common++; counts.set(tok,c-1);}} if(!common)return 0; const prec=common/p.length, rec=common/g.length; return 2*prec*rec/(prec+rec);}
function containsAnswer(pred,gold){const p=normText(pred), g=normText(gold); if(!g)return 0; if(g==='yes'||g==='no')return p.split(/\s+/).includes(g)?1:0; return p.includes(g)?1:0;}
function cleanPrediction(s){return String(s||'').replace(/^\s*(final answer|answer|resposta)\s*[:：-]\s*/i,'').split('\n')[0].trim().replace(/^['"`]+|['"`]+$/g,'').slice(0,300);}
function answerClass(answer){const a=String(answer||'').trim(), n=normText(a); if(n==='yes'||n==='no')return 'yes_no'; if(/^\d+(\.\d+)?$/.test(n))return 'numeric_only'; if(/\d/.test(a)&&/[a-zA-Z]/.test(a))return 'mixed_numeric_text'; const tc=tokenize(a).length; if(tc<=1)return 'single_token_entity'; if(tc<=3)return 'short_entity'; return 'long_answer';}
function paragraphRecords(item){const supportTitleSet=new Set((item.supporting_facts||[]).map(sf=>String(sf[0]))); return (item.context||[]).map(([title,sentences],idx)=>({idx,title:String(title),text:Array.isArray(sentences)?sentences.join(' '):String(sentences||''),sentences:Array.isArray(sentences)?sentences.map(String):[String(sentences||'')],isSupport:supportTitleSet.has(String(title))}));}
function bm25Order(question, paragraphs){const docs=paragraphs.map(p=>tokenize(`${p.title} ${p.text}`)); const q=tokenize(question).filter(t=>t.length>1); const N=docs.length||1; const df=new Map(); for(const doc of docs)for(const t of new Set(doc))df.set(t,(df.get(t)||0)+1); const avgdl=docs.reduce((a,d)=>a+d.length,0)/N||1; const k1=1.2,b=0.75; return paragraphs.map((p,i)=>{const doc=docs[i],tf=new Map(); for(const t of doc)tf.set(t,(tf.get(t)||0)+1); let score=0; for(const t of q){const f=tf.get(t)||0; if(!f)continue; const dft=df.get(t)||0; const idf=Math.log(1+(N-dft+0.5)/(dft+0.5)); score+=idf*(f*(k1+1))/(f+k1*(1-b+b*doc.length/avgdl));} return {p,score};}).sort((a,b)=>b.score-a.score||a.p.idx-b.p.idx).map((x,i)=>({...x.p,bm25_score:x.score,bm25_rank:i+1}));}
function orderedParagraphs(item, variant, args, rerankScores){const paras=paragraphRecords(item); const support=paras.filter(p=>p.isSupport); const bm25=bm25Order(item.question, paras); const bm25Distractors=bm25.filter(p=>!p.isSupport); let ordered=[];
  if(variant.includes('bge')){const scores=rerankScores?.scores?.[item._id]||{}; ordered=bm25.slice(0,args.candidateK).map(p=>({...p,bge_score:Number(scores[String(p.idx)] ?? Number.NEGATIVE_INFINITY)})).sort((a,b)=>b.bge_score-a.bge_score||a.bm25_rank-b.bm25_rank);}
  else if(variant.includes('oracle')) ordered=[...support,...bm25Distractors];
  else if(variant.includes('no_support')) ordered=[...bm25Distractors];
  else ordered=bm25.slice(0,args.candidateK);
  const seen=new Set(), out=[]; for(const p of ordered){if(seen.has(p.idx))continue; seen.add(p.idx); out.push(p);} return out.slice(0,args.maxParagraphs);
}
function supportSentences(item){const paras=paragraphRecords(item); const byTitle=new Map(paras.map(p=>[p.title,p])); return (item.supporting_facts||[]).map(([title,idx])=>{const p=byTitle.get(String(title)); return {title:String(title),sent_idx:Number(idx),sentence:p?.sentences?.[Number(idx)] ?? ''};});}
function evidenceTriples(item){return (item.evidences||[]).map(ev=>Array.isArray(ev)?ev.map(String):[String(ev)]);}
function typeHint(item){const type=item.type||'unknown'; const ans=answerClass(item.answer); const base=`Question type: ${type}. Expected answer style: ${ans}.`;
  const hints={
    comparison:'For comparison questions, identify the compared property for each named entity, compare the values, and answer with the entity requested by the question. If the question asks yes/no, answer exactly yes or no.',
    bridge_comparison:'For bridge-comparison questions, first resolve the bridge fact for each candidate, then compare the requested property, and answer with the candidate requested by the question. If it asks whether both match, answer exactly yes or no.',
    compositional:'For compositional questions, follow the evidence chain step by step and return the final target entity/date/value, not the intermediate entity.',
    inference:'For inference questions, combine the provided facts. If the question is yes/no, answer exactly yes or no.'
  };
  return `${base}\n${hints[type]||'Use the evidence conservatively and return only the final answer.'}`;
}
function promptFor(item, variant, ordered){const typeAware=variant.includes('typeaware'); const direct=variant.includes('direct'); let evidenceBlock='', schemaLabel='paragraph_context';
  if(variant.startsWith('evidence_triples')){schemaLabel='evidence_triples'; const triples=evidenceTriples(item).map((t,i)=>`[${i+1}] ${t.join(' -- ')}`).join('\n'); evidenceBlock=`Evidence triples:\n${triples || '(none)'}`;}
  else if(variant.startsWith('support_sentences')){schemaLabel='support_sentences'; const s=supportSentences(item).map((x,i)=>`[${i+1}] ${x.title} #${x.sent_idx}: ${x.sentence}`).join('\n'); evidenceBlock=`Supporting sentences:\n${s || '(none)'}`;}
  else {evidenceBlock=`Context:\n${ordered.map((p,i)=>`[${i+1}] ${p.title}\n${p.text}`).join('\n\n')}`;}
  const system = typeAware
    ? 'You answer multi-hop questions using only the provided evidence. Return only the shortest final answer string. Do not include reasoning. If the evidence is insufficient, answer UNKNOWN.'
    : 'You answer questions using only the provided context. Return the shortest correct answer string. If the answer is not in the context, answer UNKNOWN.';
  const guidance = typeAware ? `\n${typeHint(item)}\n` : (direct ? '' : '');
  const user = `${guidance}\nQuestion: ${item.question}\n\n${evidenceBlock}\n\nReturn only the answer.`;
  return {schemaLabel,messages:[{role:'system',content:system},{role:'user',content:user}]};
}
async function postChat(args,messages){const payload={model:args.model,messages,temperature:0,top_p:1,max_tokens:args.maxTokens}; let lastErr; for(let attempt=0;attempt<=args.retries;attempt++){const ac=new AbortController(); const timer=setTimeout(()=>ac.abort(),args.timeoutMs); try{const res=await fetch(args.endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ac.signal}); clearTimeout(timer); const text=await res.text(); if(!res.ok)throw new Error(`HTTP ${res.status}: ${text.slice(0,500)}`); const j=JSON.parse(text); return {response_text:j.choices?.[0]?.message?.content??'',usage:j.usage||null,finish_reason:j.choices?.[0]?.finish_reason||null,attempts:attempt+1};}catch(err){clearTimeout(timer); lastErr=err; if(attempt<args.retries)await new Promise(r=>setTimeout(r,1000*(attempt+1)));}} throw lastErr;}
function selectItems(dataset,args){const usable=dataset.filter(item=>item?._id&&item.question&&item.answer&&paragraphRecords(item).some(p=>p.isSupport)&&paragraphRecords(item).some(p=>!p.isSupport)); const byType={}; for(const item of usable){byType[item.type||'unknown'] ||= []; byType[item.type||'unknown'].push(item);} let selected=[]; for(const [type,arr] of Object.entries(byType).sort()) selected.push(...shuffle(arr,args.seed ^ sha256(Buffer.from(type)).charCodeAt(0),).slice(0,args.perType)); if(selected.length>args.limit) selected=shuffle(selected,args.seed).slice(0,args.limit); return shuffle(selected,args.seed+99);}
function loadDone(recordsPath){const done=new Set(); if(!fs.existsSync(recordsPath))return done; for(const line of fs.readFileSync(recordsPath,'utf8').split('\n').filter(Boolean)){try{const r=JSON.parse(line); done.add(`${r.qid}\t${r.variant}`);}catch{}} return done;}
function readRecords(recordsPath){if(!fs.existsSync(recordsPath))return []; return fs.readFileSync(recordsPath,'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line));}
function agg(records, keyFn){const by={}; for(const r of records){const key=keyFn(r); by[key] ||= {key,n:0,closure:0,em:0,f1:0,contains:0,errors:0,latencies:[]}; const b=by[key]; b.n++; b.closure+=r.metrics?.closure||0; b.em+=r.metrics?.em||0; b.f1+=r.metrics?.f1||0; b.contains+=r.metrics?.contains_answer||0; b.errors+=r.error?1:0; if(r.latency_ms)b.latencies.push(r.latency_ms);} return Object.values(by).sort((a,b)=>String(a.key).localeCompare(String(b.key))).map(b=>({key:b.key,n:b.n,closure:b.closure/b.n,em:b.em/b.n,f1:b.f1/b.n,contains:b.contains/b.n,error_rate:b.errors/b.n,latency_ms_mean:b.latencies.length?b.latencies.reduce((x,y)=>x+y,0)/b.latencies.length:null}));}
function pairwise(records){const byQ={}; for(const r of records){byQ[r.qid] ||= {}; byQ[r.qid][r.variant]=r;} const variants=[...new Set(records.map(r=>r.variant))].sort(); const pairs=[]; for(let i=0;i<variants.length;i++) for(let j=i+1;j<variants.length;j++){const a=variants[i],b=variants[j]; const diffs=[]; let aOnly=0,bOnly=0,both=0,neither=0; for(const g of Object.values(byQ)){if(!g[a]||!g[b])continue; const av=g[a].metrics?.closure||0, bv=g[b].metrics?.closure||0; diffs.push(av-bv); if(av&&bv)both++; else if(av)aOnly++; else if(bv)bOnly++; else neither++;} if(!diffs.length)continue; const delta=diffs.reduce((x,y)=>x+y,0)/diffs.length; pairs.push({a,b,n:diffs.length,delta,aOnly,bOnly,both,neither}); } return pairs;}
function writeSummary(out,args,selected,records,startedAt,finishedAt,status){const datasetRaw=fs.readFileSync(args.dataset); const summary={schema:'realrag.2wiki.r3i.prompt_schema_ablation.summary.v1',status,started_at:startedAt,finished_at:finishedAt||null,endpoint:args.endpoint,model:args.model,dataset_path:args.dataset,dataset_sha256:sha256(datasetRaw),rerank_scores_path:args.rerankScores,limit:args.limit,per_type:args.perType,seed:args.seed,variants:args.variants,selected_questions:selected.length,expected_records:selected.length*args.variants.length,completed_records:records.length,aggregate:{byVariant:agg(records,r=>r.variant),byTypeVariant:agg(records,r=>`${r.question_type}:${r.variant}`),byAnswerClassVariant:agg(records,r=>`${r.answer_class}:${r.variant}`),pairwise:pairwise(records)},interpretation_boundary:['2Wiki prompt/schema ablation','answer-side closure only','not internal evidence-use proof','no vLLM mutation, no EPKV hook']}; fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2)); writeResults(out,summary); return summary;}
function pct(x){return `${(x*100).toFixed(1)}%`;}
function writeResults(out,summary){const lines=[]; lines.push('# RealRAG 2Wiki R3I — prompt/schema ablation','',`Status: **${summary.status}**`,`Started: ${summary.started_at}`,`Finished: ${summary.finished_at||'running'}`,'','## Boundary',''); for(const b of summary.interpretation_boundary)lines.push(`- ${b}.`); lines.push('','## Aggregate by variant','','| variant | n | closure | EM | F1 | contains | error rate |','|---|---:|---:|---:|---:|---:|---:|'); for(const a of summary.aggregate.byVariant)lines.push(`| ${a.key} | ${a.n} | ${pct(a.closure)} | ${pct(a.em)} | ${pct(a.f1)} | ${pct(a.contains)} | ${pct(a.error_rate)} |`); lines.push('','## By question type / variant','','| type:variant | n | closure |','|---|---:|---:|'); for(const a of summary.aggregate.byTypeVariant)lines.push(`| ${a.key} | ${a.n} | ${pct(a.closure)} |`); lines.push('','## By answer class / variant','','| answer_class:variant | n | closure |','|---|---:|---:|'); for(const a of summary.aggregate.byAnswerClassVariant)lines.push(`| ${a.key} | ${a.n} | ${pct(a.closure)} |`); lines.push('','## Pairwise closure deltas','','| A - B | n | delta | A only | B only | both | neither |','|---|---:|---:|---:|---:|---:|---:|'); for(const p of summary.aggregate.pairwise)lines.push(`| ${p.a} - ${p.b} | ${p.n} | ${(p.delta*100).toFixed(1)} pp | ${p.aOnly} | ${p.bOnly} | ${p.both} | ${p.neither} |`); fs.writeFileSync(path.join(out,'RESULTS.md'),lines.join('\n')+'\n');}
async function main(){const args=parseArgs(process.argv.slice(2)); ensureDir(args.out); const startedAt=new Date().toISOString(); const logPath=path.join(args.out,'run.log'); const recordsPath=path.join(args.out,'records.jsonl'); const log=s=>{const line=`[${new Date().toISOString()}] ${s}`; console.log(line); fs.appendFileSync(logPath,line+'\n');}; log(`REALRAG_R3I_START model=${args.model} endpoint=${args.endpoint} limit=${args.limit} perType=${args.perType} variants=${args.variants.join(',')}`);
  const dataset=JSON.parse(fs.readFileSync(args.dataset,'utf8')); const rerankScores=JSON.parse(fs.readFileSync(args.rerankScores,'utf8')); const selected=selectItems(dataset,args); fs.writeFileSync(path.join(args.out,'selected-ids.json'),JSON.stringify(selected.map(x=>({id:x._id,type:x.type,answer_class:answerClass(x.answer)})),null,2));
  const tasks=[]; for(const item of selected) for(const variant of args.variants) tasks.push({item,variant}); const done=loadDone(recordsPath); const pending=tasks.filter(t=>!done.has(`${t.item._id}\t${t.variant}`)); let cursor=0, completed=done.size; log(`selected_questions=${selected.length} tasks=${tasks.length} pending=${pending.length} already_done=${done.size}`);
  async function runTask({item,variant}){const ordered=orderedParagraphs(item,variant,args,rerankScores); const {schemaLabel,messages}=promptFor(item,variant,ordered); const base={schema:'realrag.2wiki.r3i.prompt_schema_ablation.record.v1',qid:item._id,question:item.question,question_type:item.type||'unknown',answer_class:answerClass(item.answer),gold_answer:item.answer,variant,schema_label:schemaLabel,context_titles:ordered.map(p=>p.title),context_indices:ordered.map(p=>p.idx),created_at:new Date().toISOString()}; try{const t0=Date.now(); const response=await postChat(args,messages); const latencyMs=Date.now()-t0; const pred=cleanPrediction(response.response_text); const metrics={em:exact(pred,item.answer),f1:f1(pred,item.answer),contains_answer:containsAnswer(pred,item.answer)}; metrics.closure=(metrics.em||metrics.contains_answer||metrics.f1>=0.8)?1:0; const rec={...base,prediction:pred,raw_response_text:response.response_text,metrics,latency_ms:latencyMs,usage:response.usage,finish_reason:response.finish_reason,attempts:response.attempts}; fs.appendFileSync(recordsPath,JSON.stringify(rec)+'\n'); return rec;}catch(err){const rec={...base,error:String(err?.stack||err),metrics:{em:0,f1:0,contains_answer:0,closure:0}}; fs.appendFileSync(recordsPath,JSON.stringify(rec)+'\n'); return rec;}}
  async function worker(){while(cursor<pending.length){const task=pending[cursor++]; const rec=await runTask(task); completed++; if(completed%args.logEvery===0||completed===tasks.length){const records=readRecords(recordsPath); writeSummary(args.out,args,selected,records,startedAt,null,'running'); log(`progress completed=${completed}/${tasks.length} last=${rec.qid}/${rec.variant} closure=${rec.metrics?.closure||0}`);}}}
  try{await Promise.all(Array.from({length:args.concurrency},()=>worker())); const records=readRecords(recordsPath); writeSummary(args.out,args,selected,records,startedAt,new Date().toISOString(),'done'); log(`REALRAG_R3I_DONE completed=${records.length}/${tasks.length}`);}catch(err){const records=readRecords(recordsPath); writeSummary(args.out,args,selected,records,startedAt,new Date().toISOString(),'failed'); fs.writeFileSync(path.join(args.out,'ERROR.md'),`# R3I failed\n\n\`\`\`\n${String(err?.stack||err)}\n\`\`\`\n`); log(`REALRAG_R3I_FAILED ${String(err?.message||err)}`); process.exit(1);} }
main().catch(err=>{console.error(err); process.exit(1);});
