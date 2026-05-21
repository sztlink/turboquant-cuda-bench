#!/usr/bin/env node
/** Merge R3L offline vLLM.generate outputs into records.jsonl. */
import fs from 'node:fs';
const args={records:'bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/records.jsonl',outputs:'bench/evidence-utilization-realrag-hotpotqa-r3l-32b-natural-retrieval-2026-05-20/offline-outputs.jsonl',out:null};
for(let i=2;i<process.argv.length;i++){const a=process.argv[i]; if(a==='--records')args.records=process.argv[++i]; else if(a==='--outputs')args.outputs=process.argv[++i]; else if(a==='--out')args.out=process.argv[++i]; else throw new Error(`unknown ${a}`)}
if(!args.out)args.out=args.records;
function normText(s){return String(s||'').toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^a-z0-9\s]/g,' ').replace(/\b(a|an|the)\b/g,' ').replace(/\s+/g,' ').trim();}
function tokenize(s){const n=normText(s); return n?n.split(' '):[];}
function f1(pred,gold){const p=tokenize(pred),g=tokenize(gold); if(!p.length&&!g.length)return 1; if(!p.length||!g.length)return 0; const counts=new Map(); for(const tok of g)counts.set(tok,(counts.get(tok)||0)+1); let common=0; for(const tok of p){const c=counts.get(tok)||0; if(c>0){common++; counts.set(tok,c-1);}} if(!common)return 0; const prec=common/p.length, rec=common/g.length; return 2*prec*rec/(prec+rec);}
function exact(pred,gold){return normText(pred)===normText(gold)?1:0;}
function containsAnswer(pred,gold){const p=normText(pred),g=normText(gold); if(!g)return 0; if(g==='yes'||g==='no')return p.split(/\s+/).includes(g)?1:0; return p.includes(g)?1:0;}
function cleanPrediction(s){return String(s||'').replace(/^\s*(final answer|answer|resposta)\s*[:：-]\s*/i,'').split('\n')[0].trim().replace(/^['"`]+|['"`]+$/g,'').slice(0,300);}
const existing=fs.existsSync(args.records)?fs.readFileSync(args.records,'utf8').split('\n').filter(Boolean):[];
const seen=new Set(existing.map(line=>{const r=JSON.parse(line); return `${r.qid}\t${r.condition}`;}));
let added=0, skipped=0; const newLines=[];
for(const line of fs.readFileSync(args.outputs,'utf8').split('\n').filter(Boolean)){const o=JSON.parse(line); const key=`${o.qid}\t${o.condition}`; if(seen.has(key)){skipped++; continue;} const pred=cleanPrediction(o.raw_response_text); const metrics={em:exact(pred,o.gold_answer),f1:f1(pred,o.gold_answer),contains_answer:containsAnswer(pred,o.gold_answer)}; metrics.closure=(metrics.em||metrics.contains_answer||metrics.f1>=0.8)?1:0; const rec={schema:'realrag.hotpotqa.r3b.natural_retrieval.record.v1',qid:o.qid,question:o.question,gold_answer:o.gold_answer,condition:o.condition,paragraph_count:o.paragraph_count,context_titles:o.context_titles,context_indices:o.context_indices,support:o.support,retrieval:o.retrieval,created_at:o.created_at||new Date().toISOString(),prediction:pred,raw_response_text:o.raw_response_text,metrics,latency_ms:o.latency_ms??null,usage:o.usage??null,finish_reason:o.finish_reason??null,attempts:o.attempts??1,offline_vllm_generate:true}; newLines.push(JSON.stringify(rec)); seen.add(key); added++;}
fs.writeFileSync(args.out, existing.concat(newLines).join('\n')+'\n'); console.log(JSON.stringify({existing:existing.length,added,skipped,total:existing.length+added,out:args.out},null,2));
