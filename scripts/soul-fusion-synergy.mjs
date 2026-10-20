import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
const n01=String(process.env.SOUL_FUSION_N01_URL||'http://127.0.0.1:18080').replace(/\/$/,'');
const local=String(process.env.SOUL_FUSION_LOCAL_MODEL_URL||'http://127.0.0.1:18071').replace(/\/$/,'');
const execToken=String(process.env.SOUL_FUSION_EXECUTION_TOKEN||'').trim();const modelToken=String(process.env.SOUL_FUSION_MODEL_TOKEN||'').trim();
assert.ok(execToken.length>=32&&modelToken.length>=32,'local execution tokens missing');
const text='The movie was excellent and the acting was wonderful.';
const p50=xs=>{const a=[...xs].sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
const baseline=[];
for(let i=0;i<10;i++){const trace=crypto.randomBytes(16).toString('hex');const start=performance.now();
 const res=await fetch(local+'/v1/infer',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+modelToken,'x-soul-trace-id':trace,'x-correlation-id':trace},
 body:JSON.stringify({text,trace_id:trace,correlation_id:trace}),signal:AbortSignal.timeout(60000)});
 const body=await res.json();assert.equal(res.status,200,'baseline HTTP '+res.status+': '+JSON.stringify(body));assert.equal(body.trace_id,trace);assert.equal(body.correlation_id,trace);
 baseline.push({run:i+1,trace_id:trace,latency_ms:Number((performance.now()-start).toFixed(3)),model_latency_ms:body.latency_ms,label:body.result.label,confidence:body.result.confidence,probabilities:body.result.probabilities,model_sha:body.model_sha});}
const fused=[];
for(let i=0;i<10;i++){const trace=crypto.randomBytes(16).toString('hex');const now=Date.now();const input={contract_name:'soul-fusion-execution',schema_version:'0.1.0',
 message_id:crypto.randomUUID(),idempotency_key:'ci:synergy:'+i+':'+trace,trace_id:trace,correlation_id:trace,sequence_index:0,created_at:new Date(now).toISOString(),
 deadline_at:new Date(now+120000).toISOString(),source:{nucleus_id:'N01',component:'soul-fusion-synergy',version:'0.2.0'},target:{group_id:'A',capability:'fusion.execute'},
 operation:'execute',input_ref:'sha256:'+crypto.createHash('sha256').update(text).digest('hex'),payload:{text,values:[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8]},
 result_ref:null,evidence_refs:[],status:'PENDING',error:null};const start=performance.now();
 const res=await fetch(n01+'/api/soul-fusion-execution',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+execToken,'x-correlation-id':trace,'x-soul-trace-id':trace},
 body:JSON.stringify(input),signal:AbortSignal.timeout(120000)});const body=await res.json();assert.equal(res.status,200,'fused HTTP '+res.status+': '+JSON.stringify(body));
 assert.equal(body.trace_id,trace);assert.equal(body.correlation_id,trace);assert.equal(body.status,'SUCCEEDED');assert.equal(body.hops?.[2]?.provider,'local-transformers-pytorch');
 fused.push({run:i+1,trace_id:trace,latency_ms:Number((performance.now()-start).toFixed(3)),model_latency_ms:body.hops[2].latency_ms,
 label:body.result.inference.label,confidence:body.result.inference.confidence,probabilities:body.result.inference.probabilities,model_sha:body.result.inference.model_sha});}
const p50Base=p50(baseline.map(x=>x.latency_ms)),p50Fused=p50(fused.map(x=>x.latency_ms));
const equivalent=baseline.every((x,i)=>x.label===fused[i].label&&x.model_sha===fused[i].model_sha&&Object.keys(x.probabilities).every(k=>Math.abs(x.probabilities[k]-fused[i].probabilities[k])<=0.00001));
const ratio=p50Fused/p50Base;const verdict=equivalent&&ratio<=1.5?'PROVEN':'UNPROVEN';
console.log(JSON.stringify({event:'soul.fusion.synergy.completed',input:text,baseline_samples:baseline,fused_samples:fused,p50_baseline_ms:Number(p50Base.toFixed(3)),
 p50_fused_ms:Number(p50Fused.toFixed(3)),fused_to_baseline_ratio:Number(ratio.toFixed(3)),output_equivalent:equivalent,threshold_ratio:1.5,verdict,exit_code:0},null,2));
