import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnvelope, SOUL_MESH_CONTRACT_VERSION, type SoulMeshEnvelope } from './SoulMeshEnvelope.ts';

test('canonical envelope includes the required contractVersion', () => {
  const envelope = createEnvelope({
    source: 'N01',
    target: 'N02',
    correlationId: 'compat-test',
    type: 'PING',
    payload: { ok: true },
  });
  assert.equal(envelope.version, '1.0');
  assert.equal(envelope.contractVersion, SOUL_MESH_CONTRACT_VERSION);
});

test('legacy version remains representable without changing the canonical contract', () => {
  const legacy: SoulMeshEnvelope = {
    version: '1.0',
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    messageId: 'legacy-message',
    source: 'N02',
    target: 'N01',
    timestamp: Date.now(),
    nonce: 'legacy-nonce',
    correlationId: 'legacy-correlation',
    type: 'PING',
    hmac: '0'.repeat(64),
    payload: {},
  };
  assert.equal(legacy.version, '1.0');
  assert.equal(legacy.contractVersion, '1.1.0');
});
