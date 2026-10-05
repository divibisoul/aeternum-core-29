import assert from 'node:assert/strict';
import test from 'node:test';

import {
  N01_TRANSPORT_REGISTRY,
  createTaskEnvelope,
  normalizeLegacyEnvelope,
  rankCompatible,
  verifyTransportEnvelope,
} from './TransportRegistry.ts';

const SECRET = 'n01-canonical-transport-test-secret';

test('N01 transport registry keeps the existing transport priorities', () => {
  assert.equal(rankCompatible(['HTTP', 'REALTIME'], ['REALTIME', 'HTTP']), 'HTTP');
  assert.equal(N01_TRANSPORT_REGISTRY.length, 5);
});

test('N01 router boundary creates and verifies the canonical 1.1.0 envelope', async () => {
  const envelope = await createTaskEnvelope(
    'N01',
    'N07',
    { capabilityId: 'mesh.supergpu.execute@1.0.0' },
    SECRET,
    'corr-n01-n07-transport-test',
  );

  assert.equal(envelope.version, '1.0');
  assert.equal(envelope.contractVersion, '1.1.0');
  assert.equal(envelope.source, 'N01');
  assert.equal(envelope.target, 'N07');
  assert.equal(envelope.correlationId, 'corr-n01-n07-transport-test');
  assert.equal(await verifyTransportEnvelope(envelope, SECRET), true);
});

test('N01 legacy envelope can be normalized without reusing its legacy HMAC', () => {
  const normalized = normalizeLegacyEnvelope({
    version: '1.0',
    messageId: 'legacy-message',
    source: 'N02',
    target: 'N01',
    timestamp: Date.now(),
    nonce: '0123456789abcdef',
    correlationId: 'legacy-correlation',
    type: 'TASK',
    payload: { capabilityId: 'memory.read' },
    hmac: '0'.repeat(64),
  });

  assert.equal(normalized.contractVersion, '1.1.0');
  assert.equal(normalized.source, 'N02');
  assert.equal(normalized.target, 'N01');
  assert.equal(normalized.correlationId, 'legacy-correlation');
  assert.equal('hmac' in normalized, false);
});
