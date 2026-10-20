import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const baseUrl = String(process.env.SOUL_FUSION_N01_URL || 'http://127.0.0.1:18080').replace(/\/$/, '');
const token = String(process.env.SOUL_FUSION_EXECUTION_TOKEN || '').trim();
assert.ok(token.length >= 32, 'SOUL_FUSION_EXECUTION_TOKEN missing');
const traceId = crypto.randomBytes(16).toString('hex');
const correlationId = traceId;
const now = Date.now();
const text = 'Real N01 N07 LangGraph integration test. Summarize this exact request.';
const input = {
  contract_name:'soul-fusion-execution', schema_version:'0.1.0',
  message_id:crypto.randomUUID(), idempotency_key:'ci:langgraph:'+traceId,
  trace_id:traceId, correlation_id:correlationId, sequence_index:0,
  created_at:new Date(now).toISOString(), deadline_at:new Date(now+90000).toISOString(),
  source:{nucleus_id:'N01',component:'soul-fusion-langgraph-e2e',version:'0.1.0'},
  target:{group_id:'A',capability:'fusion.execute'}, operation:'execute',
  input_ref:'sha256:'+crypto.createHash('sha256').update(text).digest('hex'),
  payload:{text,values:[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8]},
  result_ref:null,evidence_refs:[],status:'PENDING',error:null,
};
console.log(JSON.stringify({event:'soul.fusion.langgraph.test.started',trace_id:traceId,correlation_id:correlationId,route:'N01 -> N07 authorization/neural.forward -> LangGraph(2 nodes)'}));
const response=await fetch(baseUrl+'/api/soul-fusion-execution',{
 method:'POST',
 headers:{'content-type':'application/json',authorization:'Bearer '+token,'x-correlation-id':correlationId,'x-soul-trace-id':traceId},
 body:JSON.stringify(input),signal:AbortSignal.timeout(90000)
});
const output=await response.json();
assert.equal(response.status,200,'HTTP '+response.status+': '+JSON.stringify(output));
assert.equal(output.status,'SUCCEEDED');
assert.equal(output.trace_id,traceId);
assert.equal(output.correlation_id,correlationId);
assert.equal(output.hops?.length,3);
assert.equal(output.hops[0].nucleus_id,'N01');
assert.equal(output.hops[1].nucleus_id,'N07');
assert.equal(output.hops[1].status,'SUCCEEDED');
assert.equal(output.hops[2].provider,'langgraph');
assert.equal(output.hops[2].model,'langgraph@1400d25b7b88cfa055c55b8a82bd95b7c25caef1');
assert.equal(output.result?.inference?.intent,'integration_verification');
assert.match(output.result?.inference?.summary||/,/i,/LangGraph executed a two-node graph/);
console.log(JSON.stringify({event:'soul.fusion.langgraph.test.completed',status:'PASS',trace_id:output.trace_id,correlation_id:output.correlation_id,provider:output.hops[2].provider,model:output.hops[2].model,latency_ms:output.latency_ms,exit_code:0},null,2));
