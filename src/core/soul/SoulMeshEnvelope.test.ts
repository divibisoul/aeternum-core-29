import assert from 'node:assert/strict';
import test from 'node:test';
import { signEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope.ts';

test('legacy N01 envelope rejects HMAC secrets shorter than 32 bytes', async () => {
  const envelope: Omit<SoulMeshEnvelope, 'hmac'> = {
    version: '1.0',
    messageId: 'legacy-key-test',
    source: 'N01',
    target: 'N07',
    timestamp: Date.now(),
    nonce: '0123456789abcdef0123456789abcdef',
    correlationId: 'legacy-key-correlation',
    type: 'CAPABILITY_REQUEST',
    payload: { capability: 'mesh.ping' },
  };
  await assert.rejects(() => signEnvelope(envelope, 'short-test-secret'), /at least 32 bytes/);
});

test('legacy N01 envelope signs with a 32-byte secret without changing its wire contract', async () => {
  const envelope: Omit<SoulMeshEnvelope, 'hmac'> = {
    version: '1.0',
    messageId: 'legacy-key-test-2',
    source: 'N01',
    target: 'N07',
    timestamp: Date.now(),
    nonce: '0123456789abcdef0123456789abcdef',
    correlationId: 'legacy-key-correlation-2',
    type: 'CAPABILITY_REQUEST',
    payload: { capability: 'mesh.ping' },
  };
  const signed = await signEnvelope(envelope, '01234567890123456789012345678901');
  assert.match(signed.hmac, /^[0-9a-f]{64}$/);
  assert.equal(signed.version, '1.0');
  assert.equal(signed.messageId, envelope.messageId);
  assert.equal(signed.correlationId, envelope.correlationId);
});
