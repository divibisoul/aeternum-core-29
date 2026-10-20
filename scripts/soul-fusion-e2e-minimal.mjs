import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import process from 'node:process';

const baseUrl = String(process.env.SOUL_FUSION_N01_URL || 'http://127.0.0.1:18080').replace(/\/$/, '');
const token = String(process.env.SOUL_FUSION_EXECUTION_TOKEN || '').trim();
assert.ok(token.length >= 32, 'SOUL_FUSION_EXECUTION_TOKEN must contain at least 32 characters');
const traceId = crypto.randomBytes(16).toString('hex');
const correlationId = traceId;
const now = Date.now();
const text = 'This is a live SOUL fusion verification. Summarize the request in one concise sentence and identify it as an integration verification, without invoking tools.';
const input = {
  contract_name: 'soul-fusion-execution',
  schema_version: '0.1.0',
  message_id: crypto.randomUUID(),
  idempotency_key: 'ci:' + (process.env.GITHUB_RUN_ID || 'local') + ':' + traceId,
  trace_id: traceId,
  correlation_id: correlationId,
  sequence_index: 0,
  created_at: new Date(now).toISOString(),
  deadline_at: new Date(now + 90_000).toISOString(),
  source: { nucleus_id: 'N01', component: 'soul-fusion-e2e-minimal', version: '0.1.0' },
  target: { group_id: 'A', capability: 'fusion.execute' },
  operation: 'execute',
  input_ref: 'sha256:' + crypto.createHash('sha256').update(text).digest('hex'),
  payload: { text, values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] },
  result_ref: null,
  evidence_refs: [],
  status: 'PENDING',
  error: null,
};

console.log(JSON.stringify({
  event: 'soul.fusion.e2e.started',
  contract: 'soul-fusion-execution@0.1.0',
  trace_id: traceId,
  correlation_id: correlationId,
  message_id: input.message_id,
  input_ref: input.input_ref,
  route: 'N01 -> N07/neural.forward@1.0.0 -> Group F/Google Gemini -> correlated response',
}));

const response = await fetch(baseUrl + '/api/soul-fusion-execution', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer ' + token,
    'x-correlation-id': correlationId,
    'x-soul-trace-id': traceId,
  },
  body: JSON.stringify(input),
  signal: AbortSignal.timeout(90_000),
});
const output = await response.json();
assert.equal(response.status, 200, 'HTTP ' + response.status + ': ' + JSON.stringify(output));
assert.equal(output.contract_name, 'soul-fusion-execution');
assert.equal(output.schema_version, '0.1.0');
assert.equal(output.status, 'SUCCEEDED');
assert.equal(output.trace_id, traceId);
assert.equal(output.correlation_id, correlationId);
assert.equal(output.hops?.length, 3);
assert.equal(output.hops[0].nucleus_id, 'N01');
assert.equal(output.hops[1].nucleus_id, 'N07');
assert.equal(output.hops[1].status, 'SUCCEEDED');
assert.equal(output.hops[2].group_id, 'F');
assert.equal(output.hops[2].provider, 'google-gemini');
assert.equal(output.result?.n07?.status, 'ok');
assert.equal(output.result?.n07?.values?.length, 8);
assert.ok(output.result?.inference?.summary?.trim());
assert.ok(output.result?.inference?.intent);
assert.ok(output.latency_ms >= 0);

console.log(JSON.stringify({
  event: 'soul.fusion.e2e.completed',
  status: 'PASS',
  trace_id: output.trace_id,
  correlation_id: output.correlation_id,
  response_message_id: output.message_id,
  provider: output.hops[2].provider,
  model: output.hops[2].model,
  n07_values: output.result.n07.values,
  intent: output.result.inference.intent,
  summary: output.result.inference.summary,
  latency_ms: output.latency_ms,
  exit_code: 0,
}, null, 2));
