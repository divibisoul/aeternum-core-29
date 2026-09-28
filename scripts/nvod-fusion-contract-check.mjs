import assert from 'node:assert/strict';
import { createFusionEnvelope, deriveFusionReply, isExpired, isFusionEnvelope, NVOD_FUSION_PROTOCOL, NVOD_FUSION_CONTRACT_VERSION } from '../src/core/fusion/FusionEnvelope.ts';

const request = createFusionEnvelope({
  source: 'N01',
  target: 'N02',
  capability: 'mesh.health',
  payload: { probe: true },
  correlationId: 'corr-nvod-001',
  traceId: 'trace-nvod-001',
  timeoutMs: 1000,
  now: 1000,
});

assert.equal(request.protocol, NVOD_FUSION_PROTOCOL);
assert.equal(request.contractVersion, NVOD_FUSION_CONTRACT_VERSION);
assert.equal(isFusionEnvelope(request), true);
assert.equal(isExpired(request, 1500), false);
assert.equal(isExpired(request, 2001), true);

const reply = deriveFusionReply(request, { healthy: true }, 'response', 'N02', 1500);
assert.equal(reply.correlationId, request.correlationId);
assert.equal(reply.causationId, request.id);
assert.equal(reply.traceId, request.traceId);
assert.equal(isFusionEnvelope(reply), true);
assert.equal(isFusionEnvelope({ ...reply, correlationId: '' }), false);

console.log(JSON.stringify({
  status: 'PASS',
  protocol: request.protocol,
  contractVersion: request.contractVersion,
  correlationId: reply.correlationId,
  replySource: reply.source,
  replyTarget: reply.target,
  heartbeatIntervalMs: 10000,
}, null, 2));
