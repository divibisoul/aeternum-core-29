import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const base=String(process.env.SOUL_FUSION_N01_URL||'http://127.0.0.1:18080').replace(/\/$/,'');
const token=String(process.env.SOUL_FUSION_EXECUTION_TOKEN||'').trim();assert.ok(token.length>=32,'SOUL_FUSION_EXECUTION_TOKEN missing');
const trace=crypto.randomBytes(16).toString('hex');const corr=trace;const text='The movie was excellent and the acting was wonderful.';
const inputSha=crypto.createHash('sha256').update(text).digest('hex');const now=Date.now();
const input={contract_name:'soul-fusion-execution',schema_version:'0.1.0',message_id:crypto.randomUUID(),idempotency_key:'ci:local-e2e:'+trace,
 trace_id:trace,correlation_id:corr,sequence_index:0,created_at:new Date(now).toISOString(),deadline_at:new Date(now+120000).toISOString(),
 source:{nucleus_id:'N01',component:'soul-fusion-e2e-minimal',version:'0.2.0'},target:{group_id:'A',capability:'fusion.execute'},operation:'execute',
 input_ref:'sha256:'+inputSha,result_ref:null,evidence_refs:[],payload:{text,values:[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8]},status:'PENDING',error:null};
console.log(JSON.stringify({event:'soul.fusion.e2e.started',trace_id:trace,correlation_id:corr,input:text,route:'N01 HTTP -> N07 HMAC authorization -> LangGraph prepare+execute -> local Transformers/PyTorch CPU'}));
const res=await fetch(base+'/api/soul-fusion-execution',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token,'x-correlation-id':corr,'x-soul-trace-id':trace},
 body:JSON.stringify(input),signal:AbortSignal.timeout(120000)});
const out=await res.json();assert.equal(res.status,200,'HTTP '+res.status+': '+JSON.stringify(out));
assert.equal(out.contract_name,'soul-fusion-execution');assert.equal(out.schema_version,'0.1.0');assert.equal(out.status,'SUCCEEDED');
assert.equal(out.trace_id,trace);assert.equal(out.correlation_id,corr);assert.equal(out.hops?.length,3);
assert.equal(out.hops[0].nucleus_id,'N01');assert.equal(out.hops[0].trace_id,trace);assert.equal(out.hops[1].nucleus_id,'N07');
assert.equal(out.hops[1].status,'SUCCEEDED');assert.equal(out.hops[1].trace_id,trace);assert.equal(out.result?.n07?.authorized,true);
assert.equal(out.hops[2].provider,'local-transformers-pytorch');assert.equal(out.hops[2].trace_id,trace);assert.match(out.hops[2].model||'',/@[0-9a-f]{40}$/);
assert.equal(out.result?.inference?.model_sha,out.hops[2].model.split('@').at(-1));assert.equal(out.result?.inference?.input_sha256,inputSha);
assert.equal(out.result?.inference?.intent,out.result?.inference?.label?.toLowerCase());assert.ok(out.result?.inference?.summary?.trim());
console.log(JSON.stringify({event:'soul.fusion.e2e.completed',status:'PASS',trace_id:out.trace_id,correlation_id:corr,n07_authorized:out.result.n07.authorized,
 graph_nodes_executed:['prepare','execute'],provider:out.hops[2].provider,model:out.hops[2].model,model_sha:out.result.inference.model_sha,input:text,
 output:out.result.inference,latency_ms:out.latency_ms,exit_code:0},null,2));
